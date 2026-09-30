import { getTranslations, setRequestLocale } from "next-intl/server";
import { LayoutDashboard, LogIn } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/session";
import { Logo } from "@/components/shell/logo";
import { LocaleSwitcher } from "@/components/shell/locale-switcher";
import { buttonVariants } from "@/components/ui/button";

export default async function PublicLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("public");
  const tc = await getTranslations("common");
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-gray-950">
      <a href="#main" className="sr-only focus:not-sr-only">
        {tc("skipToContent")}
      </a>
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link href="/" className="flex min-h-touch items-center gap-2">
            <Logo />
            <span className="font-bold text-brand-800 dark:text-brand-200">{tc("appName")}</span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 text-sm font-medium md:flex" aria-label={t("navLabel")}>
            <Link href="/programmes" className="rounded-lg px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800">
              {t("programmes")}
            </Link>
            <Link href="/jobs" className="rounded-lg px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800">
              {t("jobs")}
            </Link>
            <Link href="/verify" className="rounded-lg px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800">
              {t("verify")}
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LocaleSwitcher />
            {user ? (
              <Link href={ROLE_HOME[user.role]} className={buttonVariants({ size: "sm" })}>
                <LayoutDashboard aria-hidden />
                <span className="hidden sm:inline">{t("dashboard")}</span>
              </Link>
            ) : (
              <Link href="/login" className={buttonVariants({ size: "sm" })}>
                <LogIn aria-hidden />
                {t("login")}
              </Link>
            )}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-gray-100 px-2 text-sm font-medium dark:border-gray-800 md:hidden" aria-label={t("navLabel")}>
          <Link href="/programmes" className="flex min-h-touch items-center px-3">
            {t("programmes")}
          </Link>
          <Link href="/jobs" className="flex min-h-touch items-center px-3">
            {t("jobs")}
          </Link>
          <Link href="/verify" className="flex min-h-touch items-center px-3">
            {t("verify")}
          </Link>
        </nav>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-gray-200 bg-gray-50 py-8 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 sm:flex-row sm:justify-between">
          <p>{t("footer")}</p>
          <p>{t("footerPrivacy")}</p>
        </div>
      </footer>
    </div>
  );
}
