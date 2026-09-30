import { getTranslations, setRequestLocale } from "next-intl/server";
import { Briefcase, Building2, IndianRupee, MapPin, Send, Sparkles } from "lucide-react";
import { pageUser, sp1, type SP } from "@/lib/page";
import { db } from "@/lib/db";
import { jobsForTrainee } from "@/lib/services/jobs";
import { fmtDate, inr } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, Empty, PageHeader, STATUS_TONE } from "@/components/ui/misc";
import { ApplyButton } from "./apply-button";

export default async function TraineeJobs({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const user = await pageUser(["TRAINEE"]);
  const t = await getTranslations("traineeJobs");
  const te = await getTranslations("enums");
  const focus = sp1(searchParams, "job");
  const [ranked, apps, profile] = await Promise.all([
    jobsForTrainee(user.id, 30),
    db.application.findMany({ where: { traineeId: user.id }, orderBy: { updatedAt: "desc" }, include: { job: { include: { employer: { select: { employerProfile: { select: { orgName: true } } } } } } } }),
    db.traineeProfile.findUnique({ where: { userId: user.id }, select: { openToWork: true } }),
  ]);
  const applied = new Map(apps.map((a) => [a.jobId, a.status]));
  const focused = focus ? ranked.find((r) => r.job.id === focus) : undefined;
  const list = focused ? [focused, ...ranked.filter((r) => r.job.id !== focus)] : ranked;
  return (
    <div className="space-y-6">
      <PageHeader icon={<Briefcase />} title={t("title")} description={profile?.openToWork ? t("openToWorkOn") : t("openToWorkOff")} />
      {apps.length ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <Send aria-hidden />
              {t("myApplications")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800" data-testid="my-applications">
              {apps.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div>
                    <p className="font-medium">{a.job.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{a.job.employer.employerProfile?.orgName}</p>
                  </div>
                  <Badge tone={STATUS_TONE[a.status] ?? "gray"}>{te(`applicationStatus.${a.status}`)}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="size-5 text-saffron-500" aria-hidden />
          {t("matching")}
        </h2>
        {list.length === 0 ? (
          <Empty icon={<Briefcase />} title={t("empty")} />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {list.map((r) => (
              <li key={r.job.id} id={`job-${r.job.id}`} className={`flex flex-col rounded-xl border bg-white p-4 dark:bg-gray-900 ${r.job.id === focus ? "border-saffron-500 ring-2 ring-saffron-300" : "border-gray-200 dark:border-gray-800"}`} data-testid="job-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{r.job.title}</h3>
                    <p className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                      <Building2 className="size-4 text-brand-600" aria-hidden />
                      {r.orgName}
                    </p>
                  </div>
                  <Badge tone={r.score >= 70 ? "green" : r.score >= 45 ? "saffron" : "gray"} className="shrink-0 text-sm">
                    {t("match", { score: r.score })}
                  </Badge>
                </div>
                <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <p className="flex items-center gap-1">
                    <MapPin className="size-4 text-brand-600" aria-hidden />
                    {r.job.district}, {r.job.state}
                    {r.distanceKm != null ? ` · ${t("km", { km: r.distanceKm })}` : ""}
                  </p>
                  {r.job.salaryMin ? (
                    <p className="flex items-center gap-1">
                      <IndianRupee className="size-4 text-brand-600" aria-hidden />
                      {inr(r.job.salaryMin)} – {inr(r.job.salaryMax ?? r.job.salaryMin)}
                    </p>
                  ) : null}
                </div>
                {r.job.id === focus ? <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">{r.job.description}</p> : null}
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge>{te(`jobType.${r.job.jobType}`)}</Badge>
                  {r.job.requiredSkills.map((s) => (
                    <Badge key={s} tone="blue">
                      {s}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">{t("closes", { date: fmtDate(r.job.closesAt, locale) })}</p>
                <div className="mt-auto pt-3">
                  <ApplyButton jobId={r.job.id} status={applied.get(r.job.id) ?? null} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
