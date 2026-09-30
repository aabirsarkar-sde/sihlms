import { getTranslations, setRequestLocale } from "next-intl/server";
import { Award } from "lucide-react";
import { Link } from "@/i18n/routing";
import { pageUser, sp1, type SP } from "@/lib/page";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { Badge, PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { Pager } from "@/components/pager";
import { ActionButton } from "@/components/action-button";

export default async function CertificatesAdmin({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  await pageUser(["SUPER_ADMIN"]);
  const t = await getTranslations("certAdmin");
  const q = sp1(searchParams, "q");
  const page = Number(sp1(searchParams, "page") ?? 1) || 1;
  const where = q ? { OR: [{ certNo: { contains: q.toUpperCase() } }, { trainee: { name: { contains: q, mode: "insensitive" as const } } }] } : {};
  const [items, total] = await Promise.all([
    db.certificate.findMany({ where, orderBy: { issuedAt: "desc" }, skip: (page - 1) * 25, take: 25, include: { trainee: { select: { name: true } }, programme: { select: { code: true } } } }),
    db.certificate.count({ where }),
  ]);
  return (
    <div className="space-y-4">
      <PageHeader icon={<Award />} title={t("title")} description={t("subtitle", { n: total })} />
      <form method="get" className="flex gap-2">
        <label htmlFor="cq" className="sr-only">
          {t("search")}
        </label>
        <Input id="cq" name="q" defaultValue={q} placeholder={t("search")} className="max-w-sm" />
        <button type="submit" className="h-11 rounded-lg border border-gray-300 px-4 text-sm font-semibold dark:border-gray-700">
          {t("searchBtn")}
        </button>
      </form>
      <Table>
        <thead>
          <tr>
            <Th>{t("certNo")}</Th>
            <Th>{t("holder")}</Th>
            <Th>{t("programme")}</Th>
            <Th>{t("issued")}</Th>
            <Th>{t("status")}</Th>
            <Th>{t("actions")}</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <Td>
                <Link href={`/verify/${c.certNo}`} className="font-mono text-xs text-brand-700 underline dark:text-brand-300">
                  {c.certNo}
                </Link>
              </Td>
              <Td>{c.trainee.name}</Td>
              <Td className="font-mono text-xs">{c.programme.code}</Td>
              <Td className="text-xs">{fmtDate(c.issuedAt, locale)}</Td>
              <Td>{c.revokedAt ? <Badge tone="red" title={c.revokeReason ?? ""}>{t("revoked")}</Badge> : <Badge tone="green">{t("valid")}</Badge>}</Td>
              <Td>
                {!c.revokedAt ? (
                  <ActionButton size="sm" variant="destructive" url={`/api/v1/certificates/${c.id}/revoke`} askReason reasonLabel={t("reason")}>
                    {t("revoke")}
                  </ActionButton>
                ) : (
                  <span className="text-xs text-gray-600">{c.revokeReason}</span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pager page={page} pageSize={25} total={total} base="/admin/certificates" params={{ q }} />
    </div>
  );
}
