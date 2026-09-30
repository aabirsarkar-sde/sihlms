"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";

export function JobForm({ districts, programmes, defaults }: { districts: Record<string, string[]>; programmes: { code: string; title: string }[]; defaults: { state: string; district: string } }) {
  const t = useTranslations("jobForm");
  const te = useTranslations("enums");
  const router = useRouter();
  const [v, setV] = useState({ title: "", description: "", jobType: "FULL_TIME", state: defaults.state, district: defaults.district, salaryMin: "", salaryMax: "", skills: "", programmes: [] as string[], closesAt: "" });
  const [err, setErr] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  return (
    <form
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await api<{ id: string }>("/api/v1/jobs", {
          method: "POST",
          json: {
            title: v.title,
            description: v.description,
            jobType: v.jobType,
            state: v.state,
            district: v.district,
            salaryMin: v.salaryMin ? Number(v.salaryMin) : null,
            salaryMax: v.salaryMax ? Number(v.salaryMax) : null,
            requiredSkills: v.skills.split(",").map((s) => s.trim()).filter(Boolean),
            requiredProgrammeCodes: v.programmes,
            closesAt: `${v.closesAt}T23:59:00+05:30`,
          },
        });
        if (r.error) {
          setErr(r.error.message);
          setFields(r.error.fields ?? {});
          return;
        }
        router.push(`/employer/jobs/${r.data!.id}`);
      }}
    >
      {err ? <Alert tone="red">{err}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("title")} htmlFor="jt" error={fields.title} className="sm:col-span-2">
          <Input id="jt" value={v.title} onChange={set("title")} required />
        </Field>
        <Field label={t("description")} htmlFor="jd" error={fields.description} className="sm:col-span-2">
          <Textarea id="jd" value={v.description} onChange={set("description")} required minLength={20} />
        </Field>
        <Field label={t("type")} htmlFor="jty">
          <Select id="jty" value={v.jobType} onChange={set("jobType")}>
            {["FULL_TIME", "PART_TIME", "APPRENTICESHIP", "CONTRACT"].map((j) => (
              <option key={j} value={j}>
                {te(`jobType.${j}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("closes")} htmlFor="jc" error={fields.closesAt}>
          <Input id="jc" type="date" value={v.closesAt} onChange={set("closesAt")} required />
        </Field>
        <Field label={t("state")} htmlFor="js">
          <Select id="js" value={v.state} onChange={(e) => setV({ ...v, state: e.target.value, district: "" })} required>
            <option value="">{t("select")}</option>
            {Object.keys(districts).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("district")} htmlFor="jdi">
          <Select id="jdi" value={v.district} onChange={set("district")} required>
            <option value="">{t("select")}</option>
            {(districts[v.state] ?? []).map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("salaryMin")} htmlFor="jsm">
          <Input id="jsm" type="number" min={0} value={v.salaryMin} onChange={set("salaryMin")} />
        </Field>
        <Field label={t("salaryMax")} htmlFor="jsx">
          <Input id="jsx" type="number" min={0} value={v.salaryMax} onChange={set("salaryMax")} />
        </Field>
        <Field label={t("skills")} htmlFor="jsk" hint={t("skillsHint")} className="sm:col-span-2">
          <Input id="jsk" value={v.skills} onChange={set("skills")} placeholder="Milk testing, Accounting" />
        </Field>
        <Field label={t("programmes")} htmlFor="jp" hint={t("programmesHint")} className="sm:col-span-2">
          <select id="jp" multiple value={v.programmes} onChange={(e) => setV({ ...v, programmes: Array.from(e.target.selectedOptions).map((o) => o.value) })} className="h-40 w-full rounded-lg border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-950">
            {programmes.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code} — {p.title}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Button type="submit">
        <Save aria-hidden />
        {t("publish")}
      </Button>
    </form>
  );
}
