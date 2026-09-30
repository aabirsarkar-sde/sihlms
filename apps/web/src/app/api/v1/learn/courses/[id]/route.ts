import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadCourseFor } from "@/lib/services/learning";

export const dynamic = "force-dynamic";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser();
  const { course } = await loadCourseFor(user, params.id);
  const progress = await db.lessonProgress.findMany({ where: { traineeId: user.id, lesson: { module: { courseId: course.id } } } });
  return { course, progress };
});
