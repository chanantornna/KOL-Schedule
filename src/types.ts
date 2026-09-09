export type Platform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "x"
  | "other";

export type JobStatus =
  | "planned"
  | "in_progress"
  | "draft_sent"
  | "published"
  | "paid";

export interface Job {
  id: string;
  client: string;
  title: string;
  platform: Platform;
  draftDue: string; // ISO date (yyyy-mm-dd) or ""
  publishDate: string; // ISO date (yyyy-mm-dd) or ""
  fee: number; // THB
  status: JobStatus;
  postUrl: string; // link to the published post
  notes: string;
  createdAt: number;
}

export type JobInput = Omit<Job, "id" | "createdAt">;

export const PLATFORMS: Platform[] = [
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "x",
  "other",
];

export const STATUSES: JobStatus[] = [
  "planned",
  "in_progress",
  "draft_sent",
  "published",
  "paid",
];
