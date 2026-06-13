// Auto-classify a Question's `correct` string into an AnswerSchema suggestion.

import type { AnswerSchema } from "./types";
import { extractNumbers, extractLabeledPairs, DEFAULT_LABEL_ALIASES } from "./extractors";

export interface ClassifyResult {
  schema: AnswerSchema;
  confidence: "high" | "medium" | "low";
  reason: string;
}

const SINGLE_INT_RE = /^-?\d+$/;
const SINGLE_DECIMAL_RE = /^-?\d+[.,]\d+$/;
const FRACTION_RE = /^-?\d+\/\d+$/;
const MIXED_FRACTION_RE = /^-?\d+\s+\d+\/\d+$/;
// Only digits and basic separators — strong signal of a numeric-set answer.
const NUMERIC_SET_RE = /^[\d\s,;.\-\/]+$/;
// "a=3", "x = -2,5", "n=3/4" — variable assignment to a single number.
const VAR_EQ_NUM_RE = /^[a-zA-Z][a-zA-Z0-9_]*\s*=\s*-?\d+(?:[.,]\d+)?(?:\/\d+)?$/;
// "a=3, b=4" / "x=5; y=10" — multi-variable assignment.
const VAR_EQ_NUM_MULTI_RE = /^([a-zA-Z][a-zA-Z0-9_]*\s*=\s*-?\d+(?:[.,]\d+)?(?:\/\d+)?\s*[,;]\s*)+[a-zA-Z][a-zA-Z0-9_]*\s*=\s*-?\d+(?:[.,]\d+)?(?:\/\d+)?$/;

export function classifyAnswer(correct: string | null): ClassifyResult {
  if (correct === null || correct === undefined) {
    return {
      schema: { kind: "exact" },
      confidence: "low",
      reason: "null correct value",
    };
  }

  const trimmed = correct.trim();

  if (trimmed.length === 0) {
    return {
      schema: { kind: "exact" },
      confidence: "low",
      reason: "empty correct value",
    };
  }

  // 1) single integer / decimal → numeric (high)
  if (SINGLE_INT_RE.test(trimmed)) {
    return {
      schema: { kind: "numeric", value: Number(trimmed) },
      confidence: "high",
      reason: "single_integer",
    };
  }
  if (SINGLE_DECIMAL_RE.test(trimmed)) {
    return {
      schema: { kind: "numeric", value: Number(trimmed.replace(",", ".")) },
      confidence: "high",
      reason: "single_decimal",
    };
  }

  // 2) fraction or mixed fraction → numeric with small tolerance (high)
  if (FRACTION_RE.test(trimmed) || MIXED_FRACTION_RE.test(trimmed)) {
    const nums = extractNumbers(trimmed);
    if (nums.length === 1) {
      return {
        schema: { kind: "numeric", value: nums[0], tolerance: 1e-4 },
        confidence: "high",
        reason: "fraction",
      };
    }
  }

  // 2.5) "a = 3" / "x = -2,5" → numeric. Common in "tìm x / tìm a" questions.
  if (VAR_EQ_NUM_RE.test(trimmed)) {
    const nums = extractNumbers(trimmed);
    if (nums.length === 1) {
      return {
        schema: { kind: "numeric", value: nums[0] },
        confidence: "high",
        reason: "var_equals_number",
      };
    }
  }

  // 2.6) "a=3, b=4" → numeric_set unordered. Each "var=n" pair is just a number;
  // single-letter variables are arbitrary so we don't enforce ordering.
  if (VAR_EQ_NUM_MULTI_RE.test(trimmed)) {
    const nums = extractNumbers(trimmed);
    if (nums.length >= 2) {
      return {
        schema: { kind: "numeric_set", values: nums, ordered: false },
        confidence: "medium",
        reason: "var_equals_number_multi",
      };
    }
  }

  // 3) Try labeled extraction before numeric_set — if labels are present, prefer labeled.
  const labeled = extractLabeledPairs(trimmed);
  if (Object.keys(labeled.pairs).length >= 1 && labeled.unmatchedNumbers.length === 0) {
    return {
      schema: {
        kind: "labeled",
        pairs: labeled.pairs,
        aliases: pickRelevantAliases(Object.keys(labeled.pairs)),
      },
      confidence: "medium",
      reason: "labeled_pairs",
    };
  }

  // 4) digits + separators only → numeric_set unordered (medium)
  if (NUMERIC_SET_RE.test(trimmed)) {
    const nums = extractNumbers(trimmed);
    if (nums.length >= 2) {
      return {
        schema: { kind: "numeric_set", values: nums, ordered: false },
        confidence: "medium",
        reason: "numbers_only_multi",
      };
    }
    if (nums.length === 1) {
      // E.g. "42." or " 42 " — still a single number.
      return {
        schema: { kind: "numeric", value: nums[0] },
        confidence: "high",
        reason: "single_number_with_punctuation",
      };
    }
  }

  // 5) Last-resort numeric extraction: short answers like "7km", "60%", "70 hình",
  // "232 và 63" — the numbers are the substance, the text is just unit/noun noise.
  // Lower confidence since context could matter, but for grade-5 these almost
  // always come down to the number(s).
  const fallbackNums = extractNumbers(trimmed);
  if (fallbackNums.length === 1) {
    return {
      schema: { kind: "numeric", value: fallbackNums[0] },
      confidence: "medium",
      reason: "number_with_text",
    };
  }
  if (fallbackNums.length >= 2) {
    return {
      schema: { kind: "numeric_set", values: fallbackNums, ordered: false },
      confidence: "medium",
      reason: "numbers_with_text",
    };
  }

  // No numbers anywhere — purely textual answer (e.g. "Màu đỏ"). Stick with exact.
  return {
    schema: { kind: "exact" },
    confidence: "low",
    reason: "no_pattern_matched",
  };
}

function pickRelevantAliases(canonicals: string[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const c of canonicals) {
    if (DEFAULT_LABEL_ALIASES[c]) out[c] = DEFAULT_LABEL_ALIASES[c];
  }
  return out;
}
