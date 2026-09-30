import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { authorize } from "@/lib/rbac";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  const target = await db.user.findUnique({ where: { id: params.id } });
  if (!target) throw notFound("User");
  authorize(user, "update", "user", { institutionId: target.institutionId, targetRole: target.role, ownerId: target.id });
  const data = await body(req, z.object({ name: z.string().min(2), status: z.enum(["ACTIVE", "SUSPENDED", "PENDING"]) }).partial());
  const u = await db.user.update({ where: { id: target.id }, data });
  await audit(user.id, "user.update", "User", u.id, data);
  return { id: u.id, status: u.status };
});

export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  const target = await db.user.findUnique({ where: { id: params.id } });
  if (!target) throw notFound("User");
  authorize(user, "delete", "user", { institutionId: target.institutionId, targetRole: target.role });
  await db.user.update({ where: { id: target.id }, data: { deletedAt: new Date(), status: "SUSPENDED" } });
  await audit(user.id, "user.delete", "User", target.id, {});
  return { ok: true };
});
