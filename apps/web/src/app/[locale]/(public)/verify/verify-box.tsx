"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

export function VerifyBox({ initial = "" }: { initial?: string }) {
  const t = useTranslations("verify");
  const router = useRouter();
  const [v, setV] = useState(initial);
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const c = v.trim().toUpperCase();
        if (c) router.push(`/verify/${encodeURIComponent(c)}`);
      }}
    >
      <label htmlFor="certNo" className="sr-only">
        {t("certNo")}
      </label>
      <Input id="certNo" value={v} onChange={(e) => setV(e.target.value)} placeholder="NCCT-VAMN-2026-000123" autoComplete="off" className="font-mono uppercase" />
      <Button type="submit" aria-label={t("check")}>
        <Search aria-hidden />
        <span className="hidden sm:inline">{t("check")}</span>
      </Button>
    </form>
  );
}
