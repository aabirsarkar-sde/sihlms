import { createHmac, timingSafeEqual } from "node:crypto";

export const QR_WINDOW_MS = 30_000;

export function windowOf(ts: number) {
  return Math.floor(ts / QR_WINDOW_MS);
}

function mac(secret: string, sessionId: string, window: number) {
  return createHmac("sha256", secret).update(`${sessionId}:${window}`).digest("base64url").slice(0, 16);
}

/** Rotating session token: `<sessionId>.<window>.<hmac>`. */
export function makeSessionToken(sessionId: string, secret: string, now = Date.now()) {
  const w = windowOf(now);
  return { token: `${sessionId}.${w}.${mac(secret, sessionId, w)}`, expiresAt: (w + 1) * QR_WINDOW_MS };
}

export function parseSessionToken(token: string) {
  const [sessionId, w, sig] = token.split(".");
  if (!sessionId || !w || !sig || !/^\d+$/.test(w)) return null;
  return { sessionId, window: Number(w), sig };
}

/** Accepts only the current and previous 30 s window, so photos of old codes fail. */
export function verifySessionToken(token: string, secret: string, now = Date.now()): { ok: boolean; sessionId?: string; reason?: string } {
  const p = parseSessionToken(token);
  if (!p) return { ok: false, reason: "MALFORMED" };
  const cur = windowOf(now);
  if (p.window !== cur && p.window !== cur - 1) return { ok: false, sessionId: p.sessionId, reason: "EXPIRED" };
  const expected = Buffer.from(mac(secret, p.sessionId, p.window));
  const got = Buffer.from(p.sig);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return { ok: false, sessionId: p.sessionId, reason: "BAD_SIGNATURE" };
  return { ok: true, sessionId: p.sessionId };
}

/** Personal trainee QR (ID card / phone), scanned by faculty in Mode B: `TR:<userId>:<hmac>`. */
export function traineeQr(userId: string) {
  const secret = process.env.AUTH_SECRET ?? "dev";
  return `TR:${userId}:${createHmac("sha256", secret).update(`trainee:${userId}`).digest("base64url").slice(0, 12)}`;
}

export function verifyTraineeQr(payload: string): string | null {
  const [p, id] = payload.split(":");
  if (p !== "TR" || !id) return null;
  return traineeQr(id) === payload ? id : null;
}
