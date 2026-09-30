import { setRequestLocale } from "next-intl/server";
import { pageUser, sp1, type SP } from "@/lib/page";
import { db } from "@/lib/db";
import { loadCourseFor, parseQuestions } from "@/lib/services/learning";
import { publicQuestions, seededShuffle } from "@/lib/services/grading";
import { MAX_ATTEMPTS } from "@/lib/constants";
import { CoursePlayer, type PlayerCourse } from "@/components/learn/course-player";

export const dynamic = "force-dynamic";

export default async function CoursePage({ params: { id, locale }, searchParams }: { params: { id: string; locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const user = await pageUser(["TRAINEE"]);
  const { course } = await loadCourseFor(user, id);
  const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const [progress, assessment] = await Promise.all([
    db.lessonProgress.findMany({ where: { traineeId: user.id, lessonId: { in: lessonIds } } }),
    course.assessments[0] ? db.assessment.findUnique({ where: { id: course.assessments[0].id } }) : null,
  ]);
  let quiz: PlayerCourse["quiz"] = null;
  if (assessment) {
    const attempts = await db.attempt.findMany({ where: { assessmentId: assessment.id, traineeId: user.id }, orderBy: { submittedAt: "desc" }, select: { scorePct: true, submittedAt: true } });
    const qs = publicQuestions(seededShuffle(parseQuestions(assessment.questions), `${user.id}:${attempts.length}`));
    quiz = { id: assessment.id, title: assessment.title, timeLimitMin: assessment.timeLimitMin, questions: qs, attemptsUsed: attempts.length, maxAttempts: MAX_ATTEMPTS, best: attempts.length ? Math.max(...attempts.map((a) => a.scorePct)) : null };
  }
  const data: PlayerCourse = {
    id: course.id,
    title: course.title,
    description: course.description,
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons.map((l) => ({ id: l.id, title: l.title, kind: l.kind, body: l.body, contentUrl: l.contentUrl, captionsUrl: l.captionsUrl, durationMin: l.durationMin, translations: l.translations as never, offlineSizeKb: l.offlineSizeKb })),
      translations: ((m.lessons[0]?.translations as Record<string, unknown> | undefined)?._module ?? {}) as Record<string, string>,
    })),
    progress: Object.fromEntries(progress.map((p) => [p.lessonId, { seconds: p.secondsSpent, done: !!p.completedAt }])),
    quiz,
  };
  return <CoursePlayer course={data} initialLesson={sp1(searchParams, "lesson")} initialView={sp1(searchParams, "view") === "quiz" ? "quiz" : "lesson"} />;
}
