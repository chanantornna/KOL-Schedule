import { judgeTotal, round2 } from './scoring'
import type { Criterion } from './scoring'
import type { Contestant, Judge } from './types'

interface Props {
  judge: Judge
  criteria: Criterion[]
  contestants: Contestant[]
  isAdmin: boolean
  onNameChange: (contestantId: string, name: string) => void
  onScoreChange: (
    contestantId: string,
    judgeId: string,
    criterionId: string,
    value: number,
  ) => void
  onJudgeNameChange: (judgeId: string, name: string) => void
  onRemoveJudge: (judgeId: string) => void
  canRemoveJudge: boolean
}

export default function ScoreTable({
  judge,
  criteria,
  contestants,
  isAdmin,
  onNameChange,
  onScoreChange,
  onJudgeNameChange,
  onRemoveJudge,
  canRemoveJudge,
}: Props) {
  return (
    <section className="mb-8 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <span className="text-sm font-semibold text-slate-500">กรรมการ:</span>
        <input
          value={judge.name}
          onChange={(e) => onJudgeNameChange(judge.id, e.target.value)}
          readOnly={!isAdmin}
          className={`rounded border border-slate-300 px-2 py-1 text-sm font-semibold text-slate-800 focus:outline-none ${
            isAdmin ? 'focus:border-indigo-500' : 'cursor-default bg-slate-50'
          }`}
          placeholder="ชื่อกรรมการ"
        />
        {isAdmin && (
          <button
            onClick={() => {
              if (
                window.confirm(
                  `ลบกรรมการ "${judge.name}" และคะแนนทั้งหมดของท่านนี้?`,
                )
              )
                onRemoveJudge(judge.id)
            }}
            disabled={!canRemoveJudge}
            className="ml-auto rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            title={canRemoveJudge ? 'ลบกรรมการคนนี้' : 'ต้องมีกรรมการอย่างน้อย 1 คน'}
          >
            ลบกรรมการ
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-slate-600">
              <th className="w-12 border border-slate-200 px-2 py-2">No.</th>
              <th className="min-w-[160px] border border-slate-200 px-2 py-2 text-left">
                Name
              </th>
              {criteria.map((c) => (
                <th
                  key={c.id}
                  className="min-w-[110px] border border-slate-200 px-2 py-2 align-top"
                >
                  <div className="text-xs font-semibold leading-tight">
                    {c.label}
                  </div>
                  <div className="mt-1 text-[11px] font-normal text-indigo-600">
                    {c.weight}% · เต็ม {c.max}
                  </div>
                </th>
              ))}
              <th className="w-24 border border-slate-200 px-2 py-2">
                Total
                <div className="text-[11px] font-normal text-slate-400">
                  (เต็ม 5)
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {contestants.map((c, idx) => {
              const scores = c.scores[judge.id] ?? {}
              const total = round2(judgeTotal(scores, criteria))
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="border border-slate-200 px-2 py-1 text-center font-medium text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-200 px-2 py-1">
                    <input
                      value={c.name}
                      onChange={(e) => onNameChange(c.id, e.target.value)}
                      readOnly={!isAdmin}
                      className={`w-full rounded border border-transparent px-1 py-1 focus:outline-none ${
                        isAdmin
                          ? 'hover:border-slate-200 focus:border-indigo-500'
                          : 'cursor-default'
                      }`}
                      placeholder={isAdmin ? `ผู้เข้าแข่งขัน ${idx + 1}` : ''}
                    />
                  </td>
                  {criteria.map((cr) => (
                    <td
                      key={cr.id}
                      className="border border-slate-200 px-2 py-1 text-center"
                    >
                      <input
                        type="number"
                        min={0}
                        max={cr.max}
                        step={0.5}
                        value={scores[cr.id] ?? 0}
                        onChange={(e) =>
                          onScoreChange(
                            c.id,
                            judge.id,
                            cr.id,
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
