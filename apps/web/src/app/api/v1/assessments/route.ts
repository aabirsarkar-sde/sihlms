import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { authorize } from "@/lib/rbac";
import { QuestionSchema } from "@/lib/services/grading";
import { courseForEdit } from "@/lib/services/authoring";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  authorize(user, "read", "assessment");
  const courseId = req.nextUrl.searchParams.get("courseId") ?? undefined;
  const items = await db.assessment.findMany({ where: courseId ? { courseId } : {}, include: { _count: { select: { attempts: true } } } });
  return { items, total: items.length };
});

export const POST = route(async (req) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  authorize(user, "create", "assessment");
  const input = await body(req, z.object({ courseId: z.string(), title: z.string().min(3), timeLimitMin: z.number().int().min(1).max(180).default(20), questions: z.array(QuestionSchema).default([]) }));
  await courseForEdit(user, input.courseId);
  return db.assessment.create({ data: { ...input, questions: input.questions as never } });
});
