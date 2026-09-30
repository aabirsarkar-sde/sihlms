"use client";
import Dexie, { type Table } from "dexie";

export type OutboxItem = { id?: number; url: string; method: string; body: unknown; kind: string; createdAt: number; tries: number; lastError?: string };
export type CachedCourse = { id: string; savedAt: number; sizeKb: number; data: unknown };
export type KV = { key: string; value: unknown };

class OfflineDb extends Dexie {
  outbox!: Table<OutboxItem, number>;
  courses!: Table<CachedCourse, string>;
  kv!: Table<KV, string>;
  constructor() {
    super("sahakar-setu");
    this.version(1).stores({ outbox: "++id, kind, createdAt", courses: "id, savedAt", kv: "key" });
  }
}

let _db: OfflineDb | null = null;
export function offlineDb() {
  if (!_db) _db = new OfflineDb();
  return _db;
}

const listeners = new Set<() => void>();
export function onOutboxChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const emit = () => listeners.forEach((f) => f());

export const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ (Math.random() * 16) >> (+c / 4)).toString(16));

export async function enqueue(url: string, body: unknown, kind: string, method = "POST") {
  await offlineDb().outbox.add({ url, body, kind, method, createdAt: Date.now(), tries: 0 });
  emit();
  try {
    const reg = await navigator.serviceWorker?.ready;
    // Background Sync where supported; the `online` listener covers the rest.
    await (reg as unknown as { sync?: { register(tag: string): Promise<void> } })?.sync?.register("outbox");
  } catch {
    /* not supported */
  }
}

export async function outboxCount() {
  try {
    return await offlineDb().outbox.count();
  } catch {
    return 0;
  }
}

let flushing: Promise<{ sent: number; failed: number }> | null = null;

/** Replays queued writes in order. Server endpoints are idempotent (clientId), so replaying twice is safe. */
export function flushOutbox() {
  if (flushing) return flushing;
  flushing = (async () => {
    let sent = 0;
    let failed = 0;
    const items = await offlineDb().outbox.orderBy("createdAt").toArray();
    for (const item of items) {
      try {
        const res = await fetch(item.url, { method: item.method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(item.body), credentials: "same-origin" });
        if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 401 && res.status !== 429)) {
          // 4xx other than auth/rate limit will never succeed on retry: drop it, keep the reason.
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            await offlineDb().kv.put({ key: `outbox-error:${item.id}`, value: { item, error: err } });
            failed++;
          } else sent++;
          await offlineDb().outbox.delete(item.id!);
        } else {
          await offlineDb().outbox.update(item.id!, { tries: item.tries + 1, lastError: `HTTP ${res.status}` });
          break;
        }
      } catch {
        break; // still offline
      }
    }
    emit();
    return { sent, failed };
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

/** POST online; if the network is down, queue it in the outbox and report `queued`. */
export async function postOrQueue<T = unknown>(url: string, body: unknown, kind: string): Promise<{ ok: boolean; queued?: boolean; data?: T; error?: { code: string; message: string } }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await enqueue(url, body, kind);
    return { ok: true, queued: true };
  }
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: json.error ?? { code: "HTTP", message: `HTTP ${res.status}` } };
    return { ok: true, data: json as T };
  } catch {
    await enqueue(url, body, kind);
    return { ok: true, queued: true };
  }
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  try {
    return (await offlineDb().kv.get(key))?.value as T | undefined;
  } catch {
    return undefined;
  }
}
export async function kvSet(key: string, value: unknown) {
  try {
    await offlineDb().kv.put({ key, value });
  } catch {
    /* storage unavailable */
  }
}
