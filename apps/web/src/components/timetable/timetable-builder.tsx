"use client";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Save, Trash2, X } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";

export type TSession = { id: string; title: string; facultyId: string; facultyName: string; room: string; startsAt: string; endsAt: string; attendance: number };
type Draft = { id?: string; title: string; facultyId: string; room: string; day: string; startH: number; endH: number };

const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i); // 08:00–18:00 IST
const IST = 5.5 * 3600_000;
const istDay = (d: Date) => new Date(d.getTime() + IST).toISOString().slice(0, 10);
const istHour = (d: Date) => {
  const x = new Date(d.getTime() + IST);
  return x.getUTCHours() + x.getUTCMinutes() / 60;
};
const toUtc = (day: string, h: number) => new Date(Date.parse(`${day}T00:00:00Z`) + h * 3600_000 - IST);

/** Weekly grid: drag down a day column to create a session; click a block to edit. Clashes come back from the server and are named. */
export function TimetableBuilder({ programmeId, startDate, sessions, faculty, canEdit }: { programmeId: string; startDate: string; sessions: TSession[]; faculty: { id: string; name: string }[]; canEdit: boolean }) {
  const t = useTranslations("timetable");
  const locale = useLocale();
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(() => istDay(new Date(startDate)));
  const [drag, setDrag] = useState<{ day: string; from: number; to: number } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => new Date(Date.parse(`${weekStart}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10)), [weekStart]);
  const byDay = useMemo(() => {
    const m: Record<string, TSession[]> = {};
    for (const s of sessions) (m[istDay(new Date(s.startsAt))] ??= []).push(s);
    return m;
  }, [sessions]);

  const shift = (n: number) => setWeekStart(new Date(Date.parse(`${weekStart}T00:00:00Z`) + n * 7 * 86_400_000).toISOString().slice(0, 10));
  const endDrag = () => {
    if (!drag || !canEdit) return setDrag(null);
    const a = Math.min(drag.from, drag.to);
    const b = Math.max(drag.from, drag.to) + 1;
    setDraft({ title: "", facultyId: faculty[0]?.id ?? "", room: "Hall A", day: drag.day, startH: a, endH: b });
    setErr(undefined);
    setDrag(null);
  };

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    const payload = { title: draft.title, facultyId: draft.facultyId, room: draft.room, startsAt: toUtc(draft.day, draft.startH).toISOString(), endsAt: toUtc(draft.day, draft.endH).toISOString() };
    const r = draft.id ? await api(`/api/v1/sessions/${draft.id}`, { method: "PATCH", json: payload }) : await api(`/api/v1/programmes/${programmeId}/sessions`, { method: "POST", json: payload });
    setBusy(false);
    if (r.error) return setErr(r.error.message);
    setDraft(null);
    router.refresh();
  };
  const remove = async () => {
    if (!draft?.id) return;
    setBusy(true);
    const r = await api(`/api/v1/sessions/${draft.id}`, { method: "DELETE" });
    setBusy(false);
    if (r.error) return setErr(r.error.message);
    setDraft(null);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label={t("prevWeek")}>
          <ChevronLeft aria-hidden />
        </Button>
        <p className="text-sm font-semibold">{t("weekOf", { date: new Date(`${weekStart}T00:00:00Z`).toLocaleDateString(`${locale}-IN`, { day: "numeric", month: "short", year: "numeric" }) })}</p>
        <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label={t("nextWeek")}>
          <ChevronRight aria-hidden />
        </Button>
      </div>
      {canEdit ? <p className="text-xs text-gray-600 dark:text-gray-400">{t("dragHint")}</p> : null}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800" onMouseLeave={() => setDrag(null)}>
        <div className="grid min-w-[760px] select-none" style={{ gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))" }} onMouseUp={endDrag}>
          <div className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950" />
          {days.map((d) => (
            <div key={d} className="border-b border-l border-gray-200 bg-gray-50 p-2 text-center text-xs font-semibold dark:border-gray-800 dark:bg-gray-950">
              {new Date(`${d}T00:00:00Z`).toLocaleDateString(`${locale}-IN`, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}
            </div>
          ))}
          {HOURS.map((h) => (
            <div key={h} className="contents">
              <div className="h-12 border-b border-gray-100 pr-1 pt-0.5 text-right text-[11px] text-gray-600 dark:text-gray-400 dark:border-gray-800">{`${String(h).padStart(2, "0")}:00`}</div>
              {days.map((d) => {
                const sel = drag && drag.day === d && h >= Math.min(drag.from, drag.to) && h <= Math.max(drag.from, drag.to);
                return (
                  <div
                    key={d + h}
                    onMouseDown={() => canEdit && setDrag({ day: d, from: h, to: h })}
                    onMouseEnter={() => drag && drag.day === d && setDrag({ ...drag, to: h })}
                    onDoubleClick={() => canEdit && setDraft({ title: "", facultyId: faculty[0]?.id ?? "", room: "Hall A", day: d, startH: h, endH: h + 1 })}
                    className={cn("relative h-12 border-b border-l border-gray-100 dark:border-gray-800", canEdit && "cursor-crosshair hover:bg-brand-50/60 dark:hover:bg-brand-900/20", sel && "bg-brand-100 dark:bg-brand-900/50")}
                  >
                    {h === HOURS[0]
                      ? (byDay[d] ?? []).map((s) => {
                          const top = (istHour(new Date(s.startsAt)) - HOURS[0]) * 48;
                          const height = Math.max(24, (istHour(new Date(s.endsAt)) - istHour(new Date(s.startsAt))) * 48 - 2);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={() => {
                                if (!canEdit) return;
                                setErr(undefined);
                                setDraft({ id: s.id, title: s.title, facultyId: s.facultyId, room: s.room, day: d, startH: istHour(new Date(s.startsAt)), endH: istHour(new Date(s.endsAt)) });
                              }}
                              className="absolute inset-x-0.5 z-10 overflow-hidden rounded-md border-l-4 border-brand-700 bg-brand-100 p-1 text-left text-[11px] leading-tight text-brand-900 shadow-sm dark:bg-brand-900 dark:text-brand-50"
                              style={{ top, height }}
                            >
                              <span className="block font-semibold">{s.title}</span>
                              <span className="block">
                                {s.facultyName} · {s.room}
                              </span>
                            </button>
                          );
                        })
                      : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {draft ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={draft.id ? t("editSession") : t("newSession")}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
            className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{draft.id ? t("editSession") : t("newSession")}</h2>
              <button type="button" onClick={() => setDraft(null)} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={t("close")}>
                <X className="size-5" aria-hidden />
              </button>
            </div>
            {err ? (
              <Alert tone="red" data-testid="clash-error">
                {err}
              </Alert>
            ) : null}
            <Field label={t("title")} htmlFor="s-title">
              <Input id="s-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required minLength={2} />
            </Field>
            <Field label={t("faculty")} htmlFor="s-fac">
              <Select id="s-fac" value={draft.facultyId} onChange={(e) => setDraft({ ...draft, facultyId: e.target.value })}>
                {faculty.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label={t("room")} htmlFor="s-room">
                <Input id="s-room" value={draft.room} onChange={(e) => setDraft({ ...draft, room: e.target.value })} required />
              </Field>
              <Field label={t("from")} htmlFor="s-from">
                <Select id="s-from" value={draft.startH} onChange={(e) => setDraft({ ...draft, startH: Number(e.target.value) })}>
                  {Array.from({ length: 23 }, (_, i) => 7 + i * 0.5).map((h) => (
                    <option key={h} value={h}>{`${String(Math.floor(h)).padStart(2, "0")}:${h % 1 ? "30" : "00"}`}</option>
                  ))}
                </Select>
              </Field>
              <Field label={t("to")} htmlFor="s-to">
                <Select id="s-to" value={draft.endH} onChange={(e) => setDraft({ ...draft, endH: Number(e.target.value) })}>
                  {Array.from({ length: 23 }, (_, i) => 7.5 + i * 0.5).map((h) => (
                    <option key={h} value={h}>{`${String(Math.floor(h)).padStart(2, "0")}:${h % 1 ? "30" : "00"}`}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label={t("date")} htmlFor="s-day">
              <Input id="s-day" type="date" value={draft.day} onChange={(e) => setDraft({ ...draft, day: e.target.value })} />
            </Field>
            <div className="flex justify-between gap-2 pt-2">
              {draft.id ? (
                <Button type="button" variant="ghost" className="text-red-700" onClick={remove} disabled={busy}>
                  <Trash2 aria-hidden />
                  {t("delete")}
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" disabled={busy}>
                <Save aria-hidden />
                {t("save")}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
