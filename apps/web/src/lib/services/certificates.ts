import { createHash } from "node:crypto";
import { db } from "../db";
import { ApiError, notFound } from "../errors";
import { audit } from "../audit";
import { authorize, type Actor } from "../rbac";
import { notify } from "../notify";
import { renderCertificatePdf } from "../pdf";
import { getObject, putObject } from "../storage";
import { evaluateEligibility, formatCertNo, type EligibilityResult } from "./eligibility";

export const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export type EligibilityRow = EligibilityResult & { traineeId: string; name: string; certNo?: string | null };

export async function programmeEligibility(programmeId: string): Promise<EligibilityRow[]> {
  const p = await db.programme.findUnique({
    where: { id: programmeId },
    include: { course: { include: { assessments: { select: { id: true } } } } },
  });
  if (!p) throw notFound("Programme");
  const now = new Date();
  const sessions = await db.session.findMany({ where: { programmeId, startsAt: { lte: now } }, select: { id: true } });
  const sessionIds = sessions.map((s) => s.id);
  const assessmentIds = p.course?.assessments.map((a) => a.id) ?? [];
  const enrollments = await db.enrollment.findMany({ where: { programmeId }, include: { trainee: { select: { id: true, name: true } } } });
  const traineeIds = enrollments.map((e) => e.traineeId);

  const [att, best, certs] = await Promise.all([
    db.attendance.groupBy({ by: ["traineeId"], where: { sessionId: { in: sessionIds }, traineeId: { in: traineeIds }, present: true }, _count: { _all: true } }),
    assessmentIds.length
      ? db.attempt.groupBy({ by: ["traineeId"], where: { assessmentId: { in: assessmentIds }, traineeId: { in: traineeIds } }, _max: { scorePct: true } })
      : Promise.resolve([] as { traineeId: string; _max: { scorePct: number | null } }[]),
    db.certificate.findMany({ where: { programmeId }, select: { traineeId: true, certNo: true } }),
  ]);
  const attMap = new Map(att.map((a) => [a.traineeId, a._count._all]));
  const bestMap = new Map(best.map((b) => [b.traineeId, b._max.scorePct]));
  const certMap = new Map(certs.map((c) => [c.traineeId, c.certNo]));

  return enrollments
    .map((e) => ({
      traineeId: e.traineeId,
      name: e.trainee.name,
      certNo: certMap.get(e.traineeId) ?? null,
      ...evaluateEligibility({
        attendedSessions: attMap.get(e.traineeId) ?? 0,
        totalSessions: sessionIds.length,
        bestScorePct: bestMap.get(e.traineeId) ?? null,
        minAttendancePct: p.minAttendancePct,
        passMarkPct: p.passMarkPct,
        requiresAssessment: assessmentIds.length > 0,
      }),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function nextSeq(key: string, n: number) {
  const rows = await db.$queryRaw<{ value: number }[]>`
    INSERT INTO "Counter" (key, value) VALUES (${key}, ${n})
    ON CONFLICT (key) DO UPDATE SET value = "Counter".value + ${n}
    RETURNING value`;
  const end = rows[0].value;
  return end - n + 1; // first sequence number in the reserved block
}

/** Runs eligibility and bulk-generates PDFs for every eligible trainee who has no certificate yet. */
export async function issueCertificates(actor: Actor, programmeId: string) {
  const p = await db.programme.findUnique({ where: { id: programmeId }, include: { institution: true } });
  if (!p) throw notFound("Programme");
  authorize(actor, "create", "certificate", { institutionId: p.institutionId });
  const rows = await programmeEligibility(programmeId);
  const toIssue = rows.filter((r) => r.eligible && !r.certNo);
  const ineligible = rows.filter((r) => !r.eligible);
  const issuedAt = new Date();
  const year = issuedAt.getFullYear();
  const issued: { traineeId: string; certNo: string }[] = [];
  if (toIssue.length) {
    const first = await nextSeq(`cert:${p.institution.code}:${year}`, toIssue.length);
    const profiles = await db.traineeProfile.findMany({ where: { userId: { in: toIssue.map((t) => t.traineeId) } }, select: { userId: true, photoUrl: true } });
    const photoOf = new Map(profiles.map((pr) => [pr.userId, pr.photoUrl]));
    const CHUNK = 10;
    for (let i = 0; i < toIssue.length; i += CHUNK) {
      await Promise.all(
        toIssue.slice(i, i + CHUNK).map(async (t, j) => {
          const certNo = formatCertNo(p.institution.code, year, first + i + j);
          let photo: Uint8Array | null = null;
          const key = photoOf.get(t.traineeId);
          if (key && !key.startsWith("http")) photo = await getObject(key).catch(() => null);
          const pdf = await renderCertificatePdf({
            certNo,
            traineeName: t.name,
            programmeTitle: p.title,
            programmeCode: p.code,
            institutionName: p.institution.name,
            startDate: p.startDate,
            endDate: p.endDate,
            issuedAt,
            verifyUrl: `${appUrl()}/verify/${certNo}`,
            photo,
          });
          const sha256 = createHash("sha256").update(pdf).digest("hex");
          const pdfUrl = await putObject(`certificates/${certNo}.pdf`, pdf);
          await db.$transaction(async (tx) => {
            const c = await tx.certificate.create({ data: { certNo, traineeId: t.traineeId, programmeId, issuedAt, pdfUrl, sha256 } });
            await tx.enrollment.updateMany({ where: { programmeId, traineeId: t.traineeId }, data: { completedAt: issuedAt } });
            await audit(actor.id, "certificate.issue", "Certificate", c.id, { certNo, sha256 }, tx);
            await notify(t.traineeId, "Certificate issued", `Your certificate ${certNo} for ${p.title} is in your wallet.`, tx, "SMS");
          });
          issued.push({ traineeId: t.traineeId, certNo });
        }),
      );
    }
  }
  return {
    issued,
    alreadyIssued: rows.filter((r) => r.certNo).length,
    ineligible: ineligible.map((r) => ({ traineeId: r.traineeId, name: r.name, reasons: r.reasons, attendancePct: r.attendancePct, bestScorePct: r.bestScorePct })),
  };
}

/** Revocation is a flag, never a delete. */
export async function revokeCertificate(actor: Actor, id: string, reason: string) {
  authorize(actor, "update", "certificate");
  if (!reason?.trim()) throw new ApiError("VALIDATION", "Reason is required", { reason: "required" });
  const c = await db.certificate.findUnique({ where: { id } });
  if (!c) throw notFound("Certificate");
  if (c.revokedAt) throw new ApiError("CONFLICT", "Already revoked");
  const updated = await db.certificate.update({ where: { id }, data: { revokedAt: new Date(), revokeReason: reason.trim() } });
  await audit(actor.id, "certificate.revoke", "Certificate", id, { reason });
  await notify(c.traineeId, "Certificate revoked", `Certificate ${c.certNo} was revoked: ${reason}`);
  return updated;
}

export type VerifyResult =
  | { status: "NOT_FOUND"; certNo: string }
  | {
      status: "VALID" | "REVOKED";
      certNo: string;
      holder: string;
      programme: string;
      programmeCode: string;
      institution: string;
      issuedAt: Date;
      sha256: string;
      revokedAt: Date | null;
      revokeReason: string | null;
    };

export async function verifyCertificate(certNo: string): Promise<VerifyResult> {
  const c = await db.certificate.findUnique({
    where: { certNo },
    include: { trainee: { select: { name: true } }, programme: { select: { title: true, code: true, institution: { select: { name: true } } } } },
  });
  if (!c) return { status: "NOT_FOUND", certNo };
  return {
    status: c.revokedAt ? "REVOKED" : "VALID",
    certNo: c.certNo,
    holder: c.trainee.name,
    programme: c.programme.title,
    programmeCode: c.programme.code,
    institution: c.programme.institution.name,
    issuedAt: c.issuedAt,
    sha256: c.sha256,
    revokedAt: c.revokedAt,
    revokeReason: c.revokeReason,
  };
}

export async function verifyByHash(bytes: Uint8Array) {
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const c = await db.certificate.findFirst({ where: { sha256 }, select: { certNo: true } });
  if (!c) return { match: false as const, sha256 };
  return { match: true as const, sha256, result: await verifyCertificate(c.certNo) };
}
