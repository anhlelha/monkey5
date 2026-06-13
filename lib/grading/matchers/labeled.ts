import type { GradeResult } from "../types";
import { DEFAULT_LABEL_ALIASES, extractLabeledPairs, extractNumbers } from "../extractors";

interface LabeledOptions {
  pairs: Record<string, number>;
  aliases?: Record<string, string[]>;
  tolerance?: number;
}

const DEFAULT_TOLERANCE = 1e-9;

function nearlyEqual(a: number, b: number, tol: number): boolean {
  return Math.abs(a - b) <= tol;
}

export function matchLabeled(userInput: string, opts: LabeledOptions): GradeResult {
  const tol = opts.tolerance ?? DEFAULT_TOLERANCE;
  const aliases = opts.aliases ?? DEFAULT_LABEL_ALIASES;
  const expectedLabels = Object.keys(opts.pairs);

  const { pairs: gotPairs, unmatchedNumbers } = extractLabeledPairs(userInput, aliases);

  // CASE A: user labeled every required key correctly.
  const allLabeled = expectedLabels.every((k) => gotPairs[k] !== undefined);
  if (allLabeled) {
    const ok = expectedLabels.every((k) =>
      nearlyEqual(gotPairs[k], opts.pairs[k], tol),
    );
    return {
      correct: ok,
      method: "labeled",
      confidence: 1,
      diagnostic: `labeled match: got ${JSON.stringify(gotPairs)} vs expected ${JSON.stringify(opts.pairs)}`,
    };
  }

  // CASE B: user didn't label, but the multiset of numbers matches.
  // Accept this — the question's domain often makes the assignment obvious
  // (e.g. "tuổi mẹ và con: 50, 25" — both orders work).
  if (Object.keys(gotPairs).length === 0) {
    const expectedValues = expectedLabels.map((k) => opts.pairs[k]);

    // Try default extraction, then fall back to comma-as-list if count mismatches.
    let allNums = extractNumbers(userInput);
    let fallbackUsed = false;
    if (allNums.length !== expectedValues.length) {
      const alt = extractNumbers(userInput, { commasAsListSeparators: true });
      if (alt.length === expectedValues.length) {
        allNums = alt;
        fallbackUsed = true;
      }
    }

    if (allNums.length === expectedValues.length) {
      const remaining = [...expectedValues];
      let allFound = true;
      for (const n of allNums) {
        const idx = remaining.findIndex((e) => nearlyEqual(n, e, tol));
        if (idx === -1) {
          allFound = false;
          break;
        }
        remaining.splice(idx, 1);
      }
      if (allFound) {
        return {
          correct: true,
          method: "labeled",
          confidence: fallbackUsed ? 0.85 : 0.9,
          diagnostic: `unlabeled-but-multiset-match: ${allNums.join(", ")}${fallbackUsed ? " (fallback=commas-as-list)" : ""}`,
        };
      }
    }
  }

  // CASE C: partial labels — strict failure. Better to reject than guess.
  return {
    correct: false,
    method: "labeled",
    confidence: 1,
    diagnostic: `partial/mismatch: got ${JSON.stringify(gotPairs)} unmatched=${unmatchedNumbers.join(",")} vs expected ${JSON.stringify(opts.pairs)}`,
  };
}
