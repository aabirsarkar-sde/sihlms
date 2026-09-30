import { getTranslations, setRequestLocale } from "next-intl/server";
import { Shield } from "lucide-react";
import { pageUser, sp1, type SP } from "@/lib/page";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { Pager } from "@/components/pager";

export const dynamic = "force-dynamic";

export default async function Audit({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  await pageUser(["SUPER_ADMIN"]);
  const t = await getTranslations("audit");
  const q = sp1(searchParams, "q");
  const page = Number(sp1(searchParams, "page") ?? 1) || 1;
  const where = q ? { OR: [{ action: { contains: q } }, { entity: { contains: q } }, { entityId: q }] } : {};
  const [items, total] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 50, take: 50, include: { actor: { select: { name: true, role: true } } } }),
    db.auditLog.count({ where }),
  ]);
  return (
    <div className="space-y-4">
      <PageHeader icon={<Shield />} title={t("title")} description={t("subtitle")} />
      <form method="get" className="flex gap-2">
        <label htmlFor="aq" className="sr-only">
          {t("search")}
        </label>
        <Input id="aq" name="q" defaultValue={q} placeholder={t("search")} className="max-w-sm" />
        <button type="submit" className="h-11 rounded-lg border border-gray-300 px-4 text-sm font-semibold dark:border-gray-700">
          {t("searchBtn")}
        </button>
      </form>
      <Table>
        <thead>
          <tr>
            <Th>{t("when")}</Th>
            <Th>{t("who")}</Th>
            <Th>{t("action")}</Th>
            <Th>{t("entity")}</Th>
            <Th>{t("details")}</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id}>
              <Td className="whitespace-nowrap text-xs">{fmtDateTime(a.createdAt, locale)}</Td>
              <Td className="text-xs">{a.actor?.name ?? t("system")}</Td>
              <Td className="font-mono text-xs">{a.action}</Td>
              <Td className="font-mono text-xs">
                {a.entity}:{a.entityId.slice(0, 10)}
              </Td>
              <Td className="max-w-md truncate font-mono text-xs" title={JSON.stringify(a.diff)}>
                {JSON.stringify(a.diff)}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pager page={page} pageSize={50} total={total} base="/admin/audit" params={{ q }} />
    </div>
  );
}
