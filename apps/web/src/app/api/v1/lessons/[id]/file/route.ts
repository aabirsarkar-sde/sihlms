import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getObject } from "@/lib/storage";
import { isEnrolledInCourse } from "@/lib/services/learning";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { mp4: "video/mp4", pdf: "application/pdf", mp3: "audio/mpeg", vtt: "text/vtt" };

/** Lesson media for enrolled trainees and staff. Cacheable by the service worker for offline use. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in" } }, { status: 401 });
  const l = await db.lesson.findUnique({ where: { id: params.id }, include: { module: { select: { courseId: true, course: { select: { published: true } } } } } });
  if (!l) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 });
  if (user.role === "TRAINEE" && !l.module.course.published && !(await isEnrolledInCourse(user.id, l.module.courseId))) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Not enrolled" } }, { status: 403 });
  const key = req.nextUrl.searchParams.get("k") ?? "";
  if (!key.startsWith(`lessons/${l.id}`)) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Bad key" } }, { status: 403 });
  const buf = await getObject(key).catch(() => null);
  if (!buf) return NextResponse.json({ error: { code: "NOT_FOUND", message: "File missing" } }, { status: 404 });
  return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": TYPES[key.split(".").pop() ?? ""] ?? "application/octet-stream", "Cache-Control": "private, max-age=86400" } });
}
