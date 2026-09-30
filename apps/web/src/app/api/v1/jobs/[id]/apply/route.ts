import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { applyToJob } from "@/lib/services/jobs";

export const dynamic = "force-dynamic";

export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["TRAINEE"]);
  const { coverNote } = await body(req, z.object({ coverNote: z.string().max(500).optional() }));
  return applyToJob(user, params.id, coverNote);
});
