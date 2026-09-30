"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";

const CATS = ["COOP_EMPLOYEE", "PACS_MEMBER", "SHG_MEMBER", "DAIRY_COOP", "FARMER", "RURAL_YOUTH"];

export function ProgrammeForm({ institutions, staff, courses }: { institutions: { id: string; name: string; code: string }[]; staff: { id: string; name: string; institutionId: string | null }[]; courses: { id: string; title: string }[] }) {
  const t = useTranslations("adminProgrammes");
  const te = useTranslations("enums");
  const router = useRouter();
  const [v, setV] = useState({
    institutionId: institutions[0]?.id ?? "",
    code: "",
    title: "",
    description: "",
    targetCategories: [] as string[],
    mode: "IN_PERSON",
    startDate: "",
    endDate: "",
    nominationDeadline: "",
    capacity: 40,
    passMarkPct: 60,
    minAttendancePct: 75,
    courseId: "",
    coordinatorId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.type === "number" ? Number(e.target.value) : e.target.value });
  const coords = staff.filter((s) => s.institutionId === v.institutionId);
  const inst = institutions.find((i) => i.id === v.institutionId);

  return (
    <form
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await api<{ id: string }>("/api/v1/programmes", {
          method: "POST",
          json: { ...v, code: v.code.toUpperCase(), courseId: v.courseId || null, startDate: `${v.startDate}T09:30:00+05:30`, endDate: `${v.endDate}T17:30:00+05:30`, nominationDeadline: `${v.nominationDeadline}T23:59:00+05:30` },
        });
        setBusy(false);
        if (r.error) {
          setErr(r.error.message);
          setErrors(r.error.fields ?? {});
          return;
        }
        router.push(`/admin/programmes/${r.data!.id}`);
      }}
    >
      {err ? <Alert tone="red">{err}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {institutions.length > 1 ? (
          <Field label={t("institution")} htmlFor="inst" className="sm:col-span-2">
            <Select id="inst" value={v.institutionId} onChange={set("institutionId")}>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field label={t("titleField")} htmlFor="title" error={errors.title} className="sm:col-span-2">
          <Input id="title" value={v.title} onChange={set("title")} required />
        </Field>
        <Field label={t("code")} htmlFor="code" error={errors.code} hint={t("codeHint", { code: `${inst?.code ?? "VAMN"}-DCM-2611` })}>
          <Input id="code" value={v.code} onChange={set("code")} required className="font-mono uppercase" />
        </Field>
        <Field label={t("mode")} htmlFor="mode">
          <Select id="mode" value={v.mode} onChange={set("mode")}>
            {["IN_PERSON", "ONLINE", "BLENDED"].map((m) => (
              <option key={m} value={m}>
                {te(`mode.${m}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("description")} htmlFor="desc" error={errors.description} className="sm:col-span-2">
          <Textarea id="desc" value={v.description} onChange={set("description")} required />
        </Field>
        <fieldset className="sm:col-span-2">
          <legend className="mb-1 text-sm font-medium">{t("targets")}</legend>
          {errors.targetCategories ? <p className="text-sm text-red-700">{errors.targetCategories}</p> : null}
          <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-3">
            {CATS.map((c) => (
              <Checkbox key={c} label={te(`category.${c}`)} checked={v.targetCategories.includes(c)} onChange={(e) => setV({ ...v, targetCategories: e.target.checked ? [...v.targetCategories, c] : v.targetCategories.filter((x) => x !== c) })} />
            ))}
          </div>
        </fieldset>
        <Field label={t("start")} htmlFor="start" error={errors.startDate}>
          <Input id="start" type="date" value={v.startDate} onChange={set("startDate")} required />
        </Field>
        <Field label={t("end")} htmlFor="end" error={errors.endDate}>
          <Input id="end" type="date" value={v.endDate} onChange={set("endDate")} required />
        </Field>
        <Field label={t("deadline")} htmlFor="deadline" error={errors.nominationDeadline}>
          <Input id="deadline" type="date" value={v.nominationDeadline} onChange={set("nominationDeadline")} required />
        </Field>
        <Field label={t("capacity")} htmlFor="cap" error={errors.capacity}>
          <Input id="cap" type="number" min={1} value={v.capacity} onChange={set("capacity")} required />
        </Field>
        <Field label={t("passMark")} htmlFor="pass">
          <Input id="pass" type="number" min={0} max={100} value={v.passMarkPct} onChange={set("passMarkPct")} />
        </Field>
        <Field label={t("minAttendance")} htmlFor="att">
          <Input id="att" type="number" min={0} max={100} value={v.minAttendancePct} onChange={set("minAttendancePct")} />
        </Field>
        <Field label={t("course")} htmlFor="course">
          <Select id="course" value={v.courseId} onChange={set("courseId")}>
            <option value="">{t("noCourse")}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("coordinator")} htmlFor="coord" error={errors.coordinatorId}>
          <Select id="coord" value={v.coordinatorId} onChange={set("coordinatorId")} required>
            <option value="">{t("select")}</option>
            {coords.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Button type="submit" disabled={busy}>
        <Save aria-hidden />
        {t("createDraft")}
      </Button>
    </form>
  );
}
