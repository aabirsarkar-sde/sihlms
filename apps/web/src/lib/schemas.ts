import { z } from "zod";
import { CATEGORIES } from "./constants";

export const InstitutionInput = z.object({
  name: z.string().min(3),
  code: z.string().regex(/^[A-Z0-9]{3,8}$/, "3–8 capital letters or digits"),
  type: z.enum(["VAMNICOM", "RICM", "ICM"]),
  state: z.string().min(2),
  city: z.string().min(2),
  address: z.string().min(3),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});

export const ProgrammeInput = z
  .object({
    institutionId: z.string().optional(),
    code: z.string().regex(/^[A-Z0-9-]{4,30}$/, "Capital letters, digits and hyphens"),
    title: z.string().min(3),
    description: z.string().min(10),
    targetCategories: z.array(z.enum(CATEGORIES as [string, ...string[]])).min(1),
    mode: z.enum(["IN_PERSON", "ONLINE", "BLENDED"]),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    capacity: z.number().int().min(1).max(1000),
    nominationDeadline: z.coerce.date(),
    passMarkPct: z.number().int().min(0).max(100).default(60),
    minAttendancePct: z.number().int().min(0).max(100).default(75),
    courseId: z.string().optional().nullable(),
    coordinatorId: z.string(),
  })
  .refine((p) => p.endDate >= p.startDate, { path: ["endDate"], message: "End date must be after start" })
  .refine((p) => p.nominationDeadline <= p.startDate, { path: ["nominationDeadline"], message: "Deadline must be before start" });

export const DecisionInput = z.object({ decision: z.enum(["APPROVED", "REJECTED", "WAITLISTED"]), remarks: z.string().max(500).optional() });
export const BulkDecisionInput = DecisionInput.extend({ ids: z.array(z.string()).min(1).max(500) });

export const JobInput = z.object({
  title: z.string().min(3),
  description: z.string().min(20),
  jobType: z.enum(["FULL_TIME", "PART_TIME", "APPRENTICESHIP", "CONTRACT"]),
  state: z.string().min(2),
  district: z.string().min(2),
  salaryMin: z.number().int().min(0).optional().nullable(),
  salaryMax: z.number().int().min(0).optional().nullable(),
  requiredSkills: z.array(z.string().trim().min(1)).max(20).default([]),
  requiredProgrammeCodes: z.array(z.string().trim().min(1)).max(10).default([]),
  closesAt: z.coerce.date(),
});
