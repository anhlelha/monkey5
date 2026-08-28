import { createHash } from "node:crypto";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function stableHash(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

export interface AssessmentRelevantQuestion {
  subject: string;
  type: string;
  stem: string;
  options: string;
  correct: string | null;
  answerSchema: string | null;
  points: number;
  figure: string | null;
}

export function questionContentHash(question: AssessmentRelevantQuestion): string {
  return stableHash({
    subject: question.subject,
    type: question.type,
    stem: question.stem.trim().replace(/\s+/g, " "),
    options: safeJson(question.options),
    correct: question.correct,
    answerSchema: safeJson(question.answerSchema),
    points: question.points,
    figure: question.figure,
  });
}

function safeJson(value: string | null): unknown {
  if (value === null) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}
