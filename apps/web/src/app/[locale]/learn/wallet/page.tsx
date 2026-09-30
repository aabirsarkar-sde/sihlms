import { getTranslations, setRequestLocale } from "next-intl/server";
import { Award } from "lucide-react";
import { pageUser } from "@/lib/page";
import { db } from "@/lib/db";
import { signedUrl } from "@/lib/storage";
import { appUrl } from "@/lib/services/certificates";
import { fmtDate } from "@/lib/utils";
import { Empty, PageHeader } from "@/components/ui/misc";
import { WalletCard } from "./wallet-card";

export default async function Wallet({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["TRAINEE"]);
  const t = await getTranslations("wallet");
  const certs = await db.certificate.findMany({
    where: { traineeId: user.id },
    orderBy: { issuedAt: "desc" },
    include: { programme: { select: { title: true, code: true, institution: { select: { name: true } } } } },
  });
  return (
    <div>
      <PageHeader icon={<Award />} title={t("title")} description={t("subtitle")} />
      {certs.length === 0 ? (
        <Empty icon={<Award />} title={t("empty")}>
          {t("emptyHint")}
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2" data-testid="wallet">
          {certs.map((c) => (
            <WalletCard
              key={c.id}
              cert={{
                id: c.id,
                certNo: c.certNo,
                title: c.programme.title,
                institution: c.programme.institution.name,
                issued: fmtDate(c.issuedAt, locale),
                revoked: !!c.revokedAt,
                revokeReason: c.revokeReason,
                pdf: signedUrl(c.pdfUrl, 3600),
                verifyUrl: `${appUrl()}/verify/${c.certNo}`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
