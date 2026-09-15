import { judgeTotal, grandTotal, computeRanks, round2 } from './scoring'
import type { AppState } from './types'

interface Props {
  state: AppState
}

export default function Leaderboard({ state }: Props) {
  const { judges, contestants, criteria } = state

  const rows = contestants.map((c) => {
    const totals = judges.map((j) => judgeTotal(c.scores[j.id] ?? {}, criteria))
    return {
      id: c.id,
      name: c.name,
      judgeTotals: totals,
      grand: grandTotal(totals),
    }
  })

  const ranks = computeRanks(rows.map((r) => r.grand))
  const ordered = rows
    .map((r, i) => ({ ...r, rank: ranks[i], origIndex: i }))
    .sort((a, b) => a.rank - b.rank || a.origIndex - b.origIndex)

  const medal = (rank: number) =>
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : ''

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-800">
          สรุปผล &amp; จัดอันดับ (Grand Total)
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Grand Total = ค่าเฉลี่ยของ Total จากกรรมการทุกคน แปลงเป็นคะแนนเต็ม 5
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-slate-600">
              <th className="w-16 border border-slate-200 px-2 py-2">ลำดับ</th>
              <th className="min-w-[160px] border border-slate-200 px-2 py-2 text-left">
                Name
              </th>
              {judges.map((j) => (
                <th
                  key={j.id}
                  className="min-w-[100px] border border-slate-200 px-2 py-2 text-xs"
                >
                  {j.name}
                </th>
              ))}
              <th className="w-28 border border-slate-200 px-2 py-2">
                Grand Total
                <div className="text-[11px] font-normal text-slate-400">
                  (เต็ม 5)
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="border border-slate-200 px-2 py-1 text-center font-semibold">
                  <span className="mr-1">{medal(r.rank)}</span>
                  {r.rank}
                </td>
                <td className="border border-slate-200 px-2 py-1">
                  {r.name || (
                    <span className="text-slate-300">— ยังไม่ระบุชื่อ —</span>
                  )}
                </td>
                {r.judgeTotals.map((t, i) => (
                  <td
                    key={i}
                    className="border border-slate-200 px-2 py-1 text-center text-slate-600"
                  >
                    {round2(t)}
                  </td>
                ))}
                <td className="border border-slate-200 px-2 py-1 text-center text-lg font-bold text-indigo-700">
                  {round2(r.grand)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
