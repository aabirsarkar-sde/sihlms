import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { allocateRooms } from "@/lib/services/programmes";

export const dynamic = "force-dynamic";

export const POST = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["INSTITUTE_ADMIN"]);
  return allocateRooms(user, params.id);
});
