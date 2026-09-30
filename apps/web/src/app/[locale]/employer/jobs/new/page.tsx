import { getTranslations, setRequestLocale } from "next-intl/server";
import { Plus } from "lucide-react";
import { pageUser } from "@/lib/page";
import { db } from "@/lib/db";
import { GEO, STATES } from "@/lib/geo";
import { PageHeader } from "@/components/ui/misc";
import { JobForm } from "@/components/employer/job-form";

export default async function NewJob({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["EMPLOYER"]);
  const t = await getTranslations("employer");
  const [profile, programmes] = await Promise.all([
    db.employerProfile.findUnique({ where: { userId: user.id } }),
    db.programme.findMany({ where: { deletedAt: null, status: { in: ["COMPLETED", "ONGOING"] } }, select: { code: true, title: true }, orderBy: { code: "asc" } }),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader icon={<Plus />} title={t("postJob")} />
      <JobForm districts={Object.fromEntries(STATES.map((s) => [s, Object.keys(GEO[s])]))} programmes={programmes} defaults={{ state: profile?.state ?? "", district: profile?.district ?? "" }} />
    </div>
  );
}
