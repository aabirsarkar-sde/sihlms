import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { authorize } from "@/lib/rbac";
import * as A from "@/lib/services/analytics";

export const dynamic = "force-dynamic";

/** /analytics/{overview,trainees,attendance,assessments,placements} — scoped by role. */
export const GET = route<{ kind: string }>(async (req, { params }) => {
  const user = await requireUser();
  const sp = req.nextUrl.searchParams;
  if (user.role === "TRAINEE") {
    authorize(user, "read", "analytics", { ownerId: user.id });
    const [lessons, attempts, att] = await Promise.all([
      db.lessonProgress.count({ where: { traineeId: user.id, completedAt: { not: null } } }),
      db.attempt.aggregate({ where: { traineeId: user.id }, _max: { scorePct: true }, _count: true }),
      db.attendance.count({ where: { traineeId: user.id, present: true } }),
    ]);
    return { lessonsCompleted: lessons, attempts: attempts._count, bestScore: attempts._max.scorePct, sessionsAttended: att };
  }
  if (user.role === "NOMINATOR") {
    const rows = await db.nomination.groupBy({ by: ["status"], where: { nominatedById: user.id }, _count: true });
    const certified = await db.certificate.count({ where: { trainee: { nominations: { some: { nominatedById: user.id } } } } });
    return { nominations: rows.map((r) => ({ status: r.status, count: r._count })), certified };
  }
  if (user.role === "EMPLOYER") {
    const rows = await db.application.groupBy({ by: ["status"], where: { job: { employerId: user.id } }, _count: true });
    return { applications: rows.map((r) => ({ status: r.status, count: r._count })) };
  }
  const scope = user.role === "SUPER_ADMIN" ? { institutionId: sp.get("institutionId") } : { institutionId: user.institutionId };
  authorize(user, "read", "analytics", { institutionId: scope.institutionId });
  switch (params.kind) {
    case "overview":
      return { ...(await A.overview(scope)), league: await A.institutionLeague(scope) };
    case "trainees":
      return { byMonth: await A.traineesByMonth(scope), byState: await A.traineesByState(scope), ...(await A.splits(scope)) };
    case "attendance":
      if (!scope.institutionId) throw new ApiError("BAD_REQUEST", "institutionId is required");
      return { sessions: await A.attendanceBySession(scope.institutionId, 50), hostels: await A.hostelOccupancy(scope.institutionId) };
    case "assessments": {
      const programmeId = sp.get("programmeId");
      if (!programmeId) throw new ApiError("BAD_REQUEST", "programmeId is required");
      const p = await db.programme.findUnique({ where: { id: programmeId }, select: { courseId: true, institutionId: true } });
      authorize(user, "read", "analytics", { institutionId: p?.institutionId });
      const a = p?.courseId ? await db.assessment.findFirst({ where: { courseId: p.courseId }, select: { id: true } }) : null;
      return { learners: await A.learnerProgress(programmeId), questions: a ? await A.questionDifficulty(a.id) : [] };
    }
    case "placements":
      return { pipeline: await A.placements(scope) };
    default:
      throw new ApiError("NOT_FOUND", "Unknown analytics view");
  }
});
