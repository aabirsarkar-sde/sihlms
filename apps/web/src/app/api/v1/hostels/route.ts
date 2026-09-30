import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { authorize } from "@/lib/rbac";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  const user = await requireUser(["SUPER_ADMIN", "INSTITUTE_ADMIN", "FACULTY"]);
  const institutionId = user.role === "SUPER_ADMIN" ? req.nextUrl.searchParams.get("institutionId") : user.institutionId;
  if (!institutionId) throw new ApiError("BAD_REQUEST", "institutionId is required");
  authorize(user, "read", "hostel", { institutionId });
  const items = await db.hostel.findMany({ where: { institutionId }, include: { rooms: { orderBy: { number: "asc" }, include: { allocations: { where: { checkOut: null }, include: { trainee: { select: { name: true } }, programme: { select: { code: true } } } } } } } });
  return { items, total: items.length };
});

/** Create a hostel with N rooms of B beds. */
export const POST = route(async (req) => {
  const user = await requireUser(["INSTITUTE_ADMIN"]);
  authorize(user, "create", "hostel", { institutionId: user.institutionId });
  const input = await body(req, z.object({ name: z.string().min(2), gender: z.enum(["M", "F", "ANY"]), rooms: z.number().int().min(1).max(200), beds: z.number().int().min(1).max(12), prefix: z.string().max(3).default("R") }));
  const h = await db.hostel.create({
    data: { institutionId: user.institutionId!, name: input.name, gender: input.gender, rooms: { create: Array.from({ length: input.rooms }, (_, i) => ({ number: `${input.prefix}-${String(i + 1).padStart(2, "0")}`, beds: input.beds })) } },
  });
  await audit(user.id, "hostel.create", "Hostel", h.id, input);
  return h;
});
