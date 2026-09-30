import { randomInt } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { db } from "../db";
import { ApiError } from "../errors";
import { audit } from "../audit";
import { sendSms } from "../notify";

export const DEV_OTP = "123456";
const OTP_TTL_MS = 5 * 60_000;
const OTP_PER_HOUR = 5;
const devMode = () => process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "true";

export const Phone = z
  .string()
  .transform((s) => s.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, ""))
  .refine((s) => /^[6-9]\d{9}$/.test(s), "Enter a 10-digit mobile number");

/** Rate-limited: 5 OTP requests per phone per hour. OTP is always 123456 in dev / demo mode. */
export async function requestOtp(phone: string) {
  const since = new Date(Date.now() - 60 * 60_000);
  const recent = await db.otpRequest.count({ where: { phone, createdAt: { gte: since } } });
  // The fixed demo logins are exempt in demo mode so repeated sign-ins on stage never lock anyone out.
  const demoPhone = devMode() && /^900000000[1-7]$/.test(phone);
  if (!demoPhone && recent >= OTP_PER_HOUR) throw new ApiError("RATE_LIMITED", "Too many OTP requests. Try again in an hour.");
  const code = devMode() ? DEV_OTP : String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.otpRequest.create({ data: { phone, code, expiresAt: new Date(Date.now() + OTP_TTL_MS) } });
  sendSms(phone, `Your Sahakar Setu OTP is ${code}. It expires in 5 minutes.`);
  return { sent: true, devHint: devMode() ? DEV_OTP : undefined };
}

const failures = new Map<string, { n: number; until: number }>();
function checkLoginRate(key: string) {
  const f = failures.get(key);
  if (f && f.until > Date.now() && f.n >= 5) throw new ApiError("RATE_LIMITED", "Too many attempts. Wait 15 minutes.");
}
function recordFailure(key: string) {
  const f = failures.get(key);
  const until = Date.now() + 15 * 60_000;
  failures.set(key, { n: f && f.until > Date.now() ? f.n + 1 : 1, until });
}

export async function verifyOtp(phone: string, code: string) {
  checkLoginRate(`otp:${phone}`);
  const otp = await db.otpRequest.findFirst({ where: { phone, usedAt: null, expiresAt: { gte: new Date() } }, orderBy: { createdAt: "desc" } });
  if (!otp || otp.code !== code) {
    recordFailure(`otp:${phone}`);
    throw new ApiError("BAD_REQUEST", "Incorrect or expired OTP");
  }
  await db.otpRequest.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
  failures.delete(`otp:${phone}`);
  const user = await db.user.findFirst({ where: { phone, deletedAt: null } });
  return user;
}

export async function passwordLogin(phone: string, password: string) {
  checkLoginRate(`pw:${phone}`);
  const user = await db.user.findFirst({ where: { phone, deletedAt: null } });
  const { verify } = await import("@node-rs/argon2");
  if (!user?.passwordHash || !(await verify(user.passwordHash, password))) {
    recordFailure(`pw:${phone}`);
    throw new ApiError("UNAUTHORIZED", "Wrong phone or password");
  }
  return user;
}

const regKey = () => new TextEncoder().encode(`${process.env.AUTH_SECRET ?? "dev"}:register`);
export async function registrationToken(phone: string) {
  return new SignJWT({ phone }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("20m").sign(regKey());
}
export async function phoneFromRegistrationToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, regKey());
    return String(payload.phone);
  } catch {
    throw new ApiError("UNAUTHORIZED", "Registration session expired. Verify your phone again.");
  }
}

export const RegisterInput = z.discriminatedUnion("role", [
  z.object({ role: z.literal("TRAINEE"), token: z.string(), name: z.string().trim().min(2), consent: z.literal(true), locale: z.string().default("en") }),
  z.object({ role: z.literal("NOMINATOR"), token: z.string(), name: z.string().trim().min(2), consent: z.literal(true), locale: z.string().default("en"), orgName: z.string().trim().min(2) }),
  z.object({
    role: z.literal("EMPLOYER"),
    token: z.string(),
    name: z.string().trim().min(2),
    consent: z.literal(true),
    locale: z.string().default("en"),
    orgName: z.string().trim().min(2),
    orgType: z.string().trim().min(2),
    state: z.string().min(2),
    district: z.string().min(2),
    gstin: z
      .string()
      .trim()
      .optional()
      .refine((g) => !g || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g), "Invalid GSTIN"),
  }),
]);

export async function register(input: z.infer<typeof RegisterInput>) {
  const phone = await phoneFromRegistrationToken(input.token);
  if (await db.user.findUnique({ where: { phone } })) throw new ApiError("CONFLICT", "This phone is already registered");
  const user = await db.user.create({
    data: {
      phone,
      name: input.name,
      role: input.role,
      locale: input.locale,
      status: input.role === "EMPLOYER" ? "PENDING" : "ACTIVE",
      ...(input.role === "EMPLOYER"
        ? { employerProfile: { create: { orgName: input.orgName, orgType: input.orgType, state: input.state, district: input.district, gstin: input.gstin || null } } }
        : {}),
    },
  });
  await audit(user.id, "user.register", "User", user.id, { role: input.role, consentAt: new Date().toISOString(), orgName: "orgName" in input ? input.orgName : undefined });
  return user;
}
