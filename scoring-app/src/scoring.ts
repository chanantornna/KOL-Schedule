// ===== โครงสร้างและสูตรการให้คะแนน PartyRock Scoring SPU =====
// อ้างอิงตามชีทต้นฉบับ: 5 หัวข้อ แต่ละหัวข้อคะแนนเต็ม 5
// น้ำหนัก (%) ตามหัวหน้าคอลัมน์ในชีท: 15 / 20 / 20 / 25 / 20

/** คะแนนเต็มของแต่ละหัวข้อ (ตามชีท: "Full Scores 5") */
export const MAX_SCORE_PER_CRITERION = 5

/** เกณฑ์การให้คะแนน 5 หัวข้อ พร้อมน้ำหนักเป็นเปอร์เซ็นต์ (รวม = 100) */
export interface Criterion {
  key: CriterionKey
  label: string
  weight: number // %
}

export type CriterionKey =
  | 'presentation'
  | 'flowDesign'
  | 'prompting'
  | 'promptQuality'
  | 'useCase'

export const CRITERIA: Criterion[] = [
  {
    key: 'presentation',
    label: 'Presentation (นำเสนอ + การจัดการเวลา)',
    weight: 15,
  },
  {
    key: 'flowDesign',
    label: 'Flow Design (การออกแบบ Flow)',
    weight: 20,
  },
  {
    key: 'prompting',
    label: 'Prompting Techniques',
    weight: 20,
  },
  {
    key: 'promptQuality',
    label: 'ความสมบูรณ์และการทำงานของ challenges (Prompt Quality)',
    weight: 25,
  },
  {
    key: 'useCase',
    label: 'Use Case (ประยุกต์อย่างไร)',
    weight: 20,
  },
]

/** คะแนนดิบ 5 หัวข้อของผู้เข้าแข่งขัน 1 คน จากกรรมการ 1 คน */
export type CriterionScores = Record<CriterionKey, number>

export function emptyScores(): CriterionScores {
  return {
    presentation: 0,
    flowDesign: 0,
    prompting: 0,
    promptQuality: 0,
    useCase: 0,
  }
}

/**
 * Total ต่อกรรมการ (ตามสูตรชีท):
 * แต่ละหัวข้อคะแนนดิบเต็ม 5 คูณสัดส่วนน้ำหนัก แล้วรวมกัน
 *   Total = Σ ( (score / 5) * weight )
 * ค่าเต็ม = 100
 */
export function judgeTotal(scores: CriterionScores): number {
  return CRITERIA.reduce((sum, c) => {
    const raw = clampScore(scores[c.key])
    return sum + (raw / MAX_SCORE_PER_CRITERION) * c.weight
  }, 0)
}

/** จำกัดคะแนนดิบให้อยู่ในช่วง 0..5 */
export function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > MAX_SCORE_PER_CRITERION) return MAX_SCORE_PER_CRITERION
  return value
}

/**
 * Grand Total ของผู้เข้าแข่งขัน 1 คน:
 * เฉลี่ยค่า Total จากกรรมการทุกคนที่ให้คะแนนคนนั้น (ค่าเต็ม 100)
 * ถ้าไม่มีกรรมการคนใดให้คะแนนเลย จะได้ 0
 */
export function grandTotal(judgeTotals: number[]): number {
  if (judgeTotals.length === 0) return 0
  const sum = judgeTotals.reduce((a, b) => a + b, 0)
  return sum / judgeTotals.length
}

/**
 * คำนวณลำดับ (rank) จาก grand total มากไปน้อย
 * คะแนนเท่ากันได้ลำดับเดียวกัน (competition ranking: 1,2,2,4)
 * รับ array ของ grand total ตามลำดับผู้เข้าแข่งขัน คืน array ของลำดับ (index ตรงกัน)
 */
export function computeRanks(grandTotals: number[]): number[] {
  const indexed = grandTotals.map((value, index) => ({ value, index }))
  const sorted = [...indexed].sort((a, b) => b.value - a.value)

  const rankByIndex = new Array<number>(grandTotals.length).fill(0)
  let lastValue: number | null = null
  let lastRank = 0
  sorted.forEach((item, position) => {
    const rank = lastValue !== null && item.value === lastValue ? lastRank : position + 1
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
