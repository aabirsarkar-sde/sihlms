"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { BadgeCheck, MapPin, Phone } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { Alert, Badge } from "@/components/ui/misc";

type Card = { id: string; status: string; name: string; phone: string; location: string; category: string; score: number; certificates: { certNo: string; title: string; required: boolean }[]; coverNote: string | null };
const COLS = ["APPLIED", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"];

/** Applicant pipeline. Drag cards between columns or use the status menu on each card. Status changes notify the trainee. */
export function Kanban({ cards: initial }: { cards: Card[] }) {
  const t = useTranslations("kanban");
  const te = useTranslations("enums");
  const router = useRouter();
  const [cards, setCards] = useState(initial);
  const [over, setOver] = useState<string | null>(null);
  const [err, setErr] = useState<string>();
  const move = async (id: string, status: string) => {
    const prev = cards;
    setCards(cards.map((c) => (c.id === id ? { ...c, status } : c)));
    const r = await api(`/api/v1/applications/${id}`, { method: "PATCH", json: { status } });
    if (r.error) {
      setErr(r.error.message);
      setCards(prev);
    } else router.refresh();
  };
  return (
    <div className="space-y-2">
      {err ? <Alert tone="red">{err}</Alert> : null}
      <div className="flex gap-3 overflow-x-auto pb-3">
        {COLS.map((col) => {
          const list = cards.filter((c) => c.status === col);
          return (
            <section
              key={col}
              aria-label={te(`applicationStatus.${col}`)}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(col);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => {
                setOver(null);
                const id = e.dataTransfer.getData("text/plain");
                if (id) void move(id, col);
              }}
              className={cn("flex w-56 shrink-0 flex-col rounded-xl bg-gray-100 p-2 dark:bg-gray-800/60", over === col && "ring-2 ring-brand-500")}
              data-testid={`col-${col}`}
            >
              <h3 className="mb-2 flex items-center justify-between px-1 text-sm font-semibold">
                {te(`applicationStatus.${col}`)}
                <span className="rounded-full bg-white px-2 text-xs tabular-nums dark:bg-gray-900">{list.length}</span>
              </h3>
              <ul className="space-y-2">
                {list.map((c) => (
                  <li key={c.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)} className="cursor-grab rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900" data-testid="applicant-card">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold">{c.name}</span>
                      <Badge tone={c.score >= 70 ? "green" : c.score >= 45 ? "saffron" : "gray"}>{c.score}%</Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{c.category}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs">
                      <MapPin className="size-3" aria-hidden />
                      {c.location}
                    </p>
                    <p className="flex items-center gap-1 font-mono text-xs">
                      <Phone className="size-3" aria-hidden />
                      {c.phone}
                    </p>
                    {c.certificates.map((x) => (
                      <Link key={x.certNo} href={`/verify/${x.certNo}`} target="_blank" className={cn("mt-1 flex items-center gap-1 text-xs underline", x.required ? "font-semibold text-brand-700 dark:text-brand-300" : "text-gray-700 dark:text-gray-300")}>
                        <BadgeCheck className="size-3.5 shrink-0" aria-hidden />
                        {x.title}
                      </Link>
                    ))}
                    {c.coverNote ? <p className="mt-1 line-clamp-2 text-xs italic text-gray-600">{c.coverNote}</p> : null}
                    <label className="sr-only" htmlFor={`mv-${c.id}`}>
                      {t("moveTo")}
                    </label>
                    <select id={`mv-${c.id}`} value={c.status} onChange={(e) => move(c.id, e.target.value)} className="mt-2 h-9 w-full rounded border border-gray-300 text-xs dark:border-gray-700 dark:bg-gray-950" data-testid="move-select">
                      {COLS.map((s) => (
                        <option key={s} value={s}>
                          {te(`applicationStatus.${s}`)}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">{t("phoneNote")}</p>
    </div>
  );
}
