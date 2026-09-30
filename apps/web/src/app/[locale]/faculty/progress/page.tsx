import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChartColumn, Users } from "lucide-react";
import { pageUser, sp1, type SP } from "@/lib/page";
import { db } from "@/lib/db";
import { staffProgrammes } from "@/lib/services/staff";
import { learnerProgress, questionDifficulty } from "@/lib/services/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, PageHeader, Progress, Table, Td, Th } from "@/components/ui/misc";
import { ProgrammePicker } from "@/components/programme-picker";
import { BarChartCard } from "@/components/charts/charts";

export default async function LearnerProgress({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const user = await pageUser(["FACULTY", "INSTITUTE_ADMIN"]);
  const t = await getTranslations("progress");
  const programmes = (await staffProgrammes(user)).filter((p) => p.courseId);
  const current = programmes.find((p) => p.id === sp1(searchParams, "programme")) ?? programmes.find((p) => p.status === "ONGOING") ?? programmes[0];
  if (!current) return <Empty icon={<Users />} title={t("none")} />;
  const [rows, assessment] = await Promise.all([learnerProgress(current.id), db.assessment.findFirst({ where: { courseId: current.courseId! }, select: { id: true } })]);
  const diff = assessment ? await questionDifficulty(assessment.id) : [];
  return (
    <div className="space-y-5">
      <PageHeader icon={<ChartColumn />} title={t("title")} />
      <ProgrammePicker programmes={programmes} value={current.id} />
      <BarChartCard
        title={t("difficulty")}
        description={t("difficultyHint")}
        data={diff.map((d, i) => ({ label: `Q${i + 1}`, value: d.correctPct, detail: d.prompt }))}
        valueLabel={t("correctPct")}
        csvName={`question-difficulty-${current.code}.csv`}
        percent
      />
      <Card>
        <CardHeader>
          <CardTitle>
            <Users aria-hidden />
            {t("learners", { n: rows.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <thead>
              <tr>
                <Th>{t("name")}</Th>
                <Th>{t("lessons")}</Th>
                <Th>{t("time")}</Th>
                <Th>{t("best")}</Th>
                <Th>{t("attempts")}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.traineeId}>
                  <Td>{r.name}</Td>
                  <Td className="w-48">
                    <div className="flex items-center gap-2">
                      <Progress value={r.progressPct} label={t("lessons")} />
                      <span className="text-xs tabular-nums">
                        {r.lessonsDone}/{r.totalLessons}
                      </span>
                    </div>
                  </Td>
                  <Td className="tabular-nums">{t("minutes", { n: r.minutes })}</Td>
                  <Td className={`tabular-nums ${r.bestScore != null && r.bestScore < 60 ? "text-red-700" : ""}`}>{r.bestScore != null ? `${r.bestScore}%` : "—"}</Td>
                  <Td className="tabular-nums">{r.attempts}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
