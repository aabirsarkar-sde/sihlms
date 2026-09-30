import { getTranslations, setRequestLocale } from "next-intl/server";
import { STATES, GEO } from "@/lib/geo";
import { LoginForm } from "../login/login-form";
import { RegisterForm } from "./register-form";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("registerTitle") };
}

export default function RegisterPage({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: { t?: string } }) {
  setRequestLocale(locale);
  if (!searchParams.t) return <LoginForm demo={false} />;
  const districts = Object.fromEntries(STATES.map((s) => [s, Object.keys(GEO[s])]));
  return <RegisterForm token={searchParams.t} districts={districts} />;
}
