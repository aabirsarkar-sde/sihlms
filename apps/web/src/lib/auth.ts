import "server-only";
import { cookies } from "next/headers";
import type { Role, User } from "@prisma/client";
import { db } from "./db";
import { ApiError } from "./errors";
import { SESSION_COOKIE, SESSION_TTL_S, signSession, verifySession } from "./session";

export type AuthUser = Pick<User, "id" | "name" | "role" | "institutionId" | "status" | "locale" | "phone">;

export async function getCurrentUser(): Promise<AuthUser | null> {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!claims) return null;
  const user = await db.user.findFirst({
    where: { id: claims.sub, deletedAt: null },
    select: { id: true, name: true, role: true, institutionId: true, status: true, locale: true, phone: true },
  });
  if (!user || user.status === "SUSPENDED") return null;
  return user;
}

export async function requireUser(roles?: Role[]): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError("UNAUTHORIZED", "Please sign in");
  if (roles && !roles.includes(user.role)) throw new ApiError("FORBIDDEN", "Your role cannot do this");
  return user;
}

export async function startSession(user: Pick<User, "id" | "role" | "institutionId" | "name">) {
  const token = await signSession({ sub: user.id, role: user.role, inst: user.institutionId, name: user.name });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !process.env.INSECURE_COOKIES,
    path: "/",
    maxAge: SESSION_TTL_S,
  });
}

export function endSession() {
  cookies().delete(SESSION_COOKIE);
}
