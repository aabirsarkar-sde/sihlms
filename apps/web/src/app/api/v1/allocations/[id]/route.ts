import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { authorize } from "@/lib/rbac";
import { moveAllocation } from "@/lib/services/programmes";

export const dynamic = "force-dynamic";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["INSTITUTE_ADMIN"]);
  const input = await body(req, z.object({ roomId: z.string().optional(), checkIn: z.coerce.date().optional(), checkOut: z.coerce.date().optional() }));
  if (input.roomId) return moveAllocation(user, params.id, input.roomId);
  const a = await db.roomAllocation.findUnique({ where: { id: params.id }, include: { programme: true } });
  if (!a) throw notFound("Allocation");
  authorize(user, "update", "hostel", { institutionId: a.programme.institutionId });
  return db.roomAllocation.update({ where: { id: a.id }, data: { checkIn: input.checkIn, checkOut: input.checkOut } });
});
