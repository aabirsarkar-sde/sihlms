import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
export const num = (n: number) => new Intl.NumberFormat("en-IN").format(n);
export const fmtDate = (d: Date | string, locale = "en") =>
  new Date(d).toLocaleDateString(`${locale}-IN`, { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
export const fmtTime = (d: Date | string, locale = "en") =>
  new Date(d).toLocaleTimeString(`${locale}-IN`, { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
export const fmtDateTime = (d: Date | string, locale = "en") => `${fmtDate(d, locale)}, ${fmtTime(d, locale)}`;

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v instanceof Date ? v.toISOString() : Array.isArray(v) ? v.join("; ") : String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}
