import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { translateText } from "@/lib/ai";
import { lessonForEdit } from "@/lib/services/authoring";

export const dynamic = "force-dynamic";

/** Drafts a translation with the LLM. Nothing is saved: faculty review and edit before saving. */
export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  const l = await lessonForEdit(user, params.id);
  const { target } = await body(req, z.object({ target: z.enum(["hi", "mr"]) }));
  const [title, text] = await Promise.all([translateText(l.title, target), l.body ? translateText(l.body, target) : Promise.resolve("")]);
  if (title === null) throw new ApiError("UNAVAILABLE", "Auto-translate needs ANTHROPIC_API_KEY on the server. Type the translation manually.");
  return { target, title, body: text ?? "" };
});
