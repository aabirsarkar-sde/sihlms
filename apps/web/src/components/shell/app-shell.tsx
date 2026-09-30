import type { Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { LogOut } from "lucide-react";
import { Link } from "@/i18n/routing";
import { NAV } from "./nav";
import { BottomNav, SideNav } from "./nav-links";
import { LocaleSwitcher } from "./locale-switcher";
import { SyncPill } from "./sync-pill";
import { Logo } from "./logo";
import { NotificationBell } from "./notification-bell";

export async function AppShell({ user, children, extra }: { user: { name: string; role: Role }; children: React.ReactNode; extra?: React.ReactNode }) {
  const t = await getTranslations("common");
  const tr = await getTranslations("roles");
  const items = NAV[user.role];
  const showSync = user.role === "TRAINEE" || user.role === "FACULTY";
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-950">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2">
        {t("skipToContent")}
      </a>
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
        <div className="flex h-16 items-center gap-1.5 px-2 sm:gap-2 sm:px-5">
          <Link href="/" className="flex min-h-touch items-center gap-2" aria-label={t("appName")}>
            <Logo />
            <span className="hidden font-bold text-brand-800 dark:text-brand-200 sm:inline">{t("appName")}</span>
          </Link>
          <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
            {showSync ? <SyncPill /> : null}
            <LocaleSwitcher persist />
            <NotificationBell />
            <div className="hidden text-right leading-tight lg:block">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{tr(user.role)}</div>
            </div>
            <form action="/api/v1/auth/logout" method="post">
              <button type="submit" className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" aria-label={t("logout")} title={t("logout")}>
                <LogOut className="size-5" aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 overflow-y-auto border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 md:block">
          <SideNav items={items} />
        </aside>
        <main id="main" className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-6 md:pb-10">
          {children}
        </main>
      </div>
      <BottomNav items={items} />
      {extra}
    </div>
  );
}
