// Grading types: shared contract for matchers and callers.

export type GradeMethod =
  | "exact"
  | "numeric"
  | "numeric_set"
  | "labeled"
  | "regex"
  | "text_set"
  | "mcq"
  | "empty"
  | "no_match";

export interface GradeResult {
  correct: boolean;
  method: GradeMethod;
  confidence: number;          // 1.0 = certain rule-based, <1 reserved for LLM
  normalizedInput?: string;
  diagnostic?: string;
}

export type AnswerSchema =
  | { kind: "exact" }
  | { kind: "numeric"; value: number; tolerance?: number }
  | { kind: "numeric_set"; values: number[]; ordered: boolean; tolerance?: number }
  | {
      kind: "labeled";
      pairs: Record<string, number>;
      aliases?: Record<string, string[]>;
      tolerance?: number;
    }
  | { kind: "regex"; pattern: string; flags?: string }
  | { kind: "text_set"; accept: string[]; ignoreOrder?: boolean };

export interface GradeQuestion {
  type: "fill" | "mcq" | "essay";
  correct: string | null;
  // Accepts either the parsed AnswerSchema or a JSON string from the DB column.
  answerSchema?: AnswerSchema | string | null;
}

export type RawAnswer =
  | string
  | { text?: string; drawings?: string[] }
  | null
  | undefined;
