import { route } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { verifyByHash } from "@/lib/services/certificates";

export const dynamic = "force-dynamic";

export const POST = route(async (req) => {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob)) throw new ApiError("BAD_REQUEST", "Attach the PDF as 'file'");
  if (file.size > 5 * 1024 * 1024) throw new ApiError("BAD_REQUEST", "File too large");
  return verifyByHash(new Uint8Array(await file.arrayBuffer()));
});
