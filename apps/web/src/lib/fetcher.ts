"use client";

export type ApiErr = { code: string; message: string; fields?: Record<string, string> };

export async function api<T = unknown>(url: string, init?: RequestInit & { json?: unknown }): Promise<{ data?: T; error?: ApiErr }> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { ...(init?.json !== undefined ? { "Content-Type": "application/json" } : {}), ...(init?.headers ?? {}) },
      body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) return { error: json.error ?? { code: "HTTP", message: `HTTP ${res.status}` } };
    return { data: json as T };
  } catch {
    return { error: { code: "NETWORK", message: "Network error — check your connection" } };
  }
}
