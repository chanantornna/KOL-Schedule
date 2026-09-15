import type { AppState } from './types'
import { normalizeState } from './store'

/** สร้างไฟล์สำรองข้อมูล (JSON) เพื่อส่งต่อให้กรรมการท่านอื่น */
export function buildBackupJson(state: AppState): string {
  return JSON.stringify(
    { version: 2, exportedAt: new Date().toISOString(), state },
    null,
    2,
  )
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

/** อ่านไฟล์สำรองที่อัปโหลดกลับเข้ามา แล้ว validate + normalize */
export function parseBackupJson(text: string): AppState {
  const parsed = JSON.parse(text) as { state?: Partial<AppState> } | Partial<AppState>
  const raw = (parsed as { state?: Partial<AppState> }).state ?? (parsed as Partial<AppState>)
  if (
    !raw ||
    (!Array.isArray(raw.judges) && !Array.isArray(raw.contestants) && !Array.isArray(raw.criteria))
  ) {
    throw new Error('ไฟล์ไม่ถูกต้อง หรือไม่ใช่ไฟล์สำรองของแอพนี้')
  }
  return normalizeState(raw)
}
