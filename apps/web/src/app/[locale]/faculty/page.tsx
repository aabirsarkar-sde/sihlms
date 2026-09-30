import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarClock, MapPin, MonitorPlay, Users } from "lucide-react";
import { Link } from "@/i18n/routing";
import { pageUser } from "@/lib/page";
import { db } from "@/lib/db";
import { fmtDate, fmtTime } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge, Empty, PageHeader } from "@/components/ui/misc";

export default async function FacultyToday({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["FACULTY", "INSTITUTE_ADMIN"]);
  const t = await getTranslations("faculty");
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 3600_000);
  const dayStart = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - 5.5 * 3600_000);
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);
  const scope = user.role === "FACULTY" ? { facultyId: user.id } : { programme: { institutionId: user.institutionId ?? "-" } };
  const [today, upcoming] = await Promise.all([
    db.session.findMany({
      where: { ...scope, startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } },
      orderBy: { startsAt: "asc" },
      include: { programme: { select: { title: true, code: true, _count: { select: { enrollments: true } } } }, faculty: { select: { name: true } }, _count: { select: { attendances: { where: { present: true } } } } },
    }),
    db.session.findMany({ where: { ...scope, startsAt: { gte: dayEnd } }, orderBy: { startsAt: "asc" }, take: 6, include: { programme: { select: { title: true, code: true } } } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader icon={<CalendarClock />} title={t("todayTitle")} description={fmtDate(now, locale)} />
      {today.length === 0 ? (
        <Empty icon={<CalendarClock />} title={t("noToday")} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {today.map((s) => {
            const live = s.startsAt <= now && s.endsAt >= now;
            return (
              <li key={s.id} className={`rounded-xl border bg-white p-4 dark:bg-gray-900 ${live ? "border-saffron-500 ring-2 ring-saffron-200" : "border-gray-200 dark:border-gray-800"}`}>
                <div className="flex items-center justify-between gap-2">
                  {live ? <Badge tone="saffron">{t("liveNow")}</Badge> : s.endsAt < now ? <Badge>{t("ended")}</Badge> : <Badge tone="blue">{t("later")}</Badge>}
                  <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{s.programme.code}</span>
                </div>
                <h2 className="mt-2 text-lg font-semibold">{s.title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{s.programme.title}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="flex items-center gap-1">
                    <CalendarClock className="size-4 text-brand-600" aria-hidden />
                    {fmtTime(s.startsAt, locale)}–{fmtTime(s.endsAt, locale)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-4 text-brand-600" aria-hidden />
                    {s.room}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="size-4 text-brand-600" aria-hidden />
                    {t("presentOf", { present: s._count.attendances, total: s.programme._count.enrollments })}
                  </span>
                </div>
                <Link href={`/faculty/sessions/${s.id}`} className={buttonVariants({ variant: live ? "accent" : "default", className: "mt-4 w-full" })} data-testid="open-live">
                  <MonitorPlay aria-hidden />
                  {t("openLive")}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {upcoming.length ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold">{t("upcoming")}</h2>
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
            {upcoming.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                <span>
                  <span className="font-medium">{s.title}</span>
                  <span className="block text-xs text-gray-600 dark:text-gray-400">{s.programme.title}</span>
                </span>
                <span className="whitespace-nowrap">
                  {fmtDate(s.startsAt, locale)} {fmtTime(s.startsAt, locale)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
