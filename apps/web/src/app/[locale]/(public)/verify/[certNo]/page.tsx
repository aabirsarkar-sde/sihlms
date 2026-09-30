import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeCheck, CircleHelp, CircleX } from "lucide-react";
import { verifyCertificate } from "@/lib/services/certificates";
import { fmtDate } from "@/lib/utils";
import { VerifyBox } from "../verify-box";
import { UploadCheck } from "../upload-check";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { certNo: string } }) {
  return { title: decodeURIComponent(params.certNo), robots: { index: false } };
}

export default async function VerifyResult({ params }: { params: { certNo: string; locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations("verify");
  const certNo = decodeURIComponent(params.certNo).toUpperCase();
  const r = await verifyCertificate(certNo);
  const tone =
    r.status === "VALID"
      ? { box: "border-brand-600 bg-brand-50 dark:bg-brand-900/40", icon: <BadgeCheck className="size-14 text-brand-600" aria-hidden />, label: t("valid") }
      : r.status === "REVOKED"
        ? { box: "border-red-600 bg-red-50 dark:bg-red-900/30", icon: <CircleX className="size-14 text-red-600" aria-hidden />, label: t("revoked") }
        : { box: "border-gray-400 bg-gray-50 dark:bg-gray-900", icon: <CircleHelp className="size-14 text-gray-600 dark:text-gray-400" aria-hidden />, label: t("notFound") };
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className={`rounded-2xl border-2 p-6 ${tone.box}`} data-testid="verify-status" data-status={r.status}>
        <div className="flex items-center gap-4">
          {tone.icon}
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("certificate")}</p>
            <h1 className="text-2xl font-bold">{tone.label}</h1>
            <p className="font-mono text-sm">{certNo}</p>
          </div>
        </div>
        {r.status !== "NOT_FOUND" ? (
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">{t("holder")}</dt>
              <dd className="text-lg font-semibold">{r.holder}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">{t("issued")}</dt>
              <dd className="text-lg font-semibold">{fmtDate(r.issuedAt, params.locale)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">{t("programme")}</dt>
              <dd className="font-semibold">
                {r.programme} ({r.programmeCode})
              </dd>
              <dd className="text-sm text-gray-700 dark:text-gray-300">{r.institution}</dd>
            </div>
            {r.status === "REVOKED" ? (
              <div className="sm:col-span-2 rounded-lg bg-red-100 p-3 text-red-900 dark:bg-red-900/50 dark:text-red-100">
                <dt className="text-xs font-semibold uppercase">{t("revokedOn", { date: fmtDate(r.revokedAt!, params.locale) })}</dt>
                <dd>{r.revokeReason}</dd>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">{t("hash")}</dt>
              <dd className="break-all font-mono text-xs">{r.sha256}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-gray-700 dark:text-gray-300">{t("notFoundHint")}</p>
        )}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-2 text-sm font-semibold">{t("checkAnother")}</h2>
          <VerifyBox />
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-2 text-sm font-semibold">{t("byFile")}</h2>
          <UploadCheck />
        </div>
      </div>
    </div>
  );
}
