"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, FileUp, Languages, ListChecks, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert, Badge } from "@/components/ui/misc";

type Tr = { title?: string; body?: string };
type L = { id: string; title: string; kind: string; body: string; contentUrl: string | null; captionsUrl: string | null; durationMin: number; translations: { hi?: Tr; mr?: Tr } };
type C = { id: string; title: string; description: string; published: boolean; assessmentId: string | null; modules: { id: string; title: string; lessons: L[] }[] };
type Loc = "en" | "hi" | "mr";

export function CourseEditor({ course }: { course: C }) {
  const t = useTranslations("authoring");
  const router = useRouter();
  const all = course.modules.flatMap((m) => m.lessons);
  const [sel, setSel] = useState<string | null>(all[0]?.id ?? null);
  const [published, setPublished] = useState(course.published);
  const lesson = all.find((l) => l.id === sel) ?? null;

  const addModule = async () => {
    const title = prompt(t("moduleTitlePrompt"));
    if (!title) return;
    await api(`/api/v1/courses/${course.id}/modules`, { method: "POST", json: { title } });
    router.refresh();
  };
  const addLesson = async (moduleId: string) => {
    const r = await api<{ id: string }>(`/api/v1/modules/${moduleId}/lessons`, { method: "POST", json: { title: t("newLessonTitle"), kind: "TEXT" } });
    if (r.data) setSel(r.data.id);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{course.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {course.assessmentId ? (
            <Link href={`/faculty/courses/${course.id}/questions`} className={buttonVariants({ variant: "outline" })}>
              <ListChecks aria-hidden />
              {t("questionBank")}
            </Link>
          ) : null}
          <Button
            variant={published ? "outline" : "default"}
            onClick={async () => {
              await api(`/api/v1/courses/${course.id}`, { method: "PATCH", json: { published: !published } });
              setPublished(!published);
            }}
          >
            {published ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            {published ? t("unpublish") : t("publish")}
          </Button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          {course.modules.map((m, i) => (
            <div key={m.id}>
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                {i + 1}. {m.title}
              </p>
              <ul>
                {m.lessons.map((l) => {
                  const missing = (["hi", "mr"] as const).filter((k) => !l.translations[k]?.body && l.body);
                  return (
                    <li key={l.id}>
                      <button type="button" onClick={() => setSel(l.id)} className={cn("flex min-h-touch w-full items-center justify-between gap-2 rounded-lg px-2 text-left text-sm", sel === l.id ? "bg-brand-100 font-semibold dark:bg-brand-900" : "hover:bg-gray-100 dark:hover:bg-gray-800")}>
                        <span className="line-clamp-1">{l.title}</span>
                        {missing.length ? <Badge tone="saffron">{missing.join(" ")}</Badge> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => addLesson(m.id)}>
                <Plus aria-hidden />
                {t("addLesson")}
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full" onClick={addModule}>
            <Plus aria-hidden />
            {t("addModule")}
          </Button>
        </aside>
        {lesson ? <LessonEditor key={lesson.id} lesson={lesson} onDeleted={() => setSel(null)} /> : <p className="text-sm text-gray-600">{t("pickLesson")}</p>}
      </div>
    </div>
  );
}

function LessonEditor({ lesson, onDeleted }: { lesson: L; onDeleted: () => void }) {
  const t = useTranslations("authoring");
  const te = useTranslations("enums");
  const router = useRouter();
  const [loc, setLoc] = useState<Loc>("en");
  const [v, setV] = useState({ ...lesson, translations: { hi: { ...lesson.translations.hi }, mr: { ...lesson.translations.mr } } });
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  const [busy, setBusy] = useState(false);

  const title = loc === "en" ? v.title : v.translations[loc].title ?? "";
  const bodyText = loc === "en" ? v.body : v.translations[loc].body ?? "";
  const setField = (k: "title" | "body", val: string) =>
    loc === "en" ? setV({ ...v, [k]: val }) : setV({ ...v, translations: { ...v.translations, [loc]: { ...v.translations[loc], [k]: val } } });

  const save = async () => {
    setBusy(true);
    const r = await api(`/api/v1/lessons/${lesson.id}`, { method: "PATCH", json: { title: v.title, kind: v.kind, body: v.body, contentUrl: v.contentUrl || null, durationMin: v.durationMin, translations: v.translations } });
    setBusy(false);
    setMsg(r.error ? { ok: false, text: r.error.message } : { ok: true, text: t("saved") });
    router.refresh();
  };
  const autoTranslate = async () => {
    if (loc === "en") return;
    setBusy(true);
    setMsg(undefined);
    const r = await api<{ title: string; body: string }>(`/api/v1/lessons/${lesson.id}/translate`, { method: "POST", json: { target: loc } });
    setBusy(false);
    if (r.error) return setMsg({ ok: false, text: r.error.message });
    setV({ ...v, translations: { ...v.translations, [loc]: { title: r.data!.title, body: r.data!.body } } });
    setMsg({ ok: true, text: t("draftReady") });
  };
  const upload = async (f: File, captions = false) => {
    setBusy(true);
    const fd = new FormData();
    fd.append(captions ? "captions" : "file", f);
    const r = await api<{ url: string }>(`/api/v1/lessons/${lesson.id}/upload`, { method: "POST", body: fd });
    setBusy(false);
    if (r.error) return setMsg({ ok: false, text: r.error.message });
    if (!captions) setV({ ...v, contentUrl: r.data!.url });
    setMsg({ ok: true, text: t("uploaded") });
    router.refresh();
  };

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("kind")} htmlFor="kind">
          <Select id="kind" value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value })}>
            {["TEXT", "VIDEO", "PDF", "AUDIO"].map((k) => (
              <option key={k} value={k}>
                {te(`lessonKind.${k}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("duration")} htmlFor="dur">
          <Input id="dur" type="number" min={1} value={v.durationMin} onChange={(e) => setV({ ...v, durationMin: Number(e.target.value) })} />
        </Field>
        {v.kind !== "TEXT" ? (
          <Field label={t("contentUrl")} htmlFor="url" hint={t("contentUrlHint")}>
            <Input id="url" value={v.contentUrl ?? ""} onChange={(e) => setV({ ...v, contentUrl: e.target.value })} />
          </Field>
        ) : null}
      </div>
      {v.kind !== "TEXT" ? (
        <div className="flex flex-wrap gap-2">
          <label className={buttonVariants({ variant: "outline", size: "sm", className: "cursor-pointer" })}>
            <FileUp aria-hidden />
            {t("uploadFile")}
            <input type="file" accept="video/mp4,application/pdf,audio/mpeg" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
          {v.kind === "VIDEO" ? (
            <label className={buttonVariants({ variant: "outline", size: "sm", className: "cursor-pointer" })}>
              <FileUp aria-hidden />
              {lesson.captionsUrl ? t("replaceCaptions") : t("uploadCaptions")}
              <input type="file" accept="text/vtt,.vtt" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], true)} />
            </label>
          ) : null}
        </div>
      ) : null}
      <div role="tablist" className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {(["en", "hi", "mr"] as Loc[]).map((k) => (
          <button key={k} role="tab" type="button" aria-selected={loc === k} onClick={() => setLoc(k)} className={cn("flex min-h-touch items-center gap-1 border-b-2 px-4 text-sm font-semibold", loc === k ? "border-brand-700 text-brand-800 dark:text-brand-200" : "border-transparent text-gray-600")}>
            <Languages className="size-4" aria-hidden />
            {k === "en" ? "English" : k === "hi" ? "हिन्दी" : "मराठी"}
          </button>
        ))}
      </div>
      <Field label={t("lessonTitle")} htmlFor="lt">
        <Input id="lt" value={title} onChange={(e) => setField("title", e.target.value)} lang={loc} />
      </Field>
      <Field label={t("body")} htmlFor="lb" hint={t("bodyHint")}>
        <Textarea id="lb" value={bodyText} onChange={(e) => setField("body", e.target.value)} className="min-h-72 font-mono text-sm" lang={loc} />
      </Field>
      {msg ? <Alert tone={msg.ok ? "green" : "red"}>{msg.text}</Alert> : null}
      <div className="flex flex-wrap justify-between gap-2">
        <Button
          variant="ghost"
          className="text-red-700"
          onClick={async () => {
            if (!confirm(t("confirmDelete"))) return;
            await api(`/api/v1/lessons/${lesson.id}`, { method: "DELETE" });
            onDeleted();
            router.refresh();
          }}
        >
          <Trash2 aria-hidden />
          {t("delete")}
        </Button>
        <div className="flex gap-2">
          {loc !== "en" ? (
            <Button variant="outline" onClick={autoTranslate} disabled={busy}>
              <Sparkles aria-hidden />
              {t("autoTranslate")}
            </Button>
          ) : null}
          <Button onClick={save} disabled={busy}>
            <Save aria-hidden />
            {t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
