import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SwRegister } from "@/components/shell/sw-register";

const noto = Noto_Sans({ subsets: ["latin"], variable: "--font-noto", display: "swap", weight: ["400", "500", "600", "700"] });
const deva = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-noto-deva", display: "swap", weight: ["400", "500", "600", "700"] });

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    title: { default: t("appName"), template: `%s · ${t("appName")}` },
    description: t("tagline"),
    manifest: "/manifest.webmanifest",
    icons: { icon: "/icons/icon.svg", apple: "/icons/icon-192.png" },
    appleWebApp: { capable: true, title: t("appName"), statusBarStyle: "default" },
  };
}

export const viewport: Viewport = { themeColor: "#135434", width: "device-width", initialScale: 1 };

// Every page reads the session cookie or live data, so render on request (also lets the Docker image build without a DB).
export const dynamic = "force-dynamic";

export default async function LocaleLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  if (!routing.locales.includes(locale as never)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html lang={locale} className={`${noto.variable} ${deva.variable}`}>
      <body className="font-sans">
        <NextIntlClientProvider messages={messages}>
          {children}
          <SwRegister />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
