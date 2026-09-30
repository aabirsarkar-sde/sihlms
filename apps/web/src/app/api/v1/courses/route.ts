import { z } from "zod";
import { body, listParams, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { authorize } from "@/lib/rbac";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  authorize(user, "read", "course");
  const { skip, take, q } = listParams(req);
  const where = { deletedAt: null, ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}) };
  const [items, total] = await Promise.all([db.course.findMany({ where, skip, take, orderBy: { updatedAt: "desc" }, include: { owner: { select: { name: true } }, _count: { select: { modules: true } } } }), db.course.count({ where })]);
  return { items, total };
});

export const POST = route(async (req) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  authorize(user, "create", "course");
  const input = await body(req, z.object({ title: z.string().min(3), description: z.string().min(5), language: z.enum(["en", "hi", "mr"]).default("en") }));
  const c = await db.course.create({ data: { ...input, ownerId: user.id, published: false } });
  await audit(user.id, "course.create", "Course", c.id, input);
  return c;
});
