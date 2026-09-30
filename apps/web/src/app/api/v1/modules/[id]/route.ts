import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError, notFound } from "@/lib/errors";
import { courseForEdit } from "@/lib/services/authoring";

export const dynamic = "force-dynamic";

async function load(id: string) {
  const m = await db.module.findUnique({ where: { id }, include: { _count: { select: { lessons: true } } } });
  if (!m) throw notFound("Module");
  return m;
}

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  const m = await load(params.id);
  await courseForEdit(user, m.courseId);
  const data = await body(req, z.object({ title: z.string().min(2), order: z.number().int().min(1) }).partial());
  return db.module.update({ where: { id: m.id }, data });
});

export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  const m = await load(params.id);
  await courseForEdit(user, m.courseId);
  if (m._count.lessons) throw new ApiError("CONFLICT", "Delete the module's lessons first");
  await db.module.delete({ where: { id: m.id } });
  return { ok: true };
});
