"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CameraOff, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Camera QR scanner using @zxing/browser. Calls onResult once per distinct code (debounced). */
export function QrScanner({ onResult, paused = false }: { onResult: (text: string) => void; paused?: boolean }) {
  const t = useTranslations("scan");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>();
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const last = useRef<{ text: string; at: number }>({ text: "", at: 0 });
  const cb = useRef(onResult);
  cb.current = onResult;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    let controls: { stop: () => void } | undefined;
    let cancelled = false;
    (async () => {
      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser");
        const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 150 });
        controls = await reader.decodeFromConstraints({ video: { facingMode: facing } }, videoRef.current!, (res) => {
          if (!res || pausedRef.current) return;
          const text = res.getText();
          const now = Date.now();
          if (text === last.current.text && now - last.current.at < 4000) return;
          last.current = { text, at: now };
          cb.current(text);
        });
        if (cancelled) controls.stop();
      } catch {
        setError(t("cameraError"));
      }
    })();
    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [facing, t]);

  if (error)
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl bg-gray-100 p-6 text-center text-sm dark:bg-gray-800">
        <CameraOff className="size-10 text-gray-600 dark:text-gray-400" aria-hidden />
        {error}
      </div>
    );
  return (
    <div className="relative overflow-hidden rounded-2xl bg-black">
      <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline aria-label={t("cameraLabel")} />
      <div className="pointer-events-none absolute inset-10 rounded-2xl border-4 border-white/80" aria-hidden />
      <Button type="button" variant="outline" size="icon" className="absolute bottom-3 right-3 bg-white/90" onClick={() => setFacing(facing === "environment" ? "user" : "environment")} aria-label={t("switchCamera")}>
        <SwitchCamera aria-hidden />
      </Button>
    </div>
  );
}
