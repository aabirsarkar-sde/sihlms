"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, CircleX, CloudOff, KeyRound, RefreshCw, ScanFace, Settings, Wifi } from "lucide-react";
import { kvGet, kvSet, uuid } from "@/lib/offline";
import { Logo } from "@/components/shell/logo";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";

type Pull = {
  serverTime: string;
  sessions: { id: string; title: string; room: string; startsAt: string; endsAt: string; programmeId: string; programme: { code: string; title: string } }[];
  trainees: { id: string; name: string; programmes: string[]; embedding: number[] | null }[];
};
type Mark = { kind: "KIOSK"; clientId: string; sessionId: string; traineeId: string; confidence: number; markedAt: string };
type Cfg = { key: string; faceUrl: string };

const THRESHOLD = 0.6;

export function KioskClient({ defaultFaceUrl }: { defaultFaceUrl: string }) {
  const t = useTranslations("kiosk");
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [draft, setDraft] = useState<Cfg>({ key: "", faceUrl: defaultFaceUrl });
  const [data, setData] = useState<Pull | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [queue, setQueue] = useState<Mark[]>([]);
  const [online, setOnline] = useState(true);
  const [status, setStatus] = useState<{ tone: "green" | "red" | "gray" | "saffron"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const marked = useRef<Set<string>>(new Set());
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    kvGet<Cfg>("kiosk-cfg").then((c) => c && setCfg(c));
    kvGet<Pull>("kiosk-pull").then((d) => d && setData(d));
    kvGet<Mark[]>("kiosk-queue").then((q) => q && setQueue(q));
  }, []);
  useEffect(() => void kvSet("kiosk-queue", queue), [queue]);

  const headers = useCallback(() => ({ "Content-Type": "application/json", "X-Device-Key": cfg?.key ?? "" }), [cfg]);

  const pull = useCallback(async () => {
    if (!cfg) return;
    try {
      const r = await fetch("/api/v1/devices/sync-pull", { headers: headers() });
      if (!r.ok) throw new Error(String(r.status));
      const d = (await r.json()) as Pull;
      setData(d);
      await kvSet("kiosk-pull", d);
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, [cfg, headers]);

  const flush = useCallback(async () => {
    if (!cfg || queue.length === 0) return;
    try {
      const r = await fetch("/api/v1/attendance/sync", { method: "POST", headers: headers(), body: JSON.stringify({ records: queue }) });
      if (!r.ok) throw new Error();
      const out = (await r.json()) as { results: { clientId: string }[] };
      const done = new Set(out.results.map((x) => x.clientId));
      setQueue((q) => q.filter((m) => !done.has(m.clientId)));
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, [cfg, headers, queue]);

  useEffect(() => {
    if (!cfg) return;
    void pull();
    const beat = () => fetch("/api/v1/devices/heartbeat", { method: "POST", headers: headers() }).then((r) => setOnline(r.ok)).catch(() => setOnline(false));
    void beat();
    const ivBeat = setInterval(beat, 60_000);
    const ivPull = setInterval(pull, 5 * 60_000);
    return () => {
      clearInterval(ivBeat);
      clearInterval(ivPull);
    };
  }, [cfg, headers, pull]);
  useEffect(() => {
    const iv = setInterval(flush, 5000);
    window.addEventListener("online", flush);
    return () => {
      clearInterval(iv);
      window.removeEventListener("online", flush);
    };
  }, [flush]);

  useEffect(() => {
    if (!data) return;
    const now = Date.now();
    const live = data.sessions.find((s) => Date.parse(s.startsAt) - 30 * 60_000 <= now && Date.parse(s.endsAt) >= now);
    if (live && !sessionId) setSessionId(live.id);
  }, [data, sessionId]);

  useEffect(() => {
    if (!cfg) return;
    let stream: MediaStream | undefined;
    navigator.mediaDevices
      ?.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } })
      .then((s) => {
        stream = s;
        if (video.current) video.current.srcObject = s;
      })
      .catch(() => setStatus({ tone: "red", text: t("cameraError") }));
    return () => stream?.getTracks().forEach((x) => x.stop());
  }, [cfg, t]);

  const identify = async () => {
    if (!data || !sessionId || !cfg) return;
    const session = data.sessions.find((s) => s.id === sessionId)!;
    const candidates = data.trainees.filter((x) => x.embedding && x.programmes.includes(session.programmeId)).map((x) => ({ traineeId: x.id, embedding: x.embedding }));
    if (!candidates.length) return setStatus({ tone: "saffron", text: t("noFaces") });
    setBusy(true);
    setStatus({ tone: "gray", text: t("lookAndTurn") });
    const frames: Blob[] = [];
    for (let i = 0; i < 3; i++) {
      const v = video.current!;
      const c = document.createElement("canvas");
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext("2d")!.drawImage(v, 0, 0);
      frames.push(await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/jpeg", 0.85)));
      await new Promise((r) => setTimeout(r, 450));
    }
    const fd = new FormData();
    frames.forEach((f, i) => fd.append("images", f, `f${i}.jpg`));
    fd.append("candidates", JSON.stringify(candidates));
    fd.append("threshold", String(THRESHOLD));
    fd.append("liveness", "true");
    try {
      const r = await fetch(`${cfg.faceUrl.replace(/\/$/, "")}/identify`, { method: "POST", body: fd });
      const j = (await r.json()) as { traineeId?: string; similarity?: number; live?: boolean };
      if (j.live === false) setStatus({ tone: "red", text: t("liveness") });
      else if (!j.traineeId || (j.similarity ?? 0) < THRESHOLD) setStatus({ tone: "red", text: t("noMatch") });
      else {
        const name = data.trainees.find((x) => x.id === j.traineeId)?.name ?? "";
        const key = `${sessionId}:${j.traineeId}`;
        if (!marked.current.has(key)) {
          marked.current.add(key);
          setQueue((q) => [...q, { kind: "KIOSK", clientId: uuid(), sessionId, traineeId: j.traineeId!, confidence: j.similarity!, markedAt: new Date().toISOString() }]);
        }
        setStatus({ tone: "green", text: t("welcome", { name, pct: Math.round(j.similarity! * 100) }) });
      }
    } catch {
      setStatus({ tone: "red", text: t("faceSvcDown") });
    }
    setBusy(false);
    setTimeout(() => setStatus(null), 4000);
  };

  if (!cfg)
    return (
      <main className="flex min-h-dvh items-center justify-center bg-brand-900 p-4">
        <form
          className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 dark:bg-gray-900"
          onSubmit={async (e) => {
            e.preventDefault();
            await kvSet("kiosk-cfg", draft);
            setCfg(draft);
          }}
        >
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <KeyRound className="size-6 text-brand-600" aria-hidden />
            {t("setup")}
          </h1>
          <Field label={t("deviceKey")} htmlFor="dk" hint={t("deviceKeyHint")}>
            <Input id="dk" value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value.trim() })} required className="font-mono" />
          </Field>
          <Field label={t("faceUrl")} htmlFor="fu">
            <Input id="fu" value={draft.faceUrl} onChange={(e) => setDraft({ ...draft, faceUrl: e.target.value })} required />
          </Field>
          <Button type="submit" className="w-full">
            {t("start")}
          </Button>
        </form>
      </main>
    );

  const session = data?.sessions.find((s) => s.id === sessionId);
  return (
    <main className="flex min-h-dvh flex-col bg-brand-900 text-white">
      <header className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <Logo size={44} />
          <div>
            <p className="text-lg font-bold">{t("title")}</p>
            <p className="text-sm text-brand-100">{session ? `${session.programme.code} · ${session.title} · ${session.room}` : t("noSession")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5">
            {online ? <Wifi className="size-4" aria-hidden /> : <CloudOff className="size-4" aria-hidden />}
            {online ? t("online") : t("offline")}
            {queue.length ? ` · ${t("queued", { n: queue.length })}` : ""}
          </span>
          <button type="button" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10" onClick={() => void pull()} aria-label={t("refresh")}>
            <RefreshCw className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10"
            onClick={async () => {
              await kvSet("kiosk-cfg", null);
              setCfg(null);
            }}
            aria-label={t("settings")}
          >
            <Settings className="size-5" aria-hidden />
          </button>
        </div>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 p-4">
        {data && data.sessions.length > 1 ? (
          <div className="w-full max-w-lg">
            <label htmlFor="ks" className="sr-only">
              {t("session")}
            </label>
            <Select id="ks" value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="text-gray-900">
              <option value="">{t("chooseSession")}</option>
              {data.sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.programme.code} · {s.title} · {new Date(s.startsAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        <video ref={video} autoPlay playsInline muted className="aspect-[4/3] w-full max-w-lg rounded-3xl bg-black object-cover shadow-2xl" aria-label={t("camera")} />
        <Button size="lg" variant="accent" className="h-16 w-full max-w-lg text-lg" onClick={identify} disabled={busy || !sessionId}>
          <ScanFace className="!size-6" aria-hidden />
          {busy ? t("checking") : t("markMe")}
        </Button>
        <div className="min-h-16 w-full max-w-lg" aria-live="assertive">
          {status ? (
            <Alert tone={status.tone} className="justify-center py-4 text-lg">
              {status.tone === "green" ? <CircleCheck className="!size-6" aria-hidden /> : status.tone === "red" ? <CircleX className="!size-6" aria-hidden /> : null}
              {status.text}
            </Alert>
          ) : null}
        </div>
      </div>
    </main>
  );
}
