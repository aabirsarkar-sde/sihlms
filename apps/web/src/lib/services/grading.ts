import { z } from "zod";

export const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["MCQ", "MSQ", "TF"]),
  prompt: z.string(),
  translations: z.record(z.object({ prompt: z.string().optional(), options: z.array(z.string()).optional() })).default({}),
  options: z.array(z.string()).default([]),
  // MCQ: option index; MSQ: option indexes; TF: boolean
  answer: z.union([z.number(), z.array(z.number()), z.boolean()]),
  marks: z.number().positive().default(1),
  explanation: z.string().optional(),
});
export type Question = z.infer<typeof QuestionSchema>;
export type AnswerValue = number | number[] | boolean | null | undefined;

export function isCorrect(q: Question, given: AnswerValue): boolean {
  if (given === null || given === undefined) return false;
  switch (q.type) {
    case "MCQ":
      return typeof given === "number" && given === q.answer;
    case "TF":
      return typeof given === "boolean" && given === q.answer;
    case "MSQ": {
      if (!Array.isArray(given) || !Array.isArray(q.answer)) return false;
      const a = [...new Set(given)].sort();
      const b = [...new Set(q.answer)].sort();
      return a.length === b.length && a.every((v, i) => v === b[i]);
    }
  }
}

export function grade(questions: Question[], answers: Record<string, AnswerValue>) {
  let total = 0;
  let earned = 0;
  const results = questions.map((q) => {
    total += q.marks;
    const correct = isCorrect(q, answers[q.id]);
    if (correct) earned += q.marks;
    return { id: q.id, correct, given: answers[q.id] ?? null, answer: q.answer, marks: q.marks, explanation: q.explanation };
  });
  const scorePct = total === 0 ? 0 : Math.round((earned / total) * 1000) / 10;
  return { scorePct, earned, total, results };
}

/** Deterministic shuffle so a given attempt keeps the same order across reloads. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Strip answers before sending questions to a trainee. */
export function publicQuestions(questions: Question[]) {
  return questions.map(({ answer: _a, explanation: _e, ...q }) => q);
}
