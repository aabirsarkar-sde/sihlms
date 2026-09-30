import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { embeddingToBytes, enrollFace } from "@/lib/face";

export const dynamic = "force-dynamic";

/** multipart: consent=true + 3 selfies (images). Only the embedding is stored — never the photos. */
export const POST = route(async (req) => {
  const user = await requireUser(["TRAINEE"]);
  const form = await req.formData();
  if (form.get("consent") !== "true") throw new ApiError("VALIDATION", "Consent is required for face enrolment", { consent: "required" });
  const images = form.getAll("images").filter((f): f is File => f instanceof Blob);
  if (images.length < 1) throw new ApiError("BAD_REQUEST", "Add at least one selfie");
  const embedding = await enrollFace(images);
  await db.traineeProfile.update({ where: { userId: user.id }, data: { faceEmbedding: embeddingToBytes(embedding), faceConsentAt: new Date() } });
  await audit(user.id, "face.enroll", "TraineeProfile", user.id, { images: images.length });
  return { ok: true, enrolledAt: new Date() };
});

/** One-click delete: embedding nulled, consent cleared. */
export const DELETE = route(async () => {
  const user = await requireUser(["TRAINEE"]);
  await db.traineeProfile.update({ where: { userId: user.id }, data: { faceEmbedding: null, faceConsentAt: null } });
  await audit(user.id, "face.delete", "TraineeProfile", user.id, {});
  return { ok: true };
});
