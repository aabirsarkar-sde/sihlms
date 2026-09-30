import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { revokeCertificate } from "@/lib/services/certificates";

export const dynamic = "force-dynamic";

export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["SUPER_ADMIN"]);
  const { reason } = await body(req, z.object({ reason: z.string().trim().min(5) }));
  return revokeCertificate(user, params.id, reason);
});
