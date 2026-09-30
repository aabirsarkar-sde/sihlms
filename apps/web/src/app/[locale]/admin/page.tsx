import { getTranslations, setRequestLocale } from "next-intl/server";
import { Award, BedDouble, Briefcase, ChartColumn, GraduationCap, Layers, Percent, Target, Trophy } from "lucide-react";
import { pageUser } from "@/lib/page";
import { db } from "@/lib/db";
import { attendanceBySession, hostelOccupancy, institutionLeague, overview, placements, splits, traineesByMonth, traineesByState } from "@/lib/services/analytics";
import { STATE_TILE } from "@/lib/geo";
import { fmtDate, num } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, Progress, Stat, Table, Td, Th } from "@/components/ui/misc";
import { BarChartCard, StateHeatmapCard, TrendChartCard } from "@/components/charts/charts";

export const dynamic = "force-dynamic";

export default async function Dashboard({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  const t = await getTranslations("dashboard");
  const te = await getTranslations("enums");
  const scope = user.role === "SUPER_ADMIN" ? {} : { institutionId: user.institutionId };
  const [ov, months, states, sp, league, place, inst] = await Promise.all([
    overview(scope),
    traineesByMonth(scope),
    traineesByState(scope),
    splits(scope),
    institutionLeague(scope),
    placements(scope),
    user.institutionId ? db.institution.findUnique({ where: { id: user.institutionId } }) : null,
  ]);
  const [att, hostels] = user.institutionId ? await Promise.all([attendanceBySession(user.institutionId, 12), hostelOccupancy(user.institutionId)]) : [[], []];
  return (
    <div className="space-y-5">
      <PageHeader icon={<ChartColumn />} title={user.role === "SUPER_ADMIN" ? t("allIndia") : inst?.name ?? t("institution")} description={t("asOf", { date: fmtDate(new Date(), locale) })} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4" data-testid="kpis">
        <Stat icon={<GraduationCap />} label={t("trainees")} value={num(ov.trainees)} />
        <Stat icon={<Award />} label={t("certificates")} value={num(ov.certificates)} />
        <Stat icon={<Target />} label={t("completion")} value={`${ov.completionRate}%`} />
        <Stat icon={<Percent />} label={t("avgScore")} value={`${ov.avgScore}%`} />
        <Stat icon={<Layers />} label={t("programmes")} value={num(ov.programmes)} hint={t("ongoing", { n: ov.ongoing })} />
        <Stat icon={<Briefcase />} label={t("placed")} value={num(ov.placed)} />
        <Stat icon={<Percent />} label={t("placementRate")} value={`${ov.placementRate}%`} hint={t("ofCertified")} />
        <Stat icon={<Briefcase />} label={t("applications")} value={num(place.reduce((s, p) => s + p.value, 0))} />
      </div>
      <TrendChartCard
        title={t("byMonth")}
        csvName="trainees-by-month.csv"
        data={months.map((m) => ({ month: m.month, trained: m.trained, certified: m.certified }))}
        series={[
          { key: "trained", label: t("trained") },
          { key: "certified", label: t("certifiedSeries") },
        ]}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <StateHeatmapCard title={t("heatmap")} description={t("heatmapHint")} data={states.map((s) => ({ state: s.state, value: s.trainees }))} tiles={STATE_TILE} csvName="trainees-by-state.csv" valueLabel={t("trainees")} />
        <div className="space-y-5">
          <BarChartCard title={t("byCategory")} data={sp.category.map((c) => ({ label: te(`category.${c.key}`), value: c.value }))} valueLabel={t("trainees")} csvName="trainees-by-category.csv" horizontal />
          <BarChartCard title={t("byGender")} data={sp.gender.map((g) => ({ label: te(`gender.${g.key}`), value: g.value }))} valueLabel={t("trainees")} csvName="trainees-by-gender.csv" horizontal />
        </div>
      </div>
      <BarChartCard title={t("pipeline")} data={place.sort((a, b) => ["APPLIED", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"].indexOf(a.status) - ["APPLIED", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"].indexOf(b.status)).map((p) => ({ label: te(`applicationStatus.${p.status}`), value: p.value }))} valueLabel={t("applications")} csvName="placements.csv" />
      {user.role === "SUPER_ADMIN" ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <Trophy aria-hidden />
              {t("league")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <thead>
                <tr>
                  <Th>{t("rank")}</Th>
                  <Th>{t("institution")}</Th>
                  <Th className="text-right">{t("trainees")}</Th>
                  <Th className="text-right">{t("certificates")}</Th>
                  <Th>{t("completion")}</Th>
                  <Th className="text-right">{t("avgScore")}</Th>
                  <Th className="text-right">{t("placed")}</Th>
                </tr>
              </thead>
              <tbody>
                {league.map((r, i) => (
                  <tr key={r.id}>
                    <Td className="tabular-nums">{i + 1}</Td>
                    <Td>
                      <span className="font-medium">{r.name}</span>
                      <span className="ml-2 font-mono text-xs text-gray-600 dark:text-gray-400">{r.code}</span>
                    </Td>
                    <Td className="text-right tabular-nums">{num(r.trainees)}</Td>
                    <Td className="text-right tabular-nums">{num(r.certificates)}</Td>
                    <Td className="w-40">
                      <div className="flex items-center gap-2">
                        <Progress value={r.completionPct} label={t("completion")} />
                        <span className="text-xs tabular-nums">{r.completionPct}%</span>
                      </div>
                    </Td>
                    <Td className="text-right tabular-nums">{r.avgScore}%</Td>
                    <Td className="text-right tabular-nums">{r.placed}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <BarChartCard title={t("attendanceBySession")} data={att.reverse().map((a) => ({ label: fmtDate(a.startsAt, locale).replace(/ \d{4}$/, ""), value: a.pct, detail: `${a.programme} · ${a.title} (${a.present}/${a.enrolled})` }))} valueLabel={t("attendancePct")} csvName="attendance-by-session.csv" percent />
          <Card>
            <CardHeader>
              <CardTitle>
                <BedDouble aria-hidden />
                {t("hostelOccupancy")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {hostels.map((h) => (
                <div key={h.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{h.name}</span>
                    <span className="tabular-nums">{t("beds", { used: h.used, beds: h.beds })}</span>
                  </div>
                  <Progress value={h.pct} tone={h.pct > 90 ? "red" : "green"} label={h.name} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
