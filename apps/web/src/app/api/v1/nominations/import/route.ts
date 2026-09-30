import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { importNominationsCsv } from "@/lib/services/nominations";

export const dynamic = "force-dynamic";

/** multipart (file + programmeId) or JSON { programmeId, csv } */
export const POST = route(async (req) => {
  const user = await requireUser(["NOMINATOR", "INSTITUTE_ADMIN", "SUPER_ADMIN"]);
  let programmeId: string | null = null;
  let csv: string | null = null;
  if (req.headers.get("content-type")?.includes("multipart/form-data")) {
    const form = await req.formData();
    programmeId = String(form.get("programmeId") ?? "");
    const file = form.get("file");
    csv = file instanceof Blob ? await file.text() : null;
  } else {
    const j = (await req.json().catch(() => ({}))) as { programmeId?: string; csv?: string };
    programmeId = j.programmeId ?? null;
    csv = j.csv ?? null;
  }
  if (!programmeId || !csv) throw new ApiError("BAD_REQUEST", "programmeId and a CSV file are required");
  if (csv.length > 2_000_000) throw new ApiError("BAD_REQUEST", "CSV too large");
  const t0 = Date.now();
  const report = await importNominationsCsv(user, programmeId, csv);
  return { ...report, ms: Date.now() - t0 };
});
