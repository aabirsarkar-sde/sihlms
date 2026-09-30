import { listParams, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { candidatesForJob } from "@/lib/services/jobs";

export const dynamic = "force-dynamic";

export const GET = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["EMPLOYER"]);
  const { sp, page, pageSize } = listParams(req);
  return candidatesForJob(user, params.id, {
    state: sp.get("state") ?? undefined,
    district: sp.get("district") ?? undefined,
    category: sp.get("category") ?? undefined,
    skill: sp.get("skill") ?? undefined,
    certificate: sp.get("certificate") ?? undefined,
    page,
    pageSize,
  });
});
