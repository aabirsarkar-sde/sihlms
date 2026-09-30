import { db } from "../db";
import type { AuthUser } from "../auth";

/** Programmes a staff member can work with (institution-scoped; faculty: those they coordinate or teach). */
export async function staffProgrammes(user: AuthUser) {
  return db.programme.findMany({
    where: {
      deletedAt: null,
      status: { not: "CANCELLED" },
      ...(user.role === "SUPER_ADMIN" ? {} : { institutionId: user.institutionId ?? "-" }),
      ...(user.role === "FACULTY" ? { OR: [{ coordinatorId: user.id }, { sessions: { some: { facultyId: user.id } } }] } : {}),
    },
    orderBy: { startDate: "desc" },
    select: { id: true, title: true, code: true, startDate: true, endDate: true, status: true, coordinatorId: true, courseId: true, institutionId: true },
  });
}

export async function timetableData(programmeId: string, institutionId: string) {
  const [sessions, faculty] = await Promise.all([
    db.session.findMany({ where: { programmeId }, orderBy: { startsAt: "asc" }, include: { faculty: { select: { name: true } }, _count: { select: { attendances: true } } } }),
    db.user.findMany({ where: { institutionId, role: { in: ["FACULTY", "INSTITUTE_ADMIN"] }, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return {
    sessions: sessions.map((s) => ({ id: s.id, title: s.title, facultyId: s.facultyId, facultyName: s.faculty.name, room: s.room, startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString(), attendance: s._count.attendances })),
    faculty,
  };
}
