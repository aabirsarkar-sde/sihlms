import { db, type Tx } from "./db";

/** SMS / email are logged to the console in dev; every notice also lands in the in-app Notification table. */
export async function notify(userId: string, title: string, body: string, tx: Tx = db, channel: "SMS" | "EMAIL" | "APP" = "APP") {
  await tx.notification.create({ data: { userId, title, body, channel } });
  if (channel !== "APP") console.info(`[${channel}] to=${userId} :: ${title} — ${body}`);
}

export function sendSms(phone: string, text: string) {
  console.info(`[SMS] ${phone} :: ${text}`);
}
