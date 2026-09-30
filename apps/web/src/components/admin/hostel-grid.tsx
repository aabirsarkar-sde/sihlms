"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { BedDouble, GripVertical } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/misc";

export type GridRoom = { id: string; number: string; beds: number; allocations: { id: string; name: string; programme: string; highlight?: boolean }[] };
export type GridHostel = { id: string; name: string; gender: string; rooms: GridRoom[] };

/** Occupancy grid. Drag a trainee chip onto another room (or use the Move menu, keyboard friendly). Full rooms refuse. */
export function HostelGrid({ hostels, editable }: { hostels: GridHostel[]; editable: boolean }) {
  const t = useTranslations("hostel");
  const router = useRouter();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [err, setErr] = useState<string>();
  const rooms = hostels.flatMap((h) => h.rooms.map((r) => ({ ...r, hostel: h.name })));

  const move = async (allocationId: string, roomId: string) => {
    setErr(undefined);
    const r = await api(`/api/v1/allocations/${allocationId}`, { method: "PATCH", json: { roomId } });
    if (r.error) setErr(r.error.message);
    router.refresh();
  };

  return (
    <div className="space-y-5">
      {err ? <Alert tone="red">{err}</Alert> : null}
      {hostels.map((h) => {
        const beds = h.rooms.reduce((s, r) => s + r.beds, 0);
        const used = h.rooms.reduce((s, r) => s + r.allocations.length, 0);
        return (
          <section key={h.id}>
            <h3 className="mb-2 flex items-center gap-2 font-semibold">
              <BedDouble className="size-5 text-brand-600" aria-hidden />
              {h.name}
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">{t("occupied", { used, beds })}</span>
            </h3>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {h.rooms.map((r) => {
                const full = r.allocations.length >= r.beds;
                return (
                  <li
                    key={r.id}
                    onDragOver={(e) => {
                      if (!editable) return;
                      e.preventDefault();
                      setOver(r.id);
                    }}
                    onDragLeave={() => setOver(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setOver(null);
                      const id = e.dataTransfer.getData("text/plain");
                      if (id) void move(id, r.id);
                    }}
                    className={cn(
                      "min-h-28 rounded-lg border p-2 text-xs",
                      full ? "border-brand-300 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/30" : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
                      over === r.id && (full ? "ring-2 ring-red-400" : "ring-2 ring-brand-500"),
                    )}
                  >
                    <div className="mb-1 flex justify-between font-semibold">
                      <span>{r.number}</span>
                      <span className="tabular-nums text-gray-600 dark:text-gray-400">
                        {r.allocations.length}/{r.beds}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {r.allocations.map((a) => (
                        <li
                          key={a.id}
                          draggable={editable}
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", a.id);
                            setDragging(a.id);
                          }}
                          onDragEnd={() => setDragging(null)}
                          className={cn("flex items-center gap-1 rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-800", a.highlight && "bg-saffron-100 dark:bg-saffron-700/30", editable && "cursor-grab", dragging === a.id && "opacity-40")}
                          title={a.programme}
                        >
                          {editable ? <GripVertical className="size-3 shrink-0 text-gray-400" aria-hidden /> : null}
                          <span className="line-clamp-1 flex-1">{a.name}</span>
                          {editable ? (
                            <select
                              aria-label={t("moveTo", { name: a.name })}
                              className="w-5 shrink-0 cursor-pointer appearance-none bg-transparent text-center text-gray-600 dark:text-gray-400"
                              value=""
                              onChange={(e) => e.target.value && move(a.id, e.target.value)}
                            >
                              <option value="">{"⋮"}</option>
                              {rooms
                                .filter((x) => x.id !== r.id && x.allocations.length < x.beds)
                                .map((x) => (
                                  <option key={x.id} value={x.id}>
                                    {x.hostel} {x.number}
                                  </option>
                                ))}
                            </select>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
