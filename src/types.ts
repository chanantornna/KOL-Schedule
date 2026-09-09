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

/** A file attached to a job (e.g. tax withholding certificate), stored as a
 *  base64 data URL inside localStorage. Kept small on purpose (see MAX size). */
export interface Attachment {
  id: string;
  name: string;
  type: string; // MIME type
  size: number; // bytes
  dataUrl: string; // base64 data URL
}

export interface Job {
  id: string;
  client: string;
  title: string;
  platform: Platform;
  draftDue: string; // ISO date (yyyy-mm-dd) or ""
  publishDate: string; // ISO date (yyyy-mm-dd) or ""
  fee: number; // THB (gross fee before deductions)
  status: JobStatus;
  postUrl: string; // link to the published post
  // TikTok "Gen Code" (Spark Ads authorization code) given to the client.
  genCode: string;
  genDays: number; // how many days the gen code is valid for (0 = not set)
  // Withholding tax (ภาษีหัก ณ ที่จ่าย)
  hasWht: boolean; // whether WHT applies
  whtRate: number; // percent, e.g. 3
  // Expenses (THB)
  travelCost: number;
  otherCost: number;
  attachments: Attachment[];
  notes: string;
  createdAt: number;
}

export type JobInput = Omit<Job, "id" | "createdAt">;

/** Default withholding tax rate in Thailand for service fees. */
export const DEFAULT_WHT_RATE = 3;

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
