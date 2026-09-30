import { getTranslations, setRequestLocale } from "next-intl/server";
import { Building2 } from "lucide-react";
import { pageUser } from "@/lib/page";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, PageHeader } from "@/components/ui/misc";

export default async function Company({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["EMPLOYER"]);
  const t = await getTranslations("employer");
  const p = await db.employerProfile.findUnique({ where: { userId: user.id } });
  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader icon={<Building2 />} title={t("company")} />
      <Card>
        <CardContent className="pt-5">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {[
              [t("orgName"), p?.orgName],
              [t("orgType"), p?.orgType],
              [t("location"), p ? `${p.district}, ${p.state}` : ""],
              [t("gstin"), p?.gstin ?? "—"],
              [t("contact"), `${user.name} · ${user.phone}`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-gray-600 dark:text-gray-400">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
            <div>
              <dt className="text-gray-600 dark:text-gray-400">{t("verification")}</dt>
              <dd>{p?.verifiedAt ? <Badge tone="green">{t("verifiedOn", { date: fmtDate(p.verifiedAt, locale) })}</Badge> : <Badge tone="saffron">{t("pendingBadge")}</Badge>}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
