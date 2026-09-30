import { getTranslations, setRequestLocale } from "next-intl/server";
import { Briefcase, KanbanSquare, Plus } from "lucide-react";
import { Link } from "@/i18n/routing";
import { pageUser } from "@/lib/page";
import { db } from "@/lib/db";
import { PIPELINE } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { Empty, PageHeader, Stat } from "@/components/ui/misc";

export default async function EmployerHome({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["EMPLOYER"]);
  const t = await getTranslations("employer");
  const te = await getTranslations("enums");
  const [jobs, byStatus] = await Promise.all([
    db.job.findMany({ where: { employerId: user.id, deletedAt: null }, orderBy: { createdAt: "desc" }, include: { applications: { select: { status: true } } } }),
    db.application.groupBy({ by: ["status"], where: { job: { employerId: user.id, deletedAt: null } }, _count: true }),
  ]);
  const n = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;
  return (
    <div className="space-y-5">
      <PageHeader
        icon={<KanbanSquare />}
        title={t("overview")}
        actions={
          <Link href="/employer/jobs/new" className={buttonVariants()}>
            <Plus aria-hidden />
            {t("postJob")}
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {PIPELINE.map((s) => (
          <Stat key={s} label={te(`applicationStatus.${s}`)} value={n(s)} />
        ))}
      </div>
      {jobs.length === 0 ? (
        <Empty icon={<Briefcase />} title={t("noJobs")} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link href={`/employer/jobs/${j.id}`} className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-brand-500 dark:border-gray-800 dark:bg-gray-900">
                <p className="font-semibold">{j.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {j.district}, {j.state} · {t("applicants", { n: j.applications.length })}
                </p>
                <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800" aria-hidden>
                  {PIPELINE.filter((s) => s !== "REJECTED").map((s, i) => {
                    const c = j.applications.filter((a) => a.status === s).length;
                    return c ? <span key={s} style={{ width: `${(c / j.applications.length) * 100}%`, opacity: 0.35 + i * 0.13 }} className="mr-[2px] bg-brand-700" /> : null;
                  })}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
