import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { ROLE_HOME, SESSION_COOKIE, verifySession } from "./lib/session";

const intl = createMiddleware(routing);

const AREAS: Record<string, string[]> = {
  admin: ["SUPER_ADMIN", "INSTITUTE_ADMIN"],
  faculty: ["FACULTY", "INSTITUTE_ADMIN"],
  learn: ["TRAINEE"],
  nominator: ["NOMINATOR"],
  employer: ["EMPLOYER"],
};

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const m = pathname.match(/^\/(en|hi|mr)\/(admin|faculty|learn|nominator|employer)(\/|$)/);
  if (m) {
    const [, locale, area] = m;
    const claims = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!claims) {
      const url = new URL(`/${locale}/login`, req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (!AREAS[area].includes(claims.role)) {
      return NextResponse.redirect(new URL(`/${locale}${ROLE_HOME[claims.role]}`, req.url));
    }
  }
  return intl(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|sw.js|manifest.webmanifest|icons|offline.html|.*\\..*).*)"],
};
