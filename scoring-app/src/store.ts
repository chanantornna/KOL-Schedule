import { emptyScores } from './scoring'
import { NUM_CONTESTANTS, NUM_JUDGES } from './types'
import type { AppState, Contestant, Judge } from './types'

const STORAGE_KEY = 'partyrock-scoring-v1'

/** ชื่อกรรมการเริ่มต้นตามชีท (A. Chaisit + Ajarn อีก 3) */
const DEFAULT_JUDGE_NAMES = ['A. Chaisit', 'Ajarn 2', 'Ajarn 3', 'Ajarn 4']

export function createDefaultState(): AppState {
  const judges: Judge[] = Array.from({ length: NUM_JUDGES }, (_, i) => ({
    id: `judge-${i + 1}`,
    name: DEFAULT_JUDGE_NAMES[i] ?? `Ajarn ${i + 1}`,
  }))

  const contestants: Contestant[] = Array.from(
    { length: NUM_CONTESTANTS },
    (_, i) => ({
      no: i + 1,
      name: '',
      scores: Object.fromEntries(
        judges.map((j) => [j.id, emptyScores()]),
      ),
    }),
  )

  return { judges, contestants }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()
    const parsed = JSON.parse(raw) as AppState
    // ตรวจความสมบูรณ์แบบเบื้องต้น กันข้อมูลเก่าเสียหาย
    if (
      !parsed.judges ||
      !parsed.contestants ||
      parsed.judges.length === 0 ||
      parsed.contestants.length === 0
    ) {
      return createDefaultState()
    }
    return parsed
  } catch {
    return createDefaultState()
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // เงียบไว้: ถ้า localStorage ใช้ไม่ได้ก็ไม่ทำให้แอพพัง
  }
}

export { STORAGE_KEY }
