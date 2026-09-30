import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { ProgressInput, saveProgress } from "@/lib/services/learning";

export const dynamic = "force-dynamic";

/** Accepts one record or a batch (offline replay). */
export const POST = route(async (req) => {
  const user = await requireUser(["TRAINEE"]);
  const input = await body(req, z.union([ProgressInput, z.object({ items: z.array(ProgressInput).max(500) })]));
  if ("items" in input) {
    const out = [];
    for (const i of input.items) out.push(await saveProgress(user, i));
    return { saved: out.length };
  }
  return saveProgress(user, input);
});
