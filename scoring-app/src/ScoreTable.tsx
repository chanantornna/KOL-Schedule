import { CRITERIA, MAX_SCORE_PER_CRITERION, judgeTotal, round2 } from './scoring'
import type { CriterionKey } from './scoring'
import type { Contestant, Judge } from './types'

interface Props {
  judge: Judge
  contestants: Contestant[]
  onNameChange: (contestantNo: number, name: string) => void
  onScoreChange: (
    contestantNo: number,
    judgeId: string,
    key: CriterionKey,
    value: number,
  ) => void
  onJudgeNameChange: (judgeId: string, name: string) => void
}

export default function ScoreTable({
  judge,
  contestants,
  onNameChange,
  onScoreChange,
  onJudgeNameChange,
}: Props) {
  return (
    <section className="mb-10 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <span className="text-sm font-semibold text-slate-500">กรรมการ:</span>
        <input
          value={judge.name}
          onChange={(e) => onJudgeNameChange(judge.id, e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
          placeholder="ชื่อกรรมการ"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-slate-600">
              <th className="w-12 border border-slate-200 px-2 py-2">No.</th>
              <th className="min-w-[160px] border border-slate-200 px-2 py-2 text-left">
                Name
              </th>
              {CRITERIA.map((c) => (
                <th
                  key={c.key}
                  className="min-w-[110px] border border-slate-200 px-2 py-2 align-top"
                >
                  <div className="text-xs font-semibold leading-tight">
                    {c.label}
                  </div>
                  <div className="mt-1 text-[11px] font-normal text-indigo-600">
                    {c.weight}% · เต็ม {MAX_SCORE_PER_CRITERION}
                  </div>
                </th>
              ))}
              <th className="w-24 border border-slate-200 px-2 py-2">
                Total
                <div className="text-[11px] font-normal text-slate-400">
                  (เต็ม 100)
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {contestants.map((c) => {
              const scores = c.scores[judge.id]
              const total = round2(judgeTotal(scores))
              return (
                <tr key={c.no} className="hover:bg-slate-50">
                  <td className="border border-slate-200 px-2 py-1 text-center font-medium text-slate-500">
                    {c.no}
                  </td>
                  <td className="border border-slate-200 px-2 py-1">
                    <input
                      value={c.name}
                      onChange={(e) => onNameChange(c.no, e.target.value)}
                      className="w-full rounded border border-transparent px-1 py-1 hover:border-slate-200 focus:border-indigo-500 focus:outline-none"
                      placeholder={`ผู้เข้าแข่งขัน ${c.no}`}
                    />
                  </td>
                  {CRITERIA.map((cr) => (
                    <td
                      key={cr.key}
                      className="border border-slate-200 px-2 py-1 text-center"
                    >
                      <input
                        type="number"
                        min={0}
                        max={MAX_SCORE_PER_CRITERION}
                        step={0.5}
                        value={scores[cr.key]}
                        onChange={(e) =>
                          onScoreChange(
                            c.no,
                            judge.id,
                            cr.key,
                            e.target.value === '' ? 0 : Number(e.target.value),
                          )
                        }
                        className="w-16 rounded border border-slate-300 px-1 py-1 text-center focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                  ))}
                  <td className="border border-slate-200 px-2 py-1 text-center font-semibold text-indigo-700">
                    {total}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
