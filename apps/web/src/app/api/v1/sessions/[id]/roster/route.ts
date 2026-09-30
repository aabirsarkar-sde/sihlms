import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { authorize } from "@/lib/rbac";
import { overrideAttendance } from "@/lib/services/attendance";

export const dynamic = "force-dynamic";

/** Enrolled trainees with their attendance for this session (for manual marking). */
export const GET = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  const s = await db.session.findUnique({ where: { id: params.id }, include: { programme: { select: { institutionId: true } } } });
  if (!s) throw notFound("Session");
  authorize(user, "read", "attendance", { institutionId: s.programme.institutionId });
  const [enrolled, marks] = await Promise.all([
    db.enrollment.findMany({ where: { programmeId: s.programmeId }, include: { trainee: { select: { id: true, name: true, phone: true } } }, orderBy: { trainee: { name: "asc" } } }),
    db.attendance.findMany({ where: { sessionId: s.id } }),
  ]);
  const byTrainee = new Map(marks.map((m) => [m.traineeId, m]));
  return {
    items: enrolled.map((e) => {
      const m = byTrainee.get(e.traineeId);
      return { traineeId: e.traineeId, name: e.trainee.name, present: !!m?.present, method: m?.method ?? null, markedAt: m?.markedAt ?? null, attendanceId: m?.id ?? null, reason: m?.reason ?? null };
    }),
    total: enrolled.length,
  };
});

/** Manual override for a trainee who may not have a row yet. */
export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN"]);
  const { traineeId, present, reason } = await body(req, z.object({ traineeId: z.string(), present: z.boolean(), reason: z.string().min(3) }));
  return overrideAttendance(user, params.id, traineeId, present, reason);
});
