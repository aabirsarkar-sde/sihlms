import type { Prisma } from "@prisma/client";
import { db, type Tx } from "./db";

export async function audit(
  actorId: string | null | undefined,
  action: string,
  entity: string,
  entityId: string,
  diff: Prisma.InputJsonValue = {},
  tx: Tx = db,
  ip?: string | null,
) {
  await tx.auditLog.create({ data: { actorId: actorId ?? null, action, entity, entityId, diff, ip: ip ?? null } });
}
