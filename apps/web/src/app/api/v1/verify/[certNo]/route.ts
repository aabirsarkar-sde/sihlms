import { route } from "@/lib/api";
import { verifyCertificate } from "@/lib/services/certificates";

export const dynamic = "force-dynamic";

export const GET = route<{ certNo: string }>(async (_req, { params }) => verifyCertificate(decodeURIComponent(params.certNo).toUpperCase()));
