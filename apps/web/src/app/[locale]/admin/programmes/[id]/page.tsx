import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Award, BedDouble, CalendarDays, ClipboardList, Info, Truck, Users } from "lucide-react";
import { Link } from "@/i18n/routing";
import { pageUser, sp1, type SP } from "@/lib/page";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { mealCounts } from "@/lib/services/programmes";
import { timetableData } from "@/lib/services/staff";
import { fmtDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Badge, STATUS_TONE } from "@/components/ui/misc";
import { NominationQueue } from "@/components/admin/nomination-queue";
import { IssueCertificates } from "@/components/admin/issue-certificates";
import { HostelGrid } from "@/components/admin/hostel-grid";
import { Logistics } from "@/components/admin/logistics";
import { AllocateButton, ProgrammeActions } from "@/components/admin/programme-actions";
import { TimetableBuilder } from "@/components/timetable/timetable-builder";

const TABS = [
  { k: "nominations", icon: Users },
  { k: "timetable", icon: CalendarDays },
  { k: "hostel", icon: BedDouble },
  { k: "logistics", icon: Truck },
  { k: "certificates", icon: Award },
  { k: "overview", icon: Info },
] as const;

export const dynamic = "force-dynamic";

export default async function Workspace({ params: { id, locale }, searchParams }: { params: { id: string; locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const user = await pageUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  const t = await getTranslations("workspace");
  const te = await getTranslations("enums");
  const p = await db.programme.findFirst({ where: { id, deletedAt: null }, include: { institution: true, course: { select: { title: true } }, coordinator: { select: { name: true } } } });
  if (!p || !can(user, "read", "programme", { institutionId: p.institutionId })) notFound();
  const editable = can(user, "update", "nomination", { institutionId: p.institutionId });
  const tab = (TABS.find((x) => x.k === sp1(searchParams, "tab"))?.k ?? "nominations") as (typeof TABS)[number]["k"];

  let body: React.ReactNode = null;
  if (tab === "nominations") body = <NominationQueue programmeId={p.id} />;
  if (tab === "timetable") {
    const d = await timetableData(p.id, p.institutionId);
    body = <TimetableBuilder programmeId={p.id} startDate={p.startDate.toISOString()} sessions={d.sessions} faculty={d.faculty} canEdit={editable} />;
  }
  if (tab === "hostel") {
    const hostels = await db.hostel.findMany({
      where: { institutionId: p.institutionId },
      orderBy: { name: "asc" },
      include: {
        rooms: {
          orderBy: { number: "asc" },
          include: { allocations: { where: { checkOut: null, programme: { startDate: { lte: p.endDate }, endDate: { gte: p.startDate } } }, include: { trainee: { select: { name: true } }, programme: { select: { code: true } } } } },
        },
      },
    });
    const [enrolled, allocated] = await Promise.all([db.enrollment.count({ where: { programmeId: p.id } }), db.roomAllocation.count({ where: { programmeId: p.id } })]);
    body = (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">{t("allocSummary", { allocated, enrolled })}</p>
          {editable ? <AllocateButton id={p.id} /> : null}
        </div>
        <HostelGrid
          editable={editable}
          hostels={hostels.map((h) => ({
            id: h.id,
            name: h.name,
            gender: h.gender,
            rooms: h.rooms.map((r) => ({ id: r.id, number: r.number, beds: r.beds, allocations: r.allocations.map((a) => ({ id: a.id, name: a.trainee.name, programme: a.programme.code, highlight: a.programmeId === p.id })) })),
          }))}
        />
      </div>
    );
  }
  if (tab === "logistics") {
    const [items, meals] = await Promise.all([db.logisticsItem.findMany({ where: { programmeId: p.id } }), mealCounts(p.id)]);
    body = <Logistics programmeId={p.id} editable={editable} meals={meals} initial={items.map((i) => ({ kind: i.kind as "TRAVEL", items: ((i.details as { items?: { label: string; done: boolean }[] }).items ?? []) }))} />;
  }
  if (tab === "certificates") body = <IssueCertificates programmeId={p.id} canIssue={user.role === "INSTITUTE_ADMIN"} />;
  if (tab === "overview")
    body = (
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        {[
          [t("institution"), p.institution.name],
          [t("coordinator"), p.coordinator.name],
          [t("dates"), `${fmtDate(p.startDate, locale)} – ${fmtDate(p.endDate, locale)}`],
          [t("deadline"), fmtDate(p.nominationDeadline, locale)],
          [t("mode"), te(`mode.${p.mode}`)],
          [t("course"), p.course?.title ?? "—"],
          [t("rules"), t("rulesText", { att: p.minAttendancePct, pass: p.passMarkPct })],
          [t("targets"), p.targetCategories.map((c) => te(`category.${c}`)).join(", ")],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-gray-600 dark:text-gray-400">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
        <div className="sm:col-span-2">
          <dt className="text-gray-600 dark:text-gray-400">{t("description")}</dt>
          <dd>{p.description}</dd>
        </div>
      </dl>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[p.status]}>{te(`programmeStatus.${p.status}`)}</Badge>
            <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{p.code}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold">{p.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {p.institution.name} · {fmtDate(p.startDate, locale)} – {fmtDate(p.endDate, locale)}
          </p>
        </div>
        <ProgrammeActions id={p.id} status={p.status} editable={editable} />
      </div>
      <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-800" aria-label={t("sections")}>
        {TABS.map((x) => (
          <Link key={x.k} href={`/admin/programmes/${p.id}?tab=${x.k}`} aria-current={tab === x.k ? "page" : undefined} className={cn("flex min-h-touch shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-semibold", tab === x.k ? "border-brand-700 text-brand-800 dark:text-brand-200" : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400")}>
            <x.icon className="size-4" aria-hidden />
            {t(`tab.${x.k}`)}
          </Link>
        ))}
      </nav>
      <div>{body}</div>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        <ClipboardList className="mr-1 inline size-3" aria-hidden />
        {t("auditNote")}
      </p>
    </div>
  );
}
