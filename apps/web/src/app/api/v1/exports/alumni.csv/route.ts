import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { toCsv } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Outreach export of certificate holders, filterable by state, district, category, programme code, year. Phone numbers are not included. */
export const GET = route(async (req) => {
  const user = await requireUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  const sp = req.nextUrl.searchParams;
  const where: Prisma.CertificateWhereInput = {
    revokedAt: null,
    ...(user.role === "INSTITUTE_ADMIN" ? { programme: { institutionId: user.institutionId ?? "-" } } : {}),
    ...(sp.get("programme") ? { programme: { code: { contains: sp.get("programme")!, mode: "insensitive" } } } : {}),
    ...(sp.get("year") ? { issuedAt: { gte: new Date(`${sp.get("year")}-01-01`), lt: new Date(`${Number(sp.get("year")) + 1}-01-01`) } } : {}),
    trainee: {
      traineeProfile: {
        ...(sp.get("state") ? { state: sp.get("state")! } : {}),
        ...(sp.get("district") ? { district: sp.get("district")! } : {}),
        ...(sp.get("category") ? { category: sp.get("category") as never } : {}),
      },
    },
  };
  const certs = await db.certificate.findMany({
    where,
    take: 50_000,
    orderBy: { issuedAt: "desc" },
    include: { trainee: { select: { name: true, traineeProfile: { select: { category: true, gender: true, state: true, district: true, cooperativeName: true, skills: true, openToWork: true } } } }, programme: { select: { code: true, title: true, institution: { select: { code: true } } } } },
  });
  const rows = certs.map((c) => ({
    name: c.trainee.name,
    category: c.trainee.traineeProfile?.category,
    gender: c.trainee.traineeProfile?.gender,
    state: c.trainee.traineeProfile?.state,
    district: c.trainee.traineeProfile?.district,
    cooperative: c.trainee.traineeProfile?.cooperativeName,
    skills: c.trainee.traineeProfile?.skills,
    openToWork: c.trainee.traineeProfile?.openToWork,
    programmeCode: c.programme.code,
    programme: c.programme.title,
    institution: c.programme.institution.code,
    certNo: c.certNo,
    issuedAt: c.issuedAt.toISOString().slice(0, 10),
  }));
  await audit(user.id, "export.alumni", "Export", "alumni", { rows: rows.length, filters: Object.fromEntries(sp) });
  return new NextResponse(toCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="alumni-${new Date().toISOString().slice(0, 10)}.csv"` } });
});
