import { db } from "../db";

/** Everything the trainee "Today" screen needs in one go. */
export async function traineeToday(userId: string) {
  const now = new Date();
  const [profile, enrollments, certCount, lastProgress, apps] = await Promise.all([
    db.traineeProfile.findUnique({ where: { userId }, omit: { faceEmbedding: true } }),
    db.enrollment.findMany({
      where: { traineeId: userId, programme: { status: { in: ["ONGOING", "PUBLISHED"] } } },
      include: {
        programme: {
          include: {
            institution: { select: { name: true, city: true } },
            course: { select: { id: true, title: true, _count: { select: { modules: true } } } },
            sessions: { where: { endsAt: { gte: now } }, orderBy: { startsAt: "asc" }, take: 3, include: { faculty: { select: { name: true } } } },
          },
        },
      },
    }),
    db.certificate.count({ where: { traineeId: userId, revokedAt: null } }),
    db.lessonProgress.findFirst({ where: { traineeId: userId }, orderBy: { updatedAt: "desc" }, include: { lesson: { include: { module: { select: { courseId: true, course: { select: { title: true } } } } } } } }),
    db.application.count({ where: { traineeId: userId } }),
  ]);
  const sessions = enrollments
    .flatMap((e) => e.programme.sessions.map((s) => ({ ...s, programme: { id: e.programme.id, title: e.programme.title, code: e.programme.code } })))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const attendedIds = new Set(
    (await db.attendance.findMany({ where: { traineeId: userId, sessionId: { in: sessions.map((s) => s.id) }, present: true }, select: { sessionId: true } })).map((a) => a.sessionId),
  );
  let continueCourse: { courseId: string; title: string; done: number; total: number; lessonId: string } | null = null;
  if (lastProgress) {
    const courseId = lastProgress.lesson.module.courseId;
    const [done, total] = await Promise.all([
      db.lessonProgress.count({ where: { traineeId: userId, completedAt: { not: null }, lesson: { module: { courseId } } } }),
      db.lesson.count({ where: { module: { courseId } } }),
    ]);
    continueCourse = { courseId, title: lastProgress.lesson.module.course.title, done, total, lessonId: lastProgress.lessonId };
  }
  return { profile, enrollments, sessions: sessions.map((s) => ({ ...s, attended: attendedIds.has(s.id) })), certCount, continueCourse, apps };
}
