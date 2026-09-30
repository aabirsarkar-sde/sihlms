import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { authorize } from "@/lib/rbac";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  const d = await db.device.findUnique({ where: { id: params.id } });
  if (!d) throw notFound("Device");
  authorize(user, "delete", "device", { institutionId: d.institutionId });
  await db.device.delete({ where: { id: d.id } });
  await audit(user.id, "device.revoke", "Device", d.id, {});
  return { ok: true };
});
