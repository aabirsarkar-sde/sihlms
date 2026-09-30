import type { Prisma } from "@prisma/client";
import { body, listParams, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { authorize } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { JobInput } from "@/lib/schemas";
import { districtCoords } from "@/lib/geo";
import { jobsForTrainee } from "@/lib/services/jobs";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  const user = await requireUser();
  authorize(user, "read", "job");
  const { skip, take, q, sp } = listParams(req);
  if (user.role === "TRAINEE" && sp.get("ranked") === "1") {
    const items = await jobsForTrainee(user.id, take);
    return { items, total: items.length };
  }
  const where: Prisma.JobWhereInput = {
    deletedAt: null,
    ...(user.role === "EMPLOYER" ? { employerId: user.id } : user.role === "SUPER_ADMIN" ? {} : { hidden: false, closesAt: { gte: new Date() } }),
    ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    ...(sp.get("state") ? { state: sp.get("state")! } : {}),
  };
  const [items, total] = await Promise.all([
    db.job.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, include: { _count: { select: { applications: true } }, employer: { select: { employerProfile: { select: { orgName: true } } } } } }),
    db.job.count({ where }),
  ]);
  return { items, total };
});

export const POST = route(async (req) => {
  const user = await requireUser(["EMPLOYER"]);
  authorize(user, "create", "job");
  const input = await body(req, JobInput);
  const c = districtCoords(input.state, input.district);
  const job = await db.job.create({ data: { ...input, employerId: user.id, lat: c?.[0], lng: c?.[1] } });
  await audit(user.id, "job.create", "Job", job.id, { title: job.title });
  return job;
});
