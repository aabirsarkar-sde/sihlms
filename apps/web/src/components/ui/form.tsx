import * as React from "react";
import { cn } from "@/lib/utils";

const field =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-900 placeholder:text-gray-600 dark:text-gray-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(field, "h-11", className)} {...p} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea ref={ref} className={cn(field, "min-h-24 py-2", className)} {...p} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, ref) => (
  <select ref={ref} className={cn(field, "h-11 pr-8", className)} {...p} />
));
Select.displayName = "Select";

export function Label({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1 block text-sm font-medium text-gray-800 dark:text-gray-200", className)} {...p} />;
}

export function Field({ label, htmlFor, error, hint, children, className }: { label: React.ReactNode; htmlFor: string; error?: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{hint}</p> : null}
      {error ? (
        <p className="mt-1 text-sm text-red-700 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({ label, className, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className={cn("flex min-h-touch cursor-pointer items-start gap-3 text-sm text-gray-800 dark:text-gray-200", className)}>
      <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-400 accent-brand-700" {...p} />
      <span>{label}</span>
    </label>
  );
}
