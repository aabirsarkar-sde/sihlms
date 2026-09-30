import { getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";

export async function Pager({ page, pageSize, total, base, params }: { page: number; pageSize: number; total: number; base: string; params: Record<string, string | undefined> }) {
  const t = await getTranslations("common");
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams(Object.entries({ ...params, page: String(p) }).filter(([, v]) => v) as [string, string][]);
    return `${base}?${sp.toString()}`;
  };
  return (
    <nav className="mt-6 flex items-center justify-between gap-2" aria-label={t("pagination")}>
      {page > 1 ? (
        <Link href={href(page - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <ChevronLeft aria-hidden />
          {t("previous")}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-gray-600 dark:text-gray-400">{t("pageOf", { page, pages })}</span>
      {page < pages ? (
        <Link href={href(page + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t("next")}
          <ChevronRight aria-hidden />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
