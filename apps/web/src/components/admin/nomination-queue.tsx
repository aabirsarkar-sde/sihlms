"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Clock, Undo2, X } from "lucide-react";
import { api } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Alert, Badge, Progress, STATUS_TONE, Table, Td, Th } from "@/components/ui/misc";

type N = {
  id: string;
  status: string;
  createdAt: string;
  remarks: string | null;
  trainee: { id: string; name: string; traineeProfile: { category: string; district: string; state: string; gender: string; cooperativeName: string | null } | null };
  nominatedBy: { name: string };
};

export function NominationQueue({ programmeId, onChange }: { programmeId: string; onChange?: () => void }) {
  const t = useTranslations("queue");
  const te = useTranslations("enums");
  const [data, setData] = useState<{ items: N[]; approved: number; capacity: number } | null>(null);
  const [status, setStatus] = useState("SUBMITTED");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();

  const load = useCallback(async () => {
    const r = await api<{ items: N[]; approved: number; capacity: number }>(`/api/v1/programmes/${programmeId}/nominations?pageSize=500${status ? `&status=${status}` : ""}`);
    if (r.data) setData(r.data);
    setSel(new Set());
  }, [programmeId, status]);
  useEffect(() => {
    void load();
  }, [load]);

  const bulk = async (decision: "APPROVED" | "REJECTED" | "WAITLISTED", ids = [...sel]) => {
    if (!ids.length) return;
    setBusy(true);
    const r = await api<{ approved: number; waitlisted: number }>("/api/v1/nominations/bulk-decision", { method: "POST", json: { ids, decision } });
    setBusy(false);
    if (r.error) setMsg({ ok: false, text: r.error.message });
    else setMsg({ ok: true, text: decision === "APPROVED" ? t("approvedMsg", { a: r.data!.approved, w: r.data!.waitlisted }) : t("doneMsg", { n: ids.length }) });
    await load();
    onChange?.();
  };
  const withdraw = async (id: string) => {
    setBusy(true);
    const r = await api<{ promoted: string | null }>(`/api/v1/nominations/${id}/withdraw`, { method: "POST", json: {} });
    setBusy(false);
    setMsg(r.error ? { ok: false, text: r.error.message } : { ok: true, text: r.data!.promoted ? t("withdrawnPromoted") : t("withdrawn") });
    await load();
  };

  const items = (data?.items ?? []).filter((n) => n.trainee.name.toLowerCase().includes(q.toLowerCase()));
  const all = items.length > 0 && items.every((n) => sel.has(n.id));
  return (
    <div className="space-y-3">
      {data ? (
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium">{t("capacity")}</span>
            <span className="tabular-nums" data-testid="capacity-count">
              {data.approved}/{data.capacity}
            </span>
          </div>
          <Progress value={(data.approved / data.capacity) * 100} tone={data.approved >= data.capacity ? "red" : "green"} label={t("capacity")} />
        </div>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="nq-status" className="sr-only">
          {t("status")}
        </label>
        <Select id="nq-status" value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-48">
          <option value="">{t("all")}</option>
          {["SUBMITTED", "APPROVED", "WAITLISTED", "REJECTED", "WITHDRAWN"].map((s) => (
            <option key={s} value={s}>
              {te(`nominationStatus.${s}`)}
            </option>
          ))}
        </Select>
        <label htmlFor="nq-q" className="sr-only">
          {t("search")}
        </label>
        <Input id="nq-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="sm:w-60" />
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Button size="sm" onClick={() => bulk("APPROVED")} disabled={busy || !sel.size} data-testid="bulk-approve">
            <Check aria-hidden />
            {t("approve", { n: sel.size })}
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulk("WAITLISTED")} disabled={busy || !sel.size}>
            <Clock aria-hidden />
            {t("waitlist")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulk("REJECTED")} disabled={busy || !sel.size}>
            <X aria-hidden />
            {t("reject")}
          </Button>
        </div>
      </div>
      {msg ? <Alert tone={msg.ok ? "green" : "red"}>{msg.text}</Alert> : null}
      <Table>
        <thead>
          <tr>
            <Th className="w-10">
              <input type="checkbox" aria-label={t("selectAll")} checked={all} onChange={() => setSel(all ? new Set() : new Set(items.map((n) => n.id)))} className="h-5 w-5 accent-brand-700" data-testid="select-all" />
            </Th>
            <Th>{t("trainee")}</Th>
            <Th>{t("category")}</Th>
            <Th>{t("district")}</Th>
            <Th>{t("nominatedBy")}</Th>
            <Th>{t("status")}</Th>
            <Th>{t("actions")}</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((n) => (
            <tr key={n.id}>
              <Td>
                <input
                  type="checkbox"
                  aria-label={n.trainee.name}
                  checked={sel.has(n.id)}
                  onChange={() => {
                    const s = new Set(sel);
                    if (s.has(n.id)) s.delete(n.id);
                    else s.add(n.id);
                    setSel(s);
                  }}
                  className="h-5 w-5 accent-brand-700"
                />
              </Td>
              <Td>
                <span className="font-medium">{n.trainee.name}</span>
                {n.trainee.traineeProfile?.cooperativeName ? <span className="block text-xs text-gray-600 dark:text-gray-400">{n.trainee.traineeProfile.cooperativeName}</span> : null}
              </Td>
              <Td className="text-xs">{n.trainee.traineeProfile ? te(`category.${n.trainee.traineeProfile.category}`) : "—"}</Td>
              <Td className="text-xs">{n.trainee.traineeProfile?.district}</Td>
              <Td className="text-xs">{n.nominatedBy.name}</Td>
              <Td>
                <Badge tone={STATUS_TONE[n.status]}>{te(`nominationStatus.${n.status}`)}</Badge>
              </Td>
              <Td>
                <div className="flex gap-1">
                  {n.status !== "APPROVED" && n.status !== "WITHDRAWN" ? (
                    <Button size="icon" variant="ghost" aria-label={t("approveOne", { name: n.trainee.name })} onClick={() => bulk("APPROVED", [n.id])} disabled={busy}>
                      <Check aria-hidden />
                    </Button>
                  ) : null}
                  {n.status === "APPROVED" ? (
                    <Button size="icon" variant="ghost" aria-label={t("withdrawOne", { name: n.trainee.name })} title={t("withdrawOne", { name: n.trainee.name })} onClick={() => withdraw(n.id)} disabled={busy}>
                      <Undo2 aria-hidden />
                    </Button>
                  ) : null}
                </div>
              </Td>
            </tr>
          ))}
          {items.length === 0 ? (
            <tr>
              <Td colSpan={7} className="text-center text-gray-600">
                {t("empty")}
              </Td>
            </tr>
          ) : null}
        </tbody>
      </Table>
    </div>
  );
}
