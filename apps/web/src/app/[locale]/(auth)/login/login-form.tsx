"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Building2, Briefcase, GraduationCap, KeyRound, Landmark, Phone, Presentation, ShieldCheck, UserPlus } from "lucide-react";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";

const DEMO = [
  { phone: "9000000001", role: "SUPER_ADMIN", icon: Landmark },
  { phone: "9000000002", role: "INSTITUTE_ADMIN", icon: Building2 },
  { phone: "9000000003", role: "FACULTY", icon: Presentation },
  { phone: "9000000004", role: "TRAINEE", icon: GraduationCap },
  { phone: "9000000005", role: "NOMINATOR", icon: UserPlus },
  { phone: "9000000006", role: "EMPLOYER", icon: Briefcase },
] as const;

type Verify = { needsRegistration?: boolean; token?: string; home?: string };

export function LoginForm({ demo, next }: { demo: boolean; next?: string }) {
  const t = useTranslations("auth");
  const tr = useTranslations("roles");
  const locale = useLocale();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [hint, setHint] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const finish = (r: Verify, ph: string) => {
    if (r.needsRegistration && r.token) {
      try {
        sessionStorage.setItem("reg-token", r.token);
        sessionStorage.setItem("reg-phone", ph);
      } catch {
        /* ignore */
      }
      window.location.href = `/${locale}/register?t=${encodeURIComponent(r.token)}`;
      return;
    }
    const target = next && next.startsWith(`/${locale}/`) ? next : `/${locale}${r.home ?? ""}`;
    window.location.href = target;
  };

  const request = async (ph = phone) => {
    setBusy(true);
    setError(undefined);
    const r = await api<{ devHint?: string }>("/api/v1/auth/otp/request", { method: "POST", json: { phone: ph } });
    setBusy(false);
    if (r.error) return setError(r.error.fields?.phone ?? r.error.message);
    setHint(r.data?.devHint);
    setStep("otp");
  };
  const verify = async (ph = phone, c = code) => {
    setBusy(true);
    setError(undefined);
    const r = await api<Verify>("/api/v1/auth/otp/verify", { method: "POST", json: { phone: ph, code: c } });
    setBusy(false);
    if (r.error) return setError(r.error.message);
    finish(r.data!, ph);
  };
  const demoLogin = async (ph: string) => {
    setPhone(ph);
    setBusy(true);
    const a = await api("/api/v1/auth/otp/request", { method: "POST", json: { phone: ph } });
    if (a.error) {
      setBusy(false);
      return setError(a.error.message);
    }
    await verify(ph, "123456");
  };

  return (
    <div className="w-full max-w-md space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <KeyRound className="size-6 text-brand-600" aria-hidden />
          {t("loginTitle")}
        </h1>
        <p className="mb-5 mt-1 text-sm text-gray-600 dark:text-gray-400">{t("loginSubtitle")}</p>
        {error ? (
          <Alert tone="red" className="mb-4">
            {error}
          </Alert>
        ) : null}
        {step === "phone" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void request();
            }}
            className="space-y-4"
          >
            <Field label={t("phone")} htmlFor="phone" hint={t("phoneHint")}>
              <div className="flex items-center gap-2">
                <span className="flex h-11 items-center rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm dark:border-gray-700 dark:bg-gray-800">
                  <Phone className="mr-1 size-4" aria-hidden />
                  {"+91"}
                </span>
                <Input id="phone" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} required placeholder="98XXXXXXXX" />
              </div>
            </Field>
            <Button type="submit" className="w-full" disabled={busy || phone.length !== 10}>
              {busy ? t("sending") : t("sendOtp")}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void verify();
            }}
            className="space-y-4"
          >
            <p className="text-sm">{t("otpSent", { phone })}</p>
            <Field label={t("otp")} htmlFor="otp" hint={hint ? t("devOtp", { code: hint }) : undefined}>
              <Input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required className="text-center text-2xl tracking-[0.5em]" />
            </Field>
            <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
              <ShieldCheck aria-hidden />
              {busy ? t("verifying") : t("verify")}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("phone")}>
              <ArrowLeft aria-hidden />
              {t("changeNumber")}
            </Button>
          </form>
        )}
        <p className="mt-5 text-center text-sm">
          {t("newHere")}{" "}
          <Link href="/register" className="font-semibold text-brand-700 underline dark:text-brand-300">
            {t("register")}
          </Link>
        </p>
      </div>
      {demo ? (
        <div className="rounded-2xl border border-saffron-300 bg-saffron-50 p-4 dark:border-saffron-700 dark:bg-saffron-700/10">
          <h2 className="text-sm font-semibold">{t("demoTitle")}</h2>
          <p className="mb-3 text-xs text-gray-700 dark:text-gray-300">{t("demoHint")}</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO.map((d) => (
              <button
                key={d.phone}
                type="button"
                disabled={busy}
                onClick={() => void demoLogin(d.phone)}
                data-testid={`demo-${d.role}`}
                className="flex min-h-touch items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm hover:border-brand-500 dark:border-gray-700 dark:bg-gray-900"
              >
                <d.icon className="size-5 shrink-0 text-brand-600" aria-hidden />
                <span>
                  <span className="block font-semibold leading-tight">{tr(d.role)}</span>
                  <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{d.phone}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
