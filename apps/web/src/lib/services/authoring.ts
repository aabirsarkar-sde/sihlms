import { db } from "../db";
import { notFound } from "../errors";
import { authorize, type Actor } from "../rbac";

/** Course owner, faculty who teach a programme using the course, or admins of that institution may edit. */
export async function courseForEdit(actor: Actor, courseId: string) {
  const c = await db.course.findFirst({ where: { id: courseId, deletedAt: null }, include: { owner: { select: { institutionId: true } } } });
  if (!c) throw notFound("Course");
  const assigned =
    actor.role === "FACULTY" &&
    !!(await db.programme.findFirst({ where: { courseId, OR: [{ coordinatorId: actor.id }, { sessions: { some: { facultyId: actor.id } } }] }, select: { id: true } }));
  authorize(actor, "update", "course", { ownerId: c.ownerId, institutionId: c.owner.institutionId, assigned });
  return c;
}

export async function lessonForEdit(actor: Actor, lessonId: string) {
  const l = await db.lesson.findUnique({ where: { id: lessonId }, include: { module: { select: { courseId: true } } } });
  if (!l) throw notFound("Lesson");
  await courseForEdit(actor, l.module.courseId);
  return l;
}
