import { setRequestLocale } from "next-intl/server";
import { pageUser } from "@/lib/page";
import { AppShell } from "@/components/shell/app-shell";
import { ChatWidget } from "@/components/chat/chat-widget";

export default async function LearnLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["TRAINEE"]);
  return (
    <AppShell user={user} extra={<ChatWidget />}>
      {children}
    </AppShell>
  );
}
