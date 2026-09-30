import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { withdrawNomination } from "@/lib/services/nominations";

export const dynamic = "force-dynamic";

export const POST = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["TRAINEE", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  return withdrawNomination(user, params.id);
});
