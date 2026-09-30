import { NextResponse, type NextRequest } from "next/server";
import { closeProgrammes, reindexChunks, runDueJobs } from "@/lib/jobs-queue";

export const dynamic = "force-dynamic";

/**
 * Runs due jobs from the DB-backed queue plus housekeeping.
 * - docker compose: the `cron` service POSTs every minute.
 * - Vercel Cron: GETs on the schedule in vercel.json and sends `Authorization: Bearer $CRON_SECRET` automatically.
 */
async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Bad cron secret" } }, { status: 401 });
  const jobs = await runDueJobs();
  const programmes = await closeProgrammes();
  // Rebuild chatbot chunks every 15 min on the minutely compose loop; on every run when called less often (Vercel Hobby = daily).
  const chunks = process.env.VERCEL || new Date().getMinutes() % 15 === 0 ? await reindexChunks() : null;
  return NextResponse.json({ ok: true, jobs, programmes, chunks });
}

export const GET = run;
export const POST = run;
