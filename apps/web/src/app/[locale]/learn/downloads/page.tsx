import { getTranslations, setRequestLocale } from "next-intl/server";
import { Download } from "lucide-react";
import { pageUser } from "@/lib/page";
import { PageHeader } from "@/components/ui/misc";
import { DownloadsClient } from "./downloads-client";

export default async function Downloads({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  await pageUser(["TRAINEE"]);
  const t = await getTranslations("downloads");
  return (
    <div>
      <PageHeader icon={<Download />} title={t("title")} description={t("subtitle")} />
      <DownloadsClient />
    </div>
  );
}
