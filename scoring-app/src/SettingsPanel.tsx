import { useState } from 'react'
import { totalWeight } from './scoring'
import type { Criterion } from './scoring'

interface Props {
  criteria: Criterion[]
  onAdd: () => void
  onRemove: (criterionId: string) => void
  onChange: (criterionId: string, patch: Partial<Criterion>) => void
}

export default function SettingsPanel({
  criteria,
  onAdd,
  onRemove,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false)
  const sum = totalWeight(criteria)
  const weightOk = Math.abs(sum - 100) < 0.001

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-base font-semibold text-slate-800">
          ⚙️ ตั้งค่าเกณฑ์การให้คะแนน
        </span>
        <span className="text-sm text-slate-400">{open ? 'ซ่อน ▲' : 'แก้ไข ▼'}</span>
      </button>

      {open && (
        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-600">น้ำหนักรวม:</span>
            <span
              className={
                weightOk
                  ? 'font-semibold text-emerald-600'
                  : 'font-semibold text-amber-600'
              }
            >
              {sum}%
            </span>
            {!weightOk && (
              <span className="text-xs text-amber-600">
                (แนะนำให้รวมเป็น 100% เพื่อให้ Total เต็ม 100)
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="border border-slate-200 px-2 py-2 text-left">
                    ชื่อหัวข้อ
                  </th>
                  <th className="w-28 border border-slate-200 px-2 py-2">
                    น้ำหนัก (%)
                  </th>
                  <th className="w-28 border border-slate-200 px-2 py-2">
                    คะแนนเต็ม
                  </th>
                  <th className="w-16 border border-slate-200 px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {criteria.map((c) => (
                  <tr key={c.id}>
                    <td className="border border-slate-200 px-2 py-1">
                      <input
                        value={c.label}
                        onChange={(e) => onChange(c.id, { label: e.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-1 focus:border-indigo-500 focus:outline-none"
                        placeholder="ชื่อหัวข้อการให้คะแนน"
                      />
                    </td>
                    <td className="border border-slate-200 px-2 py-1 text-center">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={c.weight}
                        onChange={(e) =>
                          onChange(c.id, { weight: Number(e.target.value) || 0 })
                        }
                        className="w-20 rounded border border-slate-300 px-1 py-1 text-center focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="border border-slate-200 px-2 py-1 text-center">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={c.max}
                        onChange={(e) =>
                          onChange(c.id, { max: Number(e.target.value) || 1 })
                        }
                        className="w-20 rounded border border-slate-300 px-1 py-1 text-center focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="border border-slate-200 px-2 py-1 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm(`ลบหัวข้อ "${c.label}"?`))
                            onRemove(c.id)
                        }}
                        disabled={criteria.length <= 1}
                        className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title={
                          criteria.length > 1
                            ? 'ลบหัวข้อนี้'
                            : 'ต้องมีอย่างน้อย 1 หัวข้อ'
                        }
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={onAdd}
            className="mt-3 rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + เพิ่มหัวข้อ
          </button>
        </div>
      )}
    </section>
  )
}
