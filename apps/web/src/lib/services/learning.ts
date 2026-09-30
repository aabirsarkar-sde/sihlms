import { z } from "zod";
import { db } from "../db";
import { ApiError, notFound } from "../errors";
import { audit } from "../audit";
import { authorize, type Actor } from "../rbac";
import { MAX_ATTEMPTS } from "../constants";
import { grade, QuestionSchema, type AnswerValue, type Question } from "./grading";

/** A trainee is enrolled in a course if enrolled in any programme using it. */
export async function isEnrolledInCourse(traineeId: string, courseId: string) {
  const e = await db.enrollment.findFirst({ where: { traineeId, programme: { courseId } }, select: { id: true } });
  return !!e;
}

export async function loadCourseFor(actor: Actor, courseId: string) {
  const course = await db.course.findFirst({
    where: { id: courseId, deletedAt: null },
    include: {
      modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } },
      assessments: { select: { id: true, title: true, timeLimitMin: true } },
    },
  });
  if (!course) throw notFound("Course");
  const enrolled = actor.role === "TRAINEE" ? await isEnrolledInCourse(actor.id, courseId) : false;
  authorize(actor, "read", "course", { enrolled, published: course.published, ownerId: course.ownerId });
  return { course, enrolled };
}

export const ProgressInput = z.object({
  lessonId: z.string(),
  secondsSpent: z.number().int().min(0).max(24 * 3600),
  completed: z.boolean().optional(),
  clientTs: z.coerce.date().optional(),
});

/** Progress conflict rule: max value wins (safe to replay offline records in any order). */
export async function saveProgress(actor: Actor, input: z.infer<typeof ProgressInput>) {
  const lesson = await db.lesson.findUnique({ where: { id: input.lessonId }, include: { module: { select: { courseId: true } } } });
  if (!lesson) throw notFound("Lesson");
  const c = await db.course.findUnique({ where: { id: lesson.module.courseId }, select: { published: true } });
  authorize(actor, "read", "course", { enrolled: await isEnrolledInCourse(actor.id, lesson.module.courseId), published: c?.published });
  const existing = await db.lessonProgress.findUnique({ where: { lessonId_traineeId: { lessonId: input.lessonId, traineeId: actor.id } } });
  const completedAt = existing?.completedAt ?? (input.completed ? input.clientTs ?? new Date() : null);
  return db.lessonProgress.upsert({
    where: { lessonId_traineeId: { lessonId: input.lessonId, traineeId: actor.id } },
    create: { lessonId: input.lessonId, traineeId: actor.id, secondsSpent: input.secondsSpent, completedAt },
    update: { secondsSpent: Math.max(existing?.secondsSpent ?? 0, input.secondsSpent), completedAt },
  });
}

export function parseQuestions(json: unknown): Question[] {
  return z.array(QuestionSchema).parse(json);
}

export const AttemptInput = z.object({
  clientId: z.string().uuid(),
  answers: z.record(z.union([z.number(), z.array(z.number()), z.boolean(), z.null()])),
  startedAt: z.coerce.date().optional(),
  submittedAt: z.coerce.date().optional(),
});

/** Auto-grades on submit; max 3 attempts; idempotent on clientId so offline attempts grade on sync. */
export async function submitAttempt(actor: Actor, assessmentId: string, input: z.infer<typeof AttemptInput>) {
  const dup = await db.attempt.findUnique({ where: { clientId: input.clientId } });
  if (dup) {
    const a = await db.assessment.findUniqueOrThrow({ where: { id: dup.assessmentId } });
    return { attempt: dup, ...grade(parseQuestions(a.questions), dup.answers as Record<string, AnswerValue>), duplicate: true };
  }
  const a = await db.assessment.findUnique({ where: { id: assessmentId }, include: { course: { select: { published: true } } } });
  if (!a) throw notFound("Assessment");
  const enrolled = await isEnrolledInCourse(actor.id, a.courseId);
  authorize(actor, "create", "attempt", { enrolled, published: a.course.published });
  const used = await db.attempt.count({ where: { assessmentId, traineeId: actor.id } });
  if (used >= MAX_ATTEMPTS) throw new ApiError("CONFLICT", `Maximum of ${MAX_ATTEMPTS} attempts reached`);
  const questions = parseQuestions(a.questions);
  const g = grade(questions, input.answers);
  const attempt = await db.attempt.create({
    data: {
      assessmentId,
      traineeId: actor.id,
      answers: input.answers,
      scorePct: g.scorePct,
      submittedAt: input.submittedAt && input.submittedAt <= new Date() ? input.submittedAt : new Date(),
      clientId: input.clientId,
    },
  });
  await audit(actor.id, "attempt.submit", "Attempt", attempt.id, { scorePct: g.scorePct });
  return { attempt, ...g, duplicate: false, attemptsUsed: used + 1 };
}

export type LessonText = { title: string; body?: string | null };
/** Lesson content in the requested locale, falling back to English with a flag. */
export function localizeLesson(lesson: { title: string; body: string | null; translations: unknown }, locale: string) {
  const tr = (lesson.translations ?? {}) as Record<string, LessonText>;
  const t = locale === "en" ? null : tr[locale];
  return {
    title: t?.title || lesson.title,
    body: t?.body || lesson.body,
    englishOnly: locale !== "en" && (!t || (!t.body && !!lesson.body)),
  };
}
