import type { Prisma } from "@prisma/client";
import { body, listParams, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { authorize } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { ProgrammeInput } from "@/lib/schemas";
import { listCatalogue } from "@/lib/services/catalogue";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  const user = await requireUser();
  const { skip, take, q, sp, page, pageSize } = listParams(req);
  if (user.role === "TRAINEE" || user.role === "NOMINATOR" || user.role === "EMPLOYER") {
    return listCatalogue({ q, institutionId: sp.get("institution") ?? undefined, state: sp.get("state") ?? undefined, category: sp.get("category") ?? undefined, mode: sp.get("mode") ?? undefined, month: sp.get("month") ?? undefined, page, pageSize });
  }
  authorize(user, "read", "programme", { institutionId: user.institutionId });
  const where: Prisma.ProgrammeWhereInput = {
    deletedAt: null,
    ...(user.role === "SUPER_ADMIN" ? {} : { institutionId: user.institutionId ?? "-" }),
    ...(sp.get("status") ? { status: sp.get("status") as never } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { code: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [items, total] = await Promise.all([
    db.programme.findMany({ where, skip, take, orderBy: { startDate: "desc" }, include: { institution: { select: { code: true, name: true } }, _count: { select: { enrollments: true, nominations: true } } } }),
    db.programme.count({ where }),
  ]);
  return { items, total };
});

export const POST = route(async (req) => {
  const user = await requireUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  const input = await body(req, ProgrammeInput);
  const institutionId = user.role === "SUPER_ADMIN" ? input.institutionId : user.institutionId;
  if (!institutionId) throw new ApiError("VALIDATION", "Institution is required", { institutionId: "required" });
  authorize(user, "create", "programme", { institutionId });
  const coord = await db.user.findFirst({ where: { id: input.coordinatorId, institutionId, role: { in: ["FACULTY", "INSTITUTE_ADMIN"] } } });
  if (!coord) throw new ApiError("VALIDATION", "Coordinator must be faculty of this institution", { coordinatorId: "invalid" });
  const p = await db.programme.create({ data: { ...input, institutionId, targetCategories: input.targetCategories as never, status: "DRAFT" } });
  await audit(user.id, "programme.create", "Programme", p.id, { code: p.code });
  return p;
});
