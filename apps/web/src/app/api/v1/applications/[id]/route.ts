import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { moveApplication } from "@/lib/services/jobs";

export const dynamic = "force-dynamic";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["EMPLOYER"]);
  const { status } = await body(req, z.object({ status: z.enum(["APPLIED", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"]) }));
  return moveApplication(user, params.id, status);
});
