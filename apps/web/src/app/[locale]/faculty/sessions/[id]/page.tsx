import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { pageUser } from "@/lib/page";
import { db } from "@/lib/db";
import { authorize } from "@/lib/rbac";
import { fmtTime } from "@/lib/utils";
import { LiveSession } from "./live-session";

export const dynamic = "force-dynamic";

export default async function LivePage({ params: { id, locale } }: { params: { id: string; locale: string } }) {
  setRequestLocale(locale);
  const user = await pageUser(["FACULTY", "INSTITUTE_ADMIN"]);
  const s = await db.session.findUnique({ where: { id }, include: { programme: { select: { title: true, code: true, institutionId: true } } } });
  if (!s) notFound();
  authorize(user, "read", "attendance", { institutionId: s.programme.institutionId });
  return <LiveSession session={{ id: s.id, title: s.title, programme: `${s.programme.title} (${s.programme.code})`, room: s.room, time: `${fmtTime(s.startsAt, locale)}–${fmtTime(s.endsAt, locale)}` }} />;
}
