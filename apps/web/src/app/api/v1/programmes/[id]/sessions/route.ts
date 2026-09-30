import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { authorize } from "@/lib/rbac";
import { createSession, SessionInput } from "@/lib/services/programmes";

export const dynamic = "force-dynamic";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser();
  const p = await db.programme.findUnique({ where: { id: params.id } });
  if (!p) throw notFound("Programme");
  const enrolled = user.role === "TRAINEE" ? !!(await db.enrollment.findUnique({ where: { programmeId_traineeId: { programmeId: p.id, traineeId: user.id } } })) : false;
  authorize(user, "read", "session", { institutionId: p.institutionId, enrolled });
  const items = await db.session.findMany({ where: { programmeId: p.id }, orderBy: { startsAt: "asc" }, include: { faculty: { select: { id: true, name: true } } }, omit: { qrSecret: true } });
  return { items, total: items.length };
});

export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["INSTITUTE_ADMIN", "FACULTY"]);
  const input = await body(req, SessionInput);
  const s = await createSession(user, params.id, input);
  const { qrSecret: _s, ...rest } = s;
  return rest;
});
