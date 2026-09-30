"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, CircleX, ClipboardList, Maximize, MonitorPlay, QrCode, ScanFace, ScanLine, Users } from "lucide-react";
import { api } from "@/lib/fetcher";
import { postOrQueue, uuid } from "@/lib/offline";
import { cn } from "@/lib/utils";
import { QrImage } from "@/components/qr/qr-image";
import { QrScanner } from "@/components/qr/qr-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Alert, Badge, Progress } from "@/components/ui/misc";

type Live = { present: number; enrolled: number; recent: { id: string; method: string; markedAt: string; confidence: number | null; trainee: { name: string } }[] };
type RosterRow = { traineeId: string; name: string; present: boolean; method: string | null; markedAt: string | null };
type Mode = "qr" | "scan" | "face" | "roster";

export function LiveSession({ session }: { session: { id: string; title: string; programme: string; room: string; time: string } }) {
  const t = useTranslations("live");
  const te = useTranslations("enums");
  const [mode, setMode] = useState<Mode>("qr");
  const [live, setLive] = useState<Live | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => api<Live>(`/api/v1/sessions/${session.id}/live`).then((r) => r.data && setLive(r.data)), [session.id]);
  useEffect(() => {
    void refresh();
    const iv = setInterval(refresh, 2000);
    return () => clearInterval(iv);
  }, [refresh]);

  const MODES: { k: Mode; icon: typeof QrCode }[] = [
    { k: "qr", icon: MonitorPlay },
    { k: "scan", icon: ScanLine },
    { k: "face", icon: ScanFace },
    { k: "roster", icon: ClipboardList },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{session.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {session.programme} · {session.room} · {session.time}
          </p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div role="tablist" className="grid grid-cols-4 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            {MODES.map((m) => (
              <button key={m.k} role="tab" type="button" aria-selected={mode === m.k} onClick={() => setMode(m.k)} className={cn("flex min-h-touch flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-xs font-semibold sm:flex-row sm:gap-2 sm:text-sm", mode === m.k ? "bg-white shadow dark:bg-gray-900" : "text-gray-600 dark:text-gray-400")}>
                <m.icon className="size-4" aria-hidden />
                {t(`mode.${m.k}`)}
              </button>
            ))}
          </div>
          <div ref={boxRef} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            {mode === "qr" ? <RotatingQr sessionId={session.id} fullscreenTarget={boxRef} present={live?.present ?? 0} enrolled={live?.enrolled ?? 0} /> : null}
            {mode === "scan" ? <ScanTrainee sessionId={session.id} onMarked={refresh} /> : null}
            {mode === "face" ? <FaceMode sessionId={session.id} onMarked={refresh} /> : null}
            {mode === "roster" ? <Roster sessionId={session.id} onChange={refresh} /> : null}
          </div>
        </div>
        <aside className="space-y-3">
          <div className="rounded-2xl bg-brand-800 p-5 text-white" aria-live="polite">
            <p className="flex items-center gap-2 text-sm text-brand-100">
              <Users className="size-4" aria-hidden />
              {t("present")}
            </p>
            <p className="text-5xl font-bold tabular-nums" data-testid="live-count">
              {live?.present ?? "–"}
              <span className="text-2xl text-brand-200">/{live?.enrolled ?? "–"}</span>
            </p>
            <Progress value={live && live.enrolled ? (live.present / live.enrolled) * 100 : 0} tone="saffron" className="mt-3 bg-brand-900" label={t("present")} />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-2 text-sm font-semibold">{t("recent")}</p>
            <ul className="space-y-2">
              {live?.recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <CircleCheck className="size-4 text-brand-600" aria-hidden />
                    {r.trainee.name}
                  </span>
                  <Badge>{te(`method.${r.method}`)}</Badge>
                </li>
              ))}
              {live && live.recent.length === 0 ? <li className="text-sm text-gray-600">{t("noneYet")}</li> : null}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function RotatingQr({ sessionId, fullscreenTarget, present, enrolled }: { sessionId: string; fullscreenTarget: React.RefObject<HTMLDivElement>; present: number; enrolled: number }) {
  const t = useTranslations("live");
  const [qr, setQr] = useState<{ token: string; expiresAt: number } | null>(null);
  const [left, setLeft] = useState(30);
  const [err, setErr] = useState<string>();
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const r = await api<{ token: string; expiresAt: number }>(`/api/v1/sessions/${sessionId}/qr`);
      if (!alive) return;
      if (r.error) setErr(r.error.message);
      else {
        setErr(undefined);
        setQr(r.data!);
      }
    };
    void load();
    const iv = setInterval(() => {
      setQr((q) => {
        if (q) {
          const s = Math.max(0, Math.ceil((q.expiresAt - Date.now()) / 1000));
          setLeft(s);
          if (s <= 0) void load();
        }
        return q;
      });
    }, 500);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [sessionId]);
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {err ? <Alert tone="red">{err}</Alert> : null}
      {qr ? <QrImage value={qr.token} size={360} label={t("qrAlt")} /> : <div className="size-[360px] animate-pulse rounded-lg bg-gray-100" />}
      <p className="text-lg font-semibold">{t("scanPrompt")}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{t("rotates", { s: left })}</p>
      <p className="text-sm font-medium">{t("presentOf", { present, enrolled })}</p>
      {qr ? (
        <details className="w-full text-left text-xs text-gray-600 dark:text-gray-400">
          <summary className="cursor-pointer">{t("showCode")}</summary>
          <code className="break-all" data-testid="session-token">
            {qr.token}
          </code>
        </details>
      ) : null}
      <Button variant="outline" onClick={() => fullscreenTarget.current?.requestFullscreen?.()}>
        <Maximize aria-hidden />
        {t("fullscreen")}
      </Button>
    </div>
  );
}

function ScanTrainee({ sessionId, onMarked }: { sessionId: string; onMarked: () => void }) {
  const t = useTranslations("live");
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  const [busy, setBusy] = useState(false);
  const onResult = async (payload: string) => {
    if (busy) return;
    setBusy(true);
    const r = await postOrQueue<{ traineeName?: string; duplicate: boolean }>("/api/v1/attendance/scan", { sessionId, payload, clientId: uuid() }, "attendance");
    setBusy(false);
    if (!r.ok) setMsg({ ok: false, text: r.error?.message ?? t("error") });
    else if (r.queued) setMsg({ ok: true, text: t("queued") });
    else setMsg({ ok: true, text: r.data?.duplicate ? t("alreadyMarked", { name: r.data.traineeName ?? "" }) : t("markedName", { name: r.data?.traineeName ?? "" }) });
    onMarked();
  };
  return (
    <div className="mx-auto max-w-sm space-y-3">
      <p className="text-center text-sm">{t("scanTraineeHint")}</p>
      <QrScanner onResult={onResult} paused={busy} />
      {msg ? (
        <Alert tone={msg.ok ? "green" : "red"}>
          {msg.ok ? <CircleCheck aria-hidden /> : <CircleX aria-hidden />}
          {msg.text}
        </Alert>
      ) : null}
    </div>
  );
}

/** Webcam → 3 frames (for the liveness head-turn check) → /attendance/face. Below-threshold falls back to manual. */
function FaceMode({ sessionId, onMarked }: { sessionId: string; onMarked: () => void }) {
  const t = useTranslations("live");
  const video = useRef<HTMLVideoElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  useEffect(() => {
    let stream: MediaStream | undefined;
    navigator.mediaDevices
      ?.getUserMedia({ video: { width: 640, height: 480 } })
      .then((s) => {
        stream = s;
        if (video.current) video.current.srcObject = s;
      })
      .catch(() => setMsg({ ok: false, text: t("cameraError") }));
    return () => stream?.getTracks().forEach((x) => x.stop());
  }, [t]);
  const grab = () =>
    new Promise<Blob>((resolve) => {
      const v = video.current!;
      const c = document.createElement("canvas");
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext("2d")!.drawImage(v, 0, 0);
      c.toBlob((b) => resolve(b!), "image/jpeg", 0.85);
    });
  const identify = async () => {
    setBusy(true);
    setMsg({ ok: true, text: t("turnHead") });
    const frames: Blob[] = [];
    for (let i = 0; i < 3; i++) {
      frames.push(await grab());
      await new Promise((r) => setTimeout(r, 450));
    }
    const fd = new FormData();
    fd.append("sessionId", sessionId);
    frames.forEach((f, i) => fd.append("image", f, `f${i}.jpg`));
    const r = await api<{ match: { name: string; similarity: number } | null; reason?: string; duplicate?: boolean }>("/api/v1/attendance/face", { method: "POST", body: fd });
    setBusy(false);
    if (r.error) return setMsg({ ok: false, text: r.error.message });
    if (!r.data!.match) return setMsg({ ok: false, text: r.data!.reason === "LIVENESS_FAILED" ? t("livenessFailed") : t("noMatch") });
    setMsg({ ok: true, text: t("faceMarked", { name: r.data!.match.name, pct: Math.round(r.data!.match.similarity * 100) }) });
    onMarked();
  };
  return (
    <div className="mx-auto max-w-md space-y-3">
      <video ref={video} autoPlay playsInline muted className="aspect-[4/3] w-full rounded-xl bg-black object-cover" aria-label={t("cameraLabel")} />
      <Button className="w-full" size="lg" onClick={identify} disabled={busy}>
        <ScanFace aria-hidden />
        {busy ? t("identifying") : t("identify")}
      </Button>
      {msg ? <Alert tone={msg.ok ? "green" : "red"}>{msg.text}</Alert> : null}
    </div>
  );
}

function Roster({ sessionId, onChange }: { sessionId: string; onChange: () => void }) {
  const t = useTranslations("live");
  const te = useTranslations("enums");
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string>();
  const [q, setQ] = useState("");
  const load = useCallback(() => api<{ items: RosterRow[] }>(`/api/v1/sessions/${sessionId}/roster`).then((r) => r.data && setRows(r.data.items)), [sessionId]);
  useEffect(() => {
    void load();
  }, [load]);
  const toggle = async (row: RosterRow) => {
    if (reason.trim().length < 3) return setErr(t("reasonRequired"));
    setErr(undefined);
    const r = await api(`/api/v1/sessions/${sessionId}/roster`, { method: "POST", json: { traineeId: row.traineeId, present: !row.present, reason } });
    if (r.error) return setErr(r.error.message);
    void load();
    onChange();
  };
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label htmlFor="reason" className="mb-1 block text-sm font-medium">
            {t("reason")}
          </label>
          <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("reasonPlaceholder")} />
        </div>
        <div>
          <label htmlFor="filter" className="mb-1 block text-sm font-medium">
            {t("filter")}
          </label>
          <Input id="filter" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {err ? <Alert tone="red">{err}</Alert> : null}
      <ul className="max-h-[60vh] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
        {rows
          .filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))
          .map((r) => (
            <li key={r.traineeId} className="flex items-center justify-between gap-2 py-2">
              <span className="text-sm">
                {r.name}
                {r.method ? <Badge className="ml-2">{te(`method.${r.method}`)}</Badge> : null}
              </span>
              <Button size="sm" variant={r.present ? "default" : "outline"} onClick={() => toggle(r)} aria-pressed={r.present}>
                {r.present ? <CircleCheck aria-hidden /> : <CircleX aria-hidden />}
                {r.present ? t("presentBtn") : t("absentBtn")}
              </Button>
            </li>
          ))}
      </ul>
    </div>
  );
}
