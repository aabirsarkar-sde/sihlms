import { body, route } from "@/lib/api";
import { startSession } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/session";
import { register, RegisterInput } from "@/lib/services/auth";

export const dynamic = "force-dynamic";

export const POST = route(async (req) => {
  const input = await body(req, RegisterInput);
  const user = await register(input);
  await startSession(user);
  return { user: { id: user.id, name: user.name, role: user.role, status: user.status }, home: user.role === "TRAINEE" ? "/learn/profile/setup" : ROLE_HOME[user.role] };
});
