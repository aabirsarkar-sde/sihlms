import { route } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { requireDevice } from "@/lib/devices";
import { ApiError } from "@/lib/errors";
import { identifyForSession } from "@/lib/face";
import { markByFace } from "@/lib/services/attendance";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** multipart: sessionId + image (and optional frames for liveness). Identifies against enrolled trainees' embeddings. */
export const POST = route(async (req) => {
  let actor = null;
  let device = null;
  if (req.headers.get("x-device-key")) device = await requireDevice(req);
  else {
    actor = await getCurrentUser();
    if (!actor || !["FACULTY", "INSTITUTE_ADMIN"].includes(actor.role)) throw new ApiError("FORBIDDEN", "Faculty or a registered device only");
  }
  const form = await req.formData();
  const sessionId = String(form.get("sessionId") ?? "");
  const frames = form.getAll("image").filter((f): f is File => f instanceof Blob);
  if (!sessionId || frames.length === 0) throw new ApiError("BAD_REQUEST", "sessionId and image are required");
  const institutionId = device?.institutionId ?? actor?.institutionId;
  if (!institutionId) throw new ApiError("FORBIDDEN", "No institution");
  const match = await identifyForSession(sessionId, frames);
  if (!match.traineeId) return { match: null, reason: match.reason, similarity: match.similarity ?? null, fallback: "MANUAL" };
  const r = await markByFace({ actor: actor ?? undefined, deviceId: device?.id, institutionId }, sessionId, match.traineeId, match.similarity!);
  const u = await db.user.findUnique({ where: { id: match.traineeId }, select: { name: true } });
  return { match: { traineeId: match.traineeId, name: u?.name, similarity: match.similarity }, duplicate: r.duplicate };
});
