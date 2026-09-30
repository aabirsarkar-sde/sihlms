import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "../db";
import { ApiError, notFound } from "../errors";
import { audit } from "../audit";
import { authorize, type Actor } from "../rbac";
import { findClash } from "./clash";
import { planAllocation } from "./allocation";

export async function loadProgrammeFor(actor: Actor, id: string, action: "read" | "update" | "delete" = "read") {
  const p = await db.programme.findFirst({ where: { id, deletedAt: null } });
  if (!p) throw notFound("Programme");
  authorize(actor, action, "programme", {
    institutionId: p.institutionId,
    published: p.status !== "DRAFT" && p.status !== "CANCELLED",
    assigned: p.coordinatorId === actor.id,
  });
  return p;
}

export const SessionInput = z.object({
  title: z.string().min(2),
  facultyId: z.string(),
  room: z.string().min(1),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

/** Checks faculty and room clashes across the whole institution; refuses to save and names the clash. */
async function assertNoClash(institutionId: string, slot: z.infer<typeof SessionInput> & { id?: string }) {
  if (slot.endsAt <= slot.startsAt) throw new ApiError("VALIDATION", "End time must be after start time", { endsAt: "after start" });
  const nearby = await db.session.findMany({
    where: {
      programme: { institutionId },
      startsAt: { lt: slot.endsAt },
      endsAt: { gt: slot.startsAt },
      ...(slot.id ? { id: { not: slot.id } } : {}),
    },
    include: { faculty: { select: { name: true } }, programme: { select: { code: true } } },
  });
  const clash = findClash(slot, nearby);
  if (clash) {
    const w = nearby.find((n) => n.id === clash.with.id)!;
    const time = `${w.startsAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}–${w.endsAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}`;
    const msg =
      clash.kind === "FACULTY"
        ? `Clash: ${w.faculty.name} is already teaching "${w.title}" (${w.programme.code}) at ${time}`
        : `Clash: room ${w.room} is already booked for "${w.title}" (${w.programme.code}) at ${time}`;
    throw new ApiError("CONFLICT", msg, { [clash.kind === "FACULTY" ? "facultyId" : "room"]: msg });
  }
}

export async function createSession(actor: Actor, programmeId: string, input: z.infer<typeof SessionInput>) {
  const p = await db.programme.findFirst({ where: { id: programmeId, deletedAt: null } });
  if (!p) throw notFound("Programme");
  authorize(actor, "create", "session", { institutionId: p.institutionId, assigned: p.coordinatorId === actor.id || input.facultyId === actor.id });
  const faculty = await db.user.findFirst({ where: { id: input.facultyId, institutionId: p.institutionId, role: { in: ["FACULTY", "INSTITUTE_ADMIN"] } } });
  if (!faculty) throw new ApiError("VALIDATION", "Faculty must belong to this institution", { facultyId: "invalid" });
  await assertNoClash(p.institutionId, input);
  const s = await db.session.create({ data: { ...input, programmeId, qrSecret: randomBytes(24).toString("hex") } });
  await audit(actor.id, "session.create", "Session", s.id, input as never);
  return s;
}

export async function updateSession(actor: Actor, sessionId: string, input: Partial<z.infer<typeof SessionInput>>) {
  const s = await db.session.findUnique({ where: { id: sessionId }, include: { programme: true } });
  if (!s) throw notFound("Session");
  authorize(actor, "update", "session", { institutionId: s.programme.institutionId, assigned: s.facultyId === actor.id || s.programme.coordinatorId === actor.id });
  const next = { title: s.title, facultyId: s.facultyId, room: s.room, startsAt: s.startsAt, endsAt: s.endsAt, ...input };
  await assertNoClash(s.programme.institutionId, { ...next, id: s.id });
  const updated = await db.session.update({ where: { id: sessionId }, data: input });
  await audit(actor.id, "session.update", "Session", s.id, input as never);
  return updated;
}

export async function deleteSession(actor: Actor, sessionId: string) {
  const s = await db.session.findUnique({ where: { id: sessionId }, include: { programme: true, _count: { select: { attendances: true } } } });
  if (!s) throw notFound("Session");
  authorize(actor, "delete", "session", { institutionId: s.programme.institutionId, assigned: s.facultyId === actor.id || s.programme.coordinatorId === actor.id });
  if (s._count.attendances > 0) throw new ApiError("CONFLICT", "Session already has attendance and cannot be deleted");
  await db.session.delete({ where: { id: sessionId } });
  await audit(actor.id, "session.delete", "Session", s.id, { title: s.title });
  return { ok: true };
}

/** Auto-allocate hostel rooms by gender for enrolled trainees who have no room yet; considers overlapping programmes. */
export async function allocateRooms(actor: Actor, programmeId: string) {
  const p = await db.programme.findFirst({ where: { id: programmeId, deletedAt: null } });
  if (!p) throw notFound("Programme");
  authorize(actor, "create", "hostel", { institutionId: p.institutionId });
  if (p.mode === "ONLINE") throw new ApiError("CONFLICT", "Online programmes do not need hostel rooms");
  return db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Programme" WHERE id = ${programmeId} FOR UPDATE`;
      const enrolled = await tx.enrollment.findMany({
        where: { programmeId, trainee: { allocations: { none: { programmeId } } } },
        include: { trainee: { select: { id: true, traineeProfile: { select: { gender: true } } } } },
        orderBy: { createdAt: "asc" },
      });
      const rooms = await tx.room.findMany({
        where: { hostel: { institutionId: p.institutionId } },
        include: {
          hostel: { select: { gender: true, name: true } },
          allocations: {
            where: { checkOut: null, programme: { startDate: { lte: p.endDate }, endDate: { gte: p.startDate } } },
            select: { id: true },
          },
        },
      });
      const plan = planAllocation(
        enrolled.map((e) => ({ id: e.traineeId, gender: e.trainee.traineeProfile?.gender ?? "U" })),
        rooms.map((r) => ({ id: r.id, gender: r.hostel.gender, beds: r.beds, occupied: r.allocations.length, label: `${r.hostel.name} ${r.number}` })),
      );
      if (plan.assignments.length) {
        await tx.roomAllocation.createMany({ data: plan.assignments.map((a) => ({ ...a, programmeId })) });
      }
      await audit(actor.id, "hostel.allocate", "Programme", programmeId, { allocated: plan.assignments.length, unallocated: plan.unallocated.length }, tx);
      const unknownGender = plan.unallocated.filter((u) => !["M", "F"].includes(u.gender.toUpperCase()[0])).length;
      return { allocated: plan.assignments.length, unallocated: plan.unallocated.map((u) => u.id), unknownGender, noBeds: plan.unallocated.length - unknownGender };
    },
    { timeout: 30_000 },
  );
}

/** Manual move of one allocation; refuses if the target room is full. */
export async function moveAllocation(actor: Actor, allocationId: string, roomId: string) {
  return db.$transaction(async (tx) => {
    const a = await tx.roomAllocation.findUnique({ where: { id: allocationId }, include: { programme: true } });
    if (!a) throw notFound("Allocation");
    authorize(actor, "update", "hostel", { institutionId: a.programme.institutionId });
    await tx.$queryRaw`SELECT id FROM "Room" WHERE id = ${roomId} FOR UPDATE`;
    const room = await tx.room.findUnique({
      where: { id: roomId },
      include: {
        hostel: true,
        allocations: { where: { checkOut: null, programme: { startDate: { lte: a.programme.endDate }, endDate: { gte: a.programme.startDate } } }, select: { id: true } },
      },
    });
    if (!room || room.hostel.institutionId !== a.programme.institutionId) throw notFound("Room");
    if (room.allocations.length >= room.beds) throw new ApiError("CONFLICT", `Room ${room.number} is full (${room.beds} beds)`);
    const updated = await tx.roomAllocation.update({ where: { id: allocationId }, data: { roomId } });
    await audit(actor.id, "hostel.move", "RoomAllocation", allocationId, { from: a.roomId, to: roomId }, tx);
    return updated;
  });
}

export type LogisticsDetails = { items: { label: string; done: boolean; note?: string }[]; veg?: number; nonVeg?: number };

/** Meal counts for the logistics checklist, computed from enrolled trainees' diet preference. */
export async function mealCounts(programmeId: string) {
  const rows = await db.enrollment.findMany({ where: { programmeId }, select: { trainee: { select: { traineeProfile: { select: { diet: true } } } } } });
  const nonVeg = rows.filter((r) => r.trainee.traineeProfile?.diet === "NON_VEG").length;
  return { veg: rows.length - nonVeg, nonVeg, total: rows.length };
}
