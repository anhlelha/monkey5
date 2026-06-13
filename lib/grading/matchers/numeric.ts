import type { GradeResult } from "../types";
import { extractNumbers } from "../extractors";

interface NumericOptions {
  value: number;
  tolerance?: number;
}

const DEFAULT_TOLERANCE = 1e-9;

export function matchNumeric(userInput: string, opts: NumericOptions): GradeResult {
  const nums = extractNumbers(userInput);
  const tol = opts.tolerance ?? DEFAULT_TOLERANCE;

  if (nums.length === 0) {
    return {
      correct: false,
      method: "numeric",
      confidence: 1,
      diagnostic: "no number found",
    };
  }

  // Strict: must contain exactly one number, matching the expected value.
  // If the user types extra numbers (e.g. "khoảng 10 đến 20"), we treat that
  // as ambiguous → wrong, to avoid false positives.
  if (nums.length > 1) {
    return {
      correct: false,
      method: "numeric",
      confidence: 1,
      diagnostic: `expected single number, got ${nums.length}: ${nums.join(", ")}`,
    };
  }

  const got = nums[0];
  const correct = Math.abs(got - opts.value) <= tol;
  return {
    correct,
    method: "numeric",
    confidence: 1,
    diagnostic: `${got} vs ${opts.value} (tol=${tol})`,
  };
}
