/**
 * Integration tests against the real database (DATABASE_URL). Run with: pnpm test:int
 * Covers the PRD ACs that need Postgres: capacity is never exceeded under concurrent approvals,
 * waitlist auto-promotion, idempotent attendance replay, and CSV import speed (50 rows < 5 s).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { bulkDecide, decideNomination, importNominationsCsv, withdrawNomination } from "@/lib/services/nominations";
import { mark } from "@/lib/services/attendance";
import type { Actor } from "@/lib/rbac";

const tag = `T${Date.now().toString(36).toUpperCase()}`;
let admin: Actor;
let nominator: Actor;
let programmeId: string;
let traineeIds: string[] = [];

beforeAll(async () => {
  const inst = await db.institution.create({ data: { name: `Test ${tag}`, code: tag.slice(0, 8), type: "ICM", state: "Maharashtra", city: "Pune", address: "x" } });
  const a = await db.user.create({ data: { phone: `70${Date.now().toString().slice(-8)}`, name: "Admin", role: "INSTITUTE_ADMIN", institutionId: inst.id } });
  const n = await db.user.create({ data: { phone: `71${Date.now().toString().slice(-8)}`, name: "Nom", role: "NOMINATOR" } });
  admin = { id: a.id, role: a.role, institutionId: inst.id, status: "ACTIVE" };
  nominator = { id: n.id, role: n.role, status: "ACTIVE" };
  const p = await db.programme.create({
    data: {
      institutionId: inst.id, code: `${tag}-CAP`, title: "Capacity test", description: "x", targetCategories: ["FARMER"], mode: "IN_PERSON", status: "PUBLISHED",
      startDate: new Date(Date.now() + 10 * 864e5), endDate: new Date(Date.now() + 12 * 864e5), nominationDeadline: new Date(Date.now() + 5 * 864e5), capacity: 5, coordinatorId: a.id,
    },
  });
  programmeId = p.id;
  for (let i = 0; i < 12; i++) {
    const u = await db.user.create({ data: { phone: `72${String(Date.now() + i).slice(-8)}`, name: `Trainee ${i}`, role: "TRAINEE" } });
    traineeIds.push(u.id);
    await db.nomination.create({ data: { programmeId, traineeId: u.id, nominatedById: n.id, status: "SUBMITTED" } });
  }
});

afterAll(async () => {
  await db.$disconnect();
});

describe("nominations (DB)", () => {
  it("never exceeds capacity under concurrent approvals", async () => {
    const noms = await db.nomination.findMany({ where: { programmeId }, select: { id: true } });
    const results = await Promise.allSettled(noms.slice(0, 10).map((n) => decideNomination(admin, n.id, "APPROVED")));
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const approved = await db.nomination.count({ where: { programmeId, status: "APPROVED" } });
    const enrolled = await db.enrollment.count({ where: { programmeId } });
    expect(approved).toBe(5);
    expect(enrolled).toBe(5);
    expect(await db.nomination.count({ where: { programmeId, status: "WAITLISTED" } })).toBe(5);
  });

  it("bulk approve on a full programme waitlists the rest", async () => {
    const left = await db.nomination.findMany({ where: { programmeId, status: "SUBMITTED" }, select: { id: true } });
    const r = await bulkDecide(admin, left.map((x) => x.id), "APPROVED");
    expect(r.every((x) => x.status === "WAITLISTED")).toBe(true);
  });

  it("withdrawal auto-promotes the oldest waitlisted nomination", async () => {
    const approved = await db.nomination.findFirst({ where: { programmeId, status: "APPROVED" } });
    const oldestWait = await db.nomination.findFirst({ where: { programmeId, status: "WAITLISTED" }, orderBy: { createdAt: "asc" } });
    const r = await withdrawNomination(admin, approved!.id);
    expect(r.promoted).toBe(oldestWait!.id);
    expect(await db.nomination.count({ where: { programmeId, status: "APPROVED" } })).toBe(5);
  });

  it("imports a 50-row CSV in under 5 seconds with a per-row error report", async () => {
    const rows = ["name,phone,category,district,cooperativeName"];
    for (let i = 0; i < 50; i++) rows.push(`Person ${i},${i === 7 ? "123" : `6${String(Date.now()).slice(-6)}${String(i).padStart(3, "0")}`},FARMER,Pune,Test Coop`);
    const t0 = Date.now();
    const report = await importNominationsCsv(nominator, programmeId, rows.join("\n"));
    expect(Date.now() - t0).toBeLessThan(5000);
    expect(report.total).toBe(50);
    expect(report.created).toBe(49);
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0].row).toBe(9);
  });
});

describe("attendance idempotency (DB)", () => {
  it("replaying the same clientId twice is safe", async () => {
    const s = await db.session.create({ data: { programmeId, title: "S", facultyId: admin.id, room: "R", startsAt: new Date(), endsAt: new Date(Date.now() + 3600e3), qrSecret: "x" } });
    const enrolled = await db.enrollment.findFirst({ where: { programmeId } });
    const clientId = randomUUID();
    const a = await mark({ sessionId: s.id, traineeId: enrolled!.traineeId, method: "QR", clientId });
    const b = await mark({ sessionId: s.id, traineeId: enrolled!.traineeId, method: "QR", clientId });
    const c = await mark({ sessionId: s.id, traineeId: enrolled!.traineeId, method: "QR", clientId: randomUUID() });
    expect(a.duplicate).toBe(false);
    expect(b.duplicate).toBe(true);
    expect(c.duplicate).toBe(true);
    expect(await db.attendance.count({ where: { sessionId: s.id } })).toBe(1);
  });
});
