"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { CloudOff, RefreshCw, Wifi } from "lucide-react";
import { flushOutbox, onOutboxChange, outboxCount } from "@/lib/offline";
import { cn } from "@/lib/utils";

/** Online / Offline pill with the number of writes waiting in the outbox. Flushes on reconnect. */
export function SyncPill() {
  const t = useTranslations("sync");
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [waiting, setWaiting] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let alive = true;
    const refresh = async () => alive && setWaiting(await outboxCount());
    const flush = async () => {
      if (!navigator.onLine) return;
      if ((await outboxCount()) === 0) return;
      setSyncing(true);
      const r = await flushOutbox();
      setSyncing(false);
      await refresh();
      if (r.sent > 0) router.refresh();
    };
    const up = () => {
      setOnline(true);
      void flush();
    };
    const down = () => setOnline(false);
    setOnline(navigator.onLine);
    void refresh().then(flush);
    const off = onOutboxChange(refresh);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    const onMsg = (e: MessageEvent) => e.data?.type === "flush-outbox" && void flush();
    navigator.serviceWorker?.addEventListener("message", onMsg);
    const iv = setInterval(flush, 8000);
    return () => {
      alive = false;
      off();
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
      navigator.serviceWorker?.removeEventListener("message", onMsg);
      clearInterval(iv);
    };
  }, [router]);

  const Icon = !online ? CloudOff : syncing ? RefreshCw : Wifi;
  return (
    <span
      role="status"
      aria-live="polite"
      data-testid="sync-pill"
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold sm:px-3",
        online ? (waiting ? "bg-saffron-100 text-saffron-700" : "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100") : "bg-gray-800 text-white",
      )}
    >
      <Icon className={cn("size-4", syncing && "animate-spin")} aria-hidden />
      <span className="sr-only sm:not-sr-only">{online ? t("online") : t("offline")}</span>
      {waiting > 0 ? <span className="tabular-nums">{t("waiting", { count: waiting })}</span> : null}
    </span>
  );
}
