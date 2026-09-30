import { NextResponse, type NextRequest } from "next/server";
import { getObject, verifySignedUrl } from "@/lib/storage";
import { certificatePdfBytes } from "@/lib/services/certificates";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", mp4: "video/mp4", mp3: "audio/mpeg", vtt: "text/vtt" };

/** Serves a stored file only with a valid, unexpired signature. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const key = sp.get("key") ?? "";
  if (!verifySignedUrl(key, Number(sp.get("exp")), sp.get("sig") ?? "")) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Link expired or invalid" } }, { status: 403 });
  try {
    const buf = key.startsWith("certificates/") ? await certificatePdfBytes(key) : await getObject(key);
    if (!buf) throw new Error("missing");
    const ext = key.split(".").pop()?.toLowerCase() ?? "";
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": TYPES[ext] ?? "application/octet-stream", "Content-Disposition": `inline; filename="${key.split("/").pop()}"`, "Cache-Control": "private, max-age=600" },
    });
  } catch {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "File not found" } }, { status: 404 });
  }
}
