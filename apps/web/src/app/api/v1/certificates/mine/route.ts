import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { signedUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser(["TRAINEE"]);
  const items = await db.certificate.findMany({ where: { traineeId: user.id }, orderBy: { issuedAt: "desc" }, include: { programme: { select: { title: true, code: true } } } });
  return { items: items.map((c) => ({ ...c, downloadUrl: signedUrl(c.pdfUrl) })), total: items.length };
});
