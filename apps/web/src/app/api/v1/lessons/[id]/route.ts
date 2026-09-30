import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { lessonForEdit } from "@/lib/services/authoring";

export const dynamic = "force-dynamic";

const Tr = z.object({ title: z.string().optional(), body: z.string().optional() });

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  const l = await lessonForEdit(user, params.id);
  const data = await body(
    req,
    z
      .object({
        title: z.string().min(2),
        kind: z.enum(["TEXT", "VIDEO", "PDF", "AUDIO"]),
        body: z.string().nullable(),
        contentUrl: z.string().nullable(),
        captionsUrl: z.string().nullable(),
        durationMin: z.number().int().min(1).max(600),
        translations: z.object({ hi: Tr.optional(), mr: Tr.optional() }),
      })
      .partial(),
  );
  const existing = (l.translations ?? {}) as Record<string, unknown>;
  const translations = data.translations ? { ...existing, ...data.translations } : undefined;
  const text = `${data.body ?? l.body ?? ""}${JSON.stringify(translations ?? existing)}`;
  const updated = await db.lesson.update({
    where: { id: l.id },
    data: { ...data, translations: translations as never, offlineSizeKb: Math.ceil(Buffer.byteLength(text) / 1024) + 2 },
  });
  await audit(user.id, "lesson.update", "Lesson", l.id, { fields: Object.keys(data) });
  return updated;
});

export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["FACULTY", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  const l = await lessonForEdit(user, params.id);
  await db.lessonProgress.deleteMany({ where: { lessonId: l.id } });
  await db.lesson.delete({ where: { id: l.id } });
  await audit(user.id, "lesson.delete", "Lesson", l.id, {});
  return { ok: true };
});
