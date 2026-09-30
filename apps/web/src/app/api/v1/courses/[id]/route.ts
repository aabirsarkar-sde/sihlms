import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { courseForEdit } from "@/lib/services/authoring";

export const dynamic = "force-dynamic";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  await courseForEdit(user, params.id);
  const data = await body(req, z.object({ title: z.string().min(3), description: z.string().min(5), published: z.boolean() }).partial());
  const c = await db.course.update({ where: { id: params.id }, data });
  await audit(user.id, "course.update", "Course", c.id, data);
  return c;
});

export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  await courseForEdit(user, params.id);
  await db.course.update({ where: { id: params.id }, data: { deletedAt: new Date(), published: false } });
  await audit(user.id, "course.delete", "Course", params.id, {});
  return { ok: true };
});
