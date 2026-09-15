// ===== โครงสร้างและสูตรการให้คะแนน (แบบยืดหยุ่น กำหนดเกณฑ์เองได้) =====
// เกณฑ์ (criteria) แต่ละข้อมีชื่อ, น้ำหนัก (%) และคะแนนเต็มของข้อนั้น
// Total ต่อกรรมการ = Σ ( คะแนนดิบ / คะแนนเต็มของข้อ × น้ำหนัก )
// ถ้าน้ำหนักรวม = 100 ค่า Total จะเต็ม 100 พอดี

export interface Criterion {
  id: string
  label: string
  weight: number // %
  max: number // คะแนนเต็มของหัวข้อนี้
}

/** คะแนนดิบของผู้เข้าแข่งขัน 1 คน จากกรรมการ 1 คน: key = criterionId */
export type CriterionScores = Record<string, number>

/** ค่าเกณฑ์เริ่มต้น (อ้างอิงชีท PartyRock เดิม เป็นเพียงค่าตั้งต้น แก้ได้) */
export function defaultCriteria(): Criterion[] {
  return [
    { id: 'c1', label: 'Presentation (นำเสนอ + การจัดการเวลา)', weight: 15, max: 5 },
    { id: 'c2', label: 'Flow Design (การออกแบบ Flow)', weight: 20, max: 5 },
    { id: 'c3', label: 'Prompting Techniques', weight: 20, max: 5 },
    {
      id: 'c4',
      label: 'ความสมบูรณ์และการทำงานของ challenges (Prompt Quality)',
      weight: 25,
      max: 5,
    },
    { id: 'c5', label: 'Use Case (ประยุกต์อย่างไร)', weight: 20, max: 5 },
  ]
}

/** สร้างชุดคะแนนว่าง (0 ทุกหัวข้อ) ตาม criteria ปัจจุบัน */
export function emptyScores(criteria: Criterion[]): CriterionScores {
  const s: CriterionScores = {}
  for (const c of criteria) s[c.id] = 0
  return s
}

/** จำกัดคะแนนดิบให้อยู่ในช่วง 0..max */
export function clampScore(value: number, max: number): number {
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > max) return max
  return value
}

/**
 * Total ต่อกรรมการ:
 *   Total = Σ ( (คะแนนดิบ / คะแนนเต็มของข้อ) × น้ำหนัก )
 */
export function judgeTotal(
  scores: CriterionScores,
  criteria: Criterion[],
): number {
  return criteria.reduce((sum, c) => {
    const raw = clampScore(scores[c.id] ?? 0, c.max)
    const denom = c.max > 0 ? c.max : 1
    return sum + (raw / denom) * c.weight
  }, 0)
}

/** ผลรวมน้ำหนักของ criteria (ใช้เตือนผู้ใช้ถ้าไม่ครบ 100) */
export function totalWeight(criteria: Criterion[]): number {
  return criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0)
}

/**
 * Grand Total ของผู้เข้าแข่งขัน 1 คน:
 * เฉลี่ยค่า Total จากกรรมการทุกคน (ถ้าไม่มีกรรมการเลย = 0)
 */
export function grandTotal(judgeTotals: number[]): number {
  if (judgeTotals.length === 0) return 0
  return judgeTotals.reduce((a, b) => a + b, 0) / judgeTotals.length
}

/**
 * คำนวณลำดับจาก grand total มากไปน้อย (competition ranking: 1,2,2,4)
 */
export function computeRanks(grandTotals: number[]): number[] {
  const indexed = grandTotals.map((value, index) => ({ value, index }))
  const sorted = [...indexed].sort((a, b) => b.value - a.value)

  const rankByIndex = new Array<number>(grandTotals.length).fill(0)
  let lastValue: number | null = null
  let lastRank = 0
  sorted.forEach((item, position) => {
    const rank =
      lastValue !== null && item.value === lastValue ? lastRank : position + 1
    rankByIndex[item.index] = rank
    lastValue = item.value
    lastRank = rank
  })
  return rankByIndex
}

/** ปัดทศนิยม 2 ตำแหน่งสำหรับแสดงผล */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
