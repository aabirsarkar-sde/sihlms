import { getTranslations, setRequestLocale } from "next-intl/server";
import { Building2 } from "lucide-react";
import { pageUser } from "@/lib/page";
import { db } from "@/lib/db";
import { PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { NewInstitution } from "./new-institution";

export default async function Institutions({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  await pageUser(["SUPER_ADMIN"]);
  const t = await getTranslations("institutions");
  const items = await db.institution.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }], include: { _count: { select: { programmes: true, users: true, devices: true } } } });
  return (
    <div className="space-y-4">
      <PageHeader icon={<Building2 />} title={t("title")} actions={<NewInstitution />} />
      <Table>
        <thead>
          <tr>
            <Th>{t("code")}</Th>
            <Th>{t("name")}</Th>
            <Th>{t("type")}</Th>
            <Th>{t("location")}</Th>
            <Th className="text-right">{t("programmes")}</Th>
            <Th className="text-right">{t("staff")}</Th>
            <Th className="text-right">{t("devices")}</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <Td className="font-mono text-xs">{i.code}</Td>
              <Td className="font-medium">{i.name}</Td>
              <Td>{i.type}</Td>
              <Td className="text-xs">
                {i.city}, {i.state}
              </Td>
              <Td className="text-right tabular-nums">{i._count.programmes}</Td>
              <Td className="text-right tabular-nums">{i._count.users}</Td>
              <Td className="text-right tabular-nums">{i._count.devices}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
