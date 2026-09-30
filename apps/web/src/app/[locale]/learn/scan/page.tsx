import { getTranslations, setRequestLocale } from "next-intl/server";
import { ScanLine } from "lucide-react";
import { pageUser, sp1, type SP } from "@/lib/page";
import { traineeQr } from "@/lib/qr";
import { PageHeader } from "@/components/ui/misc";
import { ScanClient } from "./scan-client";

export default async function ScanPage({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const user = await pageUser(["TRAINEE"]);
  const t = await getTranslations("scan");
  return (
    <div className="mx-auto max-w-md">
      <PageHeader icon={<ScanLine />} title={t("title")} description={t("subtitle")} />
      <ScanClient myQr={traineeQr(user.id)} name={user.name} initialTab={sp1(searchParams, "tab") === "myqr" ? "myqr" : "scan"} />
    </div>
  );
}
