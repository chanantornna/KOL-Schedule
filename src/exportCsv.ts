import type { Job } from "./types";
import type { Lang } from "./i18n";
import { translations } from "./i18n";
import { computeFinance } from "./utils";

function escapeCsv(value: string | number): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportJobsToCsv(jobs: Job[], lang: Lang): void {
  const t = translations[lang];

  const headers = [
    t.client,
    t.title,
    t.platform,
    t.draftDue,
    t.publishDate,
    t.fee,
    t.genCode,
    t.genDays,
    t.whtAmount,
    t.travelCost,
    t.otherCost,
    t.netIncome,
    t.status,
    t.postUrl,
    t.notes,
  ];

  const rows = jobs.map((job) => {
    const f = computeFinance(job);
    return [
      job.client,
      job.title,
      t[`platform_${job.platform}` as const],
      job.draftDue,
      job.publishDate,
      job.fee,
      job.genCode,
      job.genDays || "",
      f.wht,
      job.travelCost,
      job.otherCost,
      f.net,
      t[`status_${job.status}` as const],
      job.postUrl,
      job.notes,
    ];
  });

  const lines = [headers, ...rows]
    .map((cols) => cols.map(escapeCsv).join(","))
    .join("\r\n");

  // Prepend BOM so Excel opens Thai/UTF-8 correctly.
  const blob = new Blob(["\uFEFF" + lines], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `kol-schedule-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
