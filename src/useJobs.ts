import { useCallback, useEffect, useState } from "react";
import type { Job, JobInput } from "./types";

const STORAGE_KEY = "kol-schedule.jobs";

function loadJobs(): Job[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Job[];
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
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

  return { jobs, addJob, updateJob, deleteJob };
}
