import "server-only";
import { db } from "./db";
import { ApiError } from "./errors";
import { FACE_MATCH_THRESHOLD } from "./constants";

const FACE_URL = () => (process.env.FACE_SVC_URL ?? "http://localhost:8001").replace(/\/$/, "");

export const embeddingToBytes = (e: number[]) => Buffer.from(new Float32Array(e).buffer);
export const bytesToEmbedding = (b: Uint8Array) => Array.from(new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)));

async function call<T>(path: string, form: FormData): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${FACE_URL()}${path}`, { method: "POST", body: form, signal: AbortSignal.timeout(15_000) });
  } catch {
    throw new ApiError("UNAVAILABLE", "Face service is not reachable. Use QR or manual marking.");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError("BAD_REQUEST", json.detail ?? json.error ?? "Face service error");
  return json as T;
}

export async function faceHealth() {
  try {
    const r = await fetch(`${FACE_URL()}/health`, { signal: AbortSignal.timeout(2000) });
    return (await r.json()) as { ok: boolean; model: string };
  } catch {
    return { ok: false, model: "unreachable" };
  }
}

/** 1–3 selfies → 512-d embedding. */
export async function enrollFace(images: Blob[]) {
  const form = new FormData();
  images.slice(0, 3).forEach((img, i) => form.append("images", img, `selfie${i}.jpg`));
  const r = await call<{ embedding?: number[]; error?: string }>("/enroll", form);
  if (!r.embedding) throw new ApiError("BAD_REQUEST", r.error === "MULTIPLE_FACES" ? "More than one face in the photo" : "No face found. Face the camera in good light.");
  return r.embedding;
}

export type Candidate = { traineeId: string; embedding: number[] };

export async function sessionCandidates(sessionId: string): Promise<Candidate[]> {
  const s = await db.session.findUnique({ where: { id: sessionId }, select: { programmeId: true } });
  if (!s) throw new ApiError("NOT_FOUND", "Session not found");
  const profiles = await db.traineeProfile.findMany({
    where: { faceEmbedding: { not: null }, faceConsentAt: { not: null }, user: { enrollments: { some: { programmeId: s.programmeId } } } },
    select: { userId: true, faceEmbedding: true },
  });
  return profiles.map((p) => ({ traineeId: p.userId, embedding: bytesToEmbedding(p.faceEmbedding!) }));
}

/** Identify one face among the session's enrolled trainees. With 3 frames, face-svc also runs the liveness (head-turn / blink) check. */
export async function identifyForSession(sessionId: string, frames: Blob[]) {
  const candidates = await sessionCandidates(sessionId);
  if (!candidates.length) return { traineeId: null, reason: "NO_ENROLLED_FACES" as const };
  const form = new FormData();
  frames.slice(0, 3).forEach((f, i) => form.append("images", f, `frame${i}.jpg`));
  form.append("candidates", JSON.stringify(candidates));
  form.append("threshold", String(FACE_MATCH_THRESHOLD));
  form.append("liveness", frames.length >= 3 ? "true" : "false");
  const r = await call<{ traineeId?: string; similarity?: number; match?: null; live?: boolean; error?: string }>("/identify", form);
  if (r.live === false) return { traineeId: null, reason: "LIVENESS_FAILED" as const };
  if (!r.traineeId || (r.similarity ?? 0) < FACE_MATCH_THRESHOLD) return { traineeId: null, reason: "NO_MATCH" as const, similarity: r.similarity };
  return { traineeId: r.traineeId, similarity: r.similarity!, reason: null };
}
