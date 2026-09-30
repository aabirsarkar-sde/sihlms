import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { currentQr } from "@/lib/services/attendance";

export const dynamic = "force-dynamic";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN"]);
  const qr = await currentQr(user, params.id);
  return NextResponse.json(qr, { headers: { "Cache-Control": "no-store" } });
});
