import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeCheck, Check, X } from "lucide-react";
import { pageUser } from "@/lib/page";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { Badge, Empty, PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { ActionButton } from "@/components/action-button";

export default async function Employers({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  await pageUser(["SUPER_ADMIN"]);
  const t = await getTranslations("employers");
  const [pending, verified] = await Promise.all([
    db.user.findMany({ where: { role: "EMPLOYER", status: "PENDING", deletedAt: null }, include: { employerProfile: true }, orderBy: { createdAt: "asc" } }),
    db.user.findMany({ where: { role: "EMPLOYER", status: "ACTIVE", deletedAt: null }, include: { employerProfile: true, _count: { select: { jobs: true } } }, orderBy: { name: "asc" }, take: 100 }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader icon={<BadgeCheck />} title={t("title")} description={t("subtitle")} />
      <section>
        <h2 className="mb-2 font-semibold">{t("queue", { n: pending.length })}</h2>
        {pending.length === 0 ? (
          <Empty icon={<BadgeCheck />} title={t("queueEmpty")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("org")}</Th>
                <Th>{t("type")}</Th>
                <Th>{t("location")}</Th>
                <Th>{t("gstin")}</Th>
                <Th>{t("contact")}</Th>
                <Th>{t("since")}</Th>
                <Th>{t("actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {pending.map((e) => (
                <tr key={e.id}>
                  <Td className="font-medium">{e.employerProfile?.orgName}</Td>
                  <Td>{e.employerProfile?.orgType}</Td>
                  <Td className="text-xs">
                    {e.employerProfile?.district}, {e.employerProfile?.state}
                  </Td>
                  <Td className="font-mono text-xs">{e.employerProfile?.gstin ?? "—"}</Td>
                  <Td className="text-xs">
                    {e.name} · {e.phone}
                  </Td>
                  <Td className="text-xs">{fmtDate(e.createdAt, locale)}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <ActionButton size="sm" url={`/api/v1/employers/${e.id}/verify`} json={{ approve: true }}>
                        <Check aria-hidden />
                        {t("verify")}
                      </ActionButton>
                      <ActionButton size="sm" variant="outline" url={`/api/v1/employers/${e.id}/verify`} json={{ approve: false }}>
                        <X aria-hidden />
                        {t("reject")}
                      </ActionButton>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>
      <section>
        <h2 className="mb-2 font-semibold">{t("verified", { n: verified.length })}</h2>
        <Table>
          <thead>
            <tr>
              <Th>{t("org")}</Th>
              <Th>{t("type")}</Th>
              <Th>{t("location")}</Th>
              <Th className="text-right">{t("jobs")}</Th>
              <Th>{t("verifiedOn")}</Th>
            </tr>
          </thead>
          <tbody>
            {verified.map((e) => (
              <tr key={e.id}>
                <Td className="font-medium">
                  {e.employerProfile?.orgName} <Badge tone="green">{t("verifiedBadge")}</Badge>
                </Td>
                <Td>{e.employerProfile?.orgType}</Td>
                <Td className="text-xs">
                  {e.employerProfile?.district}, {e.employerProfile?.state}
                </Td>
                <Td className="text-right tabular-nums">{e._count.jobs}</Td>
                <Td className="text-xs">{e.employerProfile?.verifiedAt ? fmtDate(e.employerProfile.verifiedAt, locale) : "—"}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>
    </div>
  );
}
