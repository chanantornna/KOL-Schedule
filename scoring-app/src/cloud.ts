import { createClient } from '@supabase/supabase-js'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL, CLOUD_ENABLED } from './supabaseConfig'
import type { AppState } from './types'

// ===== Cloud sync ผ่าน Supabase =====
// เก็บ state ทั้งก้อนเป็น JSON 1 แถวต่อ 1 ห้อง (room) ในตาราง scoreboards
// ใช้ Postgres Changes (realtime) เพื่อให้ทุกคนที่เปิดห้องเดียวกันเห็นการแก้ทันที

let client: SupabaseClient | null = null

export function getClient(): SupabaseClient | null {
  if (!CLOUD_ENABLED) return null
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: { params: { eventsPerSecond: 5 } },
    })
  }
  return client
}

export interface CloudRow {
  room: string
  state: AppState
  updated_at: string
}

/** โหลด state ของห้องจาก cloud (คืน null ถ้ายังไม่มีห้องนี้) */
export async function fetchRoom(room: string): Promise<AppState | null> {
  const c = getClient()
  if (!c) return null
  const { data, error } = await c
    .from('scoreboards')
    .select('state')
    .eq('room', room)
    .maybeSingle()
  if (error) {
    console.error('fetchRoom error', error)
    return null
  }
  return (data?.state as AppState) ?? null
}

/** บันทึก state ของห้องขึ้น cloud (upsert) */
export async function saveRoom(room: string, state: AppState): Promise<boolean> {
  const c = getClient()
  if (!c) return false
  const { error } = await c.from('scoreboards').upsert(
    {
      room,
      state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'room' },
  )
  if (error) {
    console.error('saveRoom error', error)
    return false
  }
  return true
}

/**
 * merge + save: ดึง remote ล่าสุด merge คะแนนเข้าด้วยกัน แล้วค่อย save
 * กันปัญหา: คนแก้คะแนนพร้อมกัน แล้วคนสุดท้ายทับของคนอื่นหาย
 * - คะแนน (scores): merge ระดับ (contestant × judge × criterion) — ค่าที่ local แก้จะ override remote
 * - ข้อมูลอื่น (title, judges, criteria, contestants list): ใช้ค่า local ตรงๆ
 *   (เพราะการเปลี่ยน structure เป็นสิทธิ์แอดมินคนเดียว ไม่ต้องกังวล merge conflict)
 */
/** คีย์ระบุช่องคะแนน 1 ช่อง: "contestantId|judgeId|criterionId" */
export function scoreCellKey(
  contestantId: string,
  judgeId: string,
  criterionId: string,
): string {
  return `${contestantId}|${judgeId}|${criterionId}`
}

export async function mergeAndSaveRoom(
  room: string,
  localState: AppState,
  dirtyCells: Set<string>,
): Promise<boolean> {
  const remote = await fetchRoom(room)
  let merged = localState

  if (remote) {
    // เริ่มจาก remote เป็นฐาน (มีคะแนนล่าสุดของทุกคน)
    // แล้วทับเฉพาะช่องที่ "เครื่องนี้แก้เอง" (อยู่ใน dirtyCells) ด้วยค่า local
    // ช่องที่เราไม่ได้แตะ → คงค่า remote ไว้ (ไม่ทับของคนอื่น, ไม่เด้ง)
    const mergedContestants = localState.contestants.map((localC) => {
      const remoteC = remote.contestants.find((rc) => rc.id === localC.id)
      if (!remoteC) return localC // contestant ใหม่ที่ remote ยังไม่มี

      const mergedScores: typeof localC.scores = {}
      const allJudgeIds = new Set([
        ...Object.keys(remoteC.scores),
        ...Object.keys(localC.scores),
      ])
      for (const jid of allJudgeIds) {
        const remoteRow = remoteC.scores[jid] ?? {}
        const localRow = localC.scores[jid] ?? {}
        const allCritIds = new Set([
          ...Object.keys(remoteRow),
          ...Object.keys(localRow),
        ])
        const row: Record<string, number> = {}
        for (const cid of allCritIds) {
          const key = scoreCellKey(localC.id, jid, cid)
          if (dirtyCells.has(key)) {
            // ช่องนี้เราแก้เอง → ใช้ค่า local
            row[cid] = localRow[cid] ?? 0
          } else {
            // ช่องนี้เราไม่ได้แตะ → ใช้ค่า remote (ถ้ามี) ไม่งั้น local
            row[cid] = remoteRow[cid] ?? localRow[cid] ?? 0
          }
        }
        mergedScores[jid] = row
      }
      return { ...localC, scores: mergedScores }
    })
    merged = { ...localState, contestants: mergedContestants }
  }

  return saveRoom(room, merged)
}

/**
 * สมัครรับการเปลี่ยนแปลงของห้องแบบเรียลไทม์
 * callback จะถูกเรียกเมื่อมีคนอื่นแก้ state ของห้องนี้
 * คืนฟังก์ชันสำหรับยกเลิกการสมัคร
 */
export function subscribeRoom(
  room: string,
  onChange: (state: AppState) => void,
): () => void {
  const c = getClient()
  if (!c) return () => {}

  const channel: RealtimeChannel = c
    .channel(`scoreboard:${room}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'scoreboards',
        filter: `room=eq.${room}`,
      },
      (payload) => {
        const newRow = payload.new as CloudRow | undefined
        if (newRow?.state) onChange(newRow.state)
      },
    )
    .subscribe()

  return () => {
    c.removeChannel(channel)
  }
}
