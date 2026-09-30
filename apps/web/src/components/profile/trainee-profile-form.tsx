"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";

export type ProfileValues = {
  name: string;
  category: string;
  gender: string;
  dob: string;
  state: string;
  district: string;
  village: string;
  cooperativeName: string;
  education: string;
  languages: string;
  skills: string;
  aadhaarLast4: string;
  diet: string;
  openToWork: boolean;
};

const CATS = ["COOP_EMPLOYEE", "PACS_MEMBER", "SHG_MEMBER", "DAIRY_COOP", "FARMER", "RURAL_YOUTH"];
const EDU = ["Class 8", "Class 10", "Class 12", "Diploma", "Graduate", "Postgraduate", "None"];

/** Used by both the 3-step setup wizard (`wizard`) and the profile page. */
export function TraineeProfileForm({ initial, districts, wizard = false, onDone }: { initial: ProfileValues; districts: Record<string, string[]>; wizard?: boolean; onDone?: () => void }) {
  const t = useTranslations("profile");
  const te = useTranslations("enums");
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof ProfileValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });

  const save = async () => {
    setBusy(true);
    setMsg(undefined);
    const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
    const r = await api("/api/v1/me", {
      method: "PATCH",
      json: {
        name: v.name,
        trainee: {
          category: v.category,
          gender: v.gender,
          dob: v.dob,
          state: v.state,
          district: v.district,
          village: v.village || null,
          cooperativeName: v.cooperativeName || null,
          education: v.education,
          languages: split(v.languages),
          skills: split(v.skills),
          aadhaarLast4: v.aadhaarLast4 || null,
          diet: v.diet,
          openToWork: v.openToWork,
        },
      },
    });
    setBusy(false);
    if (r.error) {
      const f: Record<string, string> = {};
      for (const [k, m] of Object.entries(r.error.fields ?? {})) f[k.replace(/^trainee\./, "")] = m;
      setErrors(f);
      setMsg({ ok: false, text: r.error.message });
      return;
    }
    setErrors({});
    setMsg({ ok: true, text: t("saved") });
    if (onDone) onDone();
    else router.refresh();
  };

  const steps = [
    <div key="p" className="grid gap-4 sm:grid-cols-2">
      <Field label={t("name")} htmlFor="name" error={errors.name} className="sm:col-span-2">
        <Input id="name" value={v.name} onChange={set("name")} required />
      </Field>
      <Field label={t("category")} htmlFor="category" error={errors.category}>
        <Select id="category" value={v.category} onChange={set("category")} required>
          <option value="">{t("select")}</option>
          {CATS.map((c) => (
            <option key={c} value={c}>
              {te(`category.${c}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("gender")} htmlFor="gender" error={errors.gender}>
        <Select id="gender" value={v.gender} onChange={set("gender")} required>
          <option value="">{t("select")}</option>
          {["F", "M", "O"].map((g) => (
            <option key={g} value={g}>
              {te(`gender.${g}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("dob")} htmlFor="dob" error={errors.dob}>
        <Input id="dob" type="date" value={v.dob} onChange={set("dob")} required max={new Date().toISOString().slice(0, 10)} />
      </Field>
      <Field label={t("aadhaarLast4")} htmlFor="aadhaar" error={errors.aadhaarLast4} hint={t("aadhaarHint")}>
        <Input id="aadhaar" inputMode="numeric" maxLength={4} value={v.aadhaarLast4} onChange={(e) => setV({ ...v, aadhaarLast4: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
      </Field>
    </div>,
    <div key="l" className="grid gap-4 sm:grid-cols-2">
      <Field label={t("state")} htmlFor="state" error={errors.state}>
        <Select id="state" value={v.state} onChange={(e) => setV({ ...v, state: e.target.value, district: "" })} required>
          <option value="">{t("select")}</option>
          {Object.keys(districts).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </Field>
      <Field label={t("district")} htmlFor="district" error={errors.district}>
        <Select id="district" value={v.district} onChange={set("district")} required disabled={!v.state}>
          <option value="">{t("select")}</option>
          {(districts[v.state] ?? []).map((d) => (
            <option key={d}>{d}</option>
          ))}
        </Select>
      </Field>
      <Field label={t("village")} htmlFor="village">
        <Input id="village" value={v.village} onChange={set("village")} />
      </Field>
      <Field label={t("cooperative")} htmlFor="coop" hint={t("cooperativeHint")}>
        <Input id="coop" value={v.cooperativeName} onChange={set("cooperativeName")} />
      </Field>
    </div>,
    <div key="e" className="grid gap-4 sm:grid-cols-2">
      <Field label={t("education")} htmlFor="education" error={errors.education}>
        <Select id="education" value={v.education} onChange={set("education")} required>
          <option value="">{t("select")}</option>
          {EDU.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </Select>
      </Field>
      <Field label={t("diet")} htmlFor="diet">
        <Select id="diet" value={v.diet} onChange={set("diet")}>
          <option value="VEG">{t("veg")}</option>
          <option value="NON_VEG">{t("nonVeg")}</option>
        </Select>
      </Field>
      <Field label={t("languages")} htmlFor="languages" hint={t("commaHint")}>
        <Input id="languages" value={v.languages} onChange={set("languages")} placeholder="Marathi, Hindi" />
      </Field>
      <Field label={t("skills")} htmlFor="skills" hint={t("commaHint")}>
        <Input id="skills" value={v.skills} onChange={set("skills")} placeholder="Milk testing, Accounting" />
      </Field>
      <Checkbox className="sm:col-span-2" checked={v.openToWork} onChange={(e) => setV({ ...v, openToWork: e.target.checked })} label={t("openToWork")} />
    </div>,
  ];

  const titles = [t("stepPersonal"), t("stepLocation"), t("stepSkills")];
  if (!wizard)
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="space-y-6"
      >
        {steps.map((s, i) => (
          <fieldset key={i}>
            <legend className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">{titles[i]}</legend>
            {s}
          </fieldset>
        ))}
        {msg ? <Alert tone={msg.ok ? "green" : "red"}>{msg.text}</Alert> : null}
        <Button type="submit" disabled={busy}>
          <Save aria-hidden />
          {busy ? t("saving") : t("save")}
        </Button>
      </form>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (step < 2) setStep(step + 1);
        else void save();
      }}
      className="space-y-5"
    >
      <ol className="grid grid-cols-3 gap-2" aria-label={t("steps")}>
        {titles.map((title, i) => (
          <li key={title} aria-current={i === step ? "step" : undefined} className={`rounded-lg border-2 p-2 text-center text-xs font-semibold ${i === step ? "border-brand-600 bg-brand-50 dark:bg-brand-900/40" : i < step ? "border-brand-300 text-brand-700" : "border-gray-200 text-gray-600 dark:text-gray-400 dark:border-gray-700"}`}>
            {i + 1}. {title}
          </li>
        ))}
      </ol>
      {steps[step]}
      {msg && !msg.ok ? <Alert tone="red">{msg.text}</Alert> : null}
      <div className="flex justify-between gap-2">
        <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
          {t("back")}
        </Button>
        <Button type="submit" disabled={busy}>
          {step < 2 ? t("next") : busy ? t("saving") : t("finish")}
        </Button>
      </div>
    </form>
  );
}
