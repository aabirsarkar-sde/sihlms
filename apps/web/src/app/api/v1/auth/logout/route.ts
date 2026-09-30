import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const locale = req.cookies.get("NEXT_LOCALE")?.value ?? "en";
  const res = req.headers.get("accept")?.includes("application/json")
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(new URL(`/${locale}/login`, req.url), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
