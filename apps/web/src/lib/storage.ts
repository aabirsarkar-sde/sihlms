import "server-only";
import { createHmac } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Local-disk object store (S3/MinIO-compatible interface kept small on purpose).
 * Keys look like `certificates/NCCT-VAMN-2026-000001.pdf`.
 */
const ROOT = process.env.STORAGE_DIR ?? path.join(process.cwd(), "uploads");

function safe(key: string) {
  const p = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
  return path.join(ROOT, p);
}

export async function putObject(key: string, data: Uint8Array | Buffer) {
  const file = safe(key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
  return key;
}

export async function getObject(key: string) {
  return readFile(safe(key));
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
