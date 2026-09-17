import { useEffect, useRef, useState } from 'react'
import type { AppState } from './types'
import { CLOUD_ENABLED } from './supabaseConfig'
import {
  fetchRoom,
  saveRoom,
  mergeAndSaveRoom,
  subscribeRoom,
  scoreCellKey,
} from './cloud'

export type SyncStatus = 'local' | 'connecting' | 'synced' | 'saving' | 'error'

/** อ่านรหัสห้องจาก URL (?room=xxx) */
export function getRoomFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  const room = params.get('room')
  return room && room.trim() ? room.trim() : null
}

/** ตั้งรหัสห้องลง URL โดยไม่ reload */
export function setRoomInUrl(room: string): void {
  const url = new URL(window.location.href)
  url.searchParams.set('room', room)
  window.history.replaceState({}, '', url.toString())
}

interface UseCloudSyncArgs {
  room: string | null
  state: AppState
  /** เรียกเมื่อได้ state ใหม่จาก cloud (ตอนโหลดครั้งแรก หรือมีคนอื่นแก้) */
  onRemoteState: (state: AppState) => void
}

/** true ถ้าผู้ใช้กำลังพิมพ์อยู่ในช่อง input/textarea (กันไม่ให้ remote มาทับตอนพิมพ์) */
function isUserTyping(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

/**
 * จัดการ sync กับ Supabase:
 * - โหลด state ของห้องตอนเข้า (ถ้ามี) หรือสร้างใหม่บน cloud
 * - subscribe realtime: คนอื่นแก้ → onRemoteState
 * - เขียนขึ้น cloud แบบ debounce เมื่อ state เปลี่ยนจากการแก้ในเครื่อง
 */
export function useCloudSync({ room, state, onRemoteState }: UseCloudSyncArgs) {
  const [status, setStatus] = useState<SyncStatus>(
    CLOUD_ENABLED && room ? 'connecting' : 'local',
  )
  // ป้องกัน echo: ตอนรับ state จาก cloud เราตั้ง flag ไม่ให้ effect เขียนกลับทันที
  const applyingRemote = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loaded = useRef(false)
  // เก็บ remote state ที่มาถึงระหว่างผู้ใช้กำลังพิมพ์ ไว้ apply ทีหลัง (กันค่าเด้ง)
  const pendingRemote = useRef<AppState | null>(null)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // ช่องคะแนนที่เครื่องนี้เพิ่งแก้ (ยังไม่ save) — ใช้กันไม่ให้ remote มาทับ + merge ถูกช่อง
  const dirtyCells = useRef<Set<string>>(new Set())
  // อ้างอิง state ล่าสุด เพื่อให้ applyRemote เข้าถึงได้โดยไม่ต้อง re-subscribe
  const stateRef = useRef(state)
  stateRef.current = state

  // โหลด + subscribe เมื่อ room เปลี่ยน
  useEffect(() => {
    if (!CLOUD_ENABLED || !room) {
      setStatus('local')
      return
    }
    let cancelled = false
    loaded.current = false
    setStatus('connecting')

    ;(async () => {
      const remote = await fetchRoom(room)
      if (cancelled) return
      if (remote) {
        applyingRemote.current = true
        onRemoteState(remote)
        applyingRemote.current = false
      } else {
        // ห้องยังไม่มี → สร้างด้วย state ปัจจุบัน
        await saveRoom(room, state)
      }
      loaded.current = true
      setStatus('synced')
    })()

    // apply remote state จริง (ตั้ง flag กัน echo ไม่ให้เขียนกลับ cloud)
    // คงค่าช่องที่เรากำลังแก้อยู่ (dirty) ไว้ ไม่ให้ remote มาทับ → กันอาการเด้ง
    const applyRemote = (remoteState: AppState) => {
      applyingRemote.current = true
      let next = remoteState
      if (dirtyCells.current.size > 0) {
        const local = stateRef.current
        next = {
          ...remoteState,
          contestants: remoteState.contestants.map((rc) => {
            const lc = local.contestants.find((c) => c.id === rc.id)
            if (!lc) return rc
            const scores: typeof rc.scores = {}
            for (const jid of Object.keys(rc.scores)) {
              const rRow = rc.scores[jid] ?? {}
              const lRow = lc.scores[jid] ?? {}
              const row: Record<string, number> = { ...rRow }
              for (const cid of Object.keys(row)) {
                if (dirtyCells.current.has(scoreCellKey(rc.id, jid, cid))) {
                  row[cid] = lRow[cid] ?? row[cid] // คงค่าที่เราแก้ไว้
                }
              }
              scores[jid] = row
            }
            return { ...rc, scores }
          }),
        }
      }
      onRemoteState(next)
      setTimeout(() => {
        applyingRemote.current = false
      }, 0)
    }

    const unsub = subscribeRoom(room, (remoteState) => {
      // ถ้าผู้ใช้กำลังพิมพ์อยู่ อย่าเพิ่งทับ — เก็บไว้ apply ตอนหยุดพิมพ์
      if (isUserTyping()) {
        pendingRemote.current = remoteState
        return
      }
      applyRemote(remoteState)
    })

    // คอยเช็คว่ามี remote ค้างอยู่และผู้ใช้หยุดพิมพ์แล้วหรือยัง
    const flushInterval = setInterval(() => {
      if (pendingRemote.current && !isUserTyping()) {
        const pending = pendingRemote.current
        pendingRemote.current = null
        applyRemote(pending)
      }
    }, 400)

    return () => {
      cancelled = true
      unsub()
      clearInterval(flushInterval)
      if (retryTimer.current) clearTimeout(retryTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room])

  // เขียนขึ้น cloud เมื่อ state เปลี่ยน (debounce 600ms)
  useEffect(() => {
    if (!CLOUD_ENABLED || !room) return
    if (!loaded.current) return // ยังโหลดไม่เสร็จ อย่าเพิ่งเขียน
    if (applyingRemote.current) return // การเปลี่ยนนี้มาจาก cloud ไม่ต้องเขียนกลับ

    if (saveTimer.current) clearTimeout(saveTimer.current)
    setStatus('saving')
    saveTimer.current = setTimeout(async () => {
      // snapshot ช่องที่แก้ไว้ แล้วเคลียร์ (ช่องพวกนี้กำลังจะถูกบันทึก)
      const cells = new Set(dirtyCells.current)
      dirtyCells.current.clear()
      // merge: ทับเฉพาะช่องที่เราแก้เอง คงค่าคนอื่นไว้
      const ok = await mergeAndSaveRoom(room, state, cells)
      setStatus(ok ? 'synced' : 'error')
    }, 600)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, room])

  /** เรียกเมื่อผู้ใช้แก้คะแนนช่องหนึ่ง เพื่อจำว่าช่องนี้เราแก้เอง */
  const markDirty = (key: string) => {
    dirtyCells.current.add(key)
  }

  return { status, markDirty }
}
