import { getTranslations, setRequestLocale } from "next-intl/server";
import { Cpu, Wifi, WifiOff } from "lucide-react";
import { pageUser } from "@/lib/page";
import { db } from "@/lib/db";
import { deviceOnline } from "@/lib/devices";
import { fmtDateTime } from "@/lib/utils";
import { Badge, PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { ActionButton } from "@/components/action-button";
import { NewDevice } from "./new-device";

export const dynamic = "force-dynamic";

export default async function Devices({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["SUPER_ADMIN", "INSTITUTE_ADMIN"]);
  const t = await getTranslations("devices");
  const [items, institutions] = await Promise.all([
    db.device.findMany({ where: user.role === "SUPER_ADMIN" ? {} : { institutionId: user.institutionId ?? "-" }, include: { institution: { select: { code: true } } }, orderBy: { createdAt: "desc" } }),
    user.role === "SUPER_ADMIN" ? db.institution.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }) : Promise.resolve([]),
  ]);
  return (
    <div className="space-y-4">
      <PageHeader icon={<Cpu />} title={t("title")} description={t("subtitle")} actions={<NewDevice institutions={institutions} />} />
      <Table>
        <thead>
          <tr>
            <Th>{t("name")}</Th>
            <Th>{t("kind")}</Th>
            <Th>{t("institution")}</Th>
            <Th>{t("status")}</Th>
            <Th>{t("lastSeen")}</Th>
            <Th>{t("actions")}</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => {
            const on = deviceOnline(d.lastSeenAt);
            return (
              <tr key={d.id}>
                <Td className="font-medium">{d.name}</Td>
                <Td>{t(`kind_${d.kind}`)}</Td>
                <Td className="font-mono text-xs">{d.institution.code}</Td>
                <Td>
                  <Badge tone={on ? "green" : "gray"}>
                    {on ? <Wifi aria-hidden /> : <WifiOff aria-hidden />}
                    {on ? t("online") : t("offline")}
                  </Badge>
                </Td>
                <Td className="text-xs">{d.lastSeenAt ? fmtDateTime(d.lastSeenAt, locale) : "—"}</Td>
                <Td>
                  <ActionButton size="sm" variant="outline" url={`/api/v1/devices/${d.id}`} method="DELETE">
                    {t("revoke")}
                  </ActionButton>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
