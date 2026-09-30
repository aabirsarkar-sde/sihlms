import { z } from "zod";
import { body, route } from "@/lib/api";
import { startSession } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/session";
import { Phone, registrationToken, verifyOtp } from "@/lib/services/auth";
import { ApiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const POST = route(async (req) => {
  const { phone, code } = await body(req, z.object({ phone: Phone, code: z.string().regex(/^\d{6}$/, "6 digits") }));
  const user = await verifyOtp(phone, code);
  if (!user) return { needsRegistration: true, token: await registrationToken(phone) };
  if (user.status === "SUSPENDED") throw new ApiError("FORBIDDEN", "This account is suspended");
  await startSession(user);
  return { user: { id: user.id, name: user.name, role: user.role, locale: user.locale }, home: ROLE_HOME[user.role] };
});
