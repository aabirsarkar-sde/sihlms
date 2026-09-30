import { getTranslations, setRequestLocale } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import { VerifyBox } from "./verify-box";
import { UploadCheck } from "./upload-check";

export async function generateMetadata() {
  const t = await getTranslations("verify");
  return { title: t("title") };
}

export default async function VerifyPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("verify");
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <ShieldCheck className="size-7 text-brand-600" aria-hidden />
        {t("title")}
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">{t("intro")}</p>
      <div className="mt-6 rounded-xl border border-gray-200 p-5 dark:border-gray-800">
        <h2 className="mb-3 font-semibold">{t("byNumber")}</h2>
        <VerifyBox />
      </div>
      <div className="mt-4 rounded-xl border border-gray-200 p-5 dark:border-gray-800">
        <h2 className="mb-1 font-semibold">{t("byFile")}</h2>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{t("byFileHint")}</p>
        <UploadCheck />
      </div>
    </div>
  );
}
