import { getTranslations, setRequestLocale } from "next-intl/server";
import { Briefcase, Building2, IndianRupee, MapPin, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { Link } from "@/i18n/routing";
import { db } from "@/lib/db";
import { STATES } from "@/lib/geo";
import { fmtDate, inr } from "@/lib/utils";
import { sp1, type SP } from "@/lib/page";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { Badge, Empty } from "@/components/ui/misc";
import { Pager } from "@/components/pager";

export async function generateMetadata() {
  const t = await getTranslations("jobsBoard");
  return { title: t("title") };
}

export default async function JobsBoard({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const t = await getTranslations("jobsBoard");
  const te = await getTranslations("enums");
  const q = sp1(searchParams, "q");
  const state = sp1(searchParams, "state");
  const type = sp1(searchParams, "type");
  const page = Number(sp1(searchParams, "page") ?? 1) || 1;
  const pageSize = 12;
  const where: Prisma.JobWhereInput = {
    deletedAt: null,
    hidden: false,
    closesAt: { gte: new Date() },
    employer: { status: "ACTIVE" },
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { requiredSkills: { has: q } }] } : {}),
    ...(state ? { state } : {}),
    ...(type ? { jobType: type as never } : {}),
  };
  const [items, total] = await Promise.all([
    db.job.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { employer: { select: { employerProfile: { select: { orgName: true } } } } } }),
    db.job.count({ where }),
  ]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-gray-600 dark:text-gray-400">{t("subtitle")}</p>
      <form className="mt-5 grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900 sm:grid-cols-4" method="get">
        <div className="sm:col-span-2">
          <Label htmlFor="q">{t("search")}</Label>
          <Input id="q" name="q" defaultValue={q} placeholder={t("searchPlaceholder")} />
        </div>
        <div>
          <Label htmlFor="state">{t("state")}</Label>
          <Select id="state" name="state" defaultValue={state ?? ""}>
            <option value="">{t("all")}</option>
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="type">{t("type")}</Label>
          <Select id="type" name="type" defaultValue={type ?? ""}>
            <option value="">{t("all")}</option>
            {["FULL_TIME", "PART_TIME", "APPRENTICESHIP", "CONTRACT"].map((j) => (
              <option key={j} value={j}>
                {te(`jobType.${j}`)}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-4 sm:flex sm:justify-end">
          <Button type="submit" className="w-full sm:w-auto">
            <Search aria-hidden />
            {t("searchBtn")}
          </Button>
        </div>
      </form>
      {items.length === 0 ? (
        <div className="mt-6">
          <Empty icon={<Briefcase />} title={t("empty")} />
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((j) => (
            <li key={j.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <Badge tone="blue" className="self-start">
                {te(`jobType.${j.jobType}`)}
              </Badge>
              <h2 className="mt-2 font-semibold">{j.title}</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Building2 className="size-4 text-brand-600" aria-hidden />
                {j.employer.employerProfile?.orgName}
              </p>
              <p className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <MapPin className="size-4 text-brand-600" aria-hidden />
                {j.district}, {j.state}
              </p>
              {j.salaryMin ? (
                <p className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <IndianRupee className="size-4 text-brand-600" aria-hidden />
                  {inr(j.salaryMin)} – {inr(j.salaryMax ?? j.salaryMin)} {t("perMonth")}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1">
                {j.requiredSkills.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">{t("closes", { date: fmtDate(j.closesAt, locale) })}</p>
              <Link href={`/learn/jobs?job=${j.id}`} className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3" })}>
                {t("loginToApply")}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pager page={page} pageSize={pageSize} total={total} base="/jobs" params={{ q, state, type }} />
    </div>
  );
}
