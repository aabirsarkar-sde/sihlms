import { route } from "@/lib/api";
import { requireDevice } from "@/lib/devices";

export const dynamic = "force-dynamic";

/** Devices call this every 60 s; admin sees online/offline. */
export const POST = route(async (req) => {
  const d = await requireDevice(req);
  return { ok: true, deviceId: d.id, serverTime: new Date().toISOString() };
});
