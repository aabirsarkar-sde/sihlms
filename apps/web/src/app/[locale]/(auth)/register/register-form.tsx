"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Briefcase, GraduationCap, ShieldCheck, UserPlus } from "lucide-react";
import { api } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

type Role = "TRAINEE" | "NOMINATOR" | "EMPLOYER";
const ROLES: { role: Role; icon: typeof GraduationCap }[] = [
  { role: "TRAINEE", icon: GraduationCap },
  { role: "NOMINATOR", icon: UserPlus },
  { role: "EMPLOYER", icon: Briefcase },
];

export function RegisterForm({ token, districts }: { token: string; districts: Record<string, string[]> }) {
  const t = useTranslations("auth");
  const tr = useTranslations("roles");
  const locale = useLocale();
  const [role, setRole] = useState<Role>("TRAINEE");
  const [f, setF] = useState({ name: "", orgName: "", orgType: "Dairy cooperative", state: "", district: "", gstin: "" });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    const payload =
      role === "EMPLOYER"
        ? { role, token, name: f.name, consent, locale, orgName: f.orgName, orgType: f.orgType, state: f.state, district: f.district, gstin: f.gstin || undefined }
        : role === "NOMINATOR"
          ? { role, token, name: f.name, consent, locale, orgName: f.orgName }
          : { role, token, name: f.name, consent, locale };
    const r = await api<{ home: string }>("/api/v1/auth/register", { method: "POST", json: payload });
    setBusy(false);
    if (r.error) {
      setError(r.error.message);
      setFields(r.error.fields ?? {});
      return;
    }
    window.location.href = `/${locale}${r.data!.home}`;
  };

  return (
    <form onSubmit={submit} className="w-full max-w-lg space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h1 className="text-xl font-bold">{t("registerTitle")}</h1>
      {error ? <Alert tone="red">{error}</Alert> : null}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t("iAm")}</legend>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <label key={r.role} className={cn("flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 p-3 text-center text-sm font-medium", role === r.role ? "border-brand-600 bg-brand-50 dark:bg-brand-900/40" : "border-gray-200 dark:border-gray-700")}>
              <input type="radio" name="role" value={r.role} checked={role === r.role} onChange={() => setRole(r.role)} className="sr-only" />
              <r.icon className="size-7 text-brand-600" aria-hidden />
              {tr(r.role)}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label={t("fullName")} htmlFor="name" error={fields.name}>
        <Input id="name" value={f.name} onChange={set("name")} required autoComplete="name" />
      </Field>
      {role !== "TRAINEE" ? (
        <Field label={role === "EMPLOYER" ? t("orgName") : t("nominatingOrg")} htmlFor="orgName" error={fields.orgName}>
          <Input id="orgName" value={f.orgName} onChange={set("orgName")} required autoComplete="organization" />
        </Field>
      ) : null}
      {role === "EMPLOYER" ? (
        <>
          <Field label={t("orgType")} htmlFor="orgType">
            <Select id="orgType" value={f.orgType} onChange={set("orgType")}>
              {["Dairy cooperative", "Cooperative bank", "Credit cooperative", "FPO", "Agri company", "Other"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("state")} htmlFor="state" error={fields.state}>
              <Select id="state" value={f.state} onChange={(e) => setF({ ...f, state: e.target.value, district: "" })} required>
                <option value="">{t("select")}</option>
                {Object.keys(districts).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label={t("district")} htmlFor="district" error={fields.district}>
              <Select id="district" value={f.district} onChange={set("district")} required disabled={!f.state}>
                <option value="">{t("select")}</option>
                {(districts[f.state] ?? []).map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label={t("gstin")} htmlFor="gstin" error={fields.gstin} hint={t("optional")}>
            <Input id="gstin" value={f.gstin} onChange={set("gstin")} className="uppercase" maxLength={15} />
          </Field>
          <Alert tone="saffron">{t("employerPending")}</Alert>
        </>
      ) : null}
      <div className="rounded-xl bg-gray-50 p-4 text-sm dark:bg-gray-800">
        <h2 className="mb-1 flex items-center gap-2 font-semibold">
          <ShieldCheck className="size-4 text-brand-600" aria-hidden />
          {t("purposeTitle")}
        </h2>
        <p className="text-gray-700 dark:text-gray-300">{t("purposeBody")}</p>
        <Checkbox className="mt-2" checked={consent} onChange={(e) => setConsent(e.target.checked)} label={t("consent")} required />
      </div>
      <Button type="submit" className="w-full" disabled={busy || !consent}>
        {busy ? t("creating") : t("createAccount")}
      </Button>
    </form>
  );
}
