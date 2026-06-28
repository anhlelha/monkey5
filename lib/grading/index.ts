// Public entry: gradeAnswer() — the only function callers should depend on.

import type {
  AnswerSchema,
  GradeQuestion,
  GradeResult,
  RawAnswer,
} from "./types";
import { matchExact } from "./matchers/exact";
import { matchNumeric } from "./matchers/numeric";
import { matchNumericSet } from "./matchers/numeric-set";
import { matchLabeled } from "./matchers/labeled";
import { matchRegex } from "./matchers/regex";
import { matchEnglishText } from "./matchers/english/text";

function extractText(raw: RawAnswer): string {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && typeof raw.text === "string") return raw.text;
  return "";
}

function parseSchema(input: unknown): AnswerSchema | null {
  if (!input) return null;
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      return parsed as AnswerSchema;
    } catch {
      return null;
    }
  }
  if (typeof input === "object") return input as AnswerSchema;
  return null;
}

function gradeWithSchema(text: string, schema: AnswerSchema): GradeResult {
  switch (schema.kind) {
    case "exact":
      // Schema explicitly says exact — caller has to provide expected elsewhere.
      // We can't grade without it; the dispatcher below handles this case
      // by falling back to q.correct via matchExact.
      throw new Error("exact schema must be handled by dispatcher");
    case "numeric":
      return matchNumeric(text, { value: schema.value, tolerance: schema.tolerance });
    case "numeric_set":
      return matchNumericSet(text, {
        values: schema.values,
        ordered: schema.ordered,
        tolerance: schema.tolerance,
      });
    case "labeled":
      return matchLabeled(text, {
        pairs: schema.pairs,
        aliases: schema.aliases,
        tolerance: schema.tolerance,
      });
    case "regex":
      return matchRegex(text, { pattern: schema.pattern, flags: schema.flags });
    case "text_set":
      return matchEnglishText(text, { accept: schema.accept, ignoreOrder: schema.ignoreOrder });
    default: {
      const _exhaustive: never = schema;
      void _exhaustive;
      return { correct: false, method: "no_match", confidence: 1, diagnostic: "unknown schema kind" };
    }
  }
}

export function gradeAnswer(q: GradeQuestion, raw: RawAnswer): GradeResult {
  const text = extractText(raw);

  if (text.length === 0) {
    return { correct: false, method: "empty", confidence: 1, diagnostic: "empty answer" };
  }

  // MCQ: always exact match on option ID. Schema (if any) is ignored.
  if (q.type === "mcq") {
    const expected = q.correct ?? "";
    return {
      correct: text === expected && expected.length > 0,
      method: "mcq",
      confidence: 1,
      diagnostic: `mcq("${text}") == "${expected}"`,
    };
  }

  const schema = parseSchema(q.answerSchema);

  if (schema && schema.kind !== "exact") {
    return gradeWithSchema(text, schema);
  }

  // Fallback (no schema, or schema.kind === "exact"): lenient string equality.
  return matchExact(text, q.correct ?? "");
}

export type { AnswerSchema, GradeQuestion, GradeResult, RawAnswer } from "./types";
