import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { putObject, signedUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export const POST = route(async (req) => {
  const user = await requireUser(["TRAINEE"]);
  const form = await req.formData();
  const file = form.get("photo");
  if (!(file instanceof Blob) || !/^image\/(jpeg|png)$/.test(file.type)) throw new ApiError("BAD_REQUEST", "Upload a JPEG or PNG photo");
  if (file.size > 3 * 1024 * 1024) throw new ApiError("BAD_REQUEST", "Photo must be under 3 MB");
  const key = await putObject(`photos/${user.id}.${file.type === "image/png" ? "png" : "jpg"}`, Buffer.from(await file.arrayBuffer()));
  await db.traineeProfile.update({ where: { userId: user.id }, data: { photoUrl: key } });
  return { ok: true, url: signedUrl(key) };
});
