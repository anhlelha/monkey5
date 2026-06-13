import type { GradeResult } from "../types";
import { normalizeForExact } from "../normalize";

// Backward-compatible exact match, but lenient on whitespace + diacritics.
export function matchExact(userInput: string, expected: string): GradeResult {
  const a = normalizeForExact(userInput);
  const b = normalizeForExact(expected);
  return {
    correct: a === b && a.length > 0,
    method: "exact",
    confidence: 1,
    normalizedInput: a,
    diagnostic: `exact("${a}") == exact("${b}")`,
  };
}

// Strictest possible match — used when answerSchema says "exact" explicitly
// and we don't want any normalization (e.g. case-sensitive answers).
export function matchExactStrict(userInput: string, expected: string): GradeResult {
  return {
    correct: userInput === expected,
    method: "exact",
    confidence: 1,
    normalizedInput: userInput,
    diagnostic: `strict("${userInput}") == strict("${expected}")`,
  };
}
