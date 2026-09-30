import { getTranslations, setRequestLocale } from "next-intl/server";
import { BedDouble, BookOpen, Building2, CalendarDays, CircleCheck, Clock, Layers, Search } from "lucide-react";
import { Link } from "@/i18n/routing";
import { pageUser } from "@/lib/page";
import { db } from "@/lib/db";
import { fmtDate, fmtTime } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, Empty, PageHeader, STATUS_TONE } from "@/components/ui/misc";

export default async function MyProgrammes({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["TRAINEE"]);
  const t = await getTranslations("myProgrammes");
  const te = await getTranslations("enums");
  const noms = await db.nomination.findMany({
    where: { traineeId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      programme: {
        include: {
          institution: { select: { name: true, city: true } },
          sessions: { orderBy: { startsAt: "asc" }, include: { faculty: { select: { name: true } } } },
          allocations: { where: { traineeId: user.id }, include: { room: { include: { hostel: { select: { name: true } } } } } },
          certificates: { where: { traineeId: user.id }, select: { certNo: true } },
        },
      },
    },
  });
  const attended = new Set((await db.attendance.findMany({ where: { traineeId: user.id, present: true }, select: { sessionId: true } })).map((a) => a.sessionId));
  return (
    <div>
      <PageHeader
        icon={<Layers />}
        title={t("title")}
        actions={
          <Link href="/programmes" className={buttonVariants({ variant: "outline" })}>
            <Search aria-hidden />
            {t("findMore")}
          </Link>
        }
      />
      {noms.length === 0 ? (
        <Empty icon={<Layers />} title={t("empty")}>
          <Link href="/programmes" className="font-semibold text-brand-700 underline">
            {t("browse")}
          </Link>
        </Empty>
      ) : (
        <div className="space-y-4">
          {noms.map((n) => {
            const p = n.programme;
            const room = p.allocations[0]?.room;
            const past = p.sessions.filter((s) => s.startsAt <= new Date());
            const att = past.filter((s) => attended.has(s.id)).length;
            return (
              <Card key={n.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={STATUS_TONE[n.status]}>{te(`nominationStatus.${n.status}`)}</Badge>
                    <Badge tone={STATUS_TONE[p.status]}>{te(`programmeStatus.${p.status}`)}</Badge>
                    {p.certificates[0] ? (
                      <Badge tone="green">
                        <CircleCheck aria-hidden />
                        {t("certified")}
                      </Badge>
                    ) : null}
                  </div>
                  <CardTitle className="text-lg">
                    <Link href={`/programmes/${p.id}`} className="hover:underline">
                      {p.title}
                    </Link>
                  </CardTitle>
                  <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Building2 className="size-4" aria-hidden />
                      {p.institution.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-4" aria-hidden />
                      {fmtDate(p.startDate, locale)} – {fmtDate(p.endDate, locale)}
                    </span>
                  </p>
                </CardHeader>
                {n.status === "APPROVED" ? (
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {p.courseId ? (
                        <Link href={`/learn/courses/${p.courseId}`} className={buttonVariants({ size: "sm" })}>
                          <BookOpen aria-hidden />
                          {t("openCourse")}
                        </Link>
                      ) : null}
                      {room ? (
                        <span className="inline-flex min-h-touch items-center gap-2 rounded-lg bg-gray-100 px-3 text-sm dark:bg-gray-800">
                          <BedDouble className="size-4 text-brand-600" aria-hidden />
                          {t("room", { hostel: room.hostel.name, room: room.number })}
                        </span>
                      ) : null}
                      {past.length ? (
                        <span className="inline-flex min-h-touch items-center gap-2 rounded-lg bg-gray-100 px-3 text-sm dark:bg-gray-800">
                          <CircleCheck className="size-4 text-brand-600" aria-hidden />
                          {t("attendance", { att, total: past.length })}
                        </span>
                      ) : null}
                    </div>
                    {p.sessions.length ? (
                      <details>
                        <summary className="flex min-h-touch cursor-pointer items-center gap-2 text-sm font-semibold">
                          <Clock className="size-4" aria-hidden />
                          {t("timetable", { n: p.sessions.length })}
                        </summary>
                        <ul className="mt-2 divide-y divide-gray-100 text-sm dark:divide-gray-800">
                          {p.sessions.map((s) => (
                            <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                              <span>
                                <span className="font-medium">{s.title}</span>
                                <span className="block text-xs text-gray-600 dark:text-gray-400">
                                  {s.faculty.name} · {s.room}
                                </span>
                              </span>
                              <span className="flex items-center gap-2 whitespace-nowrap text-xs">
                                {attended.has(s.id) ? <CircleCheck className="size-4 text-brand-600" aria-label={t("present")} /> : null}
                                {fmtDate(s.startsAt, locale)} {fmtTime(s.startsAt, locale)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </CardContent>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
