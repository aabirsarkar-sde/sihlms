import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Prisma } from "@prisma/client";
import { Layers, Plus } from "lucide-react";
import { Link } from "@/i18n/routing";
import { pageUser, sp1, type SP } from "@/lib/page";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Badge, PageHeader, Progress, STATUS_TONE, Table, Td, Th } from "@/components/ui/misc";
import { Pager } from "@/components/pager";

export default async function AdminProgrammes({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const user = await pageUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  const t = await getTranslations("adminProgrammes");
  const te = await getTranslations("enums");
  const q = sp1(searchParams, "q");
  const status = sp1(searchParams, "status");
  const page = Number(sp1(searchParams, "page") ?? 1) || 1;
  const pageSize = 20;
  const where: Prisma.ProgrammeWhereInput = {
    deletedAt: null,
    ...(user.role === "INSTITUTE_ADMIN" ? { institutionId: user.institutionId ?? "-" } : {}),
    ...(status ? { status: status as never } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { code: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [items, total] = await Promise.all([
    db.programme.findMany({
      where,
      orderBy: [{ status: "asc" }, { startDate: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { institution: { select: { code: true } }, _count: { select: { enrollments: true, nominations: { where: { status: "SUBMITTED" } } } } },
    }),
    db.programme.count({ where }),
  ]);
  return (
    <div className="space-y-4">
      <PageHeader
        icon={<Layers />}
        title={t("title")}
        actions={
          <Link href="/admin/programmes/new" className={buttonVariants()}>
            <Plus aria-hidden />
            {t("new")}
          </Link>
        }
      />
      <form className="flex flex-col gap-2 sm:flex-row" method="get">
        <label htmlFor="q" className="sr-only">
          {t("search")}
        </label>
        <Input id="q" name="q" defaultValue={q} placeholder={t("search")} className="sm:max-w-xs" />
        <label htmlFor="status" className="sr-only">
          {t("status")}
        </label>
        <Select id="status" name="status" defaultValue={status ?? ""} className="sm:max-w-[200px]">
          <option value="">{t("allStatus")}</option>
          {["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"].map((s) => (
            <option key={s} value={s}>
              {te(`programmeStatus.${s}`)}
            </option>
          ))}
        </Select>
        <button type="submit" className={buttonVariants({ variant: "outline" })}>
          {t("filter")}
        </button>
      </form>
      <Table>
        <thead>
          <tr>
            <Th>{t("programme")}</Th>
            <Th>{t("dates")}</Th>
            <Th>{t("status")}</Th>
            <Th>{t("seats")}</Th>
            <Th>{t("pending")}</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <Td>
                <Link href={`/admin/programmes/${p.id}`} className="font-medium text-brand-800 hover:underline dark:text-brand-200">
                  {p.title}
                </Link>
                <span className="block font-mono text-xs text-gray-600 dark:text-gray-400">{p.code}</span>
              </Td>
              <Td className="whitespace-nowrap text-xs">
                {fmtDate(p.startDate, locale)} – {fmtDate(p.endDate, locale)}
              </Td>
              <Td>
                <Badge tone={STATUS_TONE[p.status]}>{te(`programmeStatus.${p.status}`)}</Badge>
              </Td>
              <Td className="w-40">
                <div className="flex items-center gap-2">
                  <Progress value={(p._count.enrollments / p.capacity) * 100} label={t("seats")} />
                  <span className="whitespace-nowrap text-xs tabular-nums">
                    {p._count.enrollments}/{p.capacity}
                  </span>
                </div>
              </Td>
              <Td className="tabular-nums">{p._count.nominations ? <Badge tone="saffron">{p._count.nominations}</Badge> : "—"}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pager page={page} pageSize={pageSize} total={total} base="/admin/programmes" params={{ q, status }} />
    </div>
  );
}
