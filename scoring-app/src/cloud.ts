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
