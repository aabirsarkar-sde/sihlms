import { getTranslations, setRequestLocale } from "next-intl/server";
import { KioskClient } from "./kiosk-client";

export async function generateMetadata() {
  const t = await getTranslations("kiosk");
  return { title: t("title") };
}

/** Fullscreen attendance kiosk (Chromium on a Raspberry Pi). Authenticates as a device, not a user. */
export default function KioskPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <KioskClient defaultFaceUrl={process.env.NEXT_PUBLIC_KIOSK_FACE_URL ?? "http://localhost:8001"} />;
}
