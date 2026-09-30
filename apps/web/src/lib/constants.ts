import type { ApplicationStatus, TraineeCategory } from "@prisma/client";

export const CATEGORIES: TraineeCategory[] = ["COOP_EMPLOYEE", "PACS_MEMBER", "SHG_MEMBER", "DAIRY_COOP", "FARMER", "RURAL_YOUTH"];
export const PIPELINE: ApplicationStatus[] = ["APPLIED", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"];
export const LOCALES = ["en", "hi", "mr"] as const;
export type Locale = (typeof LOCALES)[number];
export const MAX_ATTEMPTS = 3;
export const FACE_MATCH_THRESHOLD = 0.6;
