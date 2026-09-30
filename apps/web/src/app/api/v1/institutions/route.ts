import { body, listParams, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { authorize } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { InstitutionInput } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  const user = await requireUser();
  authorize(user, "read", "institution");
  const { skip, take, q } = listParams(req);
  const where = q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { code: { contains: q.toUpperCase() } }] } : {};
  const [items, total] = await Promise.all([db.institution.findMany({ where, skip, take, orderBy: { name: "asc" } }), db.institution.count({ where })]);
  return { items, total };
});

export const POST = route(async (req) => {
  const user = await requireUser();
  authorize(user, "create", "institution");
  const data = await body(req, InstitutionInput);
  const inst = await db.institution.create({ data });
  await audit(user.id, "institution.create", "Institution", inst.id, data);
  return inst;
});
