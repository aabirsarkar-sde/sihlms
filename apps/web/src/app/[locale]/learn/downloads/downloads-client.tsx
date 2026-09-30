"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, HardDrive, Trash2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { offlineDb, type CachedCourse } from "@/lib/offline";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty } from "@/components/ui/misc";

export function DownloadsClient() {
  const t = useTranslations("downloads");
  const [items, setItems] = useState<CachedCourse[] | null>(null);
  const [quota, setQuota] = useState<{ usage: number; quota: number }>();
  const load = () =>
    offlineDb()
      .courses.toArray()
      .then(setItems)
      .catch(() => setItems([]));
  useEffect(() => {
    void load();
    navigator.storage?.estimate?.().then((e) => setQuota({ usage: e.usage ?? 0, quota: e.quota ?? 0 }));
  }, []);
  if (items === null) return null;
  return (
    <div className="space-y-4">
      {quota ? (
        <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <HardDrive className="size-4" aria-hidden />
          {t("storage", { used: (quota.usage / 1048576).toFixed(1), total: (quota.quota / 1048576 / 1024).toFixed(1) })}
        </p>
      ) : null}
      {items.length === 0 ? (
        <Empty icon={<BookOpen />} title={t("empty")}>
          {t("emptyHint")}
        </Empty>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => {
            const d = c.data as { course: { title: string }; modules: { lessons: unknown[] }[] };
            return (
              <li key={c.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{d.course.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("meta", { lessons: d.modules.reduce((s, m) => s + m.lessons.length, 0), kb: c.sizeKb, date: new Date(c.savedAt).toLocaleDateString("en-IN") })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/learn/courses/${c.id}`} className={buttonVariants({ size: "sm" })}>
                    <BookOpen aria-hidden />
                    {t("open")}
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await offlineDb().courses.delete(c.id);
                      void load();
                    }}
                  >
                    <Trash2 aria-hidden />
                    {t("remove")}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
