import { createHmac } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Object store with two backends and one interface. Keys look like `certificates/NCCT-VAMN-2026-000001.pdf`.
 * - Vercel Blob (private access) when BLOB_READ_WRITE_TOKEN is set. Keys are used as blob pathnames.
 * - Local disk (./uploads) otherwise.
 * Files are never linked directly: downloads go through signed, short-lived /api/v1/files URLs.
 */
const ROOT = process.env.STORAGE_DIR ?? path.join(process.cwd(), "uploads");

export const usingBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

function localPath(key: string) {
  const p = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
  return path.join(ROOT, p);
}

export async function putObject(key: string, data: Uint8Array | Buffer, contentType?: string) {
  if (usingBlob()) {
    const { put } = await import("@vercel/blob");
    await put(key, Buffer.from(data), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType });
    return key;
  }
  if (process.env.VERCEL) throw new Error("File storage on Vercel needs a Blob store: set BLOB_READ_WRITE_TOKEN");
  const file = localPath(key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
  return key;
}

export async function getObject(key: string): Promise<Buffer> {
  if (usingBlob()) {
    const { get } = await import("@vercel/blob");
    const r = await get(key, { access: "private" });
    if (!r || r.statusCode !== 200) throw new Error(`Object not found: ${key}`);
    return Buffer.from(await new Response(r.stream).arrayBuffer());
  }
  return readFile(localPath(key));
}

const secret = () => process.env.AUTH_SECRET ?? "dev";

/** Signed, short-lived URL for downloading a stored file. */
export function signedUrl(key: string, ttlSeconds = 600) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = createHmac("sha256", secret()).update(`${key}:${exp}`).digest("base64url");
  return `/api/v1/files?key=${encodeURIComponent(key)}&exp=${exp}&sig=${sig}`;
}

export function verifySignedUrl(key: string, exp: number, sig: string) {
  if (!key || !exp || exp < Date.now() / 1000) return false;
  return createHmac("sha256", secret()).update(`${key}:${exp}`).digest("base64url") === sig;
}
