import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Prisma } from "@prisma/client";
import { Users } from "lucide-react";
import { pageUser, sp1, type SP } from "@/lib/page";
import { db } from "@/lib/db";
import { Input, Select } from "@/components/ui/form";
import { Badge, PageHeader, STATUS_TONE, Table, Td, Th } from "@/components/ui/misc";
import { Pager } from "@/components/pager";
import { ActionButton } from "@/components/action-button";
import { NewUser } from "./new-user";

export default async function UsersPage({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const user = await pageUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  const t = await getTranslations("users");
  const tr = await getTranslations("roles");
  const q = sp1(searchParams, "q");
  const role = sp1(searchParams, "role");
  const page = Number(sp1(searchParams, "page") ?? 1) || 1;
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(user.role === "INSTITUTE_ADMIN" ? { institutionId: user.institutionId ?? "-" } : {}),
    ...(role ? { role: role as never } : user.role === "INSTITUTE_ADMIN" ? {} : { role: { not: "TRAINEE" } }),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
  };
  const [items, total, institutions] = await Promise.all([
    db.user.findMany({ where, orderBy: { name: "asc" }, skip: (page - 1) * 25, take: 25, include: { institution: { select: { code: true } } } }),
    db.user.count({ where }),
    user.role === "SUPER_ADMIN" ? db.institution.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }) : Promise.resolve([]),
  ]);
  return (
    <div className="space-y-4">
      <PageHeader icon={<Users />} title={t("title")} actions={<NewUser institutions={institutions} superAdmin={user.role === "SUPER_ADMIN"} />} />
      <form method="get" className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="uq" className="sr-only">
          {t("search")}
        </label>
        <Input id="uq" name="q" defaultValue={q} placeholder={t("search")} className="sm:max-w-xs" />
        <label htmlFor="ur" className="sr-only">
          {t("role")}
        </label>
        <Select id="ur" name="role" defaultValue={role ?? ""} className="sm:max-w-[220px]">
          <option value="">{t("allRoles")}</option>
          {["SUPER_ADMIN", "INSTITUTE_ADMIN", "FACULTY", "TRAINEE", "NOMINATOR", "EMPLOYER"].map((r) => (
            <option key={r} value={r}>
              {tr(r)}
            </option>
          ))}
        </Select>
        <button type="submit" className="h-11 rounded-lg border border-gray-300 px-4 text-sm font-semibold dark:border-gray-700">
          {t("filter")}
        </button>
      </form>
      <Table>
        <thead>
          <tr>
            <Th>{t("name")}</Th>
            <Th>{t("phone")}</Th>
            <Th>{t("role")}</Th>
            <Th>{t("institution")}</Th>
            <Th>{t("status")}</Th>
            <Th>{t("actions")}</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.id}>
              <Td className="font-medium">{u.name}</Td>
              <Td className="font-mono text-xs">{u.phone}</Td>
              <Td>{tr(u.role)}</Td>
              <Td className="font-mono text-xs">{u.institution?.code ?? "—"}</Td>
              <Td>
                <Badge tone={STATUS_TONE[u.status] ?? "gray"}>{t(`status_${u.status}`)}</Badge>
              </Td>
              <Td>
                {u.id !== user.id && (user.role === "SUPER_ADMIN" || u.role !== "SUPER_ADMIN") ? (
                  <ActionButton size="sm" variant="outline" url={`/api/v1/users/${u.id}`} method="PATCH" json={{ status: u.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED" }}>
                    {u.status === "SUSPENDED" ? t("activate") : t("suspend")}
                  </ActionButton>
                ) : null}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pager page={page} pageSize={25} total={total} base="/admin/users" params={{ q, role }} />
    </div>
  );
}
