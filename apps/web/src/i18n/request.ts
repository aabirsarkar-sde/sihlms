import { getRequestConfig } from "next-intl/server";
import en from "../../messages/en.json";
import { routing } from "./routing";

type Msgs = { [k: string]: string | Msgs };

/** Locale messages layered over English, so a missing translation shows English rather than a raw key. */
function withFallback(base: Msgs, over: Msgs): Msgs {
  const out: Msgs = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = typeof v === "object" && typeof base[k] === "object" ? withFallback(base[k] as Msgs, v) : v;
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as never)) locale = routing.defaultLocale;
  const messages = locale === "en" ? (en as Msgs) : withFallback(en as Msgs, (await import(`../../messages/${locale}.json`)).default);
  return {
    locale,
    messages,
    timeZone: "Asia/Kolkata",
    formats: {
      dateTime: {
        short: { day: "numeric", month: "short", year: "numeric" },
        time: { hour: "2-digit", minute: "2-digit" },
      },
    },
  };
});
