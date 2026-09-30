import { getTranslations, setRequestLocale } from "next-intl/server";
import { Briefcase, Plus } from "lucide-react";
import { Link } from "@/i18n/routing";
import { pageUser } from "@/lib/page";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge, PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { ActionButton } from "@/components/action-button";

export default async function MyJobs({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["EMPLOYER"]);
  const t = await getTranslations("employer");
  const te = await getTranslations("enums");
  const jobs = await db.job.findMany({ where: { employerId: user.id, deletedAt: null }, orderBy: { createdAt: "desc" }, include: { _count: { select: { applications: true } } } });
  const now = new Date();
  return (
    <div className="space-y-4">
      <PageHeader
        icon={<Briefcase />}
        title={t("myJobs")}
        actions={
          <Link href="/employer/jobs/new" className={buttonVariants()}>
            <Plus aria-hidden />
            {t("postJob")}
          </Link>
        }
      />
      <Table>
        <thead>
          <tr>
            <Th>{t("job")}</Th>
            <Th>{t("type")}</Th>
            <Th>{t("location")}</Th>
            <Th className="text-right">{t("applicantsCol")}</Th>
            <Th>{t("closes")}</Th>
            <Th>{t("actions")}</Th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id}>
              <Td>
                <Link href={`/employer/jobs/${j.id}`} className="font-medium text-brand-800 hover:underline dark:text-brand-200">
                  {j.title}
                </Link>
                {j.hidden ? <Badge tone="red" className="ml-2">{t("hiddenByNcct")}</Badge> : null}
              </Td>
              <Td className="text-xs">{te(`jobType.${j.jobType}`)}</Td>
              <Td className="text-xs">
                {j.district}, {j.state}
              </Td>
              <Td className="text-right tabular-nums">{j._count.applications}</Td>
              <Td className="text-xs">{j.closesAt < now ? <Badge>{t("closed")}</Badge> : fmtDate(j.closesAt, locale)}</Td>
              <Td>
                <ActionButton size="sm" variant="ghost" url={`/api/v1/jobs/${j.id}`} method="DELETE">
                  {t("delete")}
                </ActionButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
