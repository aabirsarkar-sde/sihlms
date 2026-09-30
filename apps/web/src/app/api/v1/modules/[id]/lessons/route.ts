import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { courseForEdit } from "@/lib/services/authoring";

export const dynamic = "force-dynamic";

export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  const m = await db.module.findUnique({ where: { id: params.id } });
  if (!m) throw notFound("Module");
  await courseForEdit(user, m.courseId);
  const { title, kind } = await body(req, z.object({ title: z.string().min(2), kind: z.enum(["TEXT", "VIDEO", "PDF", "AUDIO"]).default("TEXT") }));
  const order = (await db.lesson.count({ where: { moduleId: m.id } })) + 1;
  return db.lesson.create({ data: { moduleId: m.id, title, kind, order, body: "", translations: {}, durationMin: 5, offlineSizeKb: 2 } });
});
