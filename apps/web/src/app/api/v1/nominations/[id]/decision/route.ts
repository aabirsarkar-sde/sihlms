import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { DecisionInput } from "@/lib/schemas";
import { decideNomination } from "@/lib/services/nominations";

export const dynamic = "force-dynamic";

export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  const { decision, remarks } = await body(req, DecisionInput);
  return decideNomination(user, params.id, decision, remarks);
});
