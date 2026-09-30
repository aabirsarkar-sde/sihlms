"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Plus } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";

export function NewDevice({ institutions }: { institutions: { id: string; name: string }[] }) {
  const t = useTranslations("devices");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ name: "", kind: "KIOSK", institutionId: institutions[0]?.id });
  const [key, setKey] = useState<string>();
  if (key)
    return (
      <Alert tone="saffron" className="w-full flex-col">
        <strong>{t("keyOnce")}</strong>
        <code className="break-all rounded bg-white px-2 py-1 font-mono text-sm text-gray-900" data-testid="device-key">
          {key}
        </code>
        <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(key)}>
          <Copy aria-hidden />
          {t("copy")}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setKey(undefined)}>
          {t("done")}
        </Button>
      </Alert>
    );
  if (!open)
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        {t("register")}
      </Button>
    );
  return (
    <form
      className="grid w-full gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:grid-cols-3 dark:border-gray-800 dark:bg-gray-900"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await api<{ apiKey: string }>("/api/v1/devices", { method: "POST", json: v });
        if (r.data) {
          setKey(r.data.apiKey);
          setOpen(false);
          router.refresh();
        }
      }}
    >
      <Field label={t("name")} htmlFor="dn">
        <Input id="dn" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required />
      </Field>
      <Field label={t("kind")} htmlFor="dk">
        <Select id="dk" value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value })}>
          <option value="KIOSK">{t("kind_KIOSK")}</option>
          <option value="HUB">{t("kind_HUB")}</option>
        </Select>
      </Field>
      {institutions.length ? (
        <Field label={t("institution")} htmlFor="di">
          <Select id="di" value={v.institutionId} onChange={(e) => setV({ ...v, institutionId: e.target.value })}>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <div className="flex gap-2 sm:col-span-3 sm:justify-end">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
        <Button type="submit">{t("create")}</Button>
      </div>
    </form>
  );
}
