import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { AttendanceMethod } from "@prisma/client";
import { db } from "../db";
import { ApiError, notFound } from "../errors";
import { audit } from "../audit";
import { authorize, type Actor } from "../rbac";
import { makeSessionToken, verifySessionToken, verifyTraineeQr } from "../qr";
import { FACE_MATCH_THRESHOLD } from "../constants";

async function loadSession(id: string) {
  const s = await db.session.findUnique({ where: { id }, include: { programme: { select: { institutionId: true, coordinatorId: true, title: true } } } });
  if (!s) throw notFound("Session");
  return s;
}

async function isEnrolled(programmeId: string, traineeId: string) {
  return !!(await db.enrollment.findUnique({ where: { programmeId_traineeId: { programmeId, traineeId } } }));
}

type MarkInput = {
  sessionId: string;
  traineeId: string;
  method: AttendanceMethod;
  clientId: string;
  markedById?: string | null;
  deviceId?: string | null;
  confidence?: number | null;
  markedAt?: Date;
};

/** Idempotent: a repeated clientId or a second mark for the same trainee+session returns the existing row. */
export async function mark(i: MarkInput) {
  const byClient = await db.attendance.findUnique({ where: { clientId: i.clientId } });
  if (byClient) return { attendance: byClient, duplicate: true };
  const existing = await db.attendance.findUnique({ where: { sessionId_traineeId: { sessionId: i.sessionId, traineeId: i.traineeId } } });
  if (existing?.present) return { attendance: existing, duplicate: true };
  try {
    const attendance = existing
      ? await db.attendance.update({ where: { id: existing.id }, data: { present: true, method: i.method, markedAt: i.markedAt ?? new Date(), markedById: i.markedById, deviceId: i.deviceId, confidence: i.confidence } })
      : await db.attendance.create({
          data: {
            sessionId: i.sessionId,
            traineeId: i.traineeId,
            method: i.method,
            clientId: i.clientId,
            markedAt: i.markedAt ?? new Date(),
            markedById: i.markedById ?? null,
            deviceId: i.deviceId ?? null,
            confidence: i.confidence ?? null,
          },
        });
    await audit(i.markedById ?? null, "attendance.mark", "Attendance", attendance.id, { method: i.method, deviceId: i.deviceId, confidence: i.confidence });
    return { attendance, duplicate: false };
  } catch (e) {
    // Lost a race with a concurrent replay of the same record: treat as duplicate.
    const again = await db.attendance.findFirst({ where: { OR: [{ clientId: i.clientId }, { sessionId: i.sessionId, traineeId: i.traineeId }] } });
    if (again) return { attendance: again, duplicate: true };
    throw e;
  }
}

export async function currentQr(actor: Actor, sessionId: string) {
  const s = await loadSession(sessionId);
  authorize(actor, "update", "attendance", { institutionId: s.programme.institutionId, assigned: s.facultyId === actor.id || s.programme.coordinatorId === actor.id || actor.role === "INSTITUTE_ADMIN" });
  return makeSessionToken(s.id, s.qrSecret);
}

/** Mode A: trainee scans the rotating code on the projector. `scannedAt` supports offline scans replayed later. */
export async function scanSessionToken(actor: Actor, token: string, clientId: string, scannedAt?: Date) {
  const sessionId = token.split(".")[0];
  const s = await loadSession(sessionId);
  const enrolled = await isEnrolled(s.programmeId, actor.id);
  authorize(actor, "create", "attendance", { ownerId: actor.id, enrolled, institutionId: s.programme.institutionId });
  const at = scannedAt && scannedAt.getTime() <= Date.now() ? scannedAt : new Date();
  const v = verifySessionToken(token, s.qrSecret, at.getTime());
  if (!v.ok) throw new ApiError("BAD_REQUEST", v.reason === "EXPIRED" ? "This QR code has expired. Scan the live code on screen." : "Invalid QR code");
  return mark({ sessionId: s.id, traineeId: actor.id, method: "QR", clientId, markedAt: at });
}

/** Mode B: faculty scans a trainee's personal QR. */
export async function scanTraineeQr(actor: Actor, sessionId: string, payload: string, clientId: string, scannedAt?: Date) {
  const s = await loadSession(sessionId);
  authorize(actor, "create", "attendance", { institutionId: s.programme.institutionId });
  const traineeId = verifyTraineeQr(payload);
  if (!traineeId) throw new ApiError("BAD_REQUEST", "Not a valid trainee QR");
  if (!(await isEnrolled(s.programmeId, traineeId))) throw new ApiError("CONFLICT", "Trainee is not enrolled in this programme");
  const res = await mark({ sessionId: s.id, traineeId, method: "QR", clientId, markedById: actor.id, markedAt: scannedAt });
  const trainee = await db.user.findUnique({ where: { id: traineeId }, select: { name: true } });
  return { ...res, traineeName: trainee?.name };
}

/** Mode C / kiosk: an identification result above the threshold marks present. */
export async function markByFace(
  by: { actor?: Actor; deviceId?: string; institutionId: string },
  sessionId: string,
  traineeId: string,
  similarity: number,
  clientId: string = randomUUID(),
  markedAt?: Date,
) {
  const s = await loadSession(sessionId);
  if (s.programme.institutionId !== by.institutionId) throw new ApiError("FORBIDDEN", "Session belongs to another institution");
  if (by.actor) authorize(by.actor, "create", "attendance", { institutionId: s.programme.institutionId });
  if (similarity < FACE_MATCH_THRESHOLD) throw new ApiError("CONFLICT", "Face match below threshold; use manual marking");
  if (!(await isEnrolled(s.programmeId, traineeId))) throw new ApiError("CONFLICT", "Trainee is not enrolled in this programme");
  return mark({
    sessionId,
    traineeId,
    method: by.deviceId ? "KIOSK" : "FACE",
    clientId,
    markedById: by.actor?.id ?? null,
    deviceId: by.deviceId ?? null,
    confidence: similarity,
    markedAt,
  });
}

/** Manual override by faculty or admin, always audit-logged with a reason. */
export async function overrideAttendance(actor: Actor, sessionId: string, traineeId: string, present: boolean, reason: string) {
  if (!reason || reason.trim().length < 3) throw new ApiError("VALIDATION", "A reason is required", { reason: "required" });
  const s = await loadSession(sessionId);
  authorize(actor, "update", "attendance", {
    institutionId: s.programme.institutionId,
    assigned: s.facultyId === actor.id || s.programme.coordinatorId === actor.id,
  });
  if (!(await isEnrolled(s.programmeId, traineeId))) throw new ApiError("CONFLICT", "Trainee is not enrolled in this programme");
  const before = await db.attendance.findUnique({ where: { sessionId_traineeId: { sessionId, traineeId } } });
  const row = before
    ? await db.attendance.update({ where: { id: before.id }, data: { present, method: "MANUAL", markedById: actor.id, reason, markedAt: new Date() } })
    : await db.attendance.create({ data: { sessionId, traineeId, present, method: "MANUAL", markedById: actor.id, reason, markedAt: new Date(), clientId: randomUUID() } });
  await audit(actor.id, "attendance.override", "Attendance", row.id, { before: before ? { present: before.present, method: before.method } : null, after: { present }, reason });
  return row;
}

export const SyncRecord = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("SESSION_TOKEN"), clientId: z.string().uuid(), token: z.string(), scannedAt: z.coerce.date() }),
  z.object({ kind: z.literal("TRAINEE_QR"), clientId: z.string().uuid(), sessionId: z.string(), payload: z.string(), scannedAt: z.coerce.date() }),
  z.object({
    kind: z.literal("KIOSK"),
    clientId: z.string().uuid(),
    sessionId: z.string(),
    traineeId: z.string(),
    confidence: z.number().min(0).max(1),
    markedAt: z.coerce.date(),
  }),
]);
export type SyncRecord = z.infer<typeof SyncRecord>;

/** Batch replay of offline records. Safe to replay twice (clientId idempotency). */
export async function syncAttendance(by: { actor?: Actor; device?: { id: string; institutionId: string } }, records: SyncRecord[]) {
  const results: { clientId: string; ok: boolean; duplicate?: boolean; error?: string }[] = [];
  for (const r of records) {
    try {
      let res: { duplicate: boolean };
      if (r.kind === "SESSION_TOKEN") {
        if (!by.actor) throw new ApiError("FORBIDDEN", "Devices cannot submit session tokens");
        res = await scanSessionToken(by.actor, r.token, r.clientId, r.scannedAt);
      } else if (r.kind === "TRAINEE_QR") {
        if (!by.actor) throw new ApiError("FORBIDDEN", "Devices cannot submit trainee QR scans");
        res = await scanTraineeQr(by.actor, r.sessionId, r.payload, r.clientId, r.scannedAt);
      } else {
        const inst = by.device?.institutionId ?? by.actor?.institutionId;
        if (!inst) throw new ApiError("FORBIDDEN", "No institution");
        res = await markByFace({ actor: by.actor, deviceId: by.device?.id, institutionId: inst }, r.sessionId, r.traineeId, r.confidence, r.clientId, r.markedAt);
      }
      results.push({ clientId: r.clientId, ok: true, duplicate: res.duplicate });
    } catch (e) {
      results.push({ clientId: r.clientId, ok: false, error: e instanceof Error ? e.message : "error" });
    }
  }
  return { results };
}

export async function liveCount(sessionId: string) {
  const s = await db.session.findUnique({ where: { id: sessionId }, select: { programmeId: true } });
  if (!s) throw notFound("Session");
  const [present, enrolled, recent] = await Promise.all([
    db.attendance.count({ where: { sessionId, present: true } }),
    db.enrollment.count({ where: { programmeId: s.programmeId } }),
    db.attendance.findMany({
      where: { sessionId, present: true },
      orderBy: { markedAt: "desc" },
      take: 8,
      select: { id: true, method: true, markedAt: true, confidence: true, trainee: { select: { name: true } } },
    }),
  ]);
  return { present, enrolled, recent };
}
