import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { issueCertificates, programmeEligibility } from "@/lib/services/certificates";
import { loadProgrammeFor } from "@/lib/services/programmes";

export const dynamic = "force-dynamic";

export const POST = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["INSTITUTE_ADMIN"]);
  const t0 = Date.now();
  const r = await issueCertificates(user, params.id);
  return { ...r, ms: Date.now() - t0 };
});

/** Preview eligibility without issuing. */
export const GET = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["INSTITUTE_ADMIN", "SUPER_ADMIN", "FACULTY"]);
  await loadProgrammeFor(user, params.id, "read");
  const items = await programmeEligibility(params.id);
  return { items, total: items.length };
});
