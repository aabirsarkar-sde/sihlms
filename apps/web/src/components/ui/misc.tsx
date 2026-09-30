import * as React from "react";
import { cn } from "@/lib/utils";

const TONES = {
  gray: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  green: "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100",
  saffron: "bg-saffron-100 text-saffron-700 dark:bg-saffron-700/30 dark:text-saffron-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
};
export type Tone = keyof typeof TONES;

export function Badge({ tone = "gray", className, ...p }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold [&_svg]:size-3.5", TONES[tone], className)} {...p} />;
}

export const STATUS_TONE: Record<string, Tone> = {
  DRAFT: "gray",
  PUBLISHED: "blue",
  ONGOING: "saffron",
  COMPLETED: "green",
  CANCELLED: "red",
  SUBMITTED: "blue",
  APPROVED: "green",
  REJECTED: "red",
  WAITLISTED: "saffron",
  WITHDRAWN: "gray",
  APPLIED: "blue",
  SHORTLISTED: "saffron",
  INTERVIEW: "saffron",
  OFFERED: "green",
  HIRED: "green",
  VALID: "green",
  REVOKED: "red",
  ACTIVE: "green",
  PENDING: "saffron",
  SUSPENDED: "red",
};

export function Progress({ value, className, label, tone = "green" }: { value: number; className?: string; label?: string; tone?: "green" | "saffron" | "red" }) {
  const v = Math.max(0, Math.min(100, value));
  const bar = tone === "green" ? "bg-brand-600" : tone === "saffron" ? "bg-saffron-500" : "bg-red-600";
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800", className)} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Stat({ label, value, icon, hint }: { label: React.ReactNode; value: React.ReactNode; icon?: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 [&_svg]:size-4 [&_svg]:text-brand-600">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-50">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{hint}</div> : null}
    </div>
  );
}

export function Empty({ icon, title, children }: { icon?: React.ReactNode; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
      <div className="text-gray-400 [&_svg]:size-8">{icon}</div>
      <p className="font-medium text-gray-800 dark:text-gray-200">{title}</p>
      {children ? <div className="text-sm text-gray-600 dark:text-gray-400">{children}</div> : null}
    </div>
  );
}

export function PageHeader({ title, description, actions, icon }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-50 sm:text-2xl [&_svg]:size-6 [&_svg]:text-brand-600">
          {icon}
          {title}
        </h1>
        {description ? <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Table({ className, ...p }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className={cn("w-full min-w-[560px] border-collapse bg-white text-sm dark:bg-gray-900", className)} {...p} />
    </div>
  );
}
export const Th = ({ className, ...p }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn("border-b border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400", className)} {...p} />
);
export const Td = ({ className, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("border-b border-gray-100 px-3 py-2.5 align-middle text-gray-800 dark:border-gray-800 dark:text-gray-200", className)} {...p} />
);

export function Alert({ tone = "gray", className, ...p }: React.HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  return <div role="status" className={cn("flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0", TONES[tone], className)} {...p} />;
}
