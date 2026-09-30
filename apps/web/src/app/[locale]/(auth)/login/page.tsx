import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "./login-form";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("loginTitle") };
}

export default function LoginPage({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: { next?: string } }) {
  setRequestLocale(locale);
  const demo = process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "true";
  const next = searchParams.next && searchParams.next.startsWith("/") && !searchParams.next.startsWith("//") ? searchParams.next : undefined;
  return <LoginForm demo={demo} next={next} />;
}
