import type { Prisma } from "@prisma/client";
import { db } from "../db";

export type CatalogueFilters = { institutionId?: string; state?: string; category?: string; mode?: string; month?: string; q?: string; page?: number; pageSize?: number };

export async function listCatalogue(f: CatalogueFilters) {
  const where: Prisma.ProgrammeWhereInput = {
    deletedAt: null,
    status: { in: ["PUBLISHED", "ONGOING"] },
    ...(f.institutionId ? { institutionId: f.institutionId } : {}),
    ...(f.state ? { institution: { state: f.state } } : {}),
    ...(f.category ? { targetCategories: { has: f.category as never } } : {}),
    ...(f.mode ? { mode: f.mode as never } : {}),
    ...(f.q ? { OR: [{ title: { contains: f.q, mode: "insensitive" } }, { code: { contains: f.q, mode: "insensitive" } }] } : {}),
  };
  if (f.month && /^\d{4}-\d{2}$/.test(f.month)) {
    const [y, m] = f.month.split("-").map(Number);
    where.startDate = { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) };
  }
  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 12;
  const [items, total] = await Promise.all([
    db.programme.findMany({
      where,
      orderBy: { startDate: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { institution: { select: { name: true, code: true, city: true, state: true } }, _count: { select: { enrollments: true } } },
    }),
    db.programme.count({ where }),
  ]);
  return { items, total, page, pageSize };
}
