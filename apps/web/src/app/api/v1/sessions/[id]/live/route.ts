import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { authorize } from "@/lib/rbac";
import { liveCount } from "@/lib/services/attendance";

export const dynamic = "force-dynamic";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  const s = await db.session.findUnique({ where: { id: params.id }, select: { programme: { select: { institutionId: true } } } });
  if (!s) throw notFound("Session");
  authorize(user, "read", "attendance", { institutionId: s.programme.institutionId });
  return NextResponse.json(await liveCount(params.id), { headers: { "Cache-Control": "no-store" } });
});
