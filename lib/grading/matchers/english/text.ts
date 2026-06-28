import type { GradeResult } from "../../types";
import { normalizeEnglish } from "../../normalize";

export interface TextSetOptions {
  /** Accepted answers — any one matching (after normalisation) is correct. */
  accept: string[];
  /**
   * When true, compares the multiset of words ignoring their order — used for
   * "sắp xếp từ thành câu" (word-reorder) answers where punctuation/order of a
   * few interchangeable words shouldn't matter. Default false (exact sequence).
   */
  ignoreOrder?: boolean;
}

const wordsOf = (s: string): string[] => (s.length === 0 ? [] : s.split(" "));

const sortedKey = (s: string): string => wordsOf(s).sort().join(" ");

/**
 * Grade an english free-text answer against a set of accepted strings.
 * Case-, punctuation- and whitespace-insensitive. With `ignoreOrder`, matches
 * when the bag of words is identical to an accepted answer.
 */
export function matchEnglishText(userInput: string, opts: TextSetOptions): GradeResult {
  const a = normalizeEnglish(userInput);
  if (a.length === 0) {
    return { correct: false, method: "text_set", confidence: 1, diagnostic: "empty answer" };
  }
  const accepted = opts.accept.map(normalizeEnglish).filter((s) => s.length > 0);

  const correct = opts.ignoreOrder
    ? accepted.some((b) => sortedKey(b) === sortedKey(a))
    : accepted.some((b) => b === a);

  return {
    correct,
    method: "text_set",
    confidence: 1,
    normalizedInput: a,
    diagnostic: `text_set("${a}") in [${accepted.map((s) => `"${s}"`).join(", ")}]${opts.ignoreOrder ? " (unordered)" : ""}`,
  };
}
