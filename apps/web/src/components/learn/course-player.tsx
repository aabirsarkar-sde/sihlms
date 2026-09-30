"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft, ArrowRight, CircleCheck, CircleDot, ClipboardCheck, CloudDownload, CloudOff, FileText, Headphones, ListChecks, PlayCircle, RotateCcw, Square, Timer, Volume2,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { kvSet, offlineDb, postOrQueue, uuid } from "@/lib/offline";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, Badge, Progress } from "@/components/ui/misc";
import { RichText } from "./rich-text";

type Tr = Record<string, { title?: string; body?: string }>;
export type PlayerLesson = { id: string; title: string; kind: string; body: string | null; contentUrl: string | null; captionsUrl: string | null; durationMin: number; translations: Tr; offlineSizeKb: number };
export type PlayerQuestion = { id: string; type: "MCQ" | "MSQ" | "TF"; prompt: string; options: string[]; translations: Record<string, { prompt?: string; options?: string[] }>; marks: number };
export type PlayerCourse = {
  id: string;
  title: string;
  description: string;
  modules: { id: string; title: string; lessons: PlayerLesson[]; translations: Record<string, string> }[];
  progress: Record<string, { seconds: number; done: boolean }>;
  quiz: { id: string; title: string; timeLimitMin: number; questions: PlayerQuestion[]; attemptsUsed: number; maxAttempts: number; best: number | null } | null;
};
type Answer = number | number[] | boolean;
type Result = { scorePct: number; results: { id: string; correct: boolean; answer: Answer; given: Answer | null }[]; attemptsUsed?: number };

const SPEECH: Record<string, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };
const SAVE_EVERY_MS = 15_000;

export function CoursePlayer({ course, initialLesson, initialView }: { course: PlayerCourse; initialLesson?: string; initialView: "lesson" | "quiz" }) {
  const t = useTranslations("player");
  const tc = useTranslations("common");
  const te = useTranslations("enums");
  const locale = useLocale();
  const lessons = useMemo(() => course.modules.flatMap((m) => m.lessons), [course]);
  const firstOpen = lessons.find((l) => !course.progress[l.id]?.done)?.id ?? lessons[0]?.id;
  const [lessonId, setLessonId] = useState(initialLesson && lessons.some((l) => l.id === initialLesson) ? initialLesson : firstOpen);
  const [view, setView] = useState<"lesson" | "quiz">(initialView);
  const [progress, setProgress] = useState(course.progress);
  const [queuedNote, setQueuedNote] = useState(false);
  const [downloaded, setDownloaded] = useState<"no" | "busy" | "yes">("no");
  const [speaking, setSpeaking] = useState(false);
  const lesson = lessons.find((l) => l.id === lessonId)!;
  const idx = lessons.findIndex((l) => l.id === lessonId);
  const doneCount = lessons.filter((l) => progress[l.id]?.done).length;

  const loc = (l: PlayerLesson) => {
    const tr = locale === "en" ? undefined : l.translations?.[locale];
    return { title: tr?.title || l.title, body: tr?.body || l.body, englishOnly: locale !== "en" && !!l.body && !tr?.body };
  };
  const cur = loc(lesson);

  // --- time tracking + periodic save (every 15 s), works offline via the outbox
  const secondsRef = useRef<number>(progress[lessonId]?.seconds ?? 0);
  const lastSaved = useRef<number>(secondsRef.current);
  const save = useCallback(
    async (completed?: boolean) => {
      const body = { lessonId, secondsSpent: secondsRef.current, completed, clientTs: new Date().toISOString() };
      lastSaved.current = secondsRef.current;
      const r = await postOrQueue("/api/v1/learn/progress", body, "progress");
      if (r.queued) setQueuedNote(true);
    },
    [lessonId],
  );
  useEffect(() => {
    secondsRef.current = progress[lessonId]?.seconds ?? 0;
    lastSaved.current = secondsRef.current;
    const tick = setInterval(() => {
      if (document.visibilityState === "visible") secondsRef.current += 1;
    }, 1000);
    const saver = setInterval(() => {
      if (secondsRef.current > lastSaved.current) void save();
    }, SAVE_EVERY_MS);
    return () => {
      clearInterval(tick);
      clearInterval(saver);
      if (secondsRef.current > lastSaved.current) void save();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  useEffect(() => {
    const u = new URL(window.location.href);
    u.searchParams.set("lesson", lessonId);
    if (view === "quiz") u.searchParams.set("view", "quiz");
    else u.searchParams.delete("view");
    window.history.replaceState(null, "", u.toString());
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, [lessonId, view]);

  useEffect(() => {
    offlineDb()
      .courses.get(course.id)
      .then((c) => c && setDownloaded("yes"))
      .catch(() => {});
  }, [course.id]);

  const complete = async () => {
    setProgress((p) => ({ ...p, [lessonId]: { seconds: secondsRef.current, done: true } }));
    await save(true);
    if (idx < lessons.length - 1) setLessonId(lessons[idx + 1].id);
    else if (course.quiz) setView("quiz");
  };

  const speak = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(`${cur.title}. ${(cur.body ?? "").replace(/[-*#]/g, " ")}`);
    u.lang = cur.englishOnly ? "en-IN" : SPEECH[locale] ?? "en-IN";
    u.rate = 0.9;
    const voice = synth.getVoices().find((v) => v.lang === u.lang);
    if (voice) u.voice = voice;
    u.onend = () => setSpeaking(false);
    synth.speak(u);
    setSpeaking(true);
  };

  const download = async () => {
    setDownloaded("busy");
    try {
      const res = await fetch(`/api/v1/learn/courses/${course.id}/offline-bundle`);
      const bundle = await res.json();
      if (!res.ok) throw new Error();
      await offlineDb().courses.put({ id: course.id, savedAt: Date.now(), sizeKb: bundle.sizeKb, data: bundle });
      if (bundle.traineeQr) await kvSet("traineeQr", bundle.traineeQr);
      if ("caches" in window) {
        const cache = await caches.open("ss-pages-v1");
        const urls = ["en", "hi", "mr"].flatMap((l) => [`/${l}/learn/courses/${course.id}`, `/${l}/learn`, `/${l}/learn/scan`, `/${l}/learn/downloads`]);
        await Promise.all([...urls, ...(bundle.files ?? [])].map((u: string) => cache.add(new Request(u, { credentials: "same-origin" })).catch(() => {})));
      }
      setDownloaded("yes");
    } catch {
      setDownloaded("no");
    }
  };

  const KindIcon = { VIDEO: PlayCircle, PDF: FileText, AUDIO: Headphones, TEXT: FileText }[lesson.kind] ?? FileText;

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <aside className="order-2 lg:order-1">
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900 lg:sticky lg:top-20">
          <p className="px-1 font-semibold">{course.title}</p>
          <div className="px-1 py-2">
            <Progress value={(doneCount / lessons.length) * 100} label={t("courseProgress")} />
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{t("lessonsDone", { done: doneCount, total: lessons.length })}</p>
          </div>
          <Button variant={downloaded === "yes" ? "ghost" : "outline"} size="sm" className="mb-2 w-full" onClick={download} disabled={downloaded === "busy"} data-testid="download-offline">
            {downloaded === "yes" ? <CircleCheck aria-hidden /> : <CloudDownload aria-hidden />}
            {downloaded === "yes" ? t("availableOffline") : downloaded === "busy" ? t("downloading") : t("downloadOffline")}
          </Button>
          <nav aria-label={t("lessons")} className="max-h-[60vh] overflow-y-auto">
            {course.modules.map((m, mi) => (
              <div key={m.id} className="mb-2">
                <p className="px-1 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                  {mi + 1}. {(locale !== "en" && m.translations?.[locale]) || m.title}
                </p>
                <ul>
                  {m.lessons.map((l) => {
                    const done = progress[l.id]?.done;
                    const active = l.id === lessonId && view === "lesson";
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setView("lesson");
                            setLessonId(l.id);
                          }}
                          aria-current={active ? "true" : undefined}
                          className={cn("flex min-h-touch w-full items-center gap-2 rounded-lg px-2 text-left text-sm", active ? "bg-brand-100 font-semibold text-brand-900 dark:bg-brand-900 dark:text-brand-50" : "hover:bg-gray-100 dark:hover:bg-gray-800")}
                        >
                          {done ? <CircleCheck className="size-4 shrink-0 text-brand-600" aria-label={t("done")} /> : <CircleDot className="size-4 shrink-0 text-gray-400" aria-hidden />}
                          <span className="line-clamp-2">{loc(l).title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {course.quiz ? (
              <button
                type="button"
                onClick={() => setView("quiz")}
                className={cn("mt-1 flex min-h-touch w-full items-center gap-2 rounded-lg px-2 text-left text-sm font-semibold", view === "quiz" ? "bg-saffron-100 text-saffron-700" : "hover:bg-gray-100 dark:hover:bg-gray-800")}
                data-testid="open-quiz"
              >
                <ListChecks className="size-4 text-saffron-600" aria-hidden />
                {t("finalTest")}
                {course.quiz.best != null ? <Badge tone={course.quiz.best >= 60 ? "green" : "red"}>{Math.round(course.quiz.best)}%</Badge> : null}
              </button>
            ) : null}
          </nav>
        </div>
      </aside>

      <section className="order-1 min-w-0 lg:order-2">
        {queuedNote ? (
          <Alert tone="saffron" className="mb-3">
            <CloudOff aria-hidden />
            {t("savedOffline")}
          </Alert>
        ) : null}
        {view === "lesson" ? (
          <article className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-7">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge>
                <KindIcon aria-hidden />
                {te(`lessonKind.${lesson.kind}`)}
              </Badge>
              <Badge>
                <Timer aria-hidden />
                {t("minutes", { n: lesson.durationMin })}
              </Badge>
              {cur.englishOnly ? <Badge tone="saffron">{tc("englishOnly")}</Badge> : null}
            </div>
            <h1 className="text-2xl font-bold" data-testid="lesson-title">
              {cur.title}
            </h1>
            {lesson.kind === "TEXT" || cur.body ? (
              <Button variant="outline" size="sm" className="mt-3" onClick={speak} aria-pressed={speaking}>
                {speaking ? <Square aria-hidden /> : <Volume2 aria-hidden />}
                {speaking ? t("stopReading") : t("readAloud")}
              </Button>
            ) : null}
            <div className="mt-5">
              {lesson.kind === "VIDEO" && lesson.contentUrl ? (
                /youtube\.com|youtu\.be/.test(lesson.contentUrl) ? (
                  <div className="aspect-video overflow-hidden rounded-lg bg-black">
                    <iframe src={lesson.contentUrl.replace("watch?v=", "embed/")} title={cur.title} className="h-full w-full" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
                  </div>
                ) : (
                  <video controls className="w-full rounded-lg bg-black" src={lesson.contentUrl}>
                    {lesson.captionsUrl ? <track kind="captions" src={lesson.captionsUrl} srcLang={locale} label={t("captions")} default /> : null}
                  </video>
                )
              ) : null}
              {lesson.kind === "AUDIO" && lesson.contentUrl ? <audio controls className="w-full" src={lesson.contentUrl} /> : null}
              {lesson.kind === "PDF" && lesson.contentUrl ? (
                <a href={lesson.contentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-touch items-center gap-2 rounded-lg border border-gray-300 px-4 font-semibold">
                  <FileText className="size-5 text-brand-600" aria-hidden />
                  {t("openPdf")}
                </a>
              ) : null}
              {cur.body ? <div className="mt-4"><RichText text={cur.body} /></div> : null}
            </div>
            <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button variant="outline" disabled={idx === 0} onClick={() => setLessonId(lessons[idx - 1].id)}>
                <ArrowLeft aria-hidden />
                {t("previous")}
              </Button>
              <Button onClick={complete} data-testid="complete-lesson">
                <CircleCheck aria-hidden />
                {progress[lessonId]?.done ? t("next") : t("markComplete")}
                <ArrowRight aria-hidden />
              </Button>
            </div>
          </article>
        ) : course.quiz ? (
          <Quiz quiz={course.quiz} />
        ) : null}
        <p className="mt-4 text-center text-sm">
          <Link href="/learn/programmes" className="text-brand-700 underline dark:text-brand-300">
            {t("backToProgrammes")}
          </Link>
        </p>
      </section>
    </div>
  );
}

function Quiz({ quiz }: { quiz: NonNullable<PlayerCourse["quiz"]> }) {
  const t = useTranslations("player");
  const locale = useLocale();
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [left, setLeft] = useState(quiz.timeLimitMin * 60);
  const [result, setResult] = useState<Result | null>(null);
  const [queued, setQueued] = useState(false);
  const [error, setError] = useState<string>();
  const [used, setUsed] = useState(quiz.attemptsUsed);
  const [busy, setBusy] = useState(false);
  const clientId = useRef<string>(uuid());
  const startedAt = useRef<string>();

  const submit = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const r = await postOrQueue<Result>(`/api/v1/assessments/${quiz.id}/attempts`, { clientId: clientId.current, answers, startedAt: startedAt.current, submittedAt: new Date().toISOString() }, "attempt");
    setBusy(false);
    if (!r.ok) return setError(r.error?.message);
    setUsed((u) => u + 1);
    if (r.queued) setQueued(true);
    else setResult(r.data!);
  }, [answers, busy, quiz.id]);

  useEffect(() => {
    if (!started || result || queued) return;
    const iv = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(iv);
  }, [started, result, queued]);
  useEffect(() => {
    if (started && left <= 0 && !result && !queued) void submit();
  }, [left, started, result, queued, submit]);

  const q = (x: PlayerQuestion) => {
    const tr = locale === "en" ? undefined : x.translations?.[locale];
    return { prompt: tr?.prompt || x.prompt, options: tr?.options?.length ? tr.options : x.options };
  };

  if (queued)
    return (
      <div className="rounded-xl border border-saffron-300 bg-saffron-50 p-6 text-center dark:border-saffron-700 dark:bg-saffron-700/10" data-testid="quiz-queued">
        <CloudOff className="mx-auto size-10 text-saffron-600" aria-hidden />
        <h2 className="mt-2 text-lg font-bold">{t("quizQueuedTitle")}</h2>
        <p className="mt-1 text-sm">{t("quizQueuedBody")}</p>
      </div>
    );

  if (result)
    return (
      <div className="space-y-4" data-testid="quiz-result">
        <div className={cn("rounded-xl p-6 text-center", result.scorePct >= 60 ? "bg-brand-50 dark:bg-brand-900/40" : "bg-red-50 dark:bg-red-900/30")}>
          <p className="text-sm font-medium">{t("yourScore")}</p>
          <p className="text-5xl font-bold">{Math.round(result.scorePct)}%</p>
          <p className="mt-1 font-semibold">{result.scorePct >= 60 ? t("passed") : t("notPassed")}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("attemptsLeft", { n: Math.max(0, quiz.maxAttempts - used) })}</p>
        </div>
        <ol className="space-y-3">
          {quiz.questions.map((x, i) => {
            const r = result.results.find((rr) => rr.id === x.id);
            const { prompt, options } = q(x);
            const fmt = (a: Answer | null | undefined) =>
              a === null || a === undefined ? "—" : typeof a === "boolean" ? (a ? t("true") : t("false")) : Array.isArray(a) ? a.map((n) => options[n]).join(", ") : options[a];
            return (
              <li key={x.id} className={cn("rounded-lg border p-3", r?.correct ? "border-brand-300 bg-brand-50/50 dark:border-brand-800" : "border-red-300 bg-red-50/50 dark:border-red-800")}>
                <p className="font-medium">
                  {i + 1}. {prompt}
                </p>
                <p className="mt-1 text-sm">
                  {r?.correct ? <CircleCheck className="mr-1 inline size-4 text-brand-600" aria-hidden /> : null}
                  {t("yourAnswer")}: {fmt(r?.given)}
                </p>
                {!r?.correct ? (
                  <p className="text-sm font-semibold text-brand-800 dark:text-brand-200">
                    {t("correctAnswer")}: {fmt(r?.answer)}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
        {used < quiz.maxAttempts && result.scorePct < 100 ? (
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RotateCcw aria-hidden />
            {t("tryAgain")}
          </Button>
        ) : null}
      </div>
    );

  if (!started)
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <ClipboardCheck className="size-6 text-saffron-600" aria-hidden />
          {quiz.title}
        </h1>
        <ul className="mt-3 space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <li>{t("quizQuestions", { n: quiz.questions.length })}</li>
          <li>{t("quizTime", { n: quiz.timeLimitMin })}</li>
          <li>{t("quizAttempts", { used, max: quiz.maxAttempts })}</li>
          <li>{t("quizBest")}</li>
        </ul>
        {used >= quiz.maxAttempts ? (
          <Alert tone="gray" className="mt-4">
            {t("noAttemptsLeft")}
          </Alert>
        ) : (
          <Button
            className="mt-5"
            size="lg"
            onClick={() => {
              startedAt.current = new Date().toISOString();
              setStarted(true);
            }}
            data-testid="start-quiz"
          >
            {t("startTest")}
          </Button>
        )}
      </div>
    );

  const answered = Object.keys(answers).length;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="space-y-4"
    >
      <div className="sticky top-16 z-10 flex items-center justify-between rounded-xl border border-gray-200 bg-white/95 p-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <span className="text-sm">{t("answered", { n: answered, total: quiz.questions.length })}</span>
        <span className={cn("flex items-center gap-1 font-mono font-semibold", left < 60 && "text-red-600")} role="timer" aria-live="off">
          <Timer className="size-4" aria-hidden />
          {Math.floor(Math.max(0, left) / 60)}:{String(Math.max(0, left) % 60).padStart(2, "0")}
        </span>
      </div>
      {error ? <Alert tone="red">{error}</Alert> : null}
      {quiz.questions.map((x, i) => {
        const { prompt, options } = q(x);
        return (
          <fieldset key={x.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900" data-testid="question">
            <legend className="sr-only">{t("questionN", { n: i + 1 })}</legend>
            <p className="mb-3 font-medium">
              {i + 1}. {prompt}
              {x.type === "MSQ" ? <span className="ml-2 text-xs font-normal text-gray-600">{t("chooseAll")}</span> : null}
            </p>
            <div className="grid gap-2">
              {x.type === "TF"
                ? [true, false].map((v) => (
                    <label key={String(v)} className={cn("flex min-h-touch cursor-pointer items-center gap-3 rounded-lg border px-3", answers[x.id] === v ? "border-brand-600 bg-brand-50 dark:bg-brand-900/40" : "border-gray-200 dark:border-gray-700")}>
                      <input type="radio" name={x.id} checked={answers[x.id] === v} onChange={() => setAnswers({ ...answers, [x.id]: v })} className="h-5 w-5 accent-brand-700" />
                      {v ? t("true") : t("false")}
                    </label>
                  ))
                : options.map((o, oi) => {
                    const multi = x.type === "MSQ";
                    const cur = answers[x.id];
                    const checked = multi ? Array.isArray(cur) && cur.includes(oi) : cur === oi;
                    return (
                      <label key={oi} className={cn("flex min-h-touch cursor-pointer items-center gap-3 rounded-lg border px-3 py-2", checked ? "border-brand-600 bg-brand-50 dark:bg-brand-900/40" : "border-gray-200 dark:border-gray-700")}>
                        <input
                          type={multi ? "checkbox" : "radio"}
                          name={x.id}
                          checked={checked}
                          onChange={() => {
                            if (!multi) return setAnswers({ ...answers, [x.id]: oi });
                            const arr = Array.isArray(cur) ? cur : [];
                            setAnswers({ ...answers, [x.id]: checked ? arr.filter((n) => n !== oi) : [...arr, oi] });
                          }}
                          className="h-5 w-5 shrink-0 accent-brand-700"
                        />
                        {o}
                      </label>
                    );
                  })}
            </div>
          </fieldset>
        );
      })}
      <Button type="submit" size="lg" className="w-full" disabled={busy} data-testid="submit-quiz">
        <ClipboardCheck aria-hidden />
        {t("submit")}
      </Button>
    </form>
  );
}
