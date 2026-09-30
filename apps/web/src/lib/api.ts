import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { Prisma } from "@prisma/client";
import { ApiError } from "./errors";

type Handler<P> = (req: NextRequest, ctx: { params: P }) => Promise<Response | unknown>;

/** Wraps a route handler: JSON responses, consistent `{ error: { code, message, fields? } }` errors. */
export function route<P = Record<string, string>>(fn: Handler<P>) {
  return async (req: NextRequest, ctx: { params: P }) => {
    try {
      const out = await fn(req, ctx);
      if (out instanceof Response) return out;
      return NextResponse.json(out ?? { ok: true });
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export function errorResponse(e: unknown) {
  // Let Next.js see its own control-flow errors (dynamic usage, redirects, notFound).
  if (e && typeof e === "object" && "digest" in e && typeof (e as { digest: unknown }).digest === "string") {
    const d = (e as { digest: string }).digest;
    if (d === "DYNAMIC_SERVER_USAGE" || d.startsWith("NEXT_")) throw e;
  }
  if (e instanceof ApiError) {
    return NextResponse.json({ error: { code: e.code, message: e.message, fields: e.fields } }, { status: e.status });
  }
  if (e instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of e.issues) fields[issue.path.join(".") || "_"] = issue.message;
    return NextResponse.json({ error: { code: "VALIDATION", message: "Invalid input", fields } }, { status: 422 });
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    return NextResponse.json({ error: { code: "CONFLICT", message: "Already exists" } }, { status: 409 });
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 });
  }
  console.error(e);
  return NextResponse.json({ error: { code: "INTERNAL", message: "Something went wrong" } }, { status: 500 });
}

export async function body<S extends ZodTypeAny>(req: Request, schema: S): Promise<z.infer<S>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError("BAD_REQUEST", "Body must be JSON");
  }
  return schema.parse(json);
}

export function listParams(req: NextRequest, maxPageSize = 100) {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1) || 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, Number(sp.get("pageSize") ?? 20) || 20));
  const q = sp.get("q")?.trim() || undefined;
  const sortRaw = sp.get("sort") ?? undefined;
  let sort: { field: string; dir: "asc" | "desc" } | undefined;
  if (sortRaw) {
    const desc = sortRaw.startsWith("-");
    sort = { field: desc ? sortRaw.slice(1) : sortRaw, dir: desc ? "desc" : "asc" };
  }
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize, q, sort, sp };
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}
