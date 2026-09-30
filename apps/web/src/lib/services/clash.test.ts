import { describe, expect, it } from "vitest";
import { findClash } from "./clash";
import { planAllocation } from "./allocation";

const d = (h: number) => new Date(Date.UTC(2026, 9, 1, h));

describe("timetable clash", () => {
  const existing = [{ id: "1", facultyId: "f1", room: "Hall A", startsAt: d(9), endsAt: d(10) }];
  it("detects faculty clash", () => expect(findClash({ facultyId: "f1", room: "Hall B", startsAt: d(9), endsAt: d(11) }, existing)?.kind).toBe("FACULTY"));
  it("detects room clash (case-insensitive)", () => expect(findClash({ facultyId: "f2", room: "hall a", startsAt: d(9), endsAt: d(10) }, existing)?.kind).toBe("ROOM"));
  it("back-to-back is fine", () => expect(findClash({ facultyId: "f1", room: "Hall A", startsAt: d(10), endsAt: d(11) }, existing)).toBeNull());
  it("ignores itself when editing", () => expect(findClash({ id: "1", facultyId: "f1", room: "Hall A", startsAt: d(9), endsAt: d(10) }, existing)).toBeNull());
});

describe("hostel allocation", () => {
  it("never exceeds beds and respects gender", () => {
    const rooms = [
      { id: "m1", gender: "M", beds: 2, occupied: 1 },
      { id: "f1", gender: "F", beds: 2, occupied: 0 },
    ];
    const guests = [
      { id: "a", gender: "M" },
      { id: "b", gender: "M" },
      { id: "c", gender: "F" },
      { id: "d", gender: "F" },
      { id: "e", gender: "F" },
    ];
    const r = planAllocation(guests, rooms);
    expect(r.assignments).toEqual([
      { traineeId: "a", roomId: "m1" },
      { traineeId: "c", roomId: "f1" },
      { traineeId: "d", roomId: "f1" },
    ]);
    expect(r.unallocated.map((u) => u.id)).toEqual(["b", "e"]);
  });
});
