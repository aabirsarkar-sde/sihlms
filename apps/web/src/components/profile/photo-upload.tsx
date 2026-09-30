"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImageUp, UserRound } from "lucide-react";
import { useRouter } from "@/i18n/routing";

export function PhotoUpload({ url }: { url: string | null }) {
  const t = useTranslations("profile");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  return (
    <div className="flex items-center gap-4">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={t("photoAlt")} className="size-20 rounded-full object-cover" />
      ) : (
        <span className="flex size-20 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800">
          <UserRound className="size-10 text-gray-600 dark:text-gray-400" aria-hidden />
        </span>
      )}
      <div>
        <label className="inline-flex min-h-touch cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
          <ImageUp className="size-4" aria-hidden />
          {busy ? t("uploading") : t("uploadPhoto")}
          <input
            type="file"
            accept="image/jpeg,image/png"
            capture="user"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              const fd = new FormData();
              fd.append("photo", f);
              const r = await fetch("/api/v1/me/photo", { method: "POST", body: fd });
              setBusy(false);
              if (!r.ok) setErr((await r.json()).error?.message);
              else router.refresh();
            }}
          />
        </label>
        {err ? <p className="mt-1 text-sm text-red-700">{err}</p> : null}
      </div>
    </div>
  );
}
