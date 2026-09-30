export type RoomCap = { id: string; gender: string; beds: number; occupied: number; label?: string };
export type Guest = { id: string; gender: string };

/** Greedy fill by gender: fills partly-used rooms first so rooms are shared, never exceeds beds. */
export function planAllocation(guests: Guest[], rooms: RoomCap[]) {
  const free = new Map(rooms.map((r) => [r.id, r.beds - r.occupied]));
  const assignments: { traineeId: string; roomId: string }[] = [];
  const unallocated: Guest[] = [];
  const ordered = [...rooms].sort((a, b) => b.occupied - a.occupied || a.id.localeCompare(b.id));
  for (const g of guests) {
    const room = ordered.find((r) => sameGender(r.gender, g.gender) && (free.get(r.id) ?? 0) > 0);
    if (!room) {
      unallocated.push(g);
      continue;
    }
    free.set(room.id, (free.get(room.id) ?? 0) - 1);
    room.occupied += 1;
    assignments.push({ traineeId: g.id, roomId: room.id });
  }
  return { assignments, unallocated };
}

function sameGender(hostel: string, guest: string) {
  const h = hostel.toUpperCase();
  if (h === "ANY" || h === "MIXED") return true;
  return h[0] === guest.toUpperCase()[0];
}
