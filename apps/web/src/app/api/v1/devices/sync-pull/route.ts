import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { requireDevice } from "@/lib/devices";
import { bytesToEmbedding } from "@/lib/face";

export const dynamic = "force-dynamic";

/**
 * Kiosk/hub pull: today's (and upcoming 24 h) sessions at the device's institution, enrolled trainees and their
 * face embeddings (consented only), so identification works with no internet. `since` limits trainee rows to changed ones.
 */
export const GET = route(async (req) => {
  const device = await requireDevice(req);
  const since = req.nextUrl.searchParams.get("since");
  const now = new Date();
  const sessions = await db.session.findMany({
    where: { programme: { institutionId: device.institutionId }, endsAt: { gte: new Date(now.getTime() - 12 * 3600_000) }, startsAt: { lte: new Date(now.getTime() + 24 * 3600_000) } },
    select: { id: true, title: true, room: true, startsAt: true, endsAt: true, programmeId: true, programme: { select: { code: true, title: true } } },
  });
  const programmeIds = [...new Set(sessions.map((s) => s.programmeId))];
  const enrollments = await db.enrollment.findMany({
    where: { programmeId: { in: programmeIds } },
    select: { programmeId: true, trainee: { select: { id: true, name: true, traineeProfile: { select: { faceEmbedding: true, faceConsentAt: true, updatedAt: true } } } } },
  });
  const trainees = new Map<string, { id: string; name: string; programmes: string[]; embedding: number[] | null; updatedAt: Date | null }>();
  for (const e of enrollments) {
    const p = e.trainee.traineeProfile;
    if (since && p?.updatedAt && p.updatedAt < new Date(since)) continue;
    const cur = trainees.get(e.trainee.id) ?? { id: e.trainee.id, name: e.trainee.name, programmes: [], embedding: p?.faceEmbedding && p.faceConsentAt ? bytesToEmbedding(p.faceEmbedding) : null, updatedAt: p?.updatedAt ?? null };
    cur.programmes.push(e.programmeId);
    trainees.set(e.trainee.id, cur);
  }
  return { serverTime: now.toISOString(), device: { id: device.id, kind: device.kind }, sessions, trainees: [...trainees.values()] };
});
