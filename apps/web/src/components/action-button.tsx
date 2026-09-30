"use client";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import { Button, type ButtonProps } from "@/components/ui/button";

/** Button that calls an API then refreshes the server component tree. Optional reason prompt field. */
export function ActionButton({ url, method = "POST", json = {}, children, askReason, reasonLabel, ...props }: ButtonProps & { url: string; method?: string; json?: Record<string, unknown>; askReason?: boolean; reasonLabel?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const [reason, setReason] = useState("");
  const [asking, setAsking] = useState(false);
  const run = async () => {
    setBusy(true);
    setErr(undefined);
    const r = await api(url, { method, json: askReason ? { ...json, reason } : json });
    setBusy(false);
    if (r.error) setErr(r.error.message);
    else {
      setAsking(false);
      router.refresh();
    }
  };
  if (askReason && asking)
    return (
      <form
        className="flex flex-wrap items-center gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        <label className="sr-only" htmlFor={`reason-${url}`}>
          {reasonLabel}
        </label>
        <input id={`reason-${url}`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={reasonLabel} className="h-11 rounded-lg border border-gray-300 px-2 text-sm dark:border-gray-700 dark:bg-gray-950" required minLength={5} autoFocus />
        <Button type="submit" size="sm" variant={props.variant} disabled={busy}>
          {children}
        </Button>
        {err ? <span className="text-xs text-red-700">{err}</span> : null}
      </form>
    );
  return (
    <span className="inline-flex flex-col">
      <Button {...props} disabled={busy || props.disabled} onClick={() => (askReason ? setAsking(true) : run())}>
        {children}
      </Button>
      {err ? <span className="text-xs text-red-700">{err}</span> : null}
    </span>
  );
}
