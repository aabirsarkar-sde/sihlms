import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { deleteSession, SessionInput, updateSession } from "@/lib/services/programmes";

export const dynamic = "force-dynamic";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["INSTITUTE_ADMIN", "FACULTY"]);
  const input = await body(req, SessionInput.partial());
  const { qrSecret: _s, ...rest } = await updateSession(user, params.id, input);
  return rest;
});

export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["INSTITUTE_ADMIN", "FACULTY"]);
  return deleteSession(user, params.id);
});
