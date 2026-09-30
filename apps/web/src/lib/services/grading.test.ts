import { describe, expect, it } from "vitest";
import { grade, publicQuestions, seededShuffle, type Question } from "./grading";

const qs: Question[] = [
  { id: "a", type: "MCQ", prompt: "", translations: {}, options: ["x", "y"], answer: 1, marks: 1 },
  { id: "b", type: "MSQ", prompt: "", translations: {}, options: ["x", "y", "z"], answer: [0, 2], marks: 2 },
  { id: "c", type: "TF", prompt: "", translations: {}, options: [], answer: false, marks: 1 },
];

describe("grading", () => {
  it("scores all correct", () => expect(grade(qs, { a: 1, b: [2, 0], c: false }).scorePct).toBe(100));
  it("MSQ needs exact set", () => expect(grade(qs, { a: 1, b: [0], c: false }).scorePct).toBe(50));
  it("missing answers are wrong", () => expect(grade(qs, {}).scorePct).toBe(0));
  it("shuffle is deterministic per seed and a permutation", () => {
    const s1 = seededShuffle([1, 2, 3, 4, 5], "x");
    expect(seededShuffle([1, 2, 3, 4, 5], "x")).toEqual(s1);
    expect([...s1].sort()).toEqual([1, 2, 3, 4, 5]);
  });
  it("public questions hide answers", () => expect(publicQuestions(qs).every((q) => !("answer" in q))).toBe(true));
});
