import { getTranslations, setRequestLocale } from "next-intl/server";
import { Plus } from "lucide-react";
import { pageUser } from "@/lib/page";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/misc";
import { ProgrammeForm } from "@/components/admin/programme-form";

export default async function NewProgramme({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  const t = await getTranslations("adminProgrammes");
  const [institutions, staff, courses] = await Promise.all([
    user.role === "SUPER_ADMIN" ? db.institution.findMany({ select: { id: true, name: true, code: true }, orderBy: { name: "asc" } }) : db.institution.findMany({ where: { id: user.institutionId ?? "-" }, select: { id: true, name: true, code: true } }),
    db.user.findMany({ where: { role: { in: ["FACULTY", "INSTITUTE_ADMIN"] }, deletedAt: null, ...(user.role === "INSTITUTE_ADMIN" ? { institutionId: user.institutionId } : {}) }, select: { id: true, name: true, institutionId: true }, orderBy: { name: "asc" } }),
    db.course.findMany({ where: { deletedAt: null }, select: { id: true, title: true } }),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader icon={<Plus />} title={t("new")} />
      <ProgrammeForm institutions={institutions} staff={staff} courses={courses} />
    </div>
  );
}
