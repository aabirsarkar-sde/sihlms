import { z } from "zod";
import { body, listParams, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError, notFound } from "@/lib/errors";
import { authorize } from "@/lib/rbac";
import { nominate } from "@/lib/services/nominations";
import { Phone } from "@/lib/services/auth";

export const dynamic = "force-dynamic";

export const GET = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser();
  const p = await db.programme.findUnique({ where: { id: params.id } });
  if (!p) throw notFound("Programme");
  authorize(user, "read", "nomination", { institutionId: p.institutionId, ownerId: user.id });
  const { skip, take, sp, q } = listParams(req, 500);
  const where = {
    programmeId: p.id,
    ...(user.role === "NOMINATOR" ? { nominatedById: user.id } : {}),
    ...(sp.get("status") ? { status: sp.get("status") as never } : {}),
    ...(q ? { trainee: { name: { contains: q, mode: "insensitive" as const } } } : {}),
  };
  const [items, total, approved] = await Promise.all([
    db.nomination.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "asc" },
      include: { trainee: { select: { id: true, name: true, traineeProfile: { select: { category: true, district: true, state: true, gender: true, cooperativeName: true } } } }, nominatedBy: { select: { name: true } } },
    }),
    db.nomination.count({ where }),
    db.nomination.count({ where: { programmeId: p.id, status: "APPROVED" } }),
  ]);
  return { items, total, approved, capacity: p.capacity };
});

/** Trainee self-nominates (empty body) or a nominator nominates an existing trainee by phone. */
export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["TRAINEE", "NOMINATOR"]);
  const input = await body(req, z.object({ phone: Phone.optional(), remarks: z.string().max(300).optional() }));
  if (user.role === "TRAINEE") {
    const profile = await db.traineeProfile.findUnique({ where: { userId: user.id } });
    if (!profile) throw new ApiError("CONFLICT", "Complete your profile first");
    return nominate(user, params.id, user.id, input.remarks);
  }
  if (!input.phone) throw new ApiError("VALIDATION", "Trainee phone is required", { phone: "required" });
  const trainee = await db.user.findFirst({ where: { phone: input.phone, role: "TRAINEE", deletedAt: null } });
  if (!trainee) throw new ApiError("NOT_FOUND", "No trainee with this phone. Use CSV import to create new trainees.");
  return nominate(user, params.id, trainee.id, input.remarks);
});
