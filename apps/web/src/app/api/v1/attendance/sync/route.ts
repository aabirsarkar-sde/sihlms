import { z } from "zod";
import { body, route } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { requireDevice } from "@/lib/devices";
import { ApiError } from "@/lib/errors";
import { SyncRecord, syncAttendance } from "@/lib/services/attendance";

export const dynamic = "force-dynamic";

/** Batch of offline records from trainees, faculty or devices (`X-Device-Key`). Idempotent by clientId. */
export const POST = route(async (req) => {
  const { records } = await body(req, z.object({ records: z.array(SyncRecord).min(1).max(1000) }));
  if (req.headers.get("x-device-key")) {
    const device = await requireDevice(req);
    return syncAttendance({ device }, records);
  }
  const user = await getCurrentUser();
  if (!user || !["TRAINEE", "FACULTY", "INSTITUTE_ADMIN"].includes(user.role)) throw new ApiError("UNAUTHORIZED", "Sign in or send X-Device-Key");
  return syncAttendance({ actor: user }, records);
});
