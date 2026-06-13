import type { GradeResult } from "../types";
import { extractNumbers } from "../extractors";

interface NumericSetOptions {
  values: number[];
  ordered: boolean;
  tolerance?: number;
}

const DEFAULT_TOLERANCE = 1e-9;

function nearlyEqual(a: number, b: number, tol: number): boolean {
  return Math.abs(a - b) <= tol;
}

// Greedy multiset matcher with tolerance.
function multisetMatch(actual: number[], expected: number[], tol: number): boolean {
  if (actual.length !== expected.length) return false;
  const remaining = [...expected];
  for (const a of actual) {
    const idx = remaining.findIndex((e) => nearlyEqual(a, e, tol));
    if (idx === -1) return false;
    remaining.splice(idx, 1);
  }
  return remaining.length === 0;
}

function orderedMatch(actual: number[], expected: number[], tol: number): boolean {
  if (actual.length !== expected.length) return false;
  return actual.every((a, i) => nearlyEqual(a, expected[i], tol));
}

export function matchNumericSet(userInput: string, opts: NumericSetOptions): GradeResult {
  const tol = opts.tolerance ?? DEFAULT_TOLERANCE;

  // Try the default extraction first (Vietnamese-aware: "3,5" → 3.5).
  let nums = extractNumbers(userInput);
  let fallbackUsed = false;

  // Contextual disambiguation: if the count doesn't match what we expect, try the
  // alternative where commas are list separators ("3,5" → [3, 5]). The expected
  // value count is the disambiguating signal — "tìm 2 số" expects 2 values.
  if (nums.length !== opts.values.length) {
    const alt = extractNumbers(userInput, { commasAsListSeparators: true });
    if (alt.length === opts.values.length) {
      nums = alt;
      fallbackUsed = true;
    }
  }

  if (nums.length === 0) {
    return {
      correct: false,
      method: "numeric_set",
      confidence: 1,
      diagnostic: "no numbers found",
    };
  }

  const correct = opts.ordered
    ? orderedMatch(nums, opts.values, tol)
    : multisetMatch(nums, opts.values, tol);

  return {
    correct,
    method: "numeric_set",
    confidence: fallbackUsed ? 0.95 : 1,
    diagnostic: `got [${nums.join(", ")}] vs expected [${opts.values.join(", ")}] (ordered=${opts.ordered}${fallbackUsed ? ", fallback=commas-as-list" : ""})`,
  };
}
