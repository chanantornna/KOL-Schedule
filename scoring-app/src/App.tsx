import { useEffect, useMemo, useRef, useState } from 'react'
import ScoreTable from './ScoreTable'
import Leaderboard from './Leaderboard'
import { clampScore } from './scoring'
import type { CriterionKey } from './scoring'
import { createDefaultState, loadState, saveState } from './store'
import type { AppState } from './types'
import {
  buildDetailCsv,
  buildSummaryCsv,
  downloadCsv,
} from './exportCsv'
import { buildBackupJson, downloadJson, parseBackupJson } from './backup'

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // persist ทุกครั้งที่ state เปลี่ยน
  useEffect(() => {
    saveState(state)
  }, [state])

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // reset เพื่อให้เลือกไฟล์เดิมซ้ำได้
    if (!file) return
    try {
      const text = await file.text()
      const imported = parseBackupJson(text)
      if (
        window.confirm(
          'นำเข้าไฟล์นี้จะเขียนทับคะแนนทั้งหมดที่มีอยู่ตอนนี้ ยืนยันหรือไม่?',
        )
      ) {
        setState(imported)
      }
    } catch (err) {
      window.alert(
        'นำเข้าไม่สำเร็จ: ' +
          (err instanceof Error ? err.message : 'ไฟล์ไม่ถูกต้อง'),
      )
    }
  }

  const updateName = (contestantNo: number, name: string) => {
    setState((prev) => ({
      ...prev,
      contestants: prev.contestants.map((c) =>
        c.no === contestantNo ? { ...c, name } : c,
      ),
    }))
  }

  const updateScore = (
    contestantNo: number,
    judgeId: string,
    key: CriterionKey,
    value: number,
  ) => {
    const clamped = clampScore(value)
    setState((prev) => ({
      ...prev,
      contestants: prev.contestants.map((c) =>
        c.no === contestantNo
          ? {
              ...c,
              scores: {
                ...c.scores,
                [judgeId]: { ...c.scores[judgeId], [key]: clamped },
              },
            }
          : c,
      ),
    }))
  }

  const updateJudgeName = (judgeId: string, name: string) => {
    setState((prev) => ({
      ...prev,
      judges: prev.judges.map((j) => (j.id === judgeId ? { ...j, name } : j)),
    }))
  }

  const resetAll = () => {
    if (
      window.confirm(
        'ล้างคะแนนและชื่อทั้งหมด กลับไปเริ่มต้นใหม่? การกระทำนี้ย้อนกลับไม่ได้',
      )
    ) {
      setState(createDefaultState())
    }
  }

  const dateStr = useMemo(
    () => new Date().toISOString().slice(0, 10),
    [],
  )

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <h1 className="text-xl font-bold text-slate-900">
            PartyRock Scoring · SPU
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            รวมคะแนนตามเกณฑ์ในชีท · กรรมการ {state.judges.length} คน · ผู้เข้าแข่งขัน{' '}
            {state.contestants.length} คน
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() =>
              downloadCsv(`partyrock-summary-${dateStr}.csv`, buildSummaryCsv(state))
            }
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            ดาวน์โหลด CSV (สรุปอันดับ)
          </button>
          <button
            onClick={() =>
              downloadCsv(`partyrock-detail-${dateStr}.csv`, buildDetailCsv(state))
            }
            className="rounded bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            ดาวน์โหลด CSV (รายละเอียดทุกหัวข้อ)
          </button>
          <button
            onClick={() =>
              downloadJson(
                `partyrock-backup-${dateStr}.json`,
                buildBackupJson(state),
              )
            }
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            ส่งออกไฟล์ (สำหรับส่งต่อ)
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            นำเข้าไฟล์
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            onClick={resetAll}
            className="ml-auto rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            ล้างข้อมูลทั้งหมด
          </button>
        </div>

        <div className="mb-6">
          <Leaderboard state={state} />
        </div>

        <div className="mb-3 text-sm font-semibold text-slate-600">
          กรอกคะแนนแยกตามกรรมการ
        </div>
        {state.judges.map((judge) => (
          <ScoreTable
            key={judge.id}
            judge={judge}
            contestants={state.contestants}
            onNameChange={updateName}
            onScoreChange={updateScore}
            onJudgeNameChange={updateJudgeName}
          />
        ))}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4">
        <div className="mx-auto max-w-6xl px-4 text-xs text-slate-400">
          ข้อมูลถูกบันทึกไว้ในเบราว์เซอร์นี้โดยอัตโนมัติ (localStorage)
        </div>
      </footer>
    </div>
  )
}
