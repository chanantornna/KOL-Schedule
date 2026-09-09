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
