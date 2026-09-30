import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/shell/logo";
import { LocaleSwitcher } from "@/components/shell/locale-switcher";

export default async function AuthLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("common");
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-brand-50 to-white dark:from-gray-900 dark:to-gray-950">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex min-h-touch items-center gap-2 font-bold text-brand-800 dark:text-brand-200">
          <Logo />
          <span>{t("appName")}</span>
        </Link>
        <LocaleSwitcher />
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 py-6 sm:items-center">
        {children}
      </main>
    </div>
  );
}
