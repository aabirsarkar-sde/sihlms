import Papa from "papaparse";
import { z } from "zod";
import type { NominationStatus, TraineeCategory } from "@prisma/client";
import { db, type Tx } from "../db";
import { ApiError, notFound } from "../errors";
import { audit } from "../audit";
import { authorize, type Actor } from "../rbac";
import { notify, sendSms } from "../notify";
import { CATEGORIES } from "../constants";
import { GEO } from "../geo";

const lockProgramme = (tx: Tx, id: string) => tx.$queryRaw`SELECT id FROM "Programme" WHERE id = ${id} FOR UPDATE`;

async function loadProgramme(id: string) {
  const p = await db.programme.findFirst({ where: { id, deletedAt: null } });
  if (!p) throw notFound("Programme");
  return p;
}

function assertOpen(p: { status: string; nominationDeadline: Date }) {
  if (!["PUBLISHED", "ONGOING"].includes(p.status)) throw new ApiError("CONFLICT", "Programme is not open for nominations");
  if (p.nominationDeadline < new Date()) throw new ApiError("CONFLICT", "Nomination deadline has passed");
}

export async function nominate(actor: Actor, programmeId: string, traineeId: string, remarks?: string) {
  const p = await loadProgramme(programmeId);
  authorize(actor, "create", "nomination", { ownerId: traineeId });
  assertOpen(p);
  const existing = await db.nomination.findUnique({ where: { programmeId_traineeId: { programmeId, traineeId } } });
  if (existing && existing.status !== "WITHDRAWN") throw new ApiError("CONFLICT", "Already nominated for this programme");
  const n = await db.$transaction(async (tx) => {
    const n = existing
      ? await tx.nomination.update({ where: { id: existing.id }, data: { status: "SUBMITTED", nominatedById: actor.id, remarks, decidedAt: null, decidedById: null } })
      : await tx.nomination.create({ data: { programmeId, traineeId, nominatedById: actor.id, status: "SUBMITTED", remarks } });
    await audit(actor.id, "nomination.create", "Nomination", n.id, { programmeId, traineeId }, tx);
    return n;
  });
  return n;
}

export const CsvRow = z.object({
  name: z.string().trim().min(2, "name is required"),
  phone: z
    .string()
    .trim()
    .transform((s) => s.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, ""))
    .refine((s) => /^[6-9]\d{9}$/.test(s), "phone must be a 10-digit Indian mobile number"),
  category: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase().replace(/[\s-]+/g, "_"))
    .refine((s): s is TraineeCategory => (CATEGORIES as string[]).includes(s), { message: `category must be one of ${CATEGORIES.join(", ")}` }),
  district: z.string().trim().min(2, "district is required"),
  cooperativeName: z.string().trim().optional().default(""),
});

export type ImportReport = { total: number; created: number; newAccounts: number; errors: { row: number; phone?: string; message: string }[] };

function stateOf(district: string) {
  for (const [state, ds] of Object.entries(GEO)) if (Object.keys(ds).some((d) => d.toLowerCase() === district.toLowerCase())) return state;
  return "Unknown";
}

/** CSV columns: name, phone, category, district, cooperativeName. Unknown phones get stub trainee accounts + SMS invite. */
export async function importNominationsCsv(actor: Actor, programmeId: string, csv: string): Promise<ImportReport> {
  authorize(actor, "create", "nomination", {});
  const p = await loadProgramme(programmeId);
  assertOpen(p);
  const parsed = Papa.parse<Record<string, string>>(csv.trim(), { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
  const report: ImportReport = { total: parsed.data.length, created: 0, newAccounts: 0, errors: [] };
  if (parsed.data.length > 2000) throw new ApiError("BAD_REQUEST", "CSV is limited to 2000 rows");

  const valid: { row: number; data: z.infer<typeof CsvRow> }[] = [];
  const seen = new Set<string>();
  parsed.data.forEach((raw, idx) => {
    const row = idx + 2; // header is row 1
    const r = CsvRow.safeParse(raw);
    if (!r.success) {
      report.errors.push({ row, phone: raw.phone, message: r.error.issues.map((i) => i.message).join("; ") });
      return;
    }
    if (seen.has(r.data.phone)) {
      report.errors.push({ row, phone: r.data.phone, message: "duplicate phone in file" });
      return;
    }
    seen.add(r.data.phone);
    valid.push({ row, data: r.data });
  });

  const phones = valid.map((v) => v.data.phone);
  const users = await db.user.findMany({ where: { phone: { in: phones } }, select: { id: true, phone: true, role: true } });
  const byPhone = new Map(users.map((u) => [u.phone, u]));
  const existingNoms = await db.nomination.findMany({
    where: { programmeId, traineeId: { in: users.map((u) => u.id) } },
    select: { traineeId: true, status: true },
  });
  const nominated = new Set(existingNoms.filter((n) => n.status !== "WITHDRAWN").map((n) => n.traineeId));

  await db.$transaction(
    async (tx) => {
      for (const { row, data } of valid) {
        let u = byPhone.get(data.phone);
        if (u && u.role !== "TRAINEE") {
          report.errors.push({ row, phone: data.phone, message: "phone belongs to a non-trainee account" });
          continue;
        }
        if (u && nominated.has(u.id)) {
          report.errors.push({ row, phone: data.phone, message: "already nominated for this programme" });
          continue;
        }
        if (!u) {
          const created = await tx.user.create({
            data: {
              phone: data.phone,
              name: data.name,
              role: "TRAINEE",
              status: "ACTIVE",
              traineeProfile: {
                create: {
                  category: data.category as TraineeCategory,
                  gender: "U",
                  dob: new Date("2000-01-01"),
                  state: stateOf(data.district),
                  district: data.district,
                  cooperativeName: data.cooperativeName || null,
                  education: "",
                  languages: [],
                  skills: [],
                },
              },
            },
            select: { id: true, phone: true, role: true },
          });
          u = created;
          report.newAccounts++;
          sendSms(data.phone, `You have been nominated for ${p.title} (${p.code}) on Sahakar Setu. Log in with this number to complete your profile.`);
        }
        await tx.nomination.upsert({
          where: { programmeId_traineeId: { programmeId, traineeId: u.id } },
          update: { status: "SUBMITTED", nominatedById: actor.id, remarks: data.cooperativeName || null },
          create: { programmeId, traineeId: u.id, nominatedById: actor.id, status: "SUBMITTED", remarks: data.cooperativeName || null },
        });
        report.created++;
      }
      await audit(actor.id, "nomination.import", "Programme", programmeId, { total: report.total, created: report.created, errors: report.errors.length }, tx);
    },
    { timeout: 30_000 },
  );
  report.errors.sort((a, b) => a.row - b.row);
  return report;
}

export type Decision = "APPROVED" | "REJECTED" | "WAITLISTED";

/**
 * Decide on one nomination. Approval creates the Enrollment in the same transaction; the programme row
 * is locked so concurrent approvals can never exceed capacity (overflow becomes WAITLISTED).
 */
async function decideInTx(tx: Tx, actor: Actor, nominationId: string, decision: Decision, remarks?: string) {
  const n = await tx.nomination.findUnique({ where: { id: nominationId }, include: { programme: true } });
  if (!n) throw notFound("Nomination");
  authorize(actor, "update", "nomination", { institutionId: n.programme.institutionId });
  await lockProgramme(tx, n.programmeId);
  let status: NominationStatus = decision;
  if (decision === "APPROVED" && n.status !== "APPROVED") {
    const approved = await tx.nomination.count({ where: { programmeId: n.programmeId, status: "APPROVED" } });
    if (approved >= n.programme.capacity) status = "WAITLISTED";
  }
  const updated = await tx.nomination.update({
    where: { id: n.id },
    data: { status, remarks: remarks ?? n.remarks, decidedById: actor.id, decidedAt: new Date() },
  });
  if (status === "APPROVED") {
    await tx.enrollment.upsert({
      where: { nominationId: n.id },
      update: {},
      create: { programmeId: n.programmeId, traineeId: n.traineeId, nominationId: n.id },
    });
  } else if (n.status === "APPROVED") {
    await tx.enrollment.deleteMany({ where: { nominationId: n.id } });
  }
  await audit(actor.id, `nomination.${status.toLowerCase()}`, "Nomination", n.id, { from: n.status, to: status, remarks }, tx);
  await notify(n.traineeId, `Nomination ${status.toLowerCase()}`, `${n.programme.title}: your nomination is ${status.toLowerCase()}.`, tx, "SMS");
  return updated;
}

export async function decideNomination(actor: Actor, nominationId: string, decision: Decision, remarks?: string) {
  // Approvals queue on the programme row lock; allow time to wait for it under concurrent clicks.
  return db.$transaction((tx) => decideInTx(tx, actor, nominationId, decision, remarks), { maxWait: 10_000, timeout: 15_000 });
}

export async function bulkDecide(actor: Actor, ids: string[], decision: Decision, remarks?: string) {
  const results: { id: string; status: NominationStatus }[] = [];
  // Oldest first so that, if capacity runs out, earlier nominations win.
  const noms = await db.nomination.findMany({ where: { id: { in: ids } }, orderBy: { createdAt: "asc" }, select: { id: true } });
  await db.$transaction(
    async (tx) => {
      for (const { id } of noms) {
        const n = await decideInTx(tx, actor, id, decision, remarks);
        results.push({ id, status: n.status });
      }
    },
    { timeout: 60_000 },
  );
  return results;
}

/** Trainee (or admin) withdraws; the oldest waitlisted nomination auto-promotes. */
export async function withdrawNomination(actor: Actor, nominationId: string) {
  return db.$transaction(async (tx) => {
    const n = await tx.nomination.findUnique({ where: { id: nominationId }, include: { programme: true } });
    if (!n) throw notFound("Nomination");
    if (actor.role === "TRAINEE") authorize(actor, "update", "nomination", { ownerId: n.traineeId });
    else authorize(actor, "update", "nomination", { institutionId: n.programme.institutionId });
    await lockProgramme(tx, n.programmeId);
    const wasApproved = n.status === "APPROVED";
    await tx.nomination.update({ where: { id: n.id }, data: { status: "WITHDRAWN" } });
    await tx.enrollment.deleteMany({ where: { nominationId: n.id } });
    await audit(actor.id, "nomination.withdraw", "Nomination", n.id, { from: n.status }, tx);
    let promoted: string | null = null;
    if (wasApproved) {
      const next = await tx.nomination.findFirst({ where: { programmeId: n.programmeId, status: "WAITLISTED" }, orderBy: { createdAt: "asc" } });
      if (next) {
        await tx.nomination.update({ where: { id: next.id }, data: { status: "APPROVED", decidedAt: new Date(), remarks: "Auto-promoted from waitlist" } });
        await tx.enrollment.create({ data: { programmeId: next.programmeId, traineeId: next.traineeId, nominationId: next.id } });
        await audit(null, "nomination.autopromote", "Nomination", next.id, { reason: "withdrawal", withdrawn: n.id }, tx);
        await notify(next.traineeId, "You are in!", `A seat opened in ${n.programme.title}. Your nomination is approved.`, tx, "SMS");
        promoted = next.id;
      }
    }
    return { ok: true, promoted };
  });
}
