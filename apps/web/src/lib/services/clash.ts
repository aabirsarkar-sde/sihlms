export type Slot = { id?: string; title?: string; facultyId: string; room: string; startsAt: Date; endsAt: Date };
export type Clash = { kind: "FACULTY" | "ROOM"; with: Slot };

export const overlaps = (a: Slot, b: Slot) => a.startsAt < b.endsAt && b.startsAt < a.endsAt;

/** Returns the first clash (same faculty or same room at an overlapping time), or null. */
export function findClash(candidate: Slot, existing: Slot[]): Clash | null {
  for (const s of existing) {
    if (candidate.id && s.id === candidate.id) continue;
    if (!overlaps(candidate, s)) continue;
    if (s.facultyId === candidate.facultyId) return { kind: "FACULTY", with: s };
    if (s.room.trim().toLowerCase() === candidate.room.trim().toLowerCase()) return { kind: "ROOM", with: s };
  }
  return null;
}
