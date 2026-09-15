import type { CriterionScores } from './scoring'

/** จำนวนกรรมการและผู้เข้าแข่งขัน ตามชีท (กรรมการ 4 ตาราง, ผู้เข้าแข่งขัน 10 คน/ตาราง) */
export const NUM_JUDGES = 4
export const NUM_CONTESTANTS = 10

export interface Judge {
  id: string
  name: string
}

export interface Contestant {
  /** เลขที่ (No.) 1..10 */
  no: number
  name: string
  /** คะแนนจากกรรมการแต่ละคน: key = judgeId */
  scores: Record<string, CriterionScores>
}

export interface AppState {
  judges: Judge[]
  contestants: Contestant[]
}
