import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { authorize } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { JobInput } from "@/lib/schemas";

export const dynamic = "force-dynamic";

async function load(id: string) {
  const j = await db.job.findFirst({ where: { id, deletedAt: null } });
  if (!j) throw notFound("Job");
  return j;
}

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser();
  authorize(user, "read", "job");
  return load(params.id);
});

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["EMPLOYER", "SUPER_ADMIN"]);
  const j = await load(params.id);
  authorize(user, "update", "job", { ownerId: j.employerId });
  const data = user.role === "SUPER_ADMIN" ? await body(req, z.object({ hidden: z.boolean() })) : await body(req, JobInput.partial());
  const updated = await db.job.update({ where: { id: j.id }, data });
  await audit(user.id, user.role === "SUPER_ADMIN" ? "job.moderate" : "job.update", "Job", j.id, data as never);
  return updated;
});

export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["EMPLOYER"]);
  const j = await load(params.id);
  authorize(user, "delete", "job", { ownerId: j.employerId });
  await db.job.update({ where: { id: j.id }, data: { deletedAt: new Date() } });
  await audit(user.id, "job.delete", "Job", j.id, {});
  return { ok: true };
});
