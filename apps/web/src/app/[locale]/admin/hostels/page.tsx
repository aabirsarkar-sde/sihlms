import { getTranslations, setRequestLocale } from "next-intl/server";
import { BedDouble } from "lucide-react";
import { pageUser, sp1, type SP } from "@/lib/page";
import { db } from "@/lib/db";
import { Empty, PageHeader } from "@/components/ui/misc";
import { HostelGrid } from "@/components/admin/hostel-grid";
import { NewHostel } from "./new-hostel";

export default async function Hostels({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const user = await pageUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  const t = await getTranslations("hostel");
  const institutions = user.role === "SUPER_ADMIN" ? await db.institution.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }) : [];
  const institutionId = user.role === "SUPER_ADMIN" ? sp1(searchParams, "institution") ?? institutions[0]?.id : user.institutionId;
  const hostels = await db.hostel.findMany({
    where: { institutionId: institutionId ?? "-" },
    orderBy: { name: "asc" },
    include: { rooms: { orderBy: { number: "asc" }, include: { allocations: { where: { checkOut: null, programme: { endDate: { gte: new Date() } } }, include: { trainee: { select: { name: true } }, programme: { select: { code: true } } } } } } },
  });
  return (
    <div className="space-y-4">
      <PageHeader icon={<BedDouble />} title={t("title")} description={t("subtitle")} actions={user.role === "INSTITUTE_ADMIN" ? <NewHostel /> : null} />
      {user.role === "SUPER_ADMIN" ? (
        <form method="get" className="flex gap-2">
          <label htmlFor="inst" className="sr-only">
            {t("institution")}
          </label>
          <select id="inst" name="institution" defaultValue={institutionId ?? undefined} className="h-11 rounded-lg border border-gray-300 px-2 dark:border-gray-700 dark:bg-gray-900">
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <button className="h-11 rounded-lg border border-gray-300 px-3 text-sm font-semibold dark:border-gray-700" type="submit">
            {t("show")}
          </button>
        </form>
      ) : null}
      {hostels.length === 0 ? (
        <Empty icon={<BedDouble />} title={t("empty")} />
      ) : (
        <HostelGrid
          editable={user.role === "INSTITUTE_ADMIN"}
          hostels={hostels.map((h) => ({ id: h.id, name: h.name, gender: h.gender, rooms: h.rooms.map((r) => ({ id: r.id, number: r.number, beds: r.beds, allocations: r.allocations.map((a) => ({ id: a.id, name: a.trainee.name, programme: a.programme.code })) })) }))}
        />
      )}
    </div>
  );
}
