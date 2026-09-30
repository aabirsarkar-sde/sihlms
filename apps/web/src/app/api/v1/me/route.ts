import { NextResponse } from "next/server";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";
import { traineeQr } from "@/lib/qr";
import { deleteMyAccount, getMe, MePatch, updateMe } from "@/lib/services/profile";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  const me = await getMe(user.id);
  return { ...me, traineeQr: user.role === "TRAINEE" ? traineeQr(user.id) : undefined };
});

export const PATCH = route(async (req) => {
  const user = await requireUser();
  return updateMe(user, await body(req, MePatch));
});

export const DELETE = route(async () => {
  const user = await requireUser();
  await deleteMyAccount(user.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
});
