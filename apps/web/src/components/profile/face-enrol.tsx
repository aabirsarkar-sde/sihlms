"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, ScanFace, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";

/** Consent → 3 selfies from the webcam → face-svc embedding. One-click delete. */
export function FaceEnrol({ enrolledAt }: { enrolledAt: string | null }) {
  const t = useTranslations("face");
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [camera, setCamera] = useState(false);
  const [shots, setShots] = useState<Blob[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream>();

  useEffect(() => {
    if (!camera) return;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      .then((s) => {
        stream.current = s;
        if (video.current) video.current.srcObject = s;
      })
      .catch(() => setMsg({ ok: false, text: t("cameraError") }));
    return () => stream.current?.getTracks().forEach((tr) => tr.stop());
  }, [camera, t]);

  const snap = () => {
    const v = video.current;
    if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    c.toBlob((b) => b && setShots((s) => [...s, b].slice(0, 3)), "image/jpeg", 0.9);
  };

  const upload = async () => {
    setBusy(true);
    const fd = new FormData();
    fd.append("consent", "true");
    shots.forEach((s, i) => fd.append("images", s, `selfie${i}.jpg`));
    const r = await api("/api/v1/me/face", { method: "POST", body: fd });
    setBusy(false);
    if (r.error) return setMsg({ ok: false, text: r.error.message });
    setCamera(false);
    setShots([]);
    setMsg({ ok: true, text: t("enrolled") });
    router.refresh();
  };

  if (enrolledAt)
    return (
      <div className="space-y-3">
        <Alert tone="green">
          <ScanFace aria-hidden />
          {t("activeSince", { date: new Date(enrolledAt).toLocaleDateString("en-IN") })}
        </Alert>
        <Button
          variant="destructive"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await api("/api/v1/me/face", { method: "DELETE" });
            setBusy(false);
            setMsg({ ok: true, text: t("deleted") });
            router.refresh();
          }}
          data-testid="delete-face"
        >
          <Trash2 aria-hidden />
          {t("delete")}
        </Button>
        {msg ? <Alert tone={msg.ok ? "green" : "red"}>{msg.text}</Alert> : null}
      </div>
    );

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-700 dark:text-gray-300">{t("explain")}</p>
      <Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} label={t("consent")} />
      {!camera ? (
        <Button disabled={!consent} onClick={() => setCamera(true)}>
          <Camera aria-hidden />
          {t("start")}
        </Button>
      ) : (
        <div className="space-y-3">
          <video ref={video} autoPlay playsInline muted className="aspect-[4/3] w-full max-w-sm rounded-xl bg-black object-cover" aria-label={t("preview")} />
          <p className="text-sm">{t("shotHint", { n: shots.length })}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={snap} disabled={shots.length >= 3}>
              <Camera aria-hidden />
              {t("capture")}
            </Button>
            <Button onClick={upload} disabled={shots.length < 3 || busy}>
              <ScanFace aria-hidden />
              {busy ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      )}
      {msg ? <Alert tone={msg.ok ? "green" : "red"}>{msg.text}</Alert> : null}
    </div>
  );
}
