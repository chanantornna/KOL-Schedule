import { useState } from 'react'
import type { SyncStatus } from './useCloudSync'

interface Props {
  room: string | null
  status: SyncStatus
  onJoin: (code: string) => void
  onLeave: () => void
}

const STATUS_LABEL: Record<SyncStatus, { text: string; className: string }> = {
  local: { text: 'ออฟไลน์ (เครื่องนี้เท่านั้น)', className: 'bg-slate-100 text-slate-500' },
  connecting: { text: 'กำลังเชื่อมต่อ…', className: 'bg-amber-100 text-amber-700' },
  synced: { text: '● ซิงค์แล้ว (เรียลไทม์)', className: 'bg-emerald-100 text-emerald-700' },
  saving: { text: 'กำลังบันทึก…', className: 'bg-sky-100 text-sky-700' },
  error: { text: 'บันทึกไม่สำเร็จ', className: 'bg-red-100 text-red-700' },
}

export default function RoomBar({ room, status, onJoin, onLeave }: Props) {
  const [code, setCode] = useState('')
  const badge = STATUS_LABEL[status]

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      window.alert('คัดลอกลิงก์ห้องแล้ว ส่งให้กรรมการท่านอื่นได้เลย')
    } catch {
      window.prompt('คัดลอกลิงก์นี้เพื่อแชร์:', window.location.href)
    }
  }

  if (!room) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-slate-50 p-3">
        <span className="text-sm text-slate-600">
          เข้าห้องเพื่อแก้คะแนนร่วมกันแบบเรียลไทม์:
        </span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onJoin(code)}
          placeholder="รหัสห้อง เช่น contest-2026"
          className="rounded border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <button
          onClick={() => onJoin(code)}
          className="rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700"
        >
          เข้าห้อง / สร้างห้อง
        </button>
        <span className="text-xs text-slate-400">
          (ตั้งรหัสอะไรก็ได้ ถ้ายังไม่มีจะสร้างใหม่ให้)
        </span>
      </div>
    )
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-slate-50 p-3">
      <span className="text-sm text-slate-600">
        ห้อง: <span className="font-semibold text-slate-800">{room}</span>
      </span>
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
        {badge.text}
      </span>
      <button
        onClick={copyLink}
        className="rounded border border-indigo-300 px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
      >
        คัดลอกลิงก์ห้อง
      </button>
      <button
        onClick={onLeave}
        className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
      >
        ออกจากห้อง
      </button>
    </div>
  )
}
