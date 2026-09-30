import { z } from "zod";
import { body, route } from "@/lib/api";
import { Phone, requestOtp } from "@/lib/services/auth";

export const dynamic = "force-dynamic";

export const POST = route(async (req) => {
  const { phone } = await body(req, z.object({ phone: Phone }));
  return requestOtp(phone);
});
