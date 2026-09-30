"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, CircleX, CloudOff, Keyboard, QrCode, ScanLine } from "lucide-react";
import { kvGet, kvSet, postOrQueue, uuid } from "@/lib/offline";
import { cn } from "@/lib/utils";
import { QrScanner } from "@/components/qr/qr-scanner";
import { QrImage } from "@/components/qr/qr-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";

type State = { kind: "ok" | "dup" | "queued" | "error"; msg?: string } | null;

export function ScanClient({ myQr, name, initialTab }: { myQr: string; name: string; initialTab: "scan" | "myqr" }) {
  const t = useTranslations("scan");
  const [tab, setTab] = useState(initialTab);
  const [state, setState] = useState<State>(null);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState("");
  const [qr, setQr] = useState(myQr);

  useEffect(() => {
    if (myQr) void kvSet("traineeQr", myQr);
    else kvGet<string>("traineeQr").then((v) => v && setQr(v));
  }, [myQr]);

  const submit = async (token: string) => {
    if (busy) return;
    if (!/^[^.]+\.\d+\.[\w-]+$/.test(token)) {
      setState({ kind: "error", msg: t("notSessionCode") });
      return;
    }
    setBusy(true);
    const t0 = performance.now();
    const r = await postOrQueue<{ duplicate: boolean }>("/api/v1/attendance/scan", { token, clientId: uuid(), scannedAt: new Date().toISOString() }, "attendance");
    setBusy(false);
    if (!r.ok) setState({ kind: "error", msg: r.error?.message });
    else if (r.queued) setState({ kind: "queued" });
    else setState({ kind: r.data?.duplicate ? "dup" : "ok", msg: `${Math.round(performance.now() - t0)} ms` });
    if (navigator.vibrate) navigator.vibrate(r.ok ? 80 : [60, 40, 60]);
  };

  return (
    <div className="space-y-4">
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {(["scan", "myqr"] as const).map((k) => (
          <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("flex min-h-touch items-center justify-center gap-2 rounded-lg text-sm font-semibold", tab === k ? "bg-white shadow dark:bg-gray-900" : "text-gray-600 dark:text-gray-400")}>
            {k === "scan" ? <ScanLine className="size-4" aria-hidden /> : <QrCode className="size-4" aria-hidden />}
            {k === "scan" ? t("tabScan") : t("tabMyQr")}
          </button>
        ))}
      </div>
      {tab === "scan" ? (
        <>
          <QrScanner onResult={submit} paused={busy} />
          <div aria-live="assertive" data-testid="scan-result">
            {state?.kind === "ok" ? (
              <Alert tone="green" className="text-base">
                <CircleCheck aria-hidden />
                <span>
                  <strong>{t("marked")}</strong> <span className="text-xs opacity-70">{state.msg}</span>
                </span>
              </Alert>
            ) : state?.kind === "dup" ? (
              <Alert tone="blue">
                <CircleCheck aria-hidden />
                {t("already")}
              </Alert>
            ) : state?.kind === "queued" ? (
              <Alert tone="saffron">
                <CloudOff aria-hidden />
                {t("queued")}
              </Alert>
            ) : state?.kind === "error" ? (
              <Alert tone="red">
                <CircleX aria-hidden />
                {state.msg}
              </Alert>
            ) : (
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">{t("pointCamera")}</p>
            )}
          </div>
          <details className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800">
            <summary className="flex min-h-touch cursor-pointer items-center gap-2 font-medium">
              <Keyboard className="size-4" aria-hidden />
              {t("manualEntry")}
            </summary>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void submit(manual.trim());
              }}
            >
              <label htmlFor="manual-code" className="sr-only">
                {t("code")}
              </label>
              <Input id="manual-code" value={manual} onChange={(e) => setManual(e.target.value)} placeholder={t("code")} className="font-mono text-sm" data-testid="manual-code" />
              <Button type="submit" disabled={!manual.trim() || busy}>
                {t("submit")}
              </Button>
            </form>
          </details>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
          {qr ? <QrImage value={qr} label={t("myQrAlt", { name })} /> : null}
          <p className="text-lg font-semibold">{name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("myQrHint")}</p>
        </div>
      )}
    </div>
  );
}
