import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "./db";
import { jobsForTrainee } from "./services/jobs";

export const CHAT_MODEL = process.env.CHAT_MODEL ?? "claude-haiku-4-5-20251001";
const LOCALE_NAME: Record<string, string> = { en: "English", hi: "Hindi (Devanagari script)", mr: "Marathi (Devanagari script)" };

export function llm() {
  const key = process.env.ANTHROPIC_API_KEY;
  return key ? new Anthropic({ apiKey: key, timeout: 12_000, maxRetries: 0 }) : null;
}

export type Card = { type: "job" | "course" | "programme" | "link"; id: string; title: string; subtitle?: string; href: string };
type Chunk = { id: string; sourceType: string; sourceId: string; text: string };

/** Word stems, so plural and oblique forms (नौकरियाँ, नोकऱ्या) still match. */
const JOB_WORDS = /job|work|employ|hire|hiring|salary|vacanc|naukri|नौकर|जॉब|काम|रोज़?गार|नोकर|वेतन|पगार/i;
const COURSE_WORDS = /course|learn|train|next|study|programme|कोर्स|पाठ्यक्रम|सीख|प्रशिक्षण|कार्यक्रम|शिक|अभ्यासक्रम/i;
const FIN_WORDS = /loan|scheme|subsidy|yojana|ऋण|लोन|योजना|सब्सिडी|कर्ज/i;

/** Retrieval: Postgres full-text over ContentChunk, then keyword overlap as a fallback. Top 6. */
export async function retrieve(query: string, k = 6): Promise<Chunk[]> {
  const q = query.replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
  if (!q) return [];
  const terms = q.split(/\s+/).filter((t) => t.length > 2).slice(0, 12);
  if (!terms.length) return [];
  const tsq = terms.join(" | ");
  const rows = await db.$queryRaw<Chunk[]>`
    SELECT id, "sourceType", "sourceId", text FROM "ContentChunk"
    WHERE to_tsvector('simple', text) @@ to_tsquery('simple', ${tsq})
    ORDER BY ts_rank(to_tsvector('simple', text), to_tsquery('simple', ${tsq})) DESC
    LIMIT ${k}`.catch(() => [] as Chunk[]);
  if (rows.length) return rows;
  return db.contentChunk.findMany({
    where: { OR: terms.map((t) => ({ text: { contains: t, mode: "insensitive" as const } })) },
    select: { id: true, sourceType: true, sourceId: true, text: true },
    take: k,
  });
}

export async function traineeContext(userId: string) {
  const [user, certs] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, include: { traineeProfile: true } }),
    db.certificate.findMany({ where: { traineeId: userId, revokedAt: null }, include: { programme: { select: { title: true, code: true } } } }),
  ]);
  const p = user?.traineeProfile;
  return {
    name: user?.name ?? "",
    text: p
      ? `Name: ${user?.name}. Category: ${p.category}. Location: ${p.district}, ${p.state}. Education: ${p.education || "unknown"}. Skills: ${p.skills.join(", ") || "none listed"}. Certificates: ${certs.map((c) => `${c.programme.title} (${c.programme.code})`).join("; ") || "none yet"}.`
      : `Name: ${user?.name}`,
    completedCourseIds: new Set<string>(),
  };
}

export async function buildContext(userId: string, message: string) {
  const [chunks, ctx] = await Promise.all([retrieve(message), traineeContext(userId)]);
  const cards: Card[] = [];
  if (JOB_WORDS.test(message)) {
    const jobs = await jobsForTrainee(userId, 3);
    for (const j of jobs) {
      cards.push({ type: "job", id: j.job.id, title: j.job.title, subtitle: `${j.orgName} · ${j.job.district} · ${j.score}%`, href: `/learn/jobs?job=${j.job.id}` });
      chunks.push({ id: `job-${j.job.id}`, sourceType: "JOB", sourceId: j.job.id, text: `Job: ${j.job.title} at ${j.orgName}, ${j.job.district}, ${j.job.state}. Skills: ${j.job.requiredSkills.join(", ")}. Match ${j.score}%.` });
    }
  }
  if (COURSE_WORDS.test(message) || cards.length === 0) {
    const programmes = await db.programme.findMany({
      where: { status: "PUBLISHED", deletedAt: null, nominationDeadline: { gte: new Date() } },
      orderBy: { startDate: "asc" },
      take: 3,
      include: { institution: { select: { name: true } } },
    });
    for (const p of programmes) {
      if (COURSE_WORDS.test(message)) cards.push({ type: "programme", id: p.id, title: p.title, subtitle: `${p.institution.name} · ${p.startDate.toLocaleDateString("en-IN")}`, href: `/programmes/${p.id}` });
      chunks.push({ id: `prog-${p.id}`, sourceType: "PROGRAMME", sourceId: p.id, text: `Upcoming programme: ${p.title} (${p.code}) at ${p.institution.name} starting ${p.startDate.toDateString()}. ${p.description}` });
    }
  }
  if (FIN_WORDS.test(message)) {
    cards.push({ type: "link", id: "coop", title: "Ministry of Cooperation — schemes", href: "https://www.cooperation.gov.in" });
    cards.push({ type: "link", id: "nabard", title: "NABARD — loans for cooperatives", href: "https://www.nabard.org" });
  }
  // Cards the retrieval surfaced directly
  for (const c of chunks) {
    if (cards.length >= 5) break;
    if (c.sourceType === "COURSE" && !cards.some((x) => x.id === c.sourceId))
      cards.push({ type: "course", id: c.sourceId, title: c.text.split(".")[0].replace(/^Course:\s*/, ""), href: `/learn/courses/${c.sourceId}` });
  }
  return { chunks: chunks.slice(0, 8), profile: ctx.text, cards: cards.slice(0, 5) };
}

export function systemPrompt(locale: string, profile: string, chunks: Chunk[]) {
  return `You are "Sahayak", the career counsellor inside Sahakar Setu, the National Council for Cooperative Training (NCCT) platform for cooperative members, PACS, SHG and dairy members, farmers and rural youth in India.

Reply ONLY in ${LOCALE_NAME[locale] ?? "English"}, in short, simple sentences suitable for a person with basic literacy. Keep replies under 120 words. Use bullet points for lists.

Rules:
- Use the CONTEXT below and the trainee PROFILE. If the context does not contain the answer, say so briefly and suggest the nearest useful step.
- Never promise jobs, income, loans, subsidies or legal outcomes. Do not give financial or legal guarantees.
- For loans, subsidies and government schemes, tell the user to check the official sources (Ministry of Cooperation: cooperation.gov.in, NABARD: nabard.org, or their district cooperative office).
- When you recommend a job or programme from the context, mention it by its exact title.

PROFILE: ${profile}

CONTEXT:
${chunks.map((c, i) => `[${i + 1}] (${c.sourceType}) ${c.text}`).join("\n")}`;
}

/** Keyword FAQ matching used when the LLM is unreachable. */
export async function faqFallback(message: string, locale: string) {
  const faqs = await db.contentChunk.findMany({ where: { sourceType: "FAQ" }, select: { text: true, sourceId: true } });
  const words = new Set(message.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2));
  let best: { text: string; score: number } | null = null;
  for (const f of faqs) {
    if (!f.sourceId.endsWith(`:${locale}`)) continue;
    const score = f.text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => words.has(w)).length;
    if (!best || score > best.score) best = { text: f.text, score };
  }
  const answer = best && best.score > 0 ? best.text.split(/\nA:\s*/)[1] ?? best.text : null;
  const fallback: Record<string, string> = {
    en: "I could not reach the counselling service right now. Here are some suggestions based on your profile.",
    hi: "अभी परामर्श सेवा से जुड़ नहीं पाया। आपकी प्रोफ़ाइल के आधार पर कुछ सुझाव नीचे हैं।",
    mr: "सध्या समुपदेशन सेवेशी संपर्क होऊ शकला नाही. तुमच्या प्रोफाइलनुसार काही सूचना खाली आहेत.",
  };
  return answer ?? fallback[locale] ?? fallback.en;
}

/** Faculty "Auto-translate": draft translation via the LLM (faculty edits before publishing). */
export async function translateText(text: string, target: string): Promise<string | null> {
  const client = llm();
  if (!client || !text.trim()) return null;
  const res = await client.messages.create({
    model: CHAT_MODEL,
    max_tokens: 4000,
    system: `Translate the user's text into ${LOCALE_NAME[target] ?? target} for rural learners. Keep formatting (markdown, line breaks) and technical terms like PACS, SHG, FPO. Output only the translation.`,
    messages: [{ role: "user", content: text }],
  });
  const block = res.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : null;
}
