import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock } from "lucide-react";
import { pageUser } from "@/lib/page";
import { AppShell } from "@/components/shell/app-shell";
import { Alert } from "@/components/ui/misc";

export default async function EmployerLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["EMPLOYER"]);
  const t = await getTranslations("employer");
  return (
    <AppShell user={user}>
      {user.status === "PENDING" ? (
        <Alert tone="saffron" className="mb-4">
          <Clock aria-hidden />
          {t("pending")}
        </Alert>
      ) : null}
      {children}
    </AppShell>
  );
}
