import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { authorize } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { loadProgrammeFor, mealCounts } from "@/lib/services/programmes";

export const dynamic = "force-dynamic";

const Item = z.object({ label: z.string().min(1), done: z.boolean(), note: z.string().optional() });

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["INSTITUTE_ADMIN", "SUPER_ADMIN", "FACULTY"]);
  const p = await loadProgrammeFor(user, params.id);
  authorize(user, "read", "hostel", { institutionId: p.institutionId });
  const [items, meals] = await Promise.all([db.logisticsItem.findMany({ where: { programmeId: p.id }, orderBy: { kind: "asc" } }), mealCounts(p.id)]);
  return { items, meals };
});

/** Replaces the checklist: [{ kind: TRAVEL|MEALS|KITS, items: [...] }] */
export const PUT = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["INSTITUTE_ADMIN"]);
  const p = await loadProgrammeFor(user, params.id);
  authorize(user, "update", "hostel", { institutionId: p.institutionId });
  const { groups } = await body(req, z.object({ groups: z.array(z.object({ kind: z.enum(["TRAVEL", "MEALS", "KITS"]), items: z.array(Item) })) }));
  const meals = await mealCounts(p.id);
  await db.$transaction([
    db.logisticsItem.deleteMany({ where: { programmeId: p.id } }),
    db.logisticsItem.createMany({ data: groups.map((g) => ({ programmeId: p.id, kind: g.kind, details: g.kind === "MEALS" ? { items: g.items, veg: meals.veg, nonVeg: meals.nonVeg } : { items: g.items } })) }),
  ]);
  await audit(user.id, "logistics.update", "Programme", p.id, { groups: groups.length });
  return { ok: true, meals };
});
