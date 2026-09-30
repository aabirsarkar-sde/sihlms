import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { traineeQr } from "@/lib/qr";
import { loadCourseFor, parseQuestions } from "@/lib/services/learning";
import { publicQuestions } from "@/lib/services/grading";

export const dynamic = "force-dynamic";

/** Manifest of everything needed to learn and take the test offline (no answers included). */
export const GET = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["TRAINEE"]);
  const { course } = await loadCourseFor(user, params.id);
  const assessments = await db.assessment.findMany({ where: { courseId: course.id } });
  const lessons = course.modules.flatMap((m) => m.lessons);
  const files = lessons.map((l) => l.contentUrl).filter((u): u is string => !!u && u.startsWith("/"));
  const sizeKb = lessons.reduce((s, l) => s + l.offlineSizeKb, 0) + assessments.length * 12;
  return {
    course: { id: course.id, title: course.title, description: course.description },
    modules: course.modules.map((m) => ({ id: m.id, title: m.title, lessons: m.lessons.map((l) => ({ id: l.id, title: l.title, kind: l.kind, body: l.body, translations: l.translations, contentUrl: l.contentUrl, durationMin: l.durationMin })) })),
    assessments: assessments.map((a) => ({ id: a.id, title: a.title, timeLimitMin: a.timeLimitMin, questions: publicQuestions(parseQuestions(a.questions)) })),
    traineeQr: traineeQr(user.id),
    files,
    sizeKb,
    generatedAt: new Date(),
  };
});
