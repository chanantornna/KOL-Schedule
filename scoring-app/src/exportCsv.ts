import { judgeTotal, grandTotal, computeRanks, round2 } from './scoring'
import type { AppState } from './types'

/** ครอบค่าด้วยเครื่องหมายคำพูด + escape สำหรับ CSV */
function csvCell(value: string | number): string {
  const s = String(value)
  return `"${s.replace(/"/g, '""')}"`
}

/**
 * CSV สรุปผล: ต่อผู้เข้าแข่งขัน 1 แถว
 * คอลัมน์: No, Name, [Total ของกรรมการแต่ละคน], Grand Total, ลำดับ
 */
export function buildSummaryCsv(state: AppState): string {
  const { judges, contestants, criteria } = state

  const grandTotals = contestants.map((c) =>
    grandTotal(judges.map((j) => judgeTotal(c.scores[j.id] ?? {}, criteria))),
  )
  const ranks = computeRanks(grandTotals)

  const header = [
    'No.',
    'Name',
    ...judges.map((j) => `${j.name} (Total /5)`),
    'Grand Total (/5)',
    'ลำดับ',
  ]

  const rows = contestants.map((c, i) => {
    const totals = judges.map((j) =>
      round2(judgeTotal(c.scores[j.id] ?? {}, criteria)),
    )
    return [i + 1, c.name, ...totals, round2(grandTotals[i]), ranks[i]]
  })

  const lines = [header, ...rows].map((r) => r.map(csvCell).join(','))
  return '\uFEFF' + lines.join('\r\n') // BOM ให้ Excel อ่านภาษาไทยถูก
}

/**
 * CSV รายละเอียด: ต่อ (ผู้เข้าแข่งขัน × กรรมการ) 1 แถว พร้อมคะแนนดิบทุกหัวข้อ
 */
export function buildDetailCsv(state: AppState): string {
  const { judges, contestants, criteria } = state

  const header = [
    'No.',
    'Name',
    'Judge',
    ...criteria.map((c) => `${c.label} (${c.weight}%)`),
    'Total',
  ]

  const rows: (string | number)[][] = []
  contestants.forEach((c, i) => {
    for (const j of judges) {
      const s = c.scores[j.id] ?? {}
      rows.push([
        i + 1,
        c.name,
        j.name,
        ...criteria.map((cr) => s[cr.id] ?? 0),
        round2(judgeTotal(s, criteria)),
      ])
    }
  })

  const lines = [header, ...rows].map((r) => r.map(csvCell).join(','))
  return '\uFEFF' + lines.join('\r\n')
}

/** ดาวน์โหลดข้อความเป็นไฟล์ */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
