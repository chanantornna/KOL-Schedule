import type { Criterion, CriterionScores } from './scoring'

export interface Judge {
  id: string
  name: string
}

export interface Contestant {
  id: string
  /** เลขที่ (No.) แสดงผลตามลำดับ */
  name: string
  /** คะแนนจากกรรมการแต่ละคน: key = judgeId → (key = criterionId → คะแนน) */
  scores: Record<string, CriterionScores>
}

export interface AppState {
  /** ชื่อของงาน/การแข่งขัน แสดงบนหัวเว็บ */
  title: string
  criteria: Criterion[]
  judges: Judge[]
  contestants: Contestant[]
}
