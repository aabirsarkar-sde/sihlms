import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { pageUser } from "@/lib/page";
import { db } from "@/lib/db";
import { courseForEdit } from "@/lib/services/authoring";
import { CourseEditor } from "@/components/authoring/course-editor";

export const dynamic = "force-dynamic";

export default async function EditCourse({ params: { id, locale } }: { params: { id: string; locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["FACULTY", "INSTITUTE_ADMIN"]);
  await courseForEdit(user, id).catch(() => notFound());
  const c = await db.course.findUnique({
    where: { id },
    include: { modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } }, assessments: { select: { id: true, title: true } } },
  });
  if (!c) notFound();
  return (
    <CourseEditor
      course={{
        id: c.id,
        title: c.title,
        description: c.description,
        published: c.published,
        assessmentId: c.assessments[0]?.id ?? null,
        modules: c.modules.map((m) => ({
          id: m.id,
          title: m.title,
          lessons: m.lessons.map((l) => ({ id: l.id, title: l.title, kind: l.kind, body: l.body ?? "", contentUrl: l.contentUrl, captionsUrl: l.captionsUrl, durationMin: l.durationMin, translations: (l.translations ?? {}) as never })),
        })),
      }}
    />
  );
}
