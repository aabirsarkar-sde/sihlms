"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";

export function NewInstitution() {
  const t = useTranslations("institutions");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ name: "", code: "", type: "ICM", state: "", city: "", address: "" });
  const [err, setErr] = useState<string>();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });
  if (!open)
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        {t("add")}
      </Button>
    );
  return (
    <form
      className="grid w-full gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:grid-cols-3 dark:border-gray-800 dark:bg-gray-900"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await api("/api/v1/institutions", { method: "POST", json: { ...v, code: v.code.toUpperCase() } });
        if (r.error) return setErr(r.error.message + " " + Object.values(r.error.fields ?? {}).join(" "));
        setOpen(false);
        router.refresh();
      }}
    >
      {err ? <Alert tone="red" className="sm:col-span-3">{err}</Alert> : null}
      <Field label={t("name")} htmlFor="in-n" className="sm:col-span-2">
        <Input id="in-n" value={v.name} onChange={set("name")} required />
      </Field>
      <Field label={t("code")} htmlFor="in-c">
        <Input id="in-c" value={v.code} onChange={set("code")} required className="uppercase" />
      </Field>
      <Field label={t("type")} htmlFor="in-t">
        <Select id="in-t" value={v.type} onChange={set("type")}>
          <option>VAMNICOM</option>
          <option>RICM</option>
          <option>ICM</option>
        </Select>
      </Field>
      <Field label={t("state")} htmlFor="in-s">
        <Input id="in-s" value={v.state} onChange={set("state")} required />
      </Field>
      <Field label={t("city")} htmlFor="in-ci">
        <Input id="in-ci" value={v.city} onChange={set("city")} required />
      </Field>
      <Field label={t("address")} htmlFor="in-a" className="sm:col-span-3">
        <Input id="in-a" value={v.address} onChange={set("address")} required />
      </Field>
      <div className="flex gap-2 sm:col-span-3 sm:justify-end">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
        <Button type="submit">{t("create")}</Button>
      </div>
    </form>
  );
}
