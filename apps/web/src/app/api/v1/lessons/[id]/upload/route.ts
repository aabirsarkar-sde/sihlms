import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { putObject } from "@/lib/storage";
import { lessonForEdit } from "@/lib/services/authoring";

export const dynamic = "force-dynamic";

const OK: Record<string, string> = { "video/mp4": "mp4", "application/pdf": "pdf", "audio/mpeg": "mp3", "text/vtt": "vtt" };

/** multipart `file` (MP4, PDF, MP3) or `captions` (VTT). */
export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  const l = await lessonForEdit(user, params.id);
  const form = await req.formData();
  const captions = form.get("captions");
  const file = captions instanceof Blob ? captions : form.get("file");
  if (!(file instanceof Blob) || !OK[file.type]) throw new ApiError("BAD_REQUEST", "Upload an MP4, PDF, MP3 or VTT file");
  if (file.size > 200 * 1024 * 1024) throw new ApiError("BAD_REQUEST", "File must be under 200 MB");
  const ext = OK[file.type];
  const key = await putObject(`lessons/${l.id}${captions instanceof Blob ? "-captions" : ""}.${ext}`, Buffer.from(await file.arrayBuffer()), file.type);
  const url = `/api/v1/lessons/${l.id}/file?k=${encodeURIComponent(key)}`;
  const updated = await db.lesson.update({
    where: { id: l.id },
    data: captions instanceof Blob ? { captionsUrl: url } : { contentUrl: url, offlineSizeKb: Math.ceil(file.size / 1024) },
  });
  return { ok: true, url, lesson: updated };
});
