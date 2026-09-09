import type { Lang } from "./i18n";

export function formatCurrency(amount: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "th" ? "th-TH" : "en-US", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(iso: string, lang: Lang): string {
  if (!iso) return "-";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Days from today to the given ISO date. Negative = past. Null if empty. */
export function daysUntil(iso: string): number | null {
  if (!iso) return null;
  const target = new Date(iso + "T00:00:00");
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function todayISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export interface JobFinance {
  fee: number;
  wht: number; // withholding tax amount
  travelCost: number;
  otherCost: number;
  expenses: number; // travel + other
  net: number; // fee - wht - expenses
}

/** Compute the financial breakdown for a single job. */
export function computeFinance(job: {
  fee: number;
  hasWht: boolean;
  whtRate: number;
  travelCost: number;
  otherCost: number;
}): JobFinance {
  const fee = job.fee || 0;
  const wht = job.hasWht ? Math.round((fee * (job.whtRate || 0)) / 100) : 0;
  const travelCost = job.travelCost || 0;
  const otherCost = job.otherCost || 0;
  const expenses = travelCost + otherCost;
  const net = fee - wht - expenses;
  return { fee, wht, travelCost, otherCost, expenses, net };
}

/** Human-readable file size, e.g. "1.2 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
