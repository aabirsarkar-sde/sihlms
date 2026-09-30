"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import type { Question } from "@/lib/services/grading";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

export function QuestionBank({ assessment, courseId }: { assessment: { id: string; title: string; timeLimitMin: number; questions: Question[] }; courseId: string }) {
  const t = useTranslations("authoring");
  const [qs, setQs] = useState<Question[]>(assessment.questions);
  const [time, setTime] = useState(assessment.timeLimitMin);
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  const upd = (i: number, q: Partial<Question>) => setQs(qs.map((x, j) => (j === i ? ({ ...x, ...q } as Question) : x)));
  const tr = (q: Question, loc: "hi" | "mr") => q.translations?.[loc] ?? {};
  const setTr = (i: number, loc: "hi" | "mr", patch: { prompt?: string; options?: string[] }) => upd(i, { translations: { ...qs[i].translations, [loc]: { ...tr(qs[i], loc), ...patch } } });

  const save = async () => {
    const r = await api(`/api/v1/assessments/${assessment.id}`, { method: "PATCH", json: { timeLimitMin: time, questions: qs } });
    setMsg(r.error ? { ok: false, text: `${r.error.message} ${Object.values(r.error.fields ?? {}).join(", ")}` } : { ok: true, text: t("saved") });
  };

  return (
    <div className="space-y-4">
      <Link href={`/faculty/courses/${courseId}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeft aria-hidden />
        {t("backToCourse")}
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-bold">{assessment.title}</h1>
        <div className="flex items-end gap-2">
          <Field label={t("timeLimit")} htmlFor="tl">
            <Input id="tl" type="number" min={1} value={time} onChange={(e) => setTime(Number(e.target.value))} className="w-28" />
          </Field>
          <Button onClick={save}>
            <Save aria-hidden />
            {t("save")}
          </Button>
        </div>
      </div>
      {msg ? <Alert tone={msg.ok ? "green" : "red"}>{msg.text}</Alert> : null}
      <ol className="space-y-4">
        {qs.map((q, i) => (
          <li key={q.id} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{t("questionN", { n: i + 1 })}</span>
              <div className="flex gap-2">
                <Select
                  aria-label={t("type")}
                  value={q.type}
                  onChange={(e) => {
                    const type = e.target.value as Question["type"];
                    upd(i, { type, answer: type === "TF" ? true : type === "MSQ" ? [0] : 0, options: type === "TF" ? [] : q.options.length ? q.options : ["", ""] });
                  }}
                  className="w-40"
                >
                  <option value="MCQ">{t("mcq")}</option>
                  <option value="MSQ">{t("msq")}</option>
                  <option value="TF">{t("tf")}</option>
                </Select>
                <Button variant="ghost" size="icon" aria-label={t("delete")} onClick={() => setQs(qs.filter((_, j) => j !== i))}>
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="English" htmlFor={`p-${q.id}`}>
                <Textarea id={`p-${q.id}`} value={q.prompt} onChange={(e) => upd(i, { prompt: e.target.value })} className="min-h-16" />
              </Field>
              <Field label="हिन्दी" htmlFor={`ph-${q.id}`}>
                <Textarea id={`ph-${q.id}`} lang="hi" value={tr(q, "hi").prompt ?? ""} onChange={(e) => setTr(i, "hi", { prompt: e.target.value })} className="min-h-16" />
              </Field>
              <Field label="मराठी" htmlFor={`pm-${q.id}`}>
                <Textarea id={`pm-${q.id}`} lang="mr" value={tr(q, "mr").prompt ?? ""} onChange={(e) => setTr(i, "mr", { prompt: e.target.value })} className="min-h-16" />
              </Field>
            </div>
            {q.type !== "TF" ? (
              <div className="grid gap-3 md:grid-cols-3">
                <Field label={t("optionsEn")} htmlFor={`o-${q.id}`} hint={t("onePerLine")}>
                  <Textarea id={`o-${q.id}`} value={q.options.join("\n")} onChange={(e) => upd(i, { options: lines(e.target.value) })} />
                </Field>
                <Field label={t("optionsHi")} htmlFor={`oh-${q.id}`}>
                  <Textarea id={`oh-${q.id}`} lang="hi" value={(tr(q, "hi").options ?? []).join("\n")} onChange={(e) => setTr(i, "hi", { options: lines(e.target.value) })} />
                </Field>
                <Field label={t("optionsMr")} htmlFor={`om-${q.id}`}>
                  <Textarea id={`om-${q.id}`} lang="mr" value={(tr(q, "mr").options ?? []).join("\n")} onChange={(e) => setTr(i, "mr", { options: lines(e.target.value) })} />
                </Field>
              </div>
            ) : null}
            <fieldset>
              <legend className="mb-1 text-sm font-medium">{t("correct")}</legend>
              <div className="flex flex-wrap gap-2">
                {q.type === "TF"
                  ? [true, false].map((b) => (
                      <label key={String(b)} className="flex min-h-touch items-center gap-2 rounded-lg border px-3 text-sm">
                        <input type="radio" checked={q.answer === b} onChange={() => upd(i, { answer: b })} className="accent-brand-700" />
                        {b ? t("true") : t("false")}
                      </label>
                    ))
                  : q.options.map((o, oi) => {
                      const checked = q.type === "MSQ" ? Array.isArray(q.answer) && q.answer.includes(oi) : q.answer === oi;
                      return (
                        <label key={oi} className="flex min-h-touch items-center gap-2 rounded-lg border px-3 text-sm">
                          <input
                            type={q.type === "MSQ" ? "checkbox" : "radio"}
                            checked={checked}
                            onChange={() => {
                              if (q.type !== "MSQ") return upd(i, { answer: oi });
                              const a = Array.isArray(q.answer) ? q.answer : [];
                              upd(i, { answer: checked ? a.filter((x) => x !== oi) : [...a, oi] });
                            }}
                            className="accent-brand-700"
                          />
                          {o || `#${oi + 1}`}
                        </label>
                      );
                    })}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>
      <Button variant="outline" onClick={() => setQs([...qs, { id: `q${Date.now().toString(36)}`, type: "MCQ", prompt: "", options: ["", ""], translations: {}, answer: 0, marks: 1 }])}>
        <Plus aria-hidden />
        {t("addQuestion")}
      </Button>
    </div>
  );
}
