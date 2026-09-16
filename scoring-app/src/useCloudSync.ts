import { useEffect, useRef, useState } from 'react'
import type { AppState } from './types'
import { CLOUD_ENABLED } from './supabaseConfig'
import { fetchRoom, saveRoom, subscribeRoom } from './cloud'

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

    const unsub = subscribeRoom(room, (remoteState) => {
      applyingRemote.current = true
      onRemoteState(remoteState)
      // ปล่อย flag ในรอบ event loop ถัดไป เพื่อให้ setState เสร็จก่อน
      setTimeout(() => {
        applyingRemote.current = false
      }, 0)
    })

    return () => {
      cancelled = true
      unsub()
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
      const ok = await saveRoom(room, state)
      setStatus(ok ? 'synced' : 'error')
    }, 600)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, room])

  return { status }
}
