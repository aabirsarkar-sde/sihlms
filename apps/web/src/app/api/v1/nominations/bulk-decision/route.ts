import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { BulkDecisionInput } from "@/lib/schemas";
import { bulkDecide } from "@/lib/services/nominations";

export const dynamic = "force-dynamic";

export const POST = route(async (req) => {
  const user = await requireUser(["INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  const { ids, decision, remarks } = await body(req, BulkDecisionInput);
  const results = await bulkDecide(user, ids, decision, remarks);
  return { results, approved: results.filter((r) => r.status === "APPROVED").length, waitlisted: results.filter((r) => r.status === "WAITLISTED").length };
});
