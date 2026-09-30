import { z } from "zod";
import { body, route } from "@/lib/api";
import { startSession } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/session";
import { passwordLogin, Phone } from "@/lib/services/auth";

export const dynamic = "force-dynamic";

export const POST = route(async (req) => {
  const { phone, password } = await body(req, z.object({ phone: Phone, password: z.string().min(1) }));
  const user = await passwordLogin(phone, password);
  await startSession(user);
  return { user: { id: user.id, name: user.name, role: user.role }, home: ROLE_HOME[user.role] };
});
