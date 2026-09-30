import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { authorize } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { deviceOnline, hashKey, newDeviceKey } from "@/lib/devices";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  authorize(user, "read", "device", { institutionId: user.institutionId });
  const items = await db.device.findMany({ where: user.role === "SUPER_ADMIN" ? {} : { institutionId: user.institutionId! }, omit: { apiKeyHash: true }, include: { institution: { select: { code: true } } } });
  return { items: items.map((d) => ({ ...d, online: deviceOnline(d.lastSeenAt) })), total: items.length };
});

/** Registers a device and returns its API key ONCE. Only the hash is stored. */
export const POST = route(async (req) => {
  const user = await requireUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  const input = await body(req, z.object({ name: z.string().min(2), kind: z.enum(["KIOSK", "HUB"]), institutionId: z.string().optional() }));
  const institutionId = user.role === "SUPER_ADMIN" ? input.institutionId : user.institutionId;
  if (!institutionId) throw new ApiError("VALIDATION", "Institution is required");
  authorize(user, "create", "device", { institutionId });
  const key = newDeviceKey();
  const d = await db.device.create({ data: { name: input.name, kind: input.kind, institutionId, apiKeyHash: hashKey(key) } });
  await audit(user.id, "device.create", "Device", d.id, { kind: d.kind });
  return { id: d.id, name: d.name, kind: d.kind, apiKey: key };
});
