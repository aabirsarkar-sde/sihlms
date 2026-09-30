import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Award, BookOpen, Briefcase, CalendarClock, CircleCheck, MapPin, QrCode, ScanLine, Sparkles, UserRoundPen } from "lucide-react";
import { Link } from "@/i18n/routing";
import { pageUser } from "@/lib/page";
import { traineeToday } from "@/lib/services/trainee";
import { jobsForTrainee } from "@/lib/services/jobs";
import { completeness } from "@/lib/services/profile";
import { fmtDate, fmtTime, inr } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, Empty, Progress } from "@/components/ui/misc";

export default async function TraineeToday({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["TRAINEE"]);
  const d = await traineeToday(user.id);
  if (!d.profile || d.profile.gender === "U") redirect(`/${locale}/learn/profile/setup`);
  const t = await getTranslations("today");
  const jobs = await jobsForTrainee(user.id, 3);
  const pct = completeness(d.profile as never, !!d.profile.photoUrl, !!d.profile.faceConsentAt);
  const now = Date.now();
  const next = d.sessions[0];
  const live = next && next.startsAt.getTime() <= now && next.endsAt.getTime() >= now;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t("hello", { name: user.name.split(" ")[0] })}</h1>
        <p className="text-gray-600 dark:text-gray-400">{fmtDate(new Date(), locale)}</p>
      </div>

      {pct < 80 ? (
        <Link href="/learn/profile" className="flex items-center gap-3 rounded-xl border border-saffron-300 bg-saffron-50 p-4 dark:border-saffron-700 dark:bg-saffron-700/10">
          <UserRoundPen className="size-8 shrink-0 text-saffron-600" aria-hidden />
          <div className="flex-1">
            <p className="font-semibold">{t("completeProfile", { pct })}</p>
            <Progress value={pct} tone="saffron" className="mt-1" label={t("profileComplete")} />
          </div>
        </Link>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            <CalendarClock aria-hidden />
            {live ? t("liveNow") : t("nextSession")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {next ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold">{next.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {next.programme.title} · {next.faculty.name}
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm">
                  <MapPin className="size-4 text-brand-600" aria-hidden />
                  {next.room} · {fmtDate(next.startsAt, locale)} {fmtTime(next.startsAt, locale)}–{fmtTime(next.endsAt, locale)}
                </p>
              </div>
              {next.attended ? (
                <Badge tone="green" className="self-start px-3 py-1.5 text-sm">
                  <CircleCheck aria-hidden />
                  {t("present")}
                </Badge>
              ) : live ? (
                <Link href="/learn/scan" className={buttonVariants({ variant: "accent", size: "lg" })}>
                  <ScanLine aria-hidden />
                  {t("scanToMark")}
                </Link>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">{t("noSessions")}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <BookOpen aria-hidden />
              {t("continueLearning")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.continueCourse ? (
              <div className="space-y-3">
                <p className="font-semibold">{d.continueCourse.title}</p>
                <Progress value={(d.continueCourse.done / d.continueCourse.total) * 100} label={t("courseProgress")} />
                <p className="text-sm text-gray-600 dark:text-gray-400">{t("lessonsDone", { done: d.continueCourse.done, total: d.continueCourse.total })}</p>
                <Link href={`/learn/courses/${d.continueCourse.courseId}?lesson=${d.continueCourse.lessonId}`} className={buttonVariants({ className: "w-full" })}>
                  <BookOpen aria-hidden />
                  {t("continue")}
                </Link>
              </div>
            ) : d.enrollments.find((e) => e.programme.course) ? (
              <Link href={`/learn/courses/${d.enrollments.find((e) => e.programme.course)!.programme.course!.id}`} className={buttonVariants({ className: "w-full" })}>
                {t("startCourse")}
              </Link>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("noCourse")}</p>
            )}
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/learn/wallet" className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <Award className="size-7 text-saffron-500" aria-hidden />
            <p className="mt-2 text-2xl font-bold">{d.certCount}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t("certificates")}</p>
          </Link>
          <Link href="/learn/scan?tab=myqr" className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <QrCode className="size-7 text-brand-600" aria-hidden />
            <p className="mt-2 font-semibold">{t("myQr")}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t("myQrHint")}</p>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>
            <Sparkles aria-hidden />
            {t("jobsForYou")}
          </CardTitle>
          <Link href="/learn/jobs" className="text-sm font-semibold text-brand-700 underline dark:text-brand-300">
            {t("seeAll")}
          </Link>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <Empty icon={<Briefcase />} title={t("noJobs")} />
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {jobs.map((j) => (
                <li key={j.job.id}>
                  <Link href={`/learn/jobs?job=${j.job.id}`} className="flex min-h-touch items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-semibold">{j.job.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {j.orgName} · {j.job.district}
                        {j.job.salaryMin ? ` · ${inr(j.job.salaryMin)}+` : ""}
                      </p>
                    </div>
                    <Badge tone={j.score >= 70 ? "green" : j.score >= 45 ? "saffron" : "gray"}>{t("match", { score: j.score })}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
