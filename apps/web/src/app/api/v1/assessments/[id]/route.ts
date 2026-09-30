import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { QuestionSchema } from "@/lib/services/grading";
import { courseForEdit } from "@/lib/services/authoring";

export const dynamic = "force-dynamic";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  const a = await db.assessment.findUnique({ where: { id: params.id } });
  if (!a) throw notFound("Assessment");
  await courseForEdit(user, a.courseId);
  return a;
});

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  const a = await db.assessment.findUnique({ where: { id: params.id } });
  if (!a) throw notFound("Assessment");
  await courseForEdit(user, a.courseId);
  const data = await body(req, z.object({ title: z.string().min(3), timeLimitMin: z.number().int().min(1).max(180), questions: z.array(QuestionSchema).min(1) }).partial());
  const updated = await db.assessment.update({ where: { id: a.id }, data: { ...data, questions: data.questions as never } });
  await audit(user.id, "assessment.update", "Assessment", a.id, { questions: data.questions?.length });
  return updated;
});
