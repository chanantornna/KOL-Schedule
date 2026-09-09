import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_WHT_RATE, type Job, type JobInput } from "./types";

const STORAGE_KEY = "kol-schedule.jobs";

/** Fill in defaults for any fields missing on older stored jobs. */
function normalizeJob(raw: Partial<Job>): Job {
  return {
    id: raw.id ?? "",
    client: raw.client ?? "",
    title: raw.title ?? "",
    platform: raw.platform ?? "other",
    draftDue: raw.draftDue ?? "",
    publishDate: raw.publishDate ?? "",
    fee: raw.fee ?? 0,
    status: raw.status ?? "planned",
    postUrl: raw.postUrl ?? "",
    genCode: raw.genCode ?? "",
    genDays: raw.genDays ?? 0,
    hasWht: raw.hasWht ?? false,
    whtRate: raw.whtRate ?? DEFAULT_WHT_RATE,
    travelCost: raw.travelCost ?? 0,
    otherCost: raw.otherCost ?? 0,
    attachments: raw.attachments ?? [],
    notes: raw.notes ?? "",
    createdAt: raw.createdAt ?? Date.now(),
  };
}

function loadJobs(): Job[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeJob);
  } catch {
    return [];
  }
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>(loadJobs);
  const [storageError, setStorageError] = useState(false);
  // Skip persisting on the very first render (nothing changed yet).
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
      setStorageError(false);
    } catch {
      // Most likely QuotaExceededError from large attachments.
      setStorageError(true);
    }
  }, [jobs]);

  const addJob = useCallback((input: JobInput) => {
    const job: Job = { ...input, id: makeId(), createdAt: Date.now() };
    setJobs((prev) => [job, ...prev]);
  }, []);

  const updateJob = useCallback((id: string, input: JobInput) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, ...input } : job))
    );
  }, []);

  const deleteJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== id));
  }, []);

  return { jobs, addJob, updateJob, deleteJob, storageError };
}
