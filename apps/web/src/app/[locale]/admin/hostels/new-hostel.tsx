"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";

export function NewHostel() {
  const t = useTranslations("hostel");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ name: "", gender: "M", rooms: 10, beds: 3, prefix: "C" });
  if (!open)
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        {t("add")}
      </Button>
    );
  return (
    <form
      className="grid w-full gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:grid-cols-5 dark:border-gray-800 dark:bg-gray-900"
      onSubmit={async (e) => {
        e.preventDefault();
        await api("/api/v1/hostels", { method: "POST", json: v });
        setOpen(false);
        router.refresh();
      }}
    >
      <Field label={t("name")} htmlFor="hn" className="sm:col-span-2">
        <Input id="hn" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required />
      </Field>
      <Field label={t("gender")} htmlFor="hg">
        <Select id="hg" value={v.gender} onChange={(e) => setV({ ...v, gender: e.target.value })}>
          <option value="M">{t("men")}</option>
          <option value="F">{t("women")}</option>
          <option value="ANY">{t("any")}</option>
        </Select>
      </Field>
      <Field label={t("rooms")} htmlFor="hr">
        <Input id="hr" type="number" min={1} value={v.rooms} onChange={(e) => setV({ ...v, rooms: Number(e.target.value) })} />
      </Field>
      <Field label={t("beds")} htmlFor="hb">
        <Input id="hb" type="number" min={1} value={v.beds} onChange={(e) => setV({ ...v, beds: Number(e.target.value) })} />
      </Field>
      <div className="flex gap-2 sm:col-span-5 sm:justify-end">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
        <Button type="submit">{t("create")}</Button>
      </div>
    </form>
  );
}
