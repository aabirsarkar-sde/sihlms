import { setRequestLocale } from "next-intl/server";
import { pageUser } from "@/lib/page";
import { AppShell } from "@/components/shell/app-shell";

export default async function AdminLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  return <AppShell user={user}>{children}</AppShell>;
}
