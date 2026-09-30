import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { sendSms } from "./notify";

/** DB-backed job table. Enqueue here; /api/v1/cron runs due jobs (poll it every minute from any scheduler). */
export async function enqueueJob(kind: "SMS" | "REINDEX_CHUNKS" | "CLOSE_PROGRAMMES", payload: Prisma.InputJsonValue = {}, runAt = new Date()) {
  return db.jobQueue.create({ data: { kind, payload, runAt } });
}

async function reindexChunks() {
  const [jobs, programmes] = await Promise.all([
    db.job.findMany({ where: { deletedAt: null, hidden: false, closesAt: { gte: new Date() } } }),
    db.programme.findMany({ where: { deletedAt: null, status: "PUBLISHED" }, include: { institution: { select: { name: true, city: true } } } }),
  ]);
  await db.$transaction([
    db.contentChunk.deleteMany({ where: { sourceType: { in: ["JOB", "PROGRAMME"] } } }),
    db.contentChunk.createMany({
      data: [
        ...jobs.map((j) => ({ sourceType: "JOB", sourceId: j.id, text: `Job: ${j.title} in ${j.district}, ${j.state}. Skills: ${j.requiredSkills.join(", ")}. Salary ₹${j.salaryMin ?? "?"}–₹${j.salaryMax ?? "?"} per month.` })),
        ...programmes.map((p) => ({ sourceType: "PROGRAMME", sourceId: p.id, text: `Programme: ${p.title} (${p.code}) at ${p.institution.name}, ${p.institution.city}. Starts ${p.startDate.toDateString()}.` })),
      ],
    }),
  ]);
  return { jobs: jobs.length, programmes: programmes.length };
}

/** Moves programme status along the calendar: PUBLISHED → ONGOING → COMPLETED. */
async function closeProgrammes() {
  const now = new Date();
  const a = await db.programme.updateMany({ where: { status: "PUBLISHED", startDate: { lte: now }, deletedAt: null }, data: { status: "ONGOING" } });
  const b = await db.programme.updateMany({ where: { status: "ONGOING", endDate: { lt: now }, deletedAt: null }, data: { status: "COMPLETED" } });
  return { started: a.count, completed: b.count };
}

export async function runDueJobs(limit = 50) {
  const due = await db.jobQueue.findMany({ where: { doneAt: null, runAt: { lte: new Date() }, attempts: { lt: 5 } }, orderBy: { runAt: "asc" }, take: limit });
  const results: { id: string; kind: string; ok: boolean }[] = [];
  for (const j of due) {
    try {
      if (j.kind === "SMS") {
        const p = j.payload as { phone: string; text: string };
        sendSms(p.phone, p.text);
      } else if (j.kind === "REINDEX_CHUNKS") await reindexChunks();
      else if (j.kind === "CLOSE_PROGRAMMES") await closeProgrammes();
      await db.jobQueue.update({ where: { id: j.id }, data: { doneAt: new Date(), attempts: { increment: 1 } } });
      results.push({ id: j.id, kind: j.kind, ok: true });
    } catch (e) {
      await db.jobQueue.update({ where: { id: j.id }, data: { attempts: { increment: 1 }, error: e instanceof Error ? e.message : String(e), runAt: new Date(Date.now() + 60_000) } });
      results.push({ id: j.id, kind: j.kind, ok: false });
    }
  }
  return results;
}

export { closeProgrammes, reindexChunks };
