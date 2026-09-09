import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLanguage } from "./LanguageContext";
import {
  DEFAULT_WHT_RATE,
  PLATFORMS,
  STATUSES,
  type Attachment,
  type Job,
  type JobInput,
} from "./types";
import { computeFinance, formatCurrency, formatFileSize } from "./utils";

interface JobFormProps {
  initial?: Job | null;
  onSubmit: (input: JobInput) => void;
  onCancel: () => void;
}

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB per file

const emptyForm: JobInput = {
  client: "",
  title: "",
  platform: "instagram",
  draftDue: "",
  publishDate: "",
  fee: 0,
  status: "planned",
  postUrl: "",
  genCode: "",
  genDays: 0,
  hasWht: false,
  whtRate: DEFAULT_WHT_RATE,
  travelCost: 0,
  otherCost: 0,
  attachments: [],
  notes: "",
};

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function JobForm({ initial, onSubmit, onCancel }: JobFormProps) {
  const { t, lang } = useLanguage();
  const [form, setForm] = useState<JobInput>(emptyForm);
  const [errors, setErrors] = useState<{ client?: boolean; title?: boolean }>(
    {}
  );
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initial) {
      const { id: _id, createdAt: _createdAt, ...rest } = initial;
      void _id;
      void _createdAt;
      setForm(rest);
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [initial]);

  const update = <K extends keyof JobInput>(key: K, value: JobInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleAddFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFileError(null);
    const added: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        setFileError(`${file.name}: ${t("fileTooBig")}`);
        continue;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        added.push({
          id: makeId(),
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          dataUrl,
        });
      } catch {
        setFileError(file.name);
      }
    }
    if (added.length > 0) {
      setForm((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...added],
      }));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (id: string) =>
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((a) => a.id !== id),
    }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = {
      client: !form.client.trim(),
      title: !form.title.trim(),
    };
    setErrors(nextErrors);
    if (nextErrors.client || nextErrors.title) return;
    onSubmit({
      ...form,
      client: form.client.trim(),
      title: form.title.trim(),
      postUrl: form.postUrl.trim(),
      genCode: form.genCode.trim(),
      notes: form.notes.trim(),
      fee: Number.isFinite(form.fee) ? form.fee : 0,
    });
  };

  const finance = computeFinance(form);

  const labelClass = "block text-sm font-medium text-slate-600 mb-1";
  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-5 text-lg font-semibold text-slate-800">
          {initial ? t("editJob") : t("addJob")}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{t("client")}</label>
              <input
                className={`${inputClass} ${
                  errors.client ? "border-red-400 ring-red-200" : ""
                }`}
                value={form.client}
                onChange={(e) => update("client", e.target.value)}
                placeholder="เช่น Nike, L'Oréal"
              />
              {errors.client && (
                <p className="mt-1 text-xs text-red-500">{t("required")}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>{t("title")}</label>
              <input
                className={`${inputClass} ${
                  errors.title ? "border-red-400 ring-red-200" : ""
                }`}
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="เช่น รีวิวรองเท้า"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">{t("required")}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{t("platform")}</label>
              <select
                className={inputClass}
                value={form.platform}
                onChange={(e) =>
                  update("platform", e.target.value as JobInput["platform"])
                }
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {t(`platform_${p}` as const)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("status")}</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) =>
                  update("status", e.target.value as JobInput["status"])
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`status_${s}` as const)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>{t("draftDue")}</label>
              <input
                type="date"
                className={inputClass}
                value={form.draftDue}
                onChange={(e) => update("draftDue", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>{t("publishDate")}</label>
              <input
                type="date"
                className={inputClass}
                value={form.publishDate}
                onChange={(e) => update("publishDate", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>{t("fee")}</label>
              <input
                type="number"
                min={0}
                step={100}
                className={inputClass}
                value={form.fee === 0 ? "" : form.fee}
                onChange={(e) =>
                  update("fee", e.target.value ? Number(e.target.value) : 0)
                }
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("postUrl")}</label>
            <input
              type="url"
              className={inputClass}
              value={form.postUrl}
              onChange={(e) => update("postUrl", e.target.value)}
              placeholder={t("postUrlPlaceholder")}
            />
          </div>

          {/* Gen Code */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className={labelClass}>{t("genCode")}</label>
              <input
                className={inputClass}
                value={form.genCode}
                onChange={(e) => update("genCode", e.target.value)}
                placeholder={t("genCodePlaceholder")}
              />
            </div>
            <div>
              <label className={labelClass}>{t("genDays")}</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.genDays === 0 ? "" : form.genDays}
                onChange={(e) =>
                  update("genDays", e.target.value ? Number(e.target.value) : 0)
                }
                placeholder="0"
              />
            </div>
          </div>

          {/* Finance */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              {t("financeSection")}
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t("travelCost")}</label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  className={inputClass}
                  value={form.travelCost === 0 ? "" : form.travelCost}
                  onChange={(e) =>
                    update(
                      "travelCost",
                      e.target.value ? Number(e.target.value) : 0
                    )
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>{t("otherCost")}</label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  className={inputClass}
                  value={form.otherCost === 0 ? "" : form.otherCost}
                  onChange={(e) =>
                    update(
                      "otherCost",
                      e.target.value ? Number(e.target.value) : 0
                    )
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={form.hasWht}
                  onChange={(e) => update("hasWht", e.target.checked)}
                />
                {t("hasWht")}
              </label>
              {form.hasWht && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">{t("whtRate")}</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                    value={form.whtRate}
                    onChange={(e) =>
                      update("whtRate", Number(e.target.value) || 0)
                    }
                  />
                </div>
              )}
            </div>

            {/* Live calculation */}
            <div className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>{t("fee")}</span>
                <span>{formatCurrency(finance.fee, lang)}</span>
              </div>
              {form.hasWht && (
                <div className="flex justify-between text-slate-500">
                  <span>
                    {t("whtAmount")} ({form.whtRate}%)
                  </span>
                  <span>- {formatCurrency(finance.wht, lang)}</span>
                </div>
              )}
              {finance.expenses > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>{t("expenses")}</span>
                  <span>- {formatCurrency(finance.expenses, lang)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-semibold text-emerald-600">
                <span>{t("netIncome")}</span>
                <span>{formatCurrency(finance.net, lang)}</span>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className={labelClass}>{t("attachments")}</label>
            <p className="mb-2 text-xs text-slate-400">{t("attachmentsHint")}</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleAddFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              + {t("addFile")}
            </button>
            {fileError && (
              <p className="mt-1 text-xs text-red-500">{fileError}</p>
            )}
            {form.attachments.length > 0 && (
              <ul className="mt-3 space-y-2">
                {form.attachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span>📎</span>
                      <span className="truncate text-slate-700">{a.name}</span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {formatFileSize(a.size)}
                      </span>
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <a
                        href={a.dataUrl}
                        download={a.name}
                        className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                      >
                        {t("download")}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        {t("removeFile")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className={labelClass}>{t("notes")}</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {t("save")}
          </button>
        </div>
      </form>
    </div>
  );
}
