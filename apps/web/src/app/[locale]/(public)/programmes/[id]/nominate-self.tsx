"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, LogIn, Send, Undo2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";

export function NominateSelf({ programmeId, open, loggedIn, isTrainee, status, nominationId }: { programmeId: string; open: boolean; loggedIn: boolean; isTrainee: boolean; status: string | null; nominationId: string | null }) {
  const t = useTranslations("programme");
  const te = useTranslations("enums");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  if (!loggedIn)
    return (
      <Link href={`/login`} className={buttonVariants({ className: "w-full" })}>
        <LogIn aria-hidden />
        {t("loginToApply")}
      </Link>
    );
  if (!isTrainee) return null;
  if (status && status !== "WITHDRAWN")
    return (
      <div className="space-y-2">
        <Alert tone={status === "APPROVED" ? "green" : status === "REJECTED" ? "red" : "blue"}>
          <CircleCheck aria-hidden />
          {t("yourStatus", { status: te(`nominationStatus.${status}`) })}
        </Alert>
        {["SUBMITTED", "APPROVED", "WAITLISTED"].includes(status) && nominationId ? (
          <Button
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const r = await api(`/api/v1/nominations/${nominationId}/withdraw`, { method: "POST", json: {} });
              setBusy(false);
              if (r.error) setErr(r.error.message);
              else router.refresh();
            }}
          >
            <Undo2 aria-hidden />
            {t("withdraw")}
          </Button>
        ) : null}
        {err ? <Alert tone="red">{err}</Alert> : null}
      </div>
    );
  if (!open) return <Alert tone="gray">{t("closed")}</Alert>;
  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const r = await api(`/api/v1/programmes/${programmeId}/nominations`, { method: "POST", json: {} });
          setBusy(false);
          if (r.error) setErr(r.error.message);
          else router.refresh();
        }}
      >
        <Send aria-hidden />
        {t("applySelf")}
      </Button>
      {err ? <Alert tone="red">{err}</Alert> : null}
    </div>
  );
}
