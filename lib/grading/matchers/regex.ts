import type { GradeResult } from "../types";

interface RegexOptions {
  pattern: string;
  flags?: string;
}

export function matchRegex(userInput: string, opts: RegexOptions): GradeResult {
  try {
    const re = new RegExp(opts.pattern, opts.flags ?? "i");
    return {
      correct: re.test(userInput),
      method: "regex",
      confidence: 1,
      diagnostic: `pattern=/${opts.pattern}/${opts.flags ?? "i"}`,
    };
  } catch (err: unknown) {
    return {
      correct: false,
      method: "regex",
      confidence: 0,
      diagnostic: `invalid regex: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
