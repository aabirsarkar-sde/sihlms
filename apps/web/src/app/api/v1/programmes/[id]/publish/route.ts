import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { loadProgrammeFor } from "@/lib/services/programmes";

export const dynamic = "force-dynamic";

export const POST = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  const p = await loadProgrammeFor(user, params.id, "update");
  if (p.status !== "DRAFT") throw new ApiError("CONFLICT", "Only draft programmes can be published");
  const updated = await db.programme.update({ where: { id: p.id }, data: { status: "PUBLISHED" } });
  await audit(user.id, "programme.publish", "Programme", p.id, {});
  return updated;
});
