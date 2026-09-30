import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { scanSessionToken, scanTraineeQr } from "@/lib/services/attendance";

export const dynamic = "force-dynamic";

/** Trainee: { token, clientId } from the rotating code. Faculty: { sessionId, payload, clientId } from a trainee's personal QR. */
export const POST = route(async (req) => {
  const user = await requireUser(["TRAINEE", "FACULTY", "INSTITUTE_ADMIN"]);
  if (user.role === "TRAINEE") {
    const { token, clientId, scannedAt } = await body(req, z.object({ token: z.string().min(10), clientId: z.string().uuid(), scannedAt: z.coerce.date().optional() }));
    const r = await scanSessionToken(user, token, clientId, scannedAt);
    return { ok: true, duplicate: r.duplicate, markedAt: r.attendance.markedAt };
  }
  const { sessionId, payload, clientId } = await body(req, z.object({ sessionId: z.string(), payload: z.string(), clientId: z.string().uuid() }));
  const r = await scanTraineeQr(user, sessionId, payload, clientId);
  return { ok: true, duplicate: r.duplicate, traineeName: r.traineeName };
});
