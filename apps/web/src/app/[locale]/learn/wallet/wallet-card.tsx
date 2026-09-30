"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Award, CloudUpload, Download, ExternalLink, Share2 } from "lucide-react";
import { api } from "@/lib/fetcher";
import { QrImage } from "@/components/qr/qr-image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, Badge } from "@/components/ui/misc";

type C = { id: string; certNo: string; title: string; institution: string; issued: string; revoked: boolean; revokeReason: string | null; pdf: string; verifyUrl: string };

export function WalletCard({ cert }: { cert: C }) {
  const t = useTranslations("wallet");
  const [dl, setDl] = useState<{ ok: boolean; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const share = `https://wa.me/?text=${encodeURIComponent(t("shareText", { title: cert.title, url: cert.verifyUrl }))}`;
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start gap-3 bg-gradient-to-r from-brand-800 to-brand-600 p-4 text-white">
        <Award className="size-9 shrink-0 text-saffron-300" aria-hidden />
        <div className="min-w-0">
          <p className="font-semibold leading-snug">{cert.title}</p>
          <p className="text-sm text-brand-100">{cert.institution}</p>
        </div>
      </div>
      <div className="flex gap-4 p-4">
        <QrImage value={cert.verifyUrl} size={104} label={t("qrAlt")} />
        <div className="min-w-0 space-y-1 text-sm">
          <p className="break-all font-mono text-xs">{cert.certNo}</p>
          <p>{t("issuedOn", { date: cert.issued })}</p>
          {cert.revoked ? <Badge tone="red">{t("revoked")}</Badge> : <Badge tone="green">{t("valid")}</Badge>}
        </div>
      </div>
      {cert.revoked && cert.revokeReason ? (
        <Alert tone="red" className="mx-4 mb-3">
          {cert.revokeReason}
        </Alert>
      ) : null}
      <div className="grid grid-cols-2 gap-2 border-t border-gray-100 p-3 dark:border-gray-800 sm:grid-cols-4">
        <a href={cert.pdf} className={buttonVariants({ variant: "outline", size: "sm" })} download>
          <Download aria-hidden />
          {t("download")}
        </a>
        <a href={share} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Share2 aria-hidden />
          {t("share")}
        </a>
        <a href={cert.verifyUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <ExternalLink aria-hidden />
          {t("verify")}
        </a>
        <Button
          variant="outline"
          size="sm"
          disabled={busy || cert.revoked}
          onClick={async () => {
            setBusy(true);
            const r = await api<{ reference: string }>(`/api/v1/certificates/${cert.id}/digilocker`, { method: "POST", json: {} });
            setBusy(false);
            setDl(r.error ? { ok: false, msg: r.error.message } : { ok: true, msg: t("digilockerOk", { ref: r.data!.reference }) });
          }}
        >
          <CloudUpload aria-hidden />
          {t("digilocker")}
        </Button>
      </div>
      {dl ? (
        <Alert tone={dl.ok ? "green" : "red"} className="mx-3 mb-3">
          {dl.msg}
        </Alert>
      ) : null}
    </div>
  );
}
