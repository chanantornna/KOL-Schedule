import { useEffect, useState, type FormEvent } from "react";
import { useLanguage } from "./LanguageContext";
import { PLATFORMS, STATUSES, type Job, type JobInput } from "./types";

interface JobFormProps {
  initial?: Job | null;
  onSubmit: (input: JobInput) => void;
  onCancel: () => void;
}

const emptyForm: JobInput = {
  client: "",
  title: "",
  platform: "instagram",
  draftDue: "",
  publishDate: "",
  fee: 0,
  status: "planned",
  postUrl: "",
  notes: "",
};

export default function JobForm({ initial, onSubmit, onCancel }: JobFormProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState<JobInput>(emptyForm);
  const [errors, setErrors] = useState<{ client?: boolean; title?: boolean }>(
    {}
  );

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
      notes: form.notes.trim(),
      fee: Number.isFinite(form.fee) ? form.fee : 0,
    });
  };

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
