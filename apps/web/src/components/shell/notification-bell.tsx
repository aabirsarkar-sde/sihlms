"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { api } from "@/lib/fetcher";

type N = { id: string; title: string; body: string; createdAt: string; readAt: string | null };

export function NotificationBell() {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<N[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((i) => !i.readAt).length;

  useEffect(() => {
    const load = () => api<{ items: N[] }>("/api/v1/notifications").then((r) => r.data && setItems(r.data.items));
    load();
    const iv = setInterval(load, 30_000);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={t("notifications")}
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          if (!open && unread) api("/api/v1/notifications", { method: "POST", json: {} }).then(() => setItems((xs) => xs.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() }))));
        }}
        className="relative flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 ? <span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-saffron-500 px-1 text-[10px] font-bold text-black">{unread}</span> : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          {items.length === 0 ? <p className="p-3 text-sm text-gray-600">{t("noNotifications")}</p> : null}
          <ul className="max-h-96 overflow-y-auto">
            {items.map((n) => (
              <li key={n.id} className="rounded-lg p-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{n.title}</div>
                <div className="text-gray-700 dark:text-gray-300">{n.body}</div>
                <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{new Date(n.createdAt).toLocaleString("en-IN")}</div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
