"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, CircleX, FileUp } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Alert } from "@/components/ui/misc";

type R = { match: boolean; sha256: string; result?: { status: string; certNo: string; holder: string } };

export function UploadCheck() {
  const t = useTranslations("verify");
  const [r, setR] = useState<R | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <label className="flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900">
        <FileUp className="size-5 text-brand-600" aria-hidden />
        {busy ? t("checking") : t("choosePdf")}
        <input
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            const fd = new FormData();
            fd.append("file", f);
            const res = await fetch("/api/v1/verify/upload", { method: "POST", body: fd });
            setR(await res.json());
            setBusy(false);
          }}
        />
      </label>
      {r ? (
        <div className="mt-3 space-y-2">
          {r.match && r.result ? (
            <Alert tone={r.result.status === "VALID" ? "green" : "red"}>
              <CircleCheck aria-hidden />
              <span>
                {t("fileMatches", { certNo: r.result.certNo, holder: r.result.holder })}{" "}
                <Link className="font-semibold underline" href={`/verify/${r.result.certNo}`}>
                  {t("viewDetails")}
                </Link>
              </span>
            </Alert>
          ) : (
            <Alert tone="red">
              <CircleX aria-hidden />
              {t("fileNoMatch")}
            </Alert>
          )}
          <p className="break-all font-mono text-xs text-gray-600 dark:text-gray-400">SHA-256: {r.sha256}</p>
        </div>
      ) : null}
    </div>
  );
}
