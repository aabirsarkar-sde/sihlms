import { setRequestLocale } from "next-intl/server";
import { pageUser } from "@/lib/page";
import { AppShell } from "@/components/shell/app-shell";

export default async function FacultyLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["FACULTY", "INSTITUTE_ADMIN"]);
  return <AppShell user={user}>{children}</AppShell>;
}
