// Shared shapes for exam taking + grading.

export interface MCQOption {
  id: string;
  text: string;
}

export interface ExamPassage {
  title: string | null;
  body: string;
  kind: string; // notice | message | article | cloze
}

export interface ExamQuestion {
  id: string;
  num: number;
  type: "fill" | "mcq" | "essay";
  subject?: string; // "math" | "english"
  topic: string;
  skill?: string | null;
  grade: string;
  points: number;
  stem: string;
  unit: string | null;
  placeholder: string | null;
  correct: string | null;
  options: MCQOption[];
  modelAnswer: string | null;
  figure: string | null;
  passageId?: string | null;
  // english reading: the shared passage shown with this question (null otherwise).
  passage?: ExamPassage | null;
  source?: string | null;
  sourceQuestionId?: string | null;
  // Optional JSON-serialized AnswerSchema. null/undefined → fall back to exact match.
  answerSchema?: string | null;
}

export interface SectionHeader {
  num: number;
  header: string;
}

export interface ExamMeta {
  id: string;
  school: string;
  kind: "official" | "reference" | "mixed";
  title: string;
  year: string;
  intro: string;
  minutes: number;
  sections?: SectionHeader[];
}

export type AnswerValue = string | { text: string; drawings: string[] } | undefined;

export function getExamSectionHeader(
  sections: SectionHeader[] | undefined,
  num: number
): string | null {
  if (!sections) return null;
  return sections.find((s) => s.num === num)?.header || null;
}

