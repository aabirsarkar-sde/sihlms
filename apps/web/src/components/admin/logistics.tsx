"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bus, Package, Plus, Save, Utensils } from "lucide-react";
import { api } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Checkbox, Input } from "@/components/ui/form";
import { Alert, Stat } from "@/components/ui/misc";

type Item = { label: string; done: boolean };
type Group = { kind: "TRAVEL" | "MEALS" | "KITS"; items: Item[] };
const ICON = { TRAVEL: Bus, MEALS: Utensils, KITS: Package };

export function Logistics({ programmeId, initial, meals, editable }: { programmeId: string; initial: Group[]; meals: { veg: number; nonVeg: number; total: number }; editable: boolean }) {
  const t = useTranslations("logistics");
  const kinds: Group["kind"][] = ["TRAVEL", "MEALS", "KITS"];
  const [groups, setGroups] = useState<Group[]>(kinds.map((k) => initial.find((g) => g.kind === k) ?? { kind: k, items: [] }));
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  const patch = (k: Group["kind"], items: Item[]) => setGroups(groups.map((g) => (g.kind === k ? { ...g, items } : g)));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<Utensils />} label={t("veg")} value={meals.veg} />
        <Stat icon={<Utensils />} label={t("nonVeg")} value={meals.nonVeg} />
        <Stat icon={<Package />} label={t("kits")} value={meals.total} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {groups.map((g) => {
          const Icon = ICON[g.kind];
          return (
            <div key={g.kind} className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <Icon className="size-5 text-brand-600" aria-hidden />
                {t(`kind.${g.kind}`)}
                <span className="ml-auto text-xs font-normal text-gray-600">
                  {g.items.filter((i) => i.done).length}/{g.items.length}
                </span>
              </h3>
              {g.items.map((it, i) => (
                <Checkbox key={i} label={it.label} checked={it.done} disabled={!editable} onChange={(e) => patch(g.kind, g.items.map((x, j) => (j === i ? { ...x, done: e.target.checked } : x)))} />
              ))}
              {editable ? (
                <form
                  className="mt-2 flex gap-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const label = draft[g.kind]?.trim();
                    if (!label) return;
                    patch(g.kind, [...g.items, { label, done: false }]);
                    setDraft({ ...draft, [g.kind]: "" });
                  }}
                >
                  <label htmlFor={`add-${g.kind}`} className="sr-only">
                    {t("add")}
                  </label>
                  <Input id={`add-${g.kind}`} value={draft[g.kind] ?? ""} onChange={(e) => setDraft({ ...draft, [g.kind]: e.target.value })} placeholder={t("add")} className="text-sm" />
                  <Button type="submit" size="icon" variant="outline" aria-label={t("add")}>
                    <Plus aria-hidden />
                  </Button>
                </form>
              ) : null}
            </div>
          );
        })}
      </div>
      {msg ? <Alert tone={msg.ok ? "green" : "red"}>{msg.text}</Alert> : null}
      {editable ? (
        <Button
          onClick={async () => {
            const r = await api(`/api/v1/programmes/${programmeId}/logistics`, { method: "PUT", json: { groups } });
            setMsg(r.error ? { ok: false, text: r.error.message } : { ok: true, text: t("saved") });
          }}
        >
          <Save aria-hidden />
          {t("save")}
        </Button>
      ) : null}
    </div>
  );
}
