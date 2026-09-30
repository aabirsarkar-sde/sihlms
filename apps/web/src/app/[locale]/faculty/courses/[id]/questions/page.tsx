import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { pageUser } from "@/lib/page";
import { db } from "@/lib/db";
import { courseForEdit } from "@/lib/services/authoring";
import { parseQuestions } from "@/lib/services/learning";
import { QuestionBank } from "@/components/authoring/question-bank";

export default async function Questions({ params: { id, locale } }: { params: { id: string; locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["FACULTY", "INSTITUTE_ADMIN"]);
  await courseForEdit(user, id).catch(() => notFound());
  const a = await db.assessment.findFirst({ where: { courseId: id } });
  if (!a) notFound();
  return <QuestionBank assessment={{ id: a.id, title: a.title, timeLimitMin: a.timeLimitMin, questions: parseQuestions(a.questions) }} courseId={id} />;
}
