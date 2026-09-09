import type { JobStatus, Platform } from "./types";

export const STATUS_STYLES: Record<JobStatus, string> = {
  planned: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  draft_sent: "bg-sky-100 text-sky-800 border-sky-200",
  published: "bg-violet-100 text-violet-800 border-violet-200",
  paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export const PLATFORM_STYLES: Record<Platform, string> = {
  instagram: "bg-pink-100 text-pink-700",
  tiktok: "bg-slate-900 text-white",
  youtube: "bg-red-100 text-red-700",
  facebook: "bg-blue-100 text-blue-700",
  x: "bg-slate-200 text-slate-800",
  other: "bg-slate-100 text-slate-600",
};
