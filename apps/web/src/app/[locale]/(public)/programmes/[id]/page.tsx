import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookOpen, Building2, CalendarDays, Clock, GraduationCap, MapPin, Target, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fmtDate, fmtTime } from "@/lib/utils";
import { Badge, Progress, STATUS_TONE } from "@/components/ui/misc";
import { NominateSelf } from "./nominate-self";

export default async function ProgrammeDetail({ params: { id, locale } }: { params: { id: string; locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("programme");
  const te = await getTranslations("enums");
  const p = await db.programme.findFirst({
    where: { id, deletedAt: null, status: { in: ["PUBLISHED", "ONGOING", "COMPLETED"] } },
    include: {
      institution: true,
      course: { select: { title: true, _count: { select: { modules: true } } } },
      sessions: { orderBy: { startsAt: "asc" }, include: { faculty: { select: { name: true } } } },
      _count: { select: { enrollments: true } },
    },
  });
  if (!p) notFound();
  const user = await getCurrentUser();
  const mine = user?.role === "TRAINEE" ? await db.nomination.findUnique({ where: { programmeId_traineeId: { programmeId: p.id, traineeId: user.id } }, select: { status: true, id: true } }) : null;
  const open = ["PUBLISHED", "ONGOING"].includes(p.status) && p.nominationDeadline > new Date();
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap gap-2">
        <Badge tone={STATUS_TONE[p.status]}>{te(`programmeStatus.${p.status}`)}</Badge>
        <Badge>{te(`mode.${p.mode}`)}</Badge>
        <Badge tone="gray" className="font-mono">
          {p.code}
        </Badge>
      </div>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{p.title}</h1>
      <p className="mt-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <Building2 className="size-5 text-brand-600" aria-hidden />
        {p.institution.name}
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 text-lg font-semibold">{t("about")}</h2>
            <p className="leading-7 text-gray-800 dark:text-gray-200">{p.description}</p>
          </section>
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              <Target className="size-5 text-brand-600" aria-hidden />
              {t("forWhom")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {p.targetCategories.map((c) => (
                <Badge key={c} tone="green">
                  {te(`category.${c}`)}
                </Badge>
              ))}
            </div>
          </section>
          {p.course ? (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                <BookOpen className="size-5 text-brand-600" aria-hidden />
                {t("course")}
              </h2>
              <p>
                {p.course.title} · {t("modules", { count: p.course._count.modules })}
              </p>
            </section>
          ) : null}
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              <CalendarDays className="size-5 text-brand-600" aria-hidden />
              {t("schedule")}
            </h2>
            <ol className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
              {p.sessions.map((s) => (
                <li key={s.id} className="flex flex-col gap-0.5 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{s.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {s.faculty.name} · {s.room}
                    </p>
                  </div>
                  <p className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                    <Clock className="size-4" aria-hidden />
                    {fmtDate(s.startsAt, locale)} {fmtTime(s.startsAt, locale)}
                  </p>
                </li>
              ))}
              {p.sessions.length === 0 ? <li className="p-3 text-sm text-gray-600">{t("scheduleSoon")}</li> : null}
            </ol>
          </section>
        </div>
        <aside className="h-fit space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
          <dl className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CalendarDays className="size-5 shrink-0 text-brand-600" aria-hidden />
              <div>
                <dt className="text-gray-600 dark:text-gray-400">{t("dates")}</dt>
                <dd className="font-semibold">
                  {fmtDate(p.startDate, locale)} – {fmtDate(p.endDate, locale)}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="size-5 shrink-0 text-brand-600" aria-hidden />
              <div>
                <dt className="text-gray-600 dark:text-gray-400">{t("venue")}</dt>
                <dd className="font-semibold">
                  {p.institution.city}, {p.institution.state}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="size-5 shrink-0 text-brand-600" aria-hidden />
              <div>
                <dt className="text-gray-600 dark:text-gray-400">{t("deadline")}</dt>
                <dd className="font-semibold">{fmtDate(p.nominationDeadline, locale)}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <GraduationCap className="size-5 shrink-0 text-brand-600" aria-hidden />
              <div>
                <dt className="text-gray-600 dark:text-gray-400">{t("toPass")}</dt>
                <dd className="font-semibold">{t("passRule", { att: p.minAttendancePct, score: p.passMarkPct })}</dd>
              </div>
            </div>
          </dl>
          <div>
            <p className="mb-1 flex items-center gap-1 text-sm">
              <Users className="size-4" aria-hidden />
              {t("seats", { taken: p._count.enrollments, capacity: p.capacity })}
            </p>
            <Progress value={(p._count.enrollments / p.capacity) * 100} label={t("seatsLabel")} />
          </div>
          <NominateSelf programmeId={p.id} open={open} loggedIn={!!user} isTrainee={user?.role === "TRAINEE"} status={mine?.status ?? null} nominationId={mine?.id ?? null} />
        </aside>
      </div>
    </div>
  );
}
