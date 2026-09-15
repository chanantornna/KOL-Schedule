import type { AppState } from './types'
import { createDefaultState } from './store'

/** สร้างไฟล์สำรองข้อมูล (JSON) เพื่อส่งต่อให้กรรมการท่านอื่น */
export function buildBackupJson(state: AppState): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), state }, null, 2)
}

export function downloadJson(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** อ่านไฟล์สำรองที่กรรมการอัปโหลดกลับเข้ามา แล้ว validate เบื้องต้น */
export function parseBackupJson(text: string): AppState {
  const parsed = JSON.parse(text) as { state?: AppState } | AppState
  const state = (parsed as { state?: AppState }).state ?? (parsed as AppState)
  if (
    !state ||
    !Array.isArray(state.judges) ||
    !Array.isArray(state.contestants) ||
    state.judges.length === 0 ||
    state.contestants.length === 0
  ) {
    throw new Error('ไฟล์ไม่ถูกต้อง หรือไม่ใช่ไฟล์สำรองของแอพนี้')
  }
  // เติมค่า default ให้ครบถ้าไฟล์เก่าขาดบางส่วน
  const base = createDefaultState()
  return {
    judges: state.judges,
    contestants: state.contestants.map((c, i) => ({
      no: c.no ?? i + 1,
      name: c.name ?? '',
      scores: c.scores ?? base.contestants[i]?.scores ?? {},
    })),
  }
}
