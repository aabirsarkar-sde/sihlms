import { NextResponse, type NextRequest } from "next/server";
import { closeProgrammes, reindexChunks, runDueJobs } from "@/lib/jobs-queue";

export const dynamic = "force-dynamic";

/** Poll every minute (docker compose ships a tiny curl loop). Protected by CRON_SECRET when set. */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Bad cron secret" } }, { status: 401 });
  const jobs = await runDueJobs();
  // Periodic housekeeping, cheap enough to run every tick.
  const programmes = await closeProgrammes();
  const minute = new Date().getMinutes();
  const chunks = minute % 15 === 0 ? await reindexChunks() : null;
  return NextResponse.json({ ok: true, jobs, programmes, chunks });
}
