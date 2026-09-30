import { getTranslations, setRequestLocale } from "next-intl/server";
import { Download, FileText } from "lucide-react";
import { pageUser } from "@/lib/page";
import { CATEGORIES } from "@/lib/constants";
import { STATES } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";

export default async function Reports({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  await pageUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  const t = await getTranslations("reports");
  const te = await getTranslations("enums");
  return (
    <div className="space-y-4">
      <PageHeader icon={<FileText />} title={t("title")} />
      <Card>
        <CardHeader>
          <CardTitle>{t("alumni")}</CardTitle>
          <CardDescription>{t("alumniHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/api/v1/exports/alumni.csv" method="get" className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="r-state">{t("state")}</Label>
              <Select id="r-state" name="state">
                <option value="">{t("all")}</option>
                {STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="r-district">{t("district")}</Label>
              <Input id="r-district" name="district" />
            </div>
            <div>
              <Label htmlFor="r-cat">{t("category")}</Label>
              <Select id="r-cat" name="category">
                <option value="">{t("all")}</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {te(`category.${c}`)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="r-prog">{t("programmeCode")}</Label>
              <Input id="r-prog" name="programme" placeholder="DCM" />
            </div>
            <div>
              <Label htmlFor="r-year">{t("year")}</Label>
              <Input id="r-year" name="year" type="number" min={2020} max={2100} />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                <Download aria-hidden />
                {t("download")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("api")}</CardTitle>
          <CardDescription>{t("apiHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <a href="/api/v1/openapi.json" className="font-mono text-sm text-brand-700 underline dark:text-brand-300">
            {"/api/v1/openapi.json"}
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
