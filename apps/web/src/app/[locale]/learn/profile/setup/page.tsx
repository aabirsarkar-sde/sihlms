import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { UserRoundPen } from "lucide-react";
import { pageUser } from "@/lib/page";
import { db } from "@/lib/db";
import { GEO, STATES } from "@/lib/geo";
import { PageHeader } from "@/components/ui/misc";
import { SetupWizard } from "./wizard";

export default async function Setup({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["TRAINEE"]);
  const existing = await db.traineeProfile.findUnique({ where: { userId: user.id }, select: { id: true, gender: true } });
  if (existing && existing.gender !== "U") redirect(`/${locale}/learn`);
  const t = await getTranslations("profile");
  const districts = Object.fromEntries(STATES.map((s) => [s, Object.keys(GEO[s])]));
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader icon={<UserRoundPen />} title={t("setupTitle")} description={t("setupSubtitle")} />
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <SetupWizard name={user.name} districts={districts} />
      </div>
    </div>
  );
}
