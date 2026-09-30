import { getTranslations, setRequestLocale } from "next-intl/server";
import { UserPlus } from "lucide-react";
import { pageUser, sp1, type SP } from "@/lib/page";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/misc";
import { NominateClient } from "./nominate-client";

export default async function Nominate({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  await pageUser(["NOMINATOR"]);
  const t = await getTranslations("nominate");
  const programmes = await db.programme.findMany({
    where: { deletedAt: null, status: { in: ["PUBLISHED", "ONGOING"] }, nominationDeadline: { gte: new Date() } },
    orderBy: { startDate: "asc" },
    select: { id: true, title: true, code: true, startDate: true, capacity: true, institution: { select: { name: true } }, _count: { select: { enrollments: true } } },
  });
  return (
    <div className="space-y-4">
      <PageHeader icon={<UserPlus />} title={t("title")} description={t("subtitle")} />
      <NominateClient programmes={programmes.map((p) => ({ id: p.id, label: `${p.code} — ${p.title}`, sub: `${p.institution.name} · ${p.startDate.toLocaleDateString(`${locale}-IN`)}`, seats: `${p._count.enrollments}/${p.capacity}` }))} initial={sp1(searchParams, "programme")} />
    </div>
  );
}
