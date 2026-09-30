import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { body, listParams, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { authorize } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { Phone } from "@/lib/services/auth";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  const user = await requireUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  authorize(user, "read", "user", { institutionId: user.institutionId });
  const { skip, take, q, sp } = listParams(req);
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(user.role === "INSTITUTE_ADMIN" ? { institutionId: user.institutionId } : {}),
    ...(sp.get("role") ? { role: sp.get("role") as never } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
  };
  const [items, total] = await Promise.all([
    db.user.findMany({ where, skip, take, orderBy: { name: "asc" }, select: { id: true, name: true, phone: true, email: true, role: true, status: true, institution: { select: { code: true } }, createdAt: true } }),
    db.user.count({ where }),
  ]);
  return { items, total };
});

export const POST = route(async (req) => {
  const user = await requireUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  const input = await body(req, z.object({ name: z.string().min(2), phone: Phone, email: z.string().email().optional().or(z.literal("")), role: z.enum(["SUPER_ADMIN", "INSTITUTE_ADMIN", "FACULTY"]), institutionId: z.string().optional() }));
  const institutionId = user.role === "SUPER_ADMIN" ? input.institutionId : user.institutionId;
  if (input.role !== "SUPER_ADMIN" && !institutionId) throw new ApiError("VALIDATION", "Institution is required", { institutionId: "required" });
  authorize(user, "create", "user", { institutionId, targetRole: input.role });
  const u = await db.user.create({ data: { name: input.name, phone: input.phone, email: input.email || null, role: input.role, institutionId: input.role === "SUPER_ADMIN" ? null : institutionId } });
  await audit(user.id, "user.create", "User", u.id, { role: u.role });
  return u;
});
