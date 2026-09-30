import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

/** SUPER_ADMIN verifies (or rejects) a self-registered employer. */
export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["SUPER_ADMIN"]);
  const { approve } = await body(req, z.object({ approve: z.boolean() }));
  const emp = await db.user.findFirst({ where: { id: params.id, role: "EMPLOYER" } });
  if (!emp) throw notFound("Employer");
  await db.$transaction([
    db.user.update({ where: { id: emp.id }, data: { status: approve ? "ACTIVE" : "SUSPENDED" } }),
    db.employerProfile.update({ where: { userId: emp.id }, data: { verifiedAt: approve ? new Date() : null } }),
  ]);
  await audit(user.id, approve ? "employer.verify" : "employer.reject", "User", emp.id, {});
  await notify(emp.id, approve ? "Account verified" : "Verification declined", approve ? "You can now search certified trainees." : "Contact NCCT for details.", undefined, "SMS");
  return { ok: true };
});
