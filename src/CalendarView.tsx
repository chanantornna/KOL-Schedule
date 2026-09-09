import { useMemo, useState } from "react";
import { useLanguage } from "./LanguageContext";
import type { Job } from "./types";
import { formatCurrency } from "./utils";

interface CalendarViewProps {
  jobs: Job[];
  onSelect: (job: Job) => void;
}

interface DayCell {
  date: Date;
  inMonth: boolean;
  iso: string;
}

function toISO(d: Date): string {
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export default function CalendarView({ jobs, onSelect }: CalendarViewProps) {
  const { t, lang } = useLanguage();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const todayIso = toISO(new Date());

  const monthLabel = new Intl.DateTimeFormat(
    lang === "th" ? "th-TH" : "en-US",
    { month: "long", year: "numeric" }
  ).format(cursor);

  const weekdays = useMemo(() => {
    const base = new Date(2024, 0, 7); // a Sunday
    const fmt = new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-US", {
      weekday: "short",
    });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return fmt.format(d);
    });
  }, [lang]);

  const cells = useMemo<DayCell[]>(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const start = new Date(firstOfMonth);
    start.setDate(1 - firstOfMonth.getDay()); // back to Sunday

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return {
        date,
        inMonth: date.getMonth() === month,
        iso: toISO(date),
      };
    });
  }, [cursor]);

  // Map ISO date -> jobs whose draft or publish falls on that day.
  const byDate = useMemo(() => {
    const map = new Map<string, { job: Job; kind: "draft" | "publish" }[]>();
    for (const job of jobs) {
      if (job.draftDue) {
        const arr = map.get(job.draftDue) ?? [];
        arr.push({ job, kind: "draft" });
        map.set(job.draftDue, arr);
      }
      if (job.publishDate) {
        const arr = map.get(job.publishDate) ?? [];
        arr.push({ job, kind: "publish" });
        map.set(job.publishDate, arr);
      }
    }
    return map;
  }, [jobs]);

  const goPrev = () =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  const goNext = () =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  const goToday = () => {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold capitalize text-slate-800">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            title={t("prevMonth")}
          >
            ‹
          </button>
          <button
            onClick={goToday}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {t("today")}
          </button>
          <button
            onClick={goNext}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            title={t("nextMonth")}
          >
            ›
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-500" />
          {t("draftLegend")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-500" />
          {t("publishLegend")}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-sm">
        {weekdays.map((wd) => (
          <div
            key={wd}
            className="bg-slate-50 py-2 text-center text-xs font-medium uppercase text-slate-500"
          >
            {wd}
          </div>
        ))}

        {cells.map((cell) => {
          const entries = byDate.get(cell.iso) ?? [];
          const isToday = cell.iso === todayIso;
          return (
            <div
              key={cell.iso}
              className={`min-h-[92px] bg-white p-1.5 align-top ${
                cell.inMonth ? "" : "bg-slate-50/60 text-slate-400"
              }`}
            >
              <div className="mb-1 flex justify-end">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday
                      ? "bg-indigo-600 font-semibold text-white"
                      : "text-slate-500"
                  }`}
                >
                  {cell.date.getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {entries.slice(0, 3).map(({ job, kind }, idx) => (
                  <button
                    key={`${job.id}-${kind}-${idx}`}
                    onClick={() => onSelect(job)}
                    title={`${job.client} · ${job.title} · ${formatCurrency(
                      job.fee,
                      lang
                    )}`}
                    className={`flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium ${
                      kind === "draft"
                        ? "bg-sky-100 text-sky-800 hover:bg-sky-200"
                        : "bg-violet-100 text-violet-800 hover:bg-violet-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                        kind === "draft" ? "bg-sky-500" : "bg-violet-500"
                      }`}
                    />
                    <span className="truncate">{job.client}</span>
                  </button>
                ))}
                {entries.length > 3 && (
                  <div className="px-1.5 text-[10px] text-slate-400">
                    +{entries.length - 3}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {jobs.length === 0 && (
        <p className="mt-4 text-center text-sm text-slate-400">
          {t("noJobsThisMonth")}
        </p>
      )}
    </div>
  );
}
