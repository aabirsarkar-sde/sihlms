import "server-only";
import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getCurrentUser, type AuthUser } from "./auth";
import { ROLE_HOME } from "./session";

/** For server pages: returns the signed-in user with one of `roles`, else redirects to login / own home. */
export async function pageUser(roles?: Role[]): Promise<AuthUser> {
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (roles && !roles.includes(user.role)) redirect(`/${locale}${ROLE_HOME[user.role]}`);
  return user;
}

export type SP = Record<string, string | string[] | undefined>;
export const sp1 = (sp: SP, k: string) => {
  const v = sp[k];
  return (Array.isArray(v) ? v[0] : v) || undefined;
};
