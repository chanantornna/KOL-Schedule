import { defaultCriteria, emptyScores } from './scoring'
import type { Criterion } from './scoring'
import type { AppState, Contestant, Judge } from './types'

const STORAGE_KEY = 'scoring-app-v2'

/** สร้าง id สั้นๆ ไม่ซ้ำ */
export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`
}

const DEFAULT_JUDGE_NAMES = ['กรรมการ 1', 'กรรมการ 2', 'กรรมการ 3']

export function createDefaultState(): AppState {
  const criteria = defaultCriteria()
  const judges: Judge[] = DEFAULT_JUDGE_NAMES.map((name) => ({
    id: uid('judge'),
    name,
  }))
  const contestants: Contestant[] = Array.from({ length: 10 }, () =>
    makeContestant('', judges, criteria),
  )
  return { title: 'ระบบรวมคะแนนการแข่งขัน', criteria, judges, contestants }
}

/** สร้างผู้เข้าแข่งขันใหม่ พร้อมช่องคะแนนว่างของกรรมการทุกคน */
export function makeContestant(
  name: string,
  judges: Judge[],
  criteria: Criterion[],
): Contestant {
  return {
    id: uid('c'),
    name,
    scores: Object.fromEntries(
      judges.map((j) => [j.id, emptyScores(criteria)]),
    ),
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()
    const parsed = JSON.parse(raw) as AppState
    return normalizeState(parsed)
  } catch {
    return createDefaultState()
  }
}

/**
 * ทำให้ state สมบูรณ์: กันข้อมูลเก่า/นำเข้าที่ขาดฟิลด์
 * - เติม title/criteria/judges/contestants ถ้าไม่มี
 * - รับประกันว่าทุก contestant มีช่องคะแนนของกรรมการและ criteria ครบ
 */
export function normalizeState(input: Partial<AppState>): AppState {
  const base = createDefaultState()
  const criteria =
    Array.isArray(input.criteria) && input.criteria.length > 0
      ? input.criteria.map((c) => ({
          id: c.id || uid('c'),
          label: c.label ?? '',
          weight: Number(c.weight) || 0,
          max: Number(c.max) > 0 ? Number(c.max) : 5,
        }))
      : base.criteria

  const judges =
    Array.isArray(input.judges) && input.judges.length > 0
      ? input.judges.map((j) => ({ id: j.id || uid('judge'), name: j.name ?? '' }))
      : base.judges

  const contestants =
    Array.isArray(input.contestants) && input.contestants.length > 0
      ? input.contestants.map((c) => ({
          id: c.id || uid('c'),
          name: c.name ?? '',
          scores: buildScores(c.scores ?? {}, judges, criteria),
        }))
      : base.contestants

  return {
    title: input.title ?? base.title,
    criteria,
    judges,
    contestants,
  }
}

/** รับประกันว่ามีคะแนนครบทุก (กรรมการ × เกณฑ์) โดยคงค่าที่มีอยู่ */
function buildScores(
  existing: Record<string, Record<string, number>>,
  judges: Judge[],
  criteria: Criterion[],
): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {}
  for (const j of judges) {
    const src = existing[j.id] ?? {}
    const row: Record<string, number> = {}
    for (const c of criteria) row[c.id] = Number(src[c.id]) || 0
    out[j.id] = row
  }
  return out
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // เงียบไว้ถ้า localStorage ใช้ไม่ได้
  }
}

export { STORAGE_KEY }
