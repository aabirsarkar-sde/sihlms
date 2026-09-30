import { getTranslations, setRequestLocale } from "next-intl/server";
import { Briefcase } from "lucide-react";
import { pageUser, sp1, type SP } from "@/lib/page";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { Badge, PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { Pager } from "@/components/pager";
import { ActionButton } from "@/components/action-button";

export default async function JobModeration({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  await pageUser(["SUPER_ADMIN"]);
  const t = await getTranslations("jobModeration");
  const page = Number(sp1(searchParams, "page") ?? 1) || 1;
  const [items, total] = await Promise.all([
    db.job.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, skip: (page - 1) * 25, take: 25, include: { employer: { select: { employerProfile: { select: { orgName: true } } } }, _count: { select: { applications: true } } } }),
    db.job.count({ where: { deletedAt: null } }),
  ]);
  return (
    <div className="space-y-4">
      <PageHeader icon={<Briefcase />} title={t("title")} description={t("subtitle")} />
      <Table>
        <thead>
          <tr>
            <Th>{t("job")}</Th>
            <Th>{t("employer")}</Th>
            <Th>{t("location")}</Th>
            <Th className="text-right">{t("applicants")}</Th>
            <Th>{t("closes")}</Th>
            <Th>{t("visibility")}</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((j) => (
            <tr key={j.id}>
              <Td className="font-medium">{j.title}</Td>
              <Td className="text-xs">{j.employer.employerProfile?.orgName}</Td>
              <Td className="text-xs">
                {j.district}, {j.state}
              </Td>
              <Td className="text-right tabular-nums">{j._count.applications}</Td>
              <Td className="text-xs">{fmtDate(j.closesAt, locale)}</Td>
              <Td>
                <div className="flex items-center gap-2">
                  {j.hidden ? <Badge tone="red">{t("hidden")}</Badge> : <Badge tone="green">{t("visible")}</Badge>}
                  <ActionButton size="sm" variant="outline" url={`/api/v1/jobs/${j.id}`} method="PATCH" json={{ hidden: !j.hidden }}>
                    {j.hidden ? t("show") : t("hide")}
                  </ActionButton>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pager page={page} pageSize={25} total={total} base="/admin/jobs" params={{}} />
    </div>
  );
}
