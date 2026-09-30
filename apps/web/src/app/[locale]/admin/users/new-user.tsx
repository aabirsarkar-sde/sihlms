"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";

export function NewUser({ institutions, superAdmin }: { institutions: { id: string; name: string }[]; superAdmin: boolean }) {
  const t = useTranslations("users");
  const tr = useTranslations("roles");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ name: "", phone: "", email: "", role: "FACULTY", institutionId: institutions[0]?.id ?? "" });
  const [err, setErr] = useState<string>();
  if (!open)
    return (
      <Button onClick={() => setOpen(true)}>
        <UserPlus aria-hidden />
        {t("add")}
      </Button>
    );
  return (
    <form
      className="grid w-full gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:grid-cols-2 dark:border-gray-800 dark:bg-gray-900"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await api("/api/v1/users", { method: "POST", json: v });
        if (r.error) return setErr(r.error.message);
        setOpen(false);
        router.refresh();
      }}
    >
      {err ? <Alert tone="red" className="sm:col-span-2">{err}</Alert> : null}
      <Field label={t("name")} htmlFor="nu-n">
        <Input id="nu-n" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required />
      </Field>
      <Field label={t("phone")} htmlFor="nu-p">
        <Input id="nu-p" inputMode="numeric" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} required />
      </Field>
      <Field label={t("role")} htmlFor="nu-r">
        <Select id="nu-r" value={v.role} onChange={(e) => setV({ ...v, role: e.target.value })}>
          {(superAdmin ? ["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"] : ["FACULTY", "INSTITUTE_ADMIN"]).map((r) => (
            <option key={r} value={r}>
              {tr(r)}
            </option>
          ))}
        </Select>
      </Field>
      {superAdmin && v.role !== "SUPER_ADMIN" ? (
        <Field label={t("institution")} htmlFor="nu-i">
          <Select id="nu-i" value={v.institutionId} onChange={(e) => setV({ ...v, institutionId: e.target.value })}>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <div className="flex gap-2 sm:col-span-2 sm:justify-end">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
        <Button type="submit">{t("create")}</Button>
      </div>
    </form>
  );
}
