import { randomBytes } from "node:crypto";
import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError, notFound } from "@/lib/errors";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Mock DigiLocker push. Real integration would call the DigiLocker Issuer API (push URI) behind this same interface.
 */
export interface DigiLockerClient {
  push(doc: { certNo: string; holderName: string; pdfKey: string }): Promise<{ reference: string }>;
}
const mockDigiLocker: DigiLockerClient = {
  async push(doc) {
    await new Promise((r) => setTimeout(r, 600));
    return { reference: `DL-${doc.certNo.slice(-6)}-${randomBytes(3).toString("hex").toUpperCase()}` };
  },
};

export const POST = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["TRAINEE"]);
  const c = await db.certificate.findUnique({ where: { id: params.id } });
  if (!c || c.traineeId !== user.id) throw notFound("Certificate");
  if (c.revokedAt) throw new ApiError("CONFLICT", "Revoked certificates cannot be pushed");
  const r = await mockDigiLocker.push({ certNo: c.certNo, holderName: user.name, pdfKey: c.pdfUrl });
  await audit(user.id, "certificate.digilocker", "Certificate", c.id, r);
  return { ok: true, reference: r.reference, mock: true };
});
