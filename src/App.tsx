import { useMemo, useState } from "react";
import { LanguageProvider, useLanguage } from "./LanguageContext";
import { useJobs } from "./useJobs";
import JobForm from "./JobForm";
import CalendarView from "./CalendarView";
import { exportJobsToCsv } from "./exportCsv";
import { PLATFORM_STYLES, STATUS_STYLES } from "./constants";
import {
  PLATFORMS,
  STATUSES,
  type Job,
  type JobInput,
  type JobStatus,
  type Platform,
} from "./types";
import { daysUntil, formatCurrency, formatDate } from "./utils";

type SortKey = "created" | "draftDue" | "publishDate" | "fee";
type ViewMode = "table" | "calendar";

function DueBadge({ iso }: { iso: string }) {
  const { t, lang } = useLanguage();
  if (!iso) return <span className="text-slate-400">{t("noDate")}</span>;
  const days = daysUntil(iso);
  let cls = "text-slate-600";
  let tag: string | null = null;
  if (days !== null) {
    if (days < 0) {
      cls = "text-red-600 font-medium";
      tag = t("overdue");
    } else if (days <= 3) {
      cls = "text-amber-600 font-medium";
      tag = t("dueSoon");
    }
  }
  return (
    <span className={cls}>
      {formatDate(iso, lang)}
      {tag && (
        <span className="ml-1 inline-block rounded bg-current/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
          {tag}
        </span>
      )}
    </span>
  );
}

function AppInner() {
  const { t, lang, toggleLang } = useLanguage();
  const { jobs, addJob, updateJob, deleteJob } = useJobs();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [view, setView] = useState<ViewMode>("table");

  const summary = useMemo(() => {
    const totalRevenue = jobs.reduce((sum, j) => sum + (j.fee || 0), 0);
    const unpaidRevenue = jobs
      .filter((j) => j.status !== "paid")
      .reduce((sum, j) => sum + (j.fee || 0), 0);
    const upcomingDrafts = jobs.filter((j) => {
      const d = daysUntil(j.draftDue);
      return (
        d !== null &&
        d >= 0 &&
        d <= 7 &&
        j.status !== "published" &&
        j.status !== "paid"
      );
    }).length;
    return {
      totalJobs: jobs.length,
      totalRevenue,
      unpaidRevenue,
      upcomingDrafts,
    };
  }, [jobs]);

  const visibleJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = jobs.filter((j) => {
      const matchesSearch =
        !q ||
        j.client.toLowerCase().includes(q) ||
        j.title.toLowerCase().includes(q) ||
        j.notes.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || j.status === statusFilter;
      const matchesPlatform =
        platformFilter === "all" || j.platform === platformFilter;
      return matchesSearch && matchesStatus && matchesPlatform;
    });

    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "fee":
          return (b.fee || 0) - (a.fee || 0);
        case "draftDue":
          return (a.draftDue || "9999").localeCompare(b.draftDue || "9999");
        case "publishDate":
          return (a.publishDate || "9999").localeCompare(
            b.publishDate || "9999"
          );
        case "created":
        default:
          return b.createdAt - a.createdAt;
      }
    });
    return list;
  }, [jobs, search, statusFilter, platformFilter, sortKey]);

  const openAdd = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (job: Job) => {
    setEditing(job);
    setShowForm(true);
  };
  const handleSubmit = (input: JobInput) => {
    if (editing) updateJob(editing.id, input);
    else addJob(input);
    setShowForm(false);
    setEditing(null);
  };
  const handleDelete = (job: Job) => {
    if (window.confirm(t("confirmDelete"))) deleteJob(job.id);
  };

  const selectClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

  return (
    <div className="min-h-screen font-sans">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{t("appTitle")}</h1>
            <p className="text-sm text-slate-500">{t("appSubtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              title="TH / EN"
            >
              {lang === "th" ? "🇹🇭 ไทย" : "🇬🇧 EN"}
            </button>
            <button
              onClick={() => exportJobsToCsv(visibleJobs, lang)}
              disabled={visibleJobs.length === 0}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ⬇ {t("exportCsv")}
            </button>
            <button
              onClick={openAdd}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              + {t("addJob")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Summary */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard label={t("totalJobs")} value={String(summary.totalJobs)} />
          <SummaryCard
            label={t("totalRevenue")}
            value={formatCurrency(summary.totalRevenue, lang)}
            accent="text-emerald-600"
          />
          <SummaryCard
            label={t("unpaidRevenue")}
            value={formatCurrency(summary.unpaidRevenue, lang)}
            accent="text-amber-600"
          />
          <SummaryCard
            label={t("upcomingDrafts")}
            value={String(summary.upcomingDrafts)}
            accent="text-sky-600"
          />
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            className={`${selectClass} min-w-[180px] flex-1`}
            placeholder={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={selectClass}
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as JobStatus | "all")
            }
          >
            <option value="all">{t("filterStatus")}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status_${s}` as const)}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={platformFilter}
            onChange={(e) =>
              setPlatformFilter(e.target.value as Platform | "all")
            }
          >
            <option value="all">{t("filterPlatform")}</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {t(`platform_${p}` as const)}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="created">{t("sortCreated")}</option>
            <option value="draftDue">{t("sortDraftDue")}</option>
            <option value="publishDate">{t("sortPublish")}</option>
            <option value="fee">{t("sortFee")}</option>
          </select>

          <div className="ml-auto inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
            <button
              onClick={() => setView("table")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                view === "table"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              ▤ {t("tableView")}
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                view === "calendar"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              ▦ {t("calendarView")}
            </button>
          </div>
        </div>

        {/* Calendar view */}
        {view === "calendar" && (
          <CalendarView jobs={visibleJobs} onSelect={openEdit} />
        )}

        {/* Table / empty state */}
        {view === "table" &&
          (visibleJobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="text-lg font-semibold text-slate-700">
              {t("emptyTitle")}
            </p>
            <p className="mt-1 text-sm text-slate-500">{t("emptyDesc")}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">{t("client")}</th>
                    <th className="px-4 py-3">{t("platform")}</th>
                    <th className="px-4 py-3">{t("draftDue")}</th>
                    <th className="px-4 py-3">{t("publishDate")}</th>
                    <th className="px-4 py-3 text-right">{t("fee")}</th>
                    <th className="px-4 py-3">{t("status")}</th>
                    <th className="px-4 py-3">{t("postUrl")}</th>
                    <th className="px-4 py-3 text-right">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">
                          {job.client}
                        </div>
                        <div className="text-slate-500">{job.title}</div>
                        {job.notes && (
                          <div className="mt-0.5 text-xs text-slate-400">
                            {job.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            PLATFORM_STYLES[job.platform]
                          }`}
                        >
                          {t(`platform_${job.platform}` as const)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <DueBadge iso={job.draftDue} />
                      </td>
                      <td className="px-4 py-3">
                        <DueBadge iso={job.publishDate} />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">
                        {formatCurrency(job.fee, lang)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            STATUS_STYLES[job.status]
                          }`}
                        >
                          {t(`status_${job.status}` as const)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {job.postUrl ? (
                          <a
                            href={job.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                            title={job.postUrl}
                          >
                            🔗 {t("openLink")}
                          </a>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(job)}
                            className="rounded-md px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                          >
                            {t("edit")}
                          </button>
                          <button
                            onClick={() => handleDelete(job)}
                            className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            {t("delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          ))}
      </main>

      {showForm && (
        <JobForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent = "text-slate-800",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}
