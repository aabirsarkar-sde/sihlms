import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import { ApiError } from "./errors";

export const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");
export const newDeviceKey = () => `ssd_${randomBytes(24).toString("base64url")}`;

/** Authenticates a kiosk / hub via `X-Device-Key`. */
export async function requireDevice(req: Request) {
  const key = req.headers.get("x-device-key");
  if (!key) throw new ApiError("UNAUTHORIZED", "Missing X-Device-Key");
  const device = await db.device.findUnique({ where: { apiKeyHash: hashKey(key) } });
  if (!device) throw new ApiError("UNAUTHORIZED", "Unknown device key");
  await db.device.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } });
  return device;
}

export const deviceOnline = (lastSeenAt: Date | null) => !!lastSeenAt && Date.now() - lastSeenAt.getTime() < 3 * 60_000;
