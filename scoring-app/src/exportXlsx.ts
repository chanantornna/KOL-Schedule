import ExcelJS from 'exceljs'
import { judgeTotal, grandTotal, computeRanks, round2 } from './scoring'
import type { AppState } from './types'

/**
 * สร้างและดาวน์โหลดไฟล์ Excel (.xlsx) ที่มี 2 ชีท:
 *  - "สรุปอันดับ": ต่อผู้เข้าแข่งขัน 1 แถว (Total ของกรรมการแต่ละคน + Grand Total + ลำดับ)
 *  - "รายละเอียด": ต่อ (ผู้เข้าแข่งขัน × กรรมการ) 1 แถว พร้อมคะแนนทุกหัวข้อ
 * ค่าที่คำนวณใช้ logic เดียวกับที่แสดงในหน้าจอ (เต็ม 5)
 */
export async function downloadXlsx(
  filename: string,
  state: AppState,
): Promise<void> {
  const { judges, contestants, criteria } = state
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Scoring App'
  wb.created = new Date()

  // ----- ชีท 1: สรุปอันดับ -----
  const grandTotals = contestants.map((c) =>
    grandTotal(judges.map((j) => judgeTotal(c.scores[j.id] ?? {}, criteria))),
  )
  const ranks = computeRanks(grandTotals)

  const summary = wb.addWorksheet('สรุปอันดับ')
  summary.columns = [
    { header: 'No.', width: 6 },
    { header: 'Name', width: 24 },
    ...judges.map((j) => ({ header: `${j.name} (Total /5)`, width: 16 })),
    { header: 'Grand Total (/5)', width: 16 },
    { header: 'ลำดับ', width: 8 },
  ]
  contestants.forEach((c, i) => {
    summary.addRow([
      i + 1,
      c.name,
      ...judges.map((j) => round2(judgeTotal(c.scores[j.id] ?? {}, criteria))),
      round2(grandTotals[i]),
      ranks[i],
    ])
  })
  summary.getRow(1).font = { bold: true }

  // ----- ชีท 2: รายละเอียด -----
  const detail = wb.addWorksheet('รายละเอียด')
  detail.columns = [
    { header: 'No.', width: 6 },
    { header: 'Name', width: 24 },
    { header: 'Judge', width: 18 },
    ...criteria.map((c) => ({
      header: `${c.label} (${c.weight}% · เต็ม ${c.max})`,
      width: 28,
    })),
    { header: 'Total (/5)', width: 10 },
  ]
  contestants.forEach((c, i) => {
    for (const j of judges) {
      const s = c.scores[j.id] ?? {}
      detail.addRow([
        i + 1,
        c.name,
        j.name,
        ...criteria.map((cr) => s[cr.id] ?? 0),
        round2(judgeTotal(s, criteria)),
      ])
    }
  })
  detail.getRow(1).font = { bold: true }

  // ----- สร้างไฟล์แล้ว trigger ดาวน์โหลด -----
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
