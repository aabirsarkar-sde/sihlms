import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { exportMyData } from "@/lib/services/profile";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  const data = await exportMyData(user.id);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="sahakar-setu-my-data.json"` },
  });
});
