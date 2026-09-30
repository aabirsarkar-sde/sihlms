"use client";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/routing";

const NAMES: Record<string, string> = { en: "English", hi: "हिन्दी", mr: "मराठी" };

export function LocaleSwitcher({ persist = false }: { persist?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-1.5 text-sm">
      <Languages className="hidden size-5 text-brand-700 dark:text-brand-300 sm:block" aria-hidden />
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          if (persist) fetch("/api/v1/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: next }) }).catch(() => {});
          const qs = window.location.search.replace(/^\?/, "");
          start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { locale: next as "en" }));
        }}
        className="h-11 max-w-[92px] rounded-lg border border-gray-300 bg-white px-1.5 text-sm font-medium dark:border-gray-700 dark:bg-gray-900 sm:max-w-none sm:px-2"
      >
        {Object.entries(NAMES).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}
