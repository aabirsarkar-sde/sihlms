"use client";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Select } from "@/components/ui/form";

export function ProgrammePicker({ programmes, value, param = "programme" }: { programmes: { id: string; title: string; code: string }[]; value?: string; param?: string }) {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="max-w-xl">
      <label htmlFor="pp" className="mb-1 block text-sm font-medium">
        {t("programme")}
      </label>
      <Select id="pp" value={value ?? ""} onChange={(e) => router.push(`${pathname}?${param}=${e.target.value}`)}>
        {programmes.map((p) => (
          <option key={p.id} value={p.id}>
            {p.code} — {p.title}
          </option>
        ))}
      </Select>
    </div>
  );
}
