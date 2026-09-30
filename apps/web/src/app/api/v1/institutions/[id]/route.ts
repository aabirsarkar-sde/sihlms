import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { authorize } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { InstitutionInput } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser();
  authorize(user, "read", "institution");
  const inst = await db.institution.findUnique({ where: { id: params.id } });
  if (!inst) throw notFound("Institution");
  return inst;
});

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser();
  authorize(user, "update", "institution", { institutionId: params.id });
  const data = await body(req, InstitutionInput.partial().omit(user.role === "SUPER_ADMIN" ? {} : { code: true, type: true }));
  const inst = await db.institution.update({ where: { id: params.id }, data });
  await audit(user.id, "institution.update", "Institution", inst.id, data);
  return inst;
});
