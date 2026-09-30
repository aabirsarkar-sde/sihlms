import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookOpen, PencilLine } from "lucide-react";
import { Link } from "@/i18n/routing";
import { pageUser } from "@/lib/page";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { Badge, PageHeader } from "@/components/ui/misc";
import { NewCourse } from "@/components/authoring/new-course";

export default async function Courses({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  await pageUser(["FACULTY", "INSTITUTE_ADMIN"]);
  const t = await getTranslations("authoring");
  const courses = await db.course.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: { owner: { select: { name: true } }, modules: { select: { _count: { select: { lessons: true } } } }, assessments: { select: { id: true } }, _count: { select: { programmes: true } } },
  });
  return (
    <div className="space-y-5">
      <PageHeader icon={<BookOpen />} title={t("coursesTitle")} actions={<NewCourse />} />
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <li key={c.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <Badge tone={c.published ? "green" : "gray"} className="self-start">
              {c.published ? t("published") : t("draft")}
            </Badge>
            <h2 className="mt-2 font-semibold">{c.title}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{c.description}</p>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {t("courseMeta", { modules: c.modules.length, lessons: c.modules.reduce((s, m) => s + m._count.lessons, 0), programmes: c._count.programmes })} · {c.owner.name}
            </p>
            <Link href={`/faculty/courses/${c.id}`} className={buttonVariants({ variant: "outline", size: "sm", className: "mt-auto" })}>
              <PencilLine aria-hidden />
              {t("edit")}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
