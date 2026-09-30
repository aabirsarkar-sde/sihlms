"use client";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav";
import { ICONS } from "./icons";

function isActive(pathname: string, href: string, all: NavItem[]) {
  if (pathname === href) return true;
  if (!pathname.startsWith(href + "/")) return false;
  // Prefer the most specific match
  return !all.some((i) => i.href !== href && i.href.startsWith(href) && (pathname === i.href || pathname.startsWith(i.href + "/")));
}

export function SideNav({ items }: { items: NavItem[] }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("main")} className="flex flex-col gap-1 p-3">
      {items.map((i) => {
        const Icon = ICONS[i.icon];
        const active = isActive(pathname, i.href, items);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-touch items-center gap-3 rounded-lg px-3 text-sm font-medium",
              active ? "bg-brand-700 text-white" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {t(i.key)}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const mobile = items.filter((i) => i.mobile).slice(0, 5);
  return (
    <nav aria-label={t("main")} className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-gray-800 dark:bg-gray-950 md:hidden">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${mobile.length}, minmax(0, 1fr))` }}>
        {mobile.map((i) => {
          const Icon = ICONS[i.icon];
          const active = isActive(pathname, i.href, items);
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={cn("flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium leading-tight", active ? "text-brand-700 dark:text-brand-300" : "text-gray-600 dark:text-gray-400")}
              >
                <Icon className="size-5" aria-hidden />
                <span className="line-clamp-1 text-center">{t(i.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
