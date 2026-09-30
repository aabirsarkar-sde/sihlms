import type { ApplicationStatus } from "@prisma/client";
import { db } from "../db";
import { ApiError, notFound } from "../errors";
import { audit } from "../audit";
import { authorize, type Actor } from "../rbac";
import { notify } from "../notify";
import { matchScore } from "./match";

export async function traineeCertCodes(traineeIds: string[]) {
  const certs = await db.certificate.findMany({
    where: { traineeId: { in: traineeIds }, revokedAt: null },
    select: { traineeId: true, certNo: true, programme: { select: { code: true, title: true } } },
  });
  const map = new Map<string, { codes: string[]; certs: { certNo: string; title: string; code: string }[] }>();
  for (const c of certs) {
    const e = map.get(c.traineeId) ?? { codes: [], certs: [] };
    e.codes.push(c.programme.code);
    e.certs.push({ certNo: c.certNo, title: c.programme.title, code: c.programme.code });
    map.set(c.traineeId, e);
  }
  return map;
}

/** Jobs ranked for a trainee ("Jobs matching you"). */
export async function jobsForTrainee(traineeId: string, limit = 20) {
  const profile = await db.traineeProfile.findUnique({ where: { userId: traineeId } });
  const certs = (await traineeCertCodes([traineeId])).get(traineeId)?.codes ?? [];
  const jobs = await db.job.findMany({
    where: { deletedAt: null, hidden: false, closesAt: { gte: new Date() }, employer: { status: "ACTIVE" } },
    include: { employer: { select: { employerProfile: { select: { orgName: true } } } } },
    take: 300,
    orderBy: { createdAt: "desc" },
  });
  return jobs
    .map((j) => ({
      job: j,
      orgName: j.employer.employerProfile?.orgName ?? "",
      ...matchScore(
        { skills: profile?.skills ?? [], programmeCodes: certs, state: profile?.state ?? "", district: profile?.district ?? "" },
        j,
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export type CandidateFilters = { district?: string; state?: string; category?: string; skill?: string; certificate?: string; page?: number; pageSize?: number };

/** Ranked candidates for a job among openToWork trainees. Phone numbers are masked until shortlisted. */
export async function candidatesForJob(actor: Actor, jobId: string, f: CandidateFilters = {}) {
  const job = await db.job.findFirst({ where: { id: jobId, deletedAt: null } });
  if (!job) throw notFound("Job");
  authorize(actor, "read", "application", { ownerId: job.employerId });
  if (actor.status !== "ACTIVE") throw new ApiError("FORBIDDEN", "Your employer account is awaiting verification");
  const profiles = await db.traineeProfile.findMany({
    where: {
      openToWork: true,
      user: { deletedAt: null, status: "ACTIVE" },
      ...(f.state ? { state: f.state } : {}),
      ...(f.district ? { district: f.district } : {}),
      ...(f.category ? { category: f.category as never } : {}),
      ...(f.skill ? { skills: { has: f.skill } } : {}),
    },
    include: { user: { select: { id: true, name: true } } },
    take: 2000,
  });
  const certMap = await traineeCertCodes(profiles.map((p) => p.userId));
  const apps = await db.application.findMany({ where: { jobId, traineeId: { in: profiles.map((p) => p.userId) } }, select: { traineeId: true, status: true } });
  const appMap = new Map(apps.map((a) => [a.traineeId, a.status]));
  let rows = profiles.map((p) => {
    const c = certMap.get(p.userId) ?? { codes: [], certs: [] };
    return {
      traineeId: p.userId,
      name: p.user.name,
      category: p.category,
      state: p.state,
      district: p.district,
      skills: p.skills,
      certificates: c.certs,
      applicationStatus: appMap.get(p.userId) ?? null,
      ...matchScore({ skills: p.skills, programmeCodes: c.codes, state: p.state, district: p.district }, job),
    };
  });
  if (f.certificate) rows = rows.filter((r) => r.certificates.some((c) => c.code === f.certificate));
  rows.sort((a, b) => b.score - a.score);
  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 20;
  return { items: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length };
}

export async function applyToJob(actor: Actor, jobId: string, coverNote?: string) {
  authorize(actor, "create", "application");
  const job = await db.job.findFirst({ where: { id: jobId, deletedAt: null, hidden: false } });
  if (!job) throw notFound("Job");
  if (job.closesAt < new Date()) throw new ApiError("CONFLICT", "This job is closed");
  const existing = await db.application.findUnique({ where: { jobId_traineeId: { jobId, traineeId: actor.id } } });
  if (existing) return existing;
  const app = await db.application.create({ data: { jobId, traineeId: actor.id, status: "APPLIED", coverNote } });
  await audit(actor.id, "application.create", "Application", app.id, { jobId });
  await notify(job.employerId, "New applicant", `${job.title}: a new trainee applied.`);
  return app;
}

const STATUS_TEXT: Record<ApplicationStatus, string> = {
  APPLIED: "received",
  SHORTLISTED: "shortlisted",
  INTERVIEW: "moved to interview",
  OFFERED: "given an offer",
  HIRED: "hired",
  REJECTED: "not selected",
};

export async function moveApplication(actor: Actor, applicationId: string, status: ApplicationStatus) {
  const app = await db.application.findUnique({ where: { id: applicationId }, include: { job: true } });
  if (!app) throw notFound("Application");
  authorize(actor, "update", "application", { ownerId: app.job.employerId });
  const updated = await db.application.update({ where: { id: applicationId }, data: { status } });
  await audit(actor.id, "application.status", "Application", app.id, { from: app.status, to: status });
  await notify(app.traineeId, "Application update", `${app.job.title}: you have been ${STATUS_TEXT[status]}.`, db, "SMS");
  return updated;
}

/** Phone is visible to the employer only once the candidate is shortlisted or further along. */
export function phoneVisible(status: ApplicationStatus | null | undefined) {
  return !!status && ["SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED"].includes(status);
}

export function maskPhone(phone: string) {
  return `${phone.slice(0, 2)}******${phone.slice(-2)}`;
}
