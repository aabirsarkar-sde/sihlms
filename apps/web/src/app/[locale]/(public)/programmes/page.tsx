import { getTranslations, setRequestLocale } from "next-intl/server";
import { Building2, CalendarDays, Filter, MapPin, Users } from "lucide-react";
import { Link } from "@/i18n/routing";
import { db } from "@/lib/db";
import { listCatalogue } from "@/lib/services/catalogue";
import { CATEGORIES } from "@/lib/constants";
import { STATES } from "@/lib/geo";
import { fmtDate } from "@/lib/utils";
import { sp1, type SP } from "@/lib/page";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { Badge, Empty, Progress, STATUS_TONE } from "@/components/ui/misc";
import { Pager } from "@/components/pager";

export async function generateMetadata() {
  const t = await getTranslations("catalogue");
  return { title: t("title") };
}

export default async function Catalogue({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const t = await getTranslations("catalogue");
  const te = await getTranslations("enums");
  const f = {
    institutionId: sp1(searchParams, "institution"),
    state: sp1(searchParams, "state"),
    category: sp1(searchParams, "category"),
    mode: sp1(searchParams, "mode"),
    month: sp1(searchParams, "month"),
    q: sp1(searchParams, "q"),
    page: Number(sp1(searchParams, "page") ?? 1) || 1,
  };
  const [{ items, total, page, pageSize }, institutions] = await Promise.all([listCatalogue(f), db.institution.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })]);
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + i - 1);
    return { v: d.toISOString().slice(0, 7), l: d.toLocaleDateString(`${locale}-IN`, { month: "long", year: "numeric" }) };
  });
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-gray-600 dark:text-gray-400">{t("subtitle")}</p>
      <form className="mt-5 grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900 sm:grid-cols-2 lg:grid-cols-6" method="get">
        <div className="lg:col-span-2">
          <Label htmlFor="q">{t("search")}</Label>
          <Input id="q" name="q" defaultValue={f.q} placeholder={t("searchPlaceholder")} />
        </div>
        <div>
          <Label htmlFor="institution">{t("institution")}</Label>
          <Select id="institution" name="institution" defaultValue={f.institutionId ?? ""}>
            <option value="">{t("all")}</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="state">{t("state")}</Label>
          <Select id="state" name="state" defaultValue={f.state ?? ""}>
            <option value="">{t("all")}</option>
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="category">{t("category")}</Label>
          <Select id="category" name="category" defaultValue={f.category ?? ""}>
            <option value="">{t("all")}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {te(`category.${c}`)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="mode">{t("mode")}</Label>
          <Select id="mode" name="mode" defaultValue={f.mode ?? ""}>
            <option value="">{t("all")}</option>
            {["IN_PERSON", "ONLINE", "BLENDED"].map((m) => (
              <option key={m} value={m}>
                {te(`mode.${m}`)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="month">{t("month")}</Label>
          <Select id="month" name="month" defaultValue={f.month ?? ""}>
            <option value="">{t("all")}</option>
            {months.map((m) => (
              <option key={m.v} value={m.v}>
                {m.l}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end lg:col-span-5 lg:justify-end">
          <Button type="submit" className="w-full sm:w-auto">
            <Filter aria-hidden />
            {t("apply")}
          </Button>
        </div>
      </form>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{t("results", { count: total })}</p>
      {items.length === 0 ? (
        <div className="mt-4">
          <Empty icon={<CalendarDays />} title={t("empty")} />
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <li key={p.id}>
              <Link href={`/programmes/${p.id}`} className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-brand-500 hover:shadow dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start justify-between gap-2">
                  <Badge tone={STATUS_TONE[p.status]}>{te(`programmeStatus.${p.status}`)}</Badge>
                  <Badge>{te(`mode.${p.mode}`)}</Badge>
                </div>
                <h2 className="mt-2 font-semibold leading-snug text-gray-900 dark:text-gray-50">{p.title}</h2>
                <p className="font-mono text-xs text-gray-600 dark:text-gray-400">{p.code}</p>
                <div className="mt-3 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <p className="flex items-center gap-2">
                    <Building2 className="size-4 shrink-0 text-brand-600" aria-hidden />
                    {p.institution.name}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0 text-brand-600" aria-hidden />
                    {p.institution.city}, {p.institution.state}
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarDays className="size-4 shrink-0 text-brand-600" aria-hidden />
                    {fmtDate(p.startDate, locale)} – {fmtDate(p.endDate, locale)}
                  </p>
                </div>
                <div className="mt-auto pt-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" aria-hidden />
                      {t("seats", { taken: p._count.enrollments, capacity: p.capacity })}
                    </span>
                  </div>
                  <Progress value={(p._count.enrollments / p.capacity) * 100} tone={p._count.enrollments >= p.capacity ? "red" : "green"} label={t("capacity")} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pager page={page} pageSize={pageSize} total={total} base="/programmes" params={{ q: f.q, institution: f.institutionId, state: f.state, category: f.category, mode: f.mode, month: f.month }} />
    </div>
  );
}
