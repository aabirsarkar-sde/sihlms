// Edge-safe session token helpers (used by middleware and server code).
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";

export const SESSION_COOKIE = "ss_session";
export const SESSION_TTL_S = 60 * 60 * 24 * 7;

export type SessionClaims = { sub: string; role: Role; inst?: string | null; name: string };

const key = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret-change-me-0123456789abcdef0123");

export async function signSession(c: SessionClaims): Promise<string> {
  return new SignJWT({ role: c.role, inst: c.inst ?? null, name: c.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(c.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_S}s`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return {
      sub: String(payload.sub),
      role: payload.role as Role,
      inst: (payload.inst as string | null) ?? null,
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}

export const ROLE_HOME: Record<Role, string> = {
  SUPER_ADMIN: "/admin",
  INSTITUTE_ADMIN: "/admin",
  FACULTY: "/faculty",
  TRAINEE: "/learn",
  NOMINATOR: "/nominator",
  EMPLOYER: "/employer",
};
