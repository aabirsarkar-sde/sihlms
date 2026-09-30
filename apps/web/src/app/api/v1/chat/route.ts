import { z } from "zod";
import { body, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildContext, CHAT_MODEL, faqFallback, llm, systemPrompt } from "@/lib/ai";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser(["TRAINEE"]);
  const items = await db.chatMessage.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30 });
  return { items: items.reverse(), total: items.length };
});

/** Streams SSE: {type:"cards"} first, then {type:"delta"} chunks, then {type:"done"}. */
export const POST = route(async (req) => {
  const user = await requireUser(["TRAINEE"]);
  const { message, locale } = await body(req, z.object({ message: z.string().trim().min(1).max(1000), locale: z.enum(["en", "hi", "mr"]).default("en") }));
  await db.chatMessage.create({ data: { userId: user.id, role: "user", content: message, locale } });
  const history = (await db.chatMessage.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 7 })).reverse().slice(0, -1);
  const ctx = await buildContext(user.id, message);
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(enc.encode(`data: ${JSON.stringify(o)}\n\n`));
      send({ type: "cards", cards: ctx.cards });
      let full = "";
      let source: "llm" | "faq" = "llm";
      const client = llm();
      try {
        if (!client) throw new Error("no key");
        const s = client.messages.stream({
          model: CHAT_MODEL,
          max_tokens: 500,
          system: systemPrompt(locale, ctx.profile, ctx.chunks),
          messages: [
            ...history.map((m) => ({ role: m.role === "assistant" ? ("assistant" as const) : ("user" as const), content: m.content })),
            { role: "user" as const, content: message },
          ].filter((m, i, arr) => i === 0 || m.role !== arr[i - 1].role),
        });
        const timeout = setTimeout(() => s.abort(), 15_000);
        for await (const ev of s) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            full += ev.delta.text;
            send({ type: "delta", text: ev.delta.text });
          }
        }
        clearTimeout(timeout);
      } catch {
        if (!full) {
          source = "faq";
          full = await faqFallback(message, locale);
          send({ type: "delta", text: full });
        }
      }
      await db.chatMessage.create({ data: { userId: user.id, role: "assistant", content: full, locale } });
      send({ type: "done", source });
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
});
