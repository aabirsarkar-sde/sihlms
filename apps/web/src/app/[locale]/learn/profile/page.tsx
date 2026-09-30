import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { History, ScanFace, ShieldCheck, UserRound } from "lucide-react";
import { pageUser } from "@/lib/page";
import { db } from "@/lib/db";
import { GEO, STATES } from "@/lib/geo";
import { signedUrl } from "@/lib/storage";
import { completeness } from "@/lib/services/profile";
import { fmtDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, PageHeader, Progress, STATUS_TONE } from "@/components/ui/misc";
import { TraineeProfileForm } from "@/components/profile/trainee-profile-form";
import { FaceEnrol } from "@/components/profile/face-enrol";
import { PrivacyActions } from "@/components/profile/privacy-actions";
import { PhotoUpload } from "@/components/profile/photo-upload";

export default async function Profile({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["TRAINEE"]);
  const t = await getTranslations("profile");
  const te = await getTranslations("enums");
  const p = await db.traineeProfile.findUnique({ where: { userId: user.id }, omit: { faceEmbedding: true } });
  if (!p) redirect(`/${locale}/learn/profile/setup`);
  const [noms, certs, attempts, apps] = await Promise.all([
    db.nomination.findMany({ where: { traineeId: user.id }, include: { programme: { select: { title: true } } } }),
    db.certificate.findMany({ where: { traineeId: user.id }, include: { programme: { select: { title: true } } } }),
    db.attempt.findMany({ where: { traineeId: user.id }, include: { assessment: { select: { title: true } } } }),
    db.application.findMany({ where: { traineeId: user.id }, include: { job: { select: { title: true } } } }),
  ]);
  const timeline = [
    ...noms.map((n) => ({ at: n.createdAt, kind: "programme", text: `${n.programme.title}`, badge: te(`nominationStatus.${n.status}`), tone: STATUS_TONE[n.status] })),
    ...certs.map((c) => ({ at: c.issuedAt, kind: "certificate", text: `${c.programme.title} · ${c.certNo}`, badge: c.revokedAt ? t("revoked") : t("certificate"), tone: c.revokedAt ? ("red" as const) : ("green" as const) })),
    ...attempts.map((a) => ({ at: a.submittedAt, kind: "test", text: a.assessment.title, badge: `${Math.round(a.scorePct)}%`, tone: a.scorePct >= 60 ? ("green" as const) : ("red" as const) })),
    ...apps.map((a) => ({ at: a.createdAt, kind: "job", text: a.job.title, badge: te(`applicationStatus.${a.status}`), tone: STATUS_TONE[a.status] })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());
  const pct = completeness(p as never, !!p.photoUrl, !!p.faceConsentAt);
  const districts = Object.fromEntries(STATES.map((s) => [s, Object.keys(GEO[s])]));
  return (
    <div className="space-y-5">
      <PageHeader icon={<UserRound />} title={t("title")} />
      <Card>
        <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <PhotoUpload url={p.photoUrl ? signedUrl(p.photoUrl) : null} />
          <div className="w-full sm:w-64">
            <p className="mb-1 text-sm font-medium">{t("completeness", { pct })}</p>
            <Progress value={pct} tone={pct >= 80 ? "green" : "saffron"} label={t("completenessLabel")} />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>
              <UserRound aria-hidden />
              {t("details")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TraineeProfileForm
              districts={districts}
              initial={{
                name: user.name,
                category: p.category,
                gender: p.gender === "U" ? "" : p.gender,
                dob: p.dob.toISOString().slice(0, 10),
                state: p.state,
                district: p.district,
                village: p.village ?? "",
                cooperativeName: p.cooperativeName ?? "",
                education: p.education,
                languages: p.languages.join(", "),
                skills: p.skills.join(", "),
                aadhaarLast4: p.aadhaarLast4 ?? "",
                diet: p.diet,
                openToWork: p.openToWork,
              }}
            />
          </CardContent>
        </Card>
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>
                <ScanFace aria-hidden />
                {t("face")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FaceEnrol enrolledAt={p.faceConsentAt?.toISOString() ?? null} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <History aria-hidden />
                {t("timeline")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="max-h-96 space-y-3 overflow-y-auto">
                {timeline.map((e, i) => (
                  <li key={i} className="border-l-2 border-brand-200 pl-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">{fmtDate(e.at, locale)}</p>
                    <p className="text-sm">{e.text}</p>
                    <Badge tone={e.tone ?? "gray"}>{e.badge}</Badge>
                  </li>
                ))}
                {timeline.length === 0 ? <li className="text-sm text-gray-600">{t("noActivity")}</li> : null}
              </ol>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <ShieldCheck aria-hidden />
                {t("privacy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PrivacyActions />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
