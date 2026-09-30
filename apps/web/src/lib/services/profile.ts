import { z } from "zod";
import { db } from "../db";
import { audit } from "../audit";
import { CATEGORIES } from "../constants";
import type { AuthUser } from "../auth";

export const TraineeProfileInput = z.object({
  category: z.enum(CATEGORIES as [string, ...string[]]),
  gender: z.enum(["M", "F", "O"]),
  dob: z.coerce.date().refine((d) => d < new Date() && d > new Date("1920-01-01"), "Enter a valid date of birth"),
  state: z.string().min(2),
  district: z.string().min(2),
  village: z.string().trim().optional().nullable(),
  cooperativeName: z.string().trim().optional().nullable(),
  education: z.string().min(1),
  languages: z.array(z.string()).default([]),
  skills: z.array(z.string().trim().min(1)).max(30).default([]),
  aadhaarLast4: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((v) => !v || /^\d{4}$/.test(v), "Only the last 4 digits"),
  diet: z.enum(["VEG", "NON_VEG"]).default("VEG"),
  openToWork: z.boolean().optional(),
});

export const MePatch = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().email().optional().nullable(),
  locale: z.enum(["en", "hi", "mr"]).optional(),
  trainee: TraineeProfileInput.partial().optional(),
  employer: z
    .object({ orgName: z.string().min(2), orgType: z.string().min(2), state: z.string(), district: z.string(), gstin: z.string().optional().nullable() })
    .partial()
    .optional(),
});

export async function updateMe(user: AuthUser, input: z.infer<typeof MePatch>) {
  const { trainee, employer, ...base } = input;
  if (Object.keys(base).length) await db.user.update({ where: { id: user.id }, data: base });
  if (trainee && user.role === "TRAINEE") {
    const existing = await db.traineeProfile.findUnique({ where: { userId: user.id } });
    const data = { ...trainee, category: trainee.category as never };
    if (existing) await db.traineeProfile.update({ where: { userId: user.id }, data });
    else await db.traineeProfile.create({ data: { ...TraineeProfileInput.parse(trainee), category: trainee.category as never, userId: user.id } });
  }
  if (employer && user.role === "EMPLOYER") await db.employerProfile.update({ where: { userId: user.id }, data: employer });
  await audit(user.id, "user.update", "User", user.id, { fields: Object.keys(input) });
  return getMe(user.id);
}

export async function getMe(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      locale: true,
      status: true,
      institutionId: true,
      institution: { select: { name: true, code: true } },
      traineeProfile: { omit: { faceEmbedding: true } },
      employerProfile: true,
    },
  });
}

/** Completeness meter: share of the profile fields that are filled. */
export function completeness(p: Record<string, unknown> | null | undefined, hasPhoto: boolean, hasFace: boolean) {
  if (!p) return 0;
  const checks = [
    !!p.category, !!p.gender && p.gender !== "U", !!p.dob, !!p.state && p.state !== "Unknown", !!p.district, !!p.village, !!p.cooperativeName,
    !!p.education, Array.isArray(p.languages) && p.languages.length > 0, Array.isArray(p.skills) && p.skills.length > 0, hasPhoto, hasFace,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/** DPDP: everything we hold about the user, as JSON. */
export async function exportMyData(userId: string) {
  const [user, nominations, enrollments, attendance, progress, attempts, certificates, applications, chat] = await Promise.all([
    getMe(userId),
    db.nomination.findMany({ where: { traineeId: userId } }),
    db.enrollment.findMany({ where: { traineeId: userId } }),
    db.attendance.findMany({ where: { traineeId: userId } }),
    db.lessonProgress.findMany({ where: { traineeId: userId } }),
    db.attempt.findMany({ where: { traineeId: userId } }),
    db.certificate.findMany({ where: { traineeId: userId } }),
    db.application.findMany({ where: { traineeId: userId } }),
    db.chatMessage.findMany({ where: { userId } }),
  ]);
  return { exportedAt: new Date(), user, nominations, enrollments, attendance, progress, attempts, certificates, applications, chat };
}

/** DPDP: delete = anonymise personal data, keep certificate records (immutable, revocation-only) for verifiers. */
export async function deleteMyAccount(userId: string) {
  await db.$transaction(async (tx) => {
    await tx.traineeProfile.updateMany({
      where: { userId },
      data: { faceEmbedding: null, faceConsentAt: null, photoUrl: null, aadhaarLast4: null, village: null, openToWork: false, resumeUrl: null, skills: [] },
    });
    await tx.chatMessage.deleteMany({ where: { userId } });
    await tx.user.update({ where: { id: userId }, data: { deletedAt: new Date(), status: "SUSPENDED", email: null, phone: `deleted-${userId}` } });
    await audit(userId, "user.delete", "User", userId, {}, tx);
  });
}
