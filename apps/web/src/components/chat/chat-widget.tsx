"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bot, Briefcase, ExternalLink, GraduationCap, Mic, MicOff, Send, X } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type Card = { type: "job" | "course" | "programme" | "link"; id: string; title: string; subtitle?: string; href: string };
type Msg = { role: "user" | "assistant"; content: string; cards?: Card[] };

type SR = { lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; start(): void; stop(): void };
const SPEECH: Record<string, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };

export function ChatWidget() {
  const t = useTranslations("chat");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SR | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!open || loaded.current) return;
    loaded.current = true;
    fetch("/api/v1/chat")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items: { role: "user" | "assistant"; content: string }[] }) => setMsgs(d.items.map((m) => ({ role: m.role, content: m.content }))))
      .catch(() => {});
  }, [open]);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setBusy(true);
    setMsgs((m) => [...m, { role: "user", content: message }, { role: "assistant", content: "" }]);
    const patch = (fn: (m: Msg) => Msg) => setMsgs((ms) => [...ms.slice(0, -1), fn(ms[ms.length - 1])]);
    try {
      const res = await fetch("/api/v1/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, locale }) });
      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const p of parts) {
          const line = p.replace(/^data: /, "");
          try {
            const ev = JSON.parse(line);
            if (ev.type === "cards") patch((m) => ({ ...m, cards: ev.cards }));
            if (ev.type === "delta") patch((m) => ({ ...m, content: m.content + ev.text }));
          } catch {
            /* partial */
          }
        }
      }
    } catch {
      patch((m) => ({ ...m, content: t("offline") }));
    }
    setBusy(false);
  };

  const toggleMic = () => {
    const W = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) return alertNoMic();
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new Ctor();
    rec.lang = SPEECH[locale] ?? "en-IN";
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      void send(text);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };
  const alertNoMic = () => setMsgs((m) => [...m, { role: "assistant", content: t("noMic") }]);

  const SUGGEST = [t("s1"), t("s2"), t("s3")];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("fixed bottom-20 right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-saffron-500 px-5 font-semibold text-black shadow-lg hover:bg-saffron-400 md:bottom-6", open && "hidden")}
        aria-label={t("open")}
        data-testid="chat-open"
      >
        <Bot className="size-6" aria-hidden />
        <span className="hidden sm:inline">{t("title")}</span>
      </button>
      {open ? (
        <div role="dialog" aria-label={t("title")} className="fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col rounded-t-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[600px] sm:w-[400px] sm:rounded-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 p-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-full bg-brand-700 text-white">
                <Bot className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold leading-tight">{t("title")}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{t("subtitle")}</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={t("close")}>
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite">
            {msgs.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">{t("welcome")}</p>
                {SUGGEST.map((s) => (
                  <button key={s} type="button" onClick={() => void send(s)} className="block w-full rounded-lg border border-brand-200 bg-brand-50 p-3 text-left text-sm hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/30">
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
            {msgs.map((m, i) => (
              <div key={i} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                <div className={cn("max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm", m.role === "user" ? "bg-brand-700 text-white" : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100")}>
                  {m.content || (busy && i === msgs.length - 1 ? <span className="animate-pulse">{t("thinking")}</span> : null)}
                </div>
                {m.cards?.length ? (
                  <div className="mt-2 grid w-full gap-2">
                    {m.cards.map((c) =>
                      c.type === "link" ? (
                        <a key={c.id} href={c.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-gray-200 p-2 text-sm hover:border-brand-500 dark:border-gray-700">
                          <ExternalLink className="size-4 text-brand-600" aria-hidden />
                          {c.title}
                        </a>
                      ) : (
                        <Link key={c.id} href={c.href} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2 text-sm hover:border-brand-500 dark:border-gray-700" data-testid={`chat-card-${c.type}`}>
                          {c.type === "job" ? <Briefcase className="size-5 shrink-0 text-saffron-600" aria-hidden /> : <GraduationCap className="size-5 shrink-0 text-brand-600" aria-hidden />}
                          <span>
                            <span className="block font-semibold">{c.title}</span>
                            {c.subtitle ? <span className="text-xs text-gray-600 dark:text-gray-400">{c.subtitle}</span> : null}
                          </span>
                        </Link>
                      ),
                    )}
                  </div>
                ) : null}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <p className="px-3 text-[11px] text-gray-600 dark:text-gray-400">{t("disclaimer")}</p>
          <form
            className="flex gap-2 border-t border-gray-200 p-3 dark:border-gray-800"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <button type="button" onClick={toggleMic} className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border", listening ? "border-red-500 bg-red-50 text-red-700" : "border-gray-300 dark:border-gray-700")} aria-label={listening ? t("stopMic") : t("speak")}>
              {listening ? <MicOff className="size-5" aria-hidden /> : <Mic className="size-5" aria-hidden />}
            </button>
            <label htmlFor="chat-input" className="sr-only">
              {t("placeholder")}
            </label>
            <input id="chat-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("placeholder")} className="h-11 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-base dark:border-gray-700 dark:bg-gray-950" />
            <button type="submit" disabled={busy || !input.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-700 text-white disabled:opacity-50" aria-label={t("send")}>
              <Send className="size-5" aria-hidden />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
