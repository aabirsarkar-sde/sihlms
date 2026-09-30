"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";

export function NewCourse() {
  const t = useTranslations("authoring");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState<string>();
  if (!open)
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        {t("newCourse")}
      </Button>
    );
  return (
    <form
      className="w-full space-y-3 rounded-xl border border-gray-200 bg-white p-4 sm:w-96 dark:border-gray-800 dark:bg-gray-900"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await api<{ id: string }>("/api/v1/courses", { method: "POST", json: { title, description } });
        if (r.error) return setErr(r.error.message);
        router.push(`/faculty/courses/${r.data!.id}`);
      }}
    >
      {err ? <Alert tone="red">{err}</Alert> : null}
      <Field label={t("courseTitle")} htmlFor="ct">
        <Input id="ct" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>
      <Field label={t("description")} htmlFor="cd">
        <Textarea id="cd" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
        <Button type="submit">{t("create")}</Button>
      </div>
    </form>
  );
}
