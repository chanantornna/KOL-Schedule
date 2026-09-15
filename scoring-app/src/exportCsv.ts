import { CRITERIA, judgeTotal, round2 } from './scoring'
import type { AppState } from './types'
import { grandTotal, computeRanks } from './scoring'

/** ครอบค่าด้วยเครื่องหมายคำพูด + escape สำหรับ CSV */
function csvCell(value: string | number): string {
  const s = String(value)
  return `"${s.replace(/"/g, '""')}"`
}

/**
 * สร้าง CSV สรุปผล: ต่อผู้เข้าแข่งขัน 1 แถว
 * คอลัมน์: No, Name, [Total ของกรรมการแต่ละคน], Grand Total, ลำดับ
 */
export function buildSummaryCsv(state: AppState): string {
  const { judges, contestants } = state

  const grandTotals = contestants.map((c) => {
    const totals = judges.map((j) => judgeTotal(c.scores[j.id]))
    return grandTotal(totals)
  })
  const ranks = computeRanks(grandTotals)

  const header = [
    'No.',
    'Name',
    ...judges.map((j) => `${j.name} (Total)`),
    'Grand Total',
    'ลำดับ',
  ]

  const rows = contestants.map((c, i) => {
    const totals = judges.map((j) => round2(judgeTotal(c.scores[j.id])))
    return [
      c.no,
      c.name,
      ...totals,
      round2(grandTotals[i]),
      ranks[i],
    ]
  })

  const lines = [header, ...rows].map((r) => r.map(csvCell).join(','))
  return '\uFEFF' + lines.join('\r\n') // BOM ให้ Excel อ่านภาษาไทยถูก
}

/**
 * สร้าง CSV รายละเอียด: ต่อ (ผู้เข้าแข่งขัน x กรรมการ) 1 แถว พร้อมคะแนนดิบทุกหัวข้อ
 */
export function buildDetailCsv(state: AppState): string {
  const { judges, contestants } = state

  const header = [
    'No.',
    'Name',
    'Judge',
    ...CRITERIA.map((c) => c.label),
    'Total',
  ]

  const rows: (string | number)[][] = []
  for (const c of contestants) {
    for (const j of judges) {
      const s = c.scores[j.id]
      rows.push([
        c.no,
        c.name,
        j.name,
        ...CRITERIA.map((cr) => s[cr.key]),
        round2(judgeTotal(s)),
      ])
    }
  }

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
