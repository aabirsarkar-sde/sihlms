export type L3 = { en: string; hi: string; mr: string };
export type LessonSeed = { title: L3; body: L3 };
export type QuestionSeed =
  | { type: "MCQ"; prompt: L3; options: { en: string[]; hi: string[]; mr: string[] }; answer: number }
  | { type: "MSQ"; prompt: L3; options: { en: string[]; hi: string[]; mr: string[] }; answer: number[] }
  | { type: "TF"; prompt: L3; answer: boolean };
export type CourseSeed = { code: string; title: string; description: string; modules: { title: L3; lessons: LessonSeed[] }[]; questions: QuestionSeed[] };
