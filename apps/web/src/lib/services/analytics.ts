import { Prisma } from "@prisma/client";
import { db } from "../db";
import { parseQuestions } from "./learning";
import { isCorrect, type AnswerValue } from "./grading";

export type Scope = { institutionId?: string | null };

const instFilter = (s: Scope, alias = "p") => (s.institutionId ? Prisma.sql`AND ${Prisma.raw(alias)}."institutionId" = ${s.institutionId}` : Prisma.empty);
const num = (v: unknown) => Number(v ?? 0);

export async function overview(scope: Scope) {
  const f = instFilter(scope);
  const [totals] = await db.$queryRaw<Record<string, bigint | number | null>[]>`
    SELECT
      (SELECT COUNT(DISTINCT e."traineeId") FROM "Enrollment" e JOIN "Programme" p ON p.id = e."programmeId" WHERE p."deletedAt" IS NULL ${f}) AS trainees,
      (SELECT COUNT(*) FROM "Enrollment" e JOIN "Programme" p ON p.id = e."programmeId" WHERE p.status = 'COMPLETED' ${f}) AS "completedEnrollments",
      (SELECT COUNT(*) FROM "Certificate" c JOIN "Programme" p ON p.id = c."programmeId" WHERE c."revokedAt" IS NULL ${f}) AS certificates,
      (SELECT COUNT(*) FROM "Certificate" c JOIN "Programme" p ON p.id = c."programmeId" WHERE c."revokedAt" IS NULL AND p.status = 'COMPLETED' ${f}) AS "completedCerts",
      (SELECT COUNT(*) FROM "Programme" p WHERE p."deletedAt" IS NULL ${f}) AS programmes,
      (SELECT COUNT(*) FROM "Programme" p WHERE p."deletedAt" IS NULL AND p.status = 'ONGOING' ${f}) AS ongoing,
      (SELECT AVG(best) FROM (
         SELECT MAX(a."scorePct") AS best FROM "Attempt" a
         JOIN "Assessment" s ON s.id = a."assessmentId"
         JOIN "Enrollment" e ON e."traineeId" = a."traineeId"
         JOIN "Programme" p ON p.id = e."programmeId" AND p."courseId" = s."courseId"
         WHERE TRUE ${f}
         GROUP BY a."traineeId", a."assessmentId") t) AS "avgScore",
      (SELECT COUNT(DISTINCT c."traineeId") FROM "Certificate" c JOIN "Programme" p ON p.id = c."programmeId" WHERE c."revokedAt" IS NULL ${f}) AS "certHolders",
      (SELECT COUNT(DISTINCT ap."traineeId") FROM "Application" ap WHERE ap.status = 'HIRED' AND ap."traineeId" IN
         (SELECT c."traineeId" FROM "Certificate" c JOIN "Programme" p ON p.id = c."programmeId" WHERE c."revokedAt" IS NULL ${f})) AS placed
  `;
  const completed = num(totals.completedEnrollments);
  const certHolders = num(totals.certHolders);
  return {
    trainees: num(totals.trainees),
    programmes: num(totals.programmes),
    ongoing: num(totals.ongoing),
    certificates: num(totals.certificates),
    completionRate: completed ? Math.round((num(totals.completedCerts) / completed) * 1000) / 10 : 0,
    avgScore: Math.round(num(totals.avgScore) * 10) / 10,
    placed: num(totals.placed),
    placementRate: certHolders ? Math.round((num(totals.placed) / certHolders) * 1000) / 10 : 0,
  };
}

export async function traineesByMonth(scope: Scope) {
  const rows = await db.$queryRaw<{ month: string; trained: bigint; certified: bigint }[]>`
    WITH months AS (
      SELECT to_char(date_trunc('month', now()) - (i || ' month')::interval, 'YYYY-MM') AS month
      FROM generate_series(0, 11) AS i
    )
    SELECT m.month,
      (SELECT COUNT(*) FROM "Enrollment" e JOIN "Programme" p ON p.id = e."programmeId"
        WHERE to_char(p."endDate", 'YYYY-MM') = m.month AND p.status IN ('COMPLETED','ONGOING') ${instFilter(scope)}) AS trained,
      (SELECT COUNT(*) FROM "Certificate" c JOIN "Programme" p ON p.id = c."programmeId"
        WHERE to_char(c."issuedAt", 'YYYY-MM') = m.month ${instFilter(scope)}) AS certified
    FROM months m ORDER BY m.month`;
  return rows.map((r) => ({ month: r.month, trained: num(r.trained), certified: num(r.certified) }));
}

export async function traineesByState(scope: Scope) {
  const rows = await db.$queryRaw<{ state: string; trainees: bigint; certified: bigint }[]>`
    SELECT tp.state, COUNT(DISTINCT e."traineeId") AS trainees, COUNT(DISTINCT c."traineeId") AS certified
    FROM "Enrollment" e
    JOIN "Programme" p ON p.id = e."programmeId"
    JOIN "TraineeProfile" tp ON tp."userId" = e."traineeId"
    LEFT JOIN "Certificate" c ON c."traineeId" = e."traineeId" AND c."programmeId" = e."programmeId" AND c."revokedAt" IS NULL
    WHERE TRUE ${instFilter(scope)}
    GROUP BY tp.state ORDER BY trainees DESC`;
  return rows.map((r) => ({ state: r.state, trainees: num(r.trainees), certified: num(r.certified) }));
}

export async function splits(scope: Scope) {
  const [cat, gender] = await Promise.all([
    db.$queryRaw<{ key: string; value: bigint }[]>`
      SELECT tp.category::text AS key, COUNT(DISTINCT e."traineeId") AS value FROM "Enrollment" e
      JOIN "Programme" p ON p.id = e."programmeId" JOIN "TraineeProfile" tp ON tp."userId" = e."traineeId"
      WHERE TRUE ${instFilter(scope)} GROUP BY tp.category ORDER BY value DESC`,
    db.$queryRaw<{ key: string; value: bigint }[]>`
      SELECT tp.gender AS key, COUNT(DISTINCT e."traineeId") AS value FROM "Enrollment" e
      JOIN "Programme" p ON p.id = e."programmeId" JOIN "TraineeProfile" tp ON tp."userId" = e."traineeId"
      WHERE TRUE ${instFilter(scope)} GROUP BY tp.gender ORDER BY value DESC`,
  ]);
  return {
    category: cat.map((r) => ({ key: r.key, value: num(r.value) })),
    gender: gender.map((r) => ({ key: r.key, value: num(r.value) })),
  };
}

export async function institutionLeague(scope: Scope) {
  const rows = await db.$queryRaw<{ id: string; name: string; code: string; type: string; trainees: bigint; certificates: bigint; avgScore: number | null; placed: bigint }[]>`
    SELECT i.id, i.name, i.code, i.type::text AS type,
      (SELECT COUNT(*) FROM "Enrollment" e JOIN "Programme" p ON p.id = e."programmeId" WHERE p."institutionId" = i.id) AS trainees,
      (SELECT COUNT(*) FROM "Certificate" c JOIN "Programme" p ON p.id = c."programmeId" WHERE p."institutionId" = i.id AND c."revokedAt" IS NULL) AS certificates,
      (SELECT AVG(a."scorePct") FROM "Attempt" a JOIN "Enrollment" e ON e."traineeId" = a."traineeId" JOIN "Programme" p ON p.id = e."programmeId" WHERE p."institutionId" = i.id) AS "avgScore",
      (SELECT COUNT(DISTINCT ap."traineeId") FROM "Application" ap JOIN "Certificate" c ON c."traineeId" = ap."traineeId" JOIN "Programme" p ON p.id = c."programmeId"
         WHERE ap.status = 'HIRED' AND p."institutionId" = i.id) AS placed
    FROM "Institution" i
    ${scope.institutionId ? Prisma.sql`WHERE i.id = ${scope.institutionId}` : Prisma.empty}
    ORDER BY certificates DESC`;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    type: r.type,
    trainees: num(r.trainees),
    certificates: num(r.certificates),
    avgScore: Math.round(num(r.avgScore) * 10) / 10,
    placed: num(r.placed),
    completionPct: num(r.trainees) ? Math.round((num(r.certificates) / num(r.trainees)) * 1000) / 10 : 0,
  }));
}

export async function placements(scope: Scope) {
  const rows = await db.$queryRaw<{ status: string; value: bigint }[]>`
    SELECT ap.status::text AS status, COUNT(*) AS value FROM "Application" ap
    ${scope.institutionId ? Prisma.sql`WHERE ap."traineeId" IN (SELECT e."traineeId" FROM "Enrollment" e JOIN "Programme" p ON p.id = e."programmeId" WHERE p."institutionId" = ${scope.institutionId})` : Prisma.empty}
    GROUP BY ap.status`;
  return rows.map((r) => ({ status: r.status, value: num(r.value) }));
}

export async function attendanceBySession(institutionId: string, limit = 20) {
  const rows = await db.$queryRaw<{ id: string; title: string; programme: string; startsAt: Date; present: bigint; enrolled: bigint }[]>`
    SELECT s.id, s.title, p.code AS programme, s."startsAt",
      (SELECT COUNT(*) FROM "Attendance" a WHERE a."sessionId" = s.id AND a.present) AS present,
      (SELECT COUNT(*) FROM "Enrollment" e WHERE e."programmeId" = s."programmeId") AS enrolled
    FROM "Session" s JOIN "Programme" p ON p.id = s."programmeId"
    WHERE p."institutionId" = ${institutionId} AND s."startsAt" <= now()
    ORDER BY s."startsAt" DESC LIMIT ${limit}`;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    programme: r.programme,
    startsAt: r.startsAt,
    present: num(r.present),
    enrolled: num(r.enrolled),
    pct: num(r.enrolled) ? Math.round((num(r.present) / num(r.enrolled)) * 100) : 0,
  }));
}

export async function hostelOccupancy(institutionId: string) {
  const hostels = await db.hostel.findMany({
    where: { institutionId },
    include: { rooms: { include: { _count: { select: { allocations: { where: { checkOut: null } } } } } } },
  });
  return hostels.map((h) => {
    const beds = h.rooms.reduce((s, r) => s + r.beds, 0);
    const used = h.rooms.reduce((s, r) => s + Math.min(r.beds, r._count.allocations), 0);
    return { name: h.name, gender: h.gender, beds, used, pct: beds ? Math.round((used / beds) * 100) : 0 };
  });
}

/** Faculty: per-programme learner progress. */
export async function learnerProgress(programmeId: string) {
  const p = await db.programme.findUnique({ where: { id: programmeId }, select: { courseId: true } });
  if (!p?.courseId) return [];
  const totalLessons = await db.lesson.count({ where: { module: { courseId: p.courseId } } });
  const rows = await db.$queryRaw<{ traineeId: string; name: string; done: bigint; seconds: bigint; best: number | null; attempts: bigint }[]>`
    SELECT u.id AS "traineeId", u.name,
      (SELECT COUNT(*) FROM "LessonProgress" lp JOIN "Lesson" l ON l.id = lp."lessonId" JOIN "Module" m ON m.id = l."moduleId"
        WHERE lp."traineeId" = u.id AND m."courseId" = ${p.courseId} AND lp."completedAt" IS NOT NULL) AS done,
      (SELECT COALESCE(SUM(lp."secondsSpent"),0) FROM "LessonProgress" lp JOIN "Lesson" l ON l.id = lp."lessonId" JOIN "Module" m ON m.id = l."moduleId"
        WHERE lp."traineeId" = u.id AND m."courseId" = ${p.courseId}) AS seconds,
      (SELECT MAX(a."scorePct") FROM "Attempt" a JOIN "Assessment" s ON s.id = a."assessmentId" WHERE a."traineeId" = u.id AND s."courseId" = ${p.courseId}) AS best,
      (SELECT COUNT(*) FROM "Attempt" a JOIN "Assessment" s ON s.id = a."assessmentId" WHERE a."traineeId" = u.id AND s."courseId" = ${p.courseId}) AS attempts
    FROM "Enrollment" e JOIN "User" u ON u.id = e."traineeId"
    WHERE e."programmeId" = ${programmeId}
    ORDER BY u.name`;
  return rows.map((r) => ({
    traineeId: r.traineeId,
    name: r.name,
    lessonsDone: num(r.done),
    totalLessons,
    progressPct: totalLessons ? Math.round((num(r.done) / totalLessons) * 100) : 0,
    minutes: Math.round(num(r.seconds) / 60),
    bestScore: r.best == null ? null : Math.round(r.best * 10) / 10,
    attempts: num(r.attempts),
  }));
}

/** Faculty: question-level difficulty (share of attempts answering correctly). */
export async function questionDifficulty(assessmentId: string) {
  const a = await db.assessment.findUnique({ where: { id: assessmentId } });
  if (!a) return [];
  const qs = parseQuestions(a.questions);
  const attempts = await db.attempt.findMany({ where: { assessmentId }, select: { answers: true }, take: 5000 });
  return qs.map((q) => {
    const answered = attempts.filter((t) => (t.answers as Record<string, AnswerValue>)[q.id] !== undefined);
    const correct = answered.filter((t) => isCorrect(q, (t.answers as Record<string, AnswerValue>)[q.id])).length;
    return { id: q.id, prompt: q.prompt, attempts: answered.length, correctPct: answered.length ? Math.round((correct / answered.length) * 100) : 0 };
  });
}
