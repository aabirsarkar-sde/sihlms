import { getTranslations, setRequestLocale } from "next-intl/server";
import { Award, List, UserPlus } from "lucide-react";
import { Link } from "@/i18n/routing";
import { pageUser, sp1, type SP } from "@/lib/page";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge, Empty, PageHeader, Stat, STATUS_TONE, Table, Td, Th } from "@/components/ui/misc";
import { Pager } from "@/components/pager";

export default async function MyNominations({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const user = await pageUser(["NOMINATOR"]);
  const t = await getTranslations("nominator");
  const te = await getTranslations("enums");
  const page = Number(sp1(searchParams, "page") ?? 1) || 1;
  const [items, total, byStatus, certified] = await Promise.all([
    db.nomination.findMany({
      where: { nominatedById: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 25,
      take: 25,
      include: { trainee: { select: { name: true, certificates: { select: { certNo: true, programmeId: true, revokedAt: true } } } }, programme: { select: { id: true, title: true, code: true, startDate: true } } },
    }),
    db.nomination.count({ where: { nominatedById: user.id } }),
    db.nomination.groupBy({ by: ["status"], where: { nominatedById: user.id }, _count: true }),
    db.certificate.count({ where: { revokedAt: null, programme: { nominations: { some: { nominatedById: user.id } } }, trainee: { nominations: { some: { nominatedById: user.id } } } } }),
  ]);
  const count = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;
  return (
    <div className="space-y-5">
      <PageHeader
        icon={<List />}
        title={t("title")}
        actions={
          <Link href="/nominator/nominate" className={buttonVariants()}>
            <UserPlus aria-hidden />
            {t("nominate")}
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t("total")} value={total} />
        <Stat label={te("nominationStatus.APPROVED")} value={count("APPROVED")} />
        <Stat label={te("nominationStatus.SUBMITTED")} value={count("SUBMITTED")} />
        <Stat icon={<Award />} label={t("certified")} value={certified} />
      </div>
      {items.length === 0 ? (
        <Empty icon={<UserPlus />} title={t("empty")} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t("nominee")}</Th>
              <Th>{t("programme")}</Th>
              <Th>{t("starts")}</Th>
              <Th>{t("status")}</Th>
              <Th>{t("certificate")}</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((n) => {
              const cert = n.trainee.certificates.find((c) => c.programmeId === n.programme.id);
              return (
                <tr key={n.id}>
                  <Td className="font-medium">{n.trainee.name}</Td>
                  <Td>
                    <Link href={`/programmes/${n.programme.id}`} className="hover:underline">
                      {n.programme.title}
                    </Link>
                    <span className="block font-mono text-xs text-gray-600 dark:text-gray-400">{n.programme.code}</span>
                  </Td>
                  <Td className="text-xs">{fmtDate(n.programme.startDate, locale)}</Td>
                  <Td>
                    <Badge tone={STATUS_TONE[n.status]}>{te(`nominationStatus.${n.status}`)}</Badge>
                  </Td>
                  <Td>
                    {cert ? (
                      <Link href={`/verify/${cert.certNo}`} className="font-mono text-xs text-brand-700 underline dark:text-brand-300">
                        {cert.certNo}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
      <Pager page={page} pageSize={25} total={total} base="/nominator" params={{}} />
    </div>
  );
}
