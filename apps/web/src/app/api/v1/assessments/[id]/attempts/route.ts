import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AttemptInput, submitAttempt } from "@/lib/services/learning";

export const dynamic = "force-dynamic";

export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["TRAINEE"]);
  const input = await body(req, AttemptInput);
  const r = await submitAttempt(user, params.id, input);
  return { attemptId: r.attempt.id, scorePct: r.scorePct, results: r.results, duplicate: r.duplicate, attemptsUsed: "attemptsUsed" in r ? r.attemptsUsed : undefined };
});

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["TRAINEE"]);
  const items = await db.attempt.findMany({ where: { assessmentId: params.id, traineeId: user.id }, orderBy: { submittedAt: "desc" }, select: { id: true, scorePct: true, submittedAt: true } });
  return { items, total: items.length };
});
