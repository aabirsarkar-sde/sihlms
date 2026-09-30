import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { courseForEdit } from "@/lib/services/authoring";

export const dynamic = "force-dynamic";

export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  await courseForEdit(user, params.id);
  const { title } = await body(req, z.object({ title: z.string().min(2) }));
  const order = (await db.module.count({ where: { courseId: params.id } })) + 1;
  return db.module.create({ data: { courseId: params.id, title, order } });
});
