import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { overrideAttendance } from "@/lib/services/attendance";

export const dynamic = "force-dynamic";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN"]);
  const { present, reason } = await body(req, z.object({ present: z.boolean(), reason: z.string().min(3) }));
  const a = await db.attendance.findUnique({ where: { id: params.id } });
  if (!a) throw notFound("Attendance");
  return overrideAttendance(user, a.sessionId, a.traineeId, present, reason);
});
