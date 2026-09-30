import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarDays } from "lucide-react";
import { pageUser, sp1, type SP } from "@/lib/page";
import { staffProgrammes, timetableData } from "@/lib/services/staff";
import { Empty, PageHeader } from "@/components/ui/misc";
import { ProgrammePicker } from "@/components/programme-picker";
import { TimetableBuilder } from "@/components/timetable/timetable-builder";

export const dynamic = "force-dynamic";

export default async function Timetable({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const user = await pageUser(["FACULTY", "INSTITUTE_ADMIN"]);
  const t = await getTranslations("timetable");
  const programmes = await staffProgrammes(user);
  const current = programmes.find((p) => p.id === sp1(searchParams, "programme")) ?? programmes.find((p) => p.status === "ONGOING") ?? programmes[0];
  if (!current) return <Empty icon={<CalendarDays />} title={t("noProgrammes")} />;
  const data = await timetableData(current.id, current.institutionId);
  const canEdit = user.role === "INSTITUTE_ADMIN" || current.coordinatorId === user.id;
  return (
    <div className="space-y-4">
      <PageHeader icon={<CalendarDays />} title={t("pageTitle")} />
      <ProgrammePicker programmes={programmes} value={current.id} />
      <TimetableBuilder key={current.id} programmeId={current.id} startDate={current.startDate.toISOString()} sessions={data.sessions} faculty={data.faculty} canEdit={canEdit} />
    </div>
  );
}
