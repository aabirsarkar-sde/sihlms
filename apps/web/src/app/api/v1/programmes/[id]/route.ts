import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { ProgrammeInput } from "@/lib/schemas";
import { loadProgrammeFor } from "@/lib/services/programmes";
import { z } from "zod";

export const dynamic = "force-dynamic";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser();
  await loadProgrammeFor(user, params.id, "read");
  return db.programme.findUnique({
    where: { id: params.id },
    include: { institution: true, course: { select: { id: true, title: true } }, coordinator: { select: { id: true, name: true } }, _count: { select: { enrollments: true, nominations: true, sessions: true } } },
  });
});

const Patch = ProgrammeInput.innerType().innerType().partial().extend({ status: z.enum(["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"]).optional() });

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser();
  const p = await loadProgrammeFor(user, params.id, "update");
  const data = await body(req, Patch);
  if (user.role === "FACULTY") {
    // Assigned faculty may only edit descriptive fields
    const allowed = ["description", "title"];
    if (Object.keys(data).some((k) => !allowed.includes(k))) throw new ApiError("FORBIDDEN", "Faculty can only edit title and description");
  }
  const { institutionId: _ignore, ...rest } = data;
  const updated = await db.programme.update({ where: { id: p.id }, data: { ...rest, targetCategories: rest.targetCategories as never } });
  await audit(user.id, "programme.update", "Programme", p.id, rest as never);
  return updated;
});

export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser();
  const p = await loadProgrammeFor(user, params.id, "delete");
  await db.programme.update({ where: { id: p.id }, data: { deletedAt: new Date(), status: "CANCELLED" } });
  await audit(user.id, "programme.delete", "Programme", p.id, {});
  return { ok: true };
});
