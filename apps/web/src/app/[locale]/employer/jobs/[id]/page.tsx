import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { KanbanSquare, Search } from "lucide-react";
import { Link } from "@/i18n/routing";
import { pageUser, sp1, type SP } from "@/lib/page";
import { db } from "@/lib/db";
import { CATEGORIES } from "@/lib/constants";
import { STATES } from "@/lib/geo";
import { matchScore } from "@/lib/services/match";
import { candidatesForJob, maskPhone, phoneVisible, traineeCertCodes } from "@/lib/services/jobs";
import { cn } from "@/lib/utils";
import { Input, Select } from "@/components/ui/form";
import { Alert, Badge, Table, Td, Th } from "@/components/ui/misc";
import { Pager } from "@/components/pager";
import { Kanban } from "@/components/employer/kanban";

export const dynamic = "force-dynamic";

export default async function JobDetail({ params: { id, locale }, searchParams }: { params: { id: string; locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const user = await pageUser(["EMPLOYER"]);
  const t = await getTranslations("employer");
  const te = await getTranslations("enums");
  const job = await db.job.findFirst({ where: { id, employerId: user.id, deletedAt: null } });
  if (!job) notFound();
  const tab = sp1(searchParams, "tab") === "search" ? "search" : "pipeline";

  const apps = await db.application.findMany({ where: { jobId: job.id }, orderBy: { createdAt: "asc" }, include: { trainee: { select: { id: true, name: true, phone: true, traineeProfile: { select: { category: true, state: true, district: true, skills: true } } } } } });
  const certs = await traineeCertCodes(apps.map((a) => a.traineeId));
  const cards = apps
    .map((a) => {
      const p = a.trainee.traineeProfile;
      const c = certs.get(a.traineeId) ?? { codes: [], certs: [] };
      const m = matchScore({ skills: p?.skills ?? [], programmeCodes: c.codes, state: p?.state ?? "", district: p?.district ?? "" }, job);
      return {
        id: a.id,
        status: a.status,
        name: a.trainee.name,
        phone: phoneVisible(a.status) ? a.trainee.phone : maskPhone(a.trainee.phone),
        location: p ? `${p.district}, ${p.state}` : "",
        category: p ? te(`category.${p.category}`) : "",
        score: m.score,
        certificates: c.certs.map((x) => ({ certNo: x.certNo, title: x.title, required: job.requiredProgrammeCodes.includes(x.code) })),
        coverNote: a.coverNote,
      };
    })
    .sort((a, b) => b.score - a.score);

  let search: Awaited<ReturnType<typeof candidatesForJob>> | null = null;
  let searchError: string | null = null;
  const f = { state: sp1(searchParams, "state"), district: sp1(searchParams, "district"), category: sp1(searchParams, "category"), skill: sp1(searchParams, "skill"), certificate: sp1(searchParams, "certificate"), page: Number(sp1(searchParams, "page") ?? 1) || 1 };
  if (tab === "search") {
    try {
      search = await candidatesForJob(user, job.id, f);
    } catch (e) {
      searchError = e instanceof Error ? e.message : "Error";
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {job.district}, {job.state} · {job.requiredSkills.join(", ")}
          {job.requiredProgrammeCodes.length ? ` · ${t("requires", { codes: job.requiredProgrammeCodes.join(", ") })}` : ""}
        </p>
      </div>
      <nav className="flex gap-1 border-b border-gray-200 dark:border-gray-800" aria-label={t("sections")}>
        {[
          { k: "pipeline", icon: KanbanSquare, label: t("pipelineTab", { n: apps.length }) },
          { k: "search", icon: Search, label: t("searchTab") },
        ].map((x) => (
          <Link key={x.k} href={`/employer/jobs/${job.id}?tab=${x.k}`} aria-current={tab === x.k ? "page" : undefined} className={cn("flex min-h-touch items-center gap-2 border-b-2 px-3 text-sm font-semibold", tab === x.k ? "border-brand-700 text-brand-800 dark:text-brand-200" : "border-transparent text-gray-600")}>
            <x.icon className="size-4" aria-hidden />
            {x.label}
          </Link>
        ))}
      </nav>
      {tab === "pipeline" ? (
        <Kanban cards={cards} />
      ) : (
        <div className="space-y-3">
          <form method="get" className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <input type="hidden" name="tab" value="search" />
            <label className="sr-only" htmlFor="cs-state">
              {t("state")}
            </label>
            <Select id="cs-state" name="state" defaultValue={f.state ?? ""}>
              <option value="">{t("anyState")}</option>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
            <label className="sr-only" htmlFor="cs-district">
              {t("district")}
            </label>
            <Input id="cs-district" name="district" defaultValue={f.district} placeholder={t("district")} />
            <label className="sr-only" htmlFor="cs-cat">
              {t("category")}
            </label>
            <Select id="cs-cat" name="category" defaultValue={f.category ?? ""}>
              <option value="">{t("anyCategory")}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {te(`category.${c}`)}
                </option>
              ))}
            </Select>
            <label className="sr-only" htmlFor="cs-skill">
              {t("skill")}
            </label>
            <Input id="cs-skill" name="skill" defaultValue={f.skill} placeholder={t("skill")} />
            <label className="sr-only" htmlFor="cs-cert">
              {t("certificateCode")}
            </label>
            <Input id="cs-cert" name="certificate" defaultValue={f.certificate} placeholder={t("certificateCode")} />
            <button type="submit" className="h-11 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white">
              {t("search")}
            </button>
          </form>
          {searchError ? <Alert tone="saffron">{searchError}</Alert> : null}
          {search ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("found", { n: search.total })}</p>
              <Table>
                <thead>
                  <tr>
                    <Th>{t("candidate")}</Th>
                    <Th>{t("location")}</Th>
                    <Th>{t("skills")}</Th>
                    <Th>{t("certificates")}</Th>
                    <Th className="text-right">{t("match")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {search.items.map((c) => (
                    <tr key={c.traineeId}>
                      <Td>
                        <span className="font-medium">{c.name}</span>
                        <span className="block text-xs text-gray-600 dark:text-gray-400">{te(`category.${c.category}`)}</span>
                        {c.applicationStatus ? <Badge tone="blue">{te(`applicationStatus.${c.applicationStatus}`)}</Badge> : null}
                      </Td>
                      <Td className="text-xs">
                        {c.district}, {c.state}
                        {c.distanceKm != null ? ` · ${c.distanceKm} km` : ""}
                      </Td>
                      <Td className="text-xs">{c.skills.join(", ")}</Td>
                      <Td className="text-xs">
                        {c.certificates.map((x) => (
                          <Link key={x.certNo} href={`/verify/${x.certNo}`} className="block font-mono text-brand-700 underline dark:text-brand-300">
                            {x.code}
                          </Link>
                        ))}
                      </Td>
                      <Td className="text-right">
                        <Badge tone={c.score >= 70 ? "green" : c.score >= 45 ? "saffron" : "gray"}>{c.score}%</Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Pager page={f.page} pageSize={20} total={search.total} base={`/employer/jobs/${job.id}`} params={{ tab: "search", state: f.state, district: f.district, category: f.category, skill: f.skill, certificate: f.certificate }} />
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
