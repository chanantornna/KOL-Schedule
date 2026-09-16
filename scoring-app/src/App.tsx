import { useEffect, useMemo, useRef, useState } from 'react'
import ScoreTable from './ScoreTable'
import Leaderboard from './Leaderboard'
import SettingsPanel from './SettingsPanel'
import RoomBar from './RoomBar'
import { clampScore } from './scoring'
import type { Criterion } from './scoring'
import {
  createDefaultState,
  loadState,
  makeContestant,
  saveState,
  uid,
} from './store'
import type { AppState } from './types'
import { buildDetailCsv, buildSummaryCsv, downloadCsv } from './exportCsv'
import { buildBackupJson, downloadJson, parseBackupJson } from './backup'
import { CLOUD_ENABLED } from './supabaseConfig'
import { getRoomFromUrl, setRoomInUrl, useCloudSync } from './useCloudSync'

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [room, setRoom] = useState<string | null>(() => getRoomFromUrl())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // บันทึกลง localStorage เสมอ (สำรอง + ใช้งาน offline ได้)
  useEffect(() => {
    saveState(state)
  }, [state])

  // cloud sync: โหลด/subscribe/เขียน เมื่ออยู่ในห้อง
  const { status: syncStatus } = useCloudSync({
    room,
    state,
    onRemoteState: setState,
  })

  // เข้าห้อง: ตั้งรหัสห้องลง URL แล้ว hook จะโหลด/สร้างห้องให้
  const joinRoom = (code: string) => {
    const clean = code.trim()
    if (!clean) return
    setRoomInUrl(clean)
    setRoom(clean)
  }

  const leaveRoom = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('room')
    window.history.replaceState({}, '', url.toString())
    setRoom(null)
  }

  // ----- ชื่องาน -----
  const setTitle = (title: string) => setState((p) => ({ ...p, title }))

  // ----- คะแนน / ชื่อผู้เข้าแข่งขัน -----
  const updateName = (contestantId: string, name: string) =>
    setState((p) => ({
      ...p,
      contestants: p.contestants.map((c) =>
        c.id === contestantId ? { ...c, name } : c,
      ),
    }))

  const updateScore = (
    contestantId: string,
    judgeId: string,
    criterionId: string,
    value: number,
  ) => {
    const crit = state.criteria.find((c) => c.id === criterionId)
    const clamped = clampScore(value, crit?.max ?? 5)
    setState((p) => ({
      ...p,
      contestants: p.contestants.map((c) =>
        c.id === contestantId
          ? {
              ...c,
              scores: {
                ...c.scores,
                [judgeId]: { ...c.scores[judgeId], [criterionId]: clamped },
              },
            }
          : c,
      ),
    }))
  }

  // ----- กรรมการ -----
  const updateJudgeName = (judgeId: string, name: string) =>
    setState((p) => ({
      ...p,
      judges: p.judges.map((j) => (j.id === judgeId ? { ...j, name } : j)),
    }))

  const addJudge = () =>
    setState((p) => {
      const newJudge = { id: uid('judge'), name: `กรรมการ ${p.judges.length + 1}` }
      const emptyRow = Object.fromEntries(p.criteria.map((c) => [c.id, 0]))
      return {
        ...p,
        judges: [...p.judges, newJudge],
        contestants: p.contestants.map((c) => ({
          ...c,
          scores: { ...c.scores, [newJudge.id]: { ...emptyRow } },
        })),
      }
    })

  const removeJudge = (judgeId: string) =>
    setState((p) => {
      if (p.judges.length <= 1) return p
      return {
        ...p,
        judges: p.judges.filter((j) => j.id !== judgeId),
        contestants: p.contestants.map((c) => {
          const { [judgeId]: _removed, ...rest } = c.scores
          return { ...c, scores: rest }
        }),
      }
    })

  // ----- ผู้เข้าแข่งขัน -----
  const addContestant = () =>
    setState((p) => ({
      ...p,
      contestants: [
        ...p.contestants,
        makeContestant('', p.judges, p.criteria),
      ],
    }))

  const removeContestant = (contestantId: string) =>
    setState((p) => {
      if (p.contestants.length <= 1) return p
      return {
        ...p,
        contestants: p.contestants.filter((c) => c.id !== contestantId),
      }
    })

  // ----- เกณฑ์ (criteria) -----
  const addCriterion = () =>
    setState((p) => {
      const newCrit: Criterion = {
        id: uid('crit'),
        label: `หัวข้อใหม่ ${p.criteria.length + 1}`,
        weight: 0,
        max: 5,
      }
      return {
        ...p,
        criteria: [...p.criteria, newCrit],
        contestants: p.contestants.map((c) => ({
          ...c,
          scores: Object.fromEntries(
            Object.entries(c.scores).map(([jid, row]) => [
              jid,
              { ...row, [newCrit.id]: 0 },
            ]),
          ),
        })),
      }
    })

  const removeCriterion = (criterionId: string) =>
    setState((p) => {
      if (p.criteria.length <= 1) return p
      return {
        ...p,
        criteria: p.criteria.filter((c) => c.id !== criterionId),
        contestants: p.contestants.map((c) => ({
          ...c,
          scores: Object.fromEntries(
            Object.entries(c.scores).map(([jid, row]) => {
              const { [criterionId]: _r, ...rest } = row
              return [jid, rest]
            }),
          ),
        })),
      }
    })

  const changeCriterion = (criterionId: string, patch: Partial<Criterion>) =>
    setState((p) => ({
      ...p,
      criteria: p.criteria.map((c) =>
        c.id === criterionId ? { ...c, ...patch } : c,
      ),
    }))

  // ----- import / reset -----
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const imported = parseBackupJson(await file.text())
      if (
        window.confirm(
          'นำเข้าไฟล์นี้จะเขียนทับข้อมูลทั้งหมดที่มีอยู่ตอนนี้ ยืนยันหรือไม่?',
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

  const resetAll = () => {
    if (window.confirm('ล้างข้อมูลทั้งหมด กลับไปค่าเริ่มต้น? ย้อนกลับไม่ได้')) {
      setState(createDefaultState())
    }
  }

  const dateStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <input
            value={state.title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-transparent text-xl font-bold text-slate-900 hover:border-slate-200 focus:border-indigo-500 focus:outline-none"
            placeholder="ชื่องาน / การแข่งขัน"
          />
          <p className="mt-1 text-sm text-slate-500">
            กรรมการ {state.judges.length} คน · ผู้เข้าแข่งขัน{' '}
            {state.contestants.length} คน · เกณฑ์ {state.criteria.length} หัวข้อ
          </p>
          {CLOUD_ENABLED && (
            <RoomBar
              room={room}
              status={syncStatus}
              onJoin={joinRoom}
              onLeave={leaveRoom}
            />
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() =>
              downloadCsv(`scores-summary-${dateStr}.csv`, buildSummaryCsv(state))
            }
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            ดาวน์โหลด CSV (สรุปอันดับ)
          </button>
          <button
            onClick={() =>
              downloadCsv(`scores-detail-${dateStr}.csv`, buildDetailCsv(state))
            }
            className="rounded bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            ดาวน์โหลด CSV (รายละเอียด)
          </button>
          <button
            onClick={() =>
              downloadJson(`scores-backup-${dateStr}.json`, buildBackupJson(state))
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
          <SettingsPanel
            criteria={state.criteria}
            onAdd={addCriterion}
            onRemove={removeCriterion}
            onChange={changeCriterion}
          />
        </div>

        <div className="mb-6">
          <Leaderboard state={state} />
        </div>

        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-600">
            กรอกคะแนนแยกตามกรรมการ
          </span>
          <div className="flex gap-2">
            <button
              onClick={addContestant}
              className="rounded border border-indigo-300 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              + เพิ่มผู้เข้าแข่งขัน
            </button>
            <button
              onClick={addJudge}
              className="rounded border border-indigo-300 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              + เพิ่มกรรมการ
            </button>
          </div>
        </div>

        {state.judges.map((judge) => (
          <ScoreTable
            key={judge.id}
            judge={judge}
            criteria={state.criteria}
            contestants={state.contestants}
            onNameChange={updateName}
            onScoreChange={updateScore}
            onJudgeNameChange={updateJudgeName}
            onRemoveJudge={removeJudge}
            canRemoveJudge={state.judges.length > 1}
          />
        ))}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-600">
            จัดการรายชื่อผู้เข้าแข่งขัน
          </h3>
          <ul className="divide-y divide-slate-100">
            {state.contestants.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 py-1.5 text-sm">
                <span className="w-8 text-slate-400">{i + 1}.</span>
                <span className="flex-1">
                  {c.name || (
                    <span className="text-slate-300">— ยังไม่ระบุชื่อ —</span>
                  )}
                </span>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `ลบผู้เข้าแข่งขัน "${c.name || i + 1}" และคะแนนทั้งหมด?`,
                      )
                    )
                      removeContestant(c.id)
                  }}
                  disabled={state.contestants.length <= 1}
                  className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ลบ
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4">
        <div className="mx-auto max-w-6xl px-4 text-xs text-slate-400">
          ข้อมูลถูกบันทึกไว้ในเบราว์เซอร์นี้โดยอัตโนมัติ (localStorage) ·
          ใช้ปุ่มส่งออก/นำเข้าไฟล์เพื่อแชร์ให้กรรมการท่านอื่น
        </div>
      </footer>
    </div>
  )
}
