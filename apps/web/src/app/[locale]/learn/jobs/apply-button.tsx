"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, Send } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";

export function ApplyButton({ jobId, status }: { jobId: string; status: string | null }) {
  const t = useTranslations("traineeJobs");
  const te = useTranslations("enums");
  const router = useRouter();
  const [s, setS] = useState(status);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  if (s)
    return (
      <p className="flex min-h-touch items-center justify-center gap-2 rounded-lg bg-brand-50 text-sm font-semibold text-brand-800 dark:bg-brand-900/40 dark:text-brand-100" data-testid="applied">
        <CircleCheck className="size-4" aria-hidden />
        {te(`applicationStatus.${s}`)}
      </p>
    );
  return (
    <>
      <Button
        className="w-full"
        disabled={busy}
        data-testid="apply"
        onClick={async () => {
          setBusy(true);
          const r = await api(`/api/v1/jobs/${jobId}/apply`, { method: "POST", json: {} });
          setBusy(false);
          if (r.error) return setErr(r.error.message);
          setS("APPLIED");
          router.refresh();
        }}
      >
        <Send aria-hidden />
        {busy ? t("applying") : t("apply")}
      </Button>
      {err ? <p className="mt-1 text-sm text-red-700">{err}</p> : null}
    </>
  );
}
