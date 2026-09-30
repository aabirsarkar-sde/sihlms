"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { BedDouble, Megaphone, PlayCircle, Flag } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";

export function ProgrammeActions({ id, status, editable }: { id: string; status: string; editable: boolean }) {
  const t = useTranslations("workspace");
  const router = useRouter();
  const [err, setErr] = useState<string>();
  if (!editable) return null;
  const go = async (fn: () => Promise<{ error?: { message: string } }>) => {
    const r = await fn();
    if (r.error) setErr(r.error.message);
    router.refresh();
  };
  return (
    <div className="flex flex-wrap gap-2">
      {status === "DRAFT" ? (
        <Button onClick={() => go(() => api(`/api/v1/programmes/${id}/publish`, { method: "POST", json: {} }))}>
          <Megaphone aria-hidden />
          {t("publish")}
        </Button>
      ) : null}
      {status === "PUBLISHED" ? (
        <Button variant="outline" onClick={() => go(() => api(`/api/v1/programmes/${id}`, { method: "PATCH", json: { status: "ONGOING" } }))}>
          <PlayCircle aria-hidden />
          {t("start")}
        </Button>
      ) : null}
      {status === "ONGOING" ? (
        <Button variant="outline" onClick={() => go(() => api(`/api/v1/programmes/${id}`, { method: "PATCH", json: { status: "COMPLETED" } }))}>
          <Flag aria-hidden />
          {t("complete")}
        </Button>
      ) : null}
      {err ? <Alert tone="red">{err}</Alert> : null}
    </div>
  );
}

export function AllocateButton({ id }: { id: string }) {
  const t = useTranslations("workspace");
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <Button
        disabled={busy}
        data-testid="allocate-rooms"
        onClick={async () => {
          setBusy(true);
          const r = await api<{ allocated: number; unallocated: string[]; unknownGender: number; noBeds: number }>(`/api/v1/programmes/${id}/allocate-rooms`, { method: "POST", json: {} });
          setBusy(false);
          setMsg(r.error ? { ok: false, text: r.error.message } : { ok: r.data!.unallocated.length === 0, text: t("allocated", { n: r.data!.allocated, left: r.data!.noBeds, unknown: r.data!.unknownGender }) });
          router.refresh();
        }}
      >
        <BedDouble aria-hidden />
        {t("autoAllocate")}
      </Button>
      {msg ? <Alert tone={msg.ok ? "green" : "saffron"}>{msg.text}</Alert> : null}
    </div>
  );
}
