import { getTranslations, setRequestLocale } from "next-intl/server";
import { Award, BookOpen, Briefcase, CalendarCheck, ClipboardList, QrCode, ShieldCheck, Smartphone, UserPlus, WifiOff } from "lucide-react";
import { Link } from "@/i18n/routing";
import { db } from "@/lib/db";
import { num } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { VerifyBox } from "./verify/verify-box";


export default async function Landing({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const [trainees, certificates, institutions, placed] = await Promise.all([
    db.enrollment.groupBy({ by: ["traineeId"] }).then((r) => r.length),
    db.certificate.count({ where: { revokedAt: null } }),
    db.institution.count(),
    db.application.count({ where: { status: "HIRED" } }),
  ]);
  const steps = [
    { icon: UserPlus, key: "nominate" },
    { icon: CalendarCheck, key: "schedule" },
    { icon: QrCode, key: "attend" },
    { icon: BookOpen, key: "learn" },
    { icon: Award, key: "certify" },
    { icon: Briefcase, key: "place" },
  ];
  return (
    <>
      <section className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.3fr_1fr] md:py-16">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
              <ShieldCheck className="size-4" aria-hidden />
              {t("badge")}
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">{t("title")}</h1>
            <p className="mt-4 max-w-xl text-lg text-brand-50">{t("subtitle")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/register" className={buttonVariants({ variant: "accent", size: "lg" })}>
                <UserPlus aria-hidden />
                {t("ctaRegister")}
              </Link>
              <Link href="/programmes" className={buttonVariants({ variant: "outline", size: "lg", className: "border-white/50 bg-transparent text-white hover:bg-white/10 dark:bg-transparent" })}>
                <ClipboardList aria-hidden />
                {t("ctaBrowse")}
              </Link>
            </div>
          </div>
          <div className="self-start rounded-2xl bg-white p-5 text-gray-900 shadow-xl dark:bg-gray-900 dark:text-gray-100">
            <h2 className="mb-1 flex items-center gap-2 font-semibold">
              <ShieldCheck className="size-5 text-brand-600" aria-hidden />
              {t("verifyTitle")}
            </h2>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{t("verifyHint")}</p>
            <VerifyBox />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10" aria-labelledby="stats">
        <h2 id="stats" className="sr-only">
          {t("statsTitle")}
        </h2>
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            [t("statTrainees"), trainees],
            [t("statCertificates"), certificates],
            [t("statInstitutions"), institutions],
            [t("statPlaced"), placed],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-gray-200 p-4 text-center dark:border-gray-800">
              <dt className="text-sm text-gray-600 dark:text-gray-400">{label}</dt>
              <dd className="mt-1 text-3xl font-bold text-brand-700 dark:text-brand-300">{num(Number(value))}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-gray-50 py-12 dark:bg-gray-900" aria-labelledby="how">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="how" className="text-2xl font-bold">
            {t("howTitle")}
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.key} className="flex gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-950">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-saffron-100 text-saffron-700">
                  <s.icon className="size-6" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold">
                    {i + 1}. {t(`steps.${s.key}.title`)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t(`steps.${s.key}.body`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 md:grid-cols-3">
        {[
          { icon: WifiOff, key: "offline" },
          { icon: Smartphone, key: "mobile" },
          { icon: ShieldCheck, key: "verified" },
        ].map((f) => (
          <div key={f.key} className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
            <f.icon className="size-8 text-brand-600" aria-hidden />
            <h3 className="mt-3 font-semibold">{t(`features.${f.key}.title`)}</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t(`features.${f.key}.body`)}</p>
          </div>
        ))}
      </section>
    </>
  );
}
