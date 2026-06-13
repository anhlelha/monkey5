// Extract numbers, fractions, and labeled pairs from free-form Vietnamese text.

import { normalizeText } from "./normalize";

// A "number-like chunk": a maximal run of digit-related chars (digits, sign, comma, dot, slash).
// We process each chunk independently so commas in "1,5" don't bleed into "1,5 và 2,3".
const NUMBER_CHUNK_RE = /-?\d[\d.,/]*\d|-?\d/g;

// Mixed fraction is detected BEFORE chunking because it spans whitespace ("1 3/4").
const MIXED_FRACTION_RE = /(-?\d+)\s+(\d+)\/(\d+)/g;

function parseChunk(chunk: string): number[] {
  if (!chunk) return [];

  // Pure integer.
  if (/^-?\d+$/.test(chunk)) return [Number(chunk)];

  // Simple fraction.
  const frac = chunk.match(/^(-?\d+)\/(\d+)$/);
  if (frac) return [Number(frac[1]) / Number(frac[2])];

  const isNeg = chunk.startsWith("-");
  const body = isNeg ? chunk.slice(1) : chunk;

  // Single-dot ambiguity: "1.000" is Vietnamese thousands → 1000, but "3.14" is decimal.
  // Disambiguate by counting trailing digits: exactly 3 + leading 1-3 → thousands; otherwise decimal.
  const singleDot = body.match(/^(\d{1,})\.(\d+)$/);
  if (singleDot) {
    const before = singleDot[1];
    const after = singleDot[2];
    if (before.length <= 3 && after.length === 3 && /^\d+$/.test(after)) {
      return [(isNeg ? -1 : 1) * Number(before + after)];
    }
    return [(isNeg ? -1 : 1) * Number(before + "." + after)];
  }

  const commas = (body.match(/,/g) || []).length;
  const dots = (body.match(/\./g) || []).length;

  // European-style "1.000,5": dots as thousands, comma as decimal.
  if (commas === 1 && dots >= 1) {
    const stripped = body.replace(/\./g, "").replace(",", ".");
    if (/^\d+(?:\.\d+)?$/.test(stripped)) {
      return [(isNeg ? -1 : 1) * Number(stripped)];
    }
  }

  // Only dots — could be thousands grouping "1.000.000" or just a malformed string.
  if (dots >= 2 && commas === 0) {
    const parts = body.split(".");
    if (parts.every((p, i) => (i === 0 ? /^\d{1,3}$/.test(p) : /^\d{3}$/.test(p)))) {
      return [(isNeg ? -1 : 1) * Number(parts.join(""))];
    }
  }

  // Comma-only chunks — Vietnamese disambiguation core.
  // Vietnamese convention: comma = decimal, dot = thousands. But users sometimes deviate,
  // so we add pragmatic rules informed by digit-group length.
  if (commas >= 1 && dots === 0) {
    const parts = body.split(",");

    // Rule 1: leading "0" before a single comma is ALWAYS decimal ("0,125" = 0.125, "0,5" = 0.5).
    // A standalone integer never starts with 0 in normal Vietnamese text.
    if (parts.length === 2 && parts[0] === "0" && /^\d+$/.test(parts[1])) {
      return [(isNeg ? -1 : 1) * Number("0." + parts[1])];
    }

    // Rule 2: single comma with 1-2 trailing digits → Vietnamese decimal ("3,14", "1,5", "1,55").
    if (parts.length === 2 && /^\d{1,2}$/.test(parts[1])) {
      return [(isNeg ? -1 : 1) * Number(parts[0] + "." + parts[1])];
    }

    // Rule 3: thousands grouping — first 1-3 digits, every subsequent part exactly 3 digits.
    // Catches "1,000" / "1,234,567" without misreading "24,26,28,30" or "884,1105".
    // (Rules 1-2 already handled "0,…" and short Vietnamese decimals.)
    const isThousands =
      parts.length >= 2 &&
      /^\d{1,3}$/.test(parts[0]) &&
      parts.slice(1).every((p) => /^\d{3}$/.test(p));
    if (isThousands) {
      return [(isNeg ? -1 : 1) * Number(parts.join(""))];
    }

    // Rule 4: anything else — commas as list separators ("24,26,28,30" / "884,1105").
    // Negative sign only attaches to the first element.
    return parts
      .map((p, i) => {
        if (!/^\d+$/.test(p)) return NaN;
        return i === 0 && isNeg ? -Number(p) : Number(p);
      })
      .filter((n) => Number.isFinite(n));
  }

  // Anything else: try to extract any digit runs.
  return body
    .split(/[^\d]+/)
    .filter((s) => s.length > 0)
    .map((s, i) => (i === 0 && isNeg ? -Number(s) : Number(s)))
    .filter((n) => Number.isFinite(n));
}

export interface ExtractOptions {
  // Force all commas to act as list separators (no comma-as-decimal interpretation).
  // Used as a contextual fallback when the caller knows the expected number count
  // and the default extraction returned a different count.
  commasAsListSeparators?: boolean;
}

export function extractNumbers(input: string, opts?: ExtractOptions): number[] {
  if (!input) return [];
  if (opts?.commasAsListSeparators) {
    // Replace commas with whitespace so each digit group is a standalone chunk,
    // then run the standard extractor on the rewritten string.
    return extractNumbers(input.replace(/,/g, " "));
  }
  const result: number[] = [];

  // 1) Handle mixed fractions first ("1 3/4" → 1.75) and blank them out so chunking
  // doesn't see them as two separate numbers.
  let working = input;
  for (const m of input.matchAll(MIXED_FRACTION_RE)) {
    const whole = Number(m[1]);
    const num = Number(m[2]);
    const den = Number(m[3]);
    const sign = whole < 0 ? -1 : 1;
    result.push(whole + sign * (num / den));
    working = working.replace(m[0], " ".repeat(m[0].length));
  }

  // 2) Each digit-rich chunk is parsed independently.
  for (const m of working.matchAll(NUMBER_CHUNK_RE)) {
    for (const n of parseChunk(m[0])) {
      if (Number.isFinite(n)) result.push(n);
    }
  }

  return result;
}

// Vietnamese label aliases — used by the labeled matcher and the classifier suggester.
// IMPORTANT: aliases are matched longest-first; once a span is consumed, shorter aliases
// cannot re-match the same region. Add new aliases with enough specificity to avoid clashes
// (e.g. don't add bare "so" — it would eat into "so lon", "so be", etc.).
export const DEFAULT_LABEL_ALIASES: Record<string, string[]> = {
  // Family
  me: ["me", "ma", "mom", "mother", "mau"],
  con: ["con", "child", "son", "daughter"],
  bo: ["bo", "ba", "father", "dad", "cha"],
  anh: ["anh", "brother"],
  chi: ["chi", "sister"],
  em: ["em"],
  ong: ["ong", "grandfather"],
  ba_noi: ["ba noi", "grandmother"],
  // Two-number arithmetic ("tìm hai số có tổng ... tỉ số ...")
  so_lon: ["so lon", "so lon hon", "larger"],
  so_be: ["so be", "so nho", "smaller"],
  so_thu_nhat: ["so thu nhat", "so 1", "so a"],
  so_thu_hai: ["so thu hai", "so 2", "so b"],
  so_thu_ba: ["so thu ba", "so 3", "so c"],
  // Geometry
  chieu_dai: ["chieu dai", "length"],
  chieu_rong: ["chieu rong", "width"],
  chieu_cao: ["chieu cao", "height"],
  dien_tich: ["dien tich", "area"],
  chu_vi: ["chu vi", "perimeter"],
  the_tich: ["the tich", "volume"],
  ban_kinh: ["ban kinh", "radius"],
  duong_kinh: ["duong kinh", "diameter"],
};

export interface LabeledExtraction {
  pairs: Record<string, number>;
  unmatchedNumbers: number[];
}

// Parse "mẹ 50, con 25" / "Mẹ là 50 tuổi, con 25" / "con: 25, mẹ: 50" etc.
// `aliases` maps canonical label -> list of accepted surface forms (diacritic-stripped, lowercased).
export function extractLabeledPairs(
  input: string,
  aliases: Record<string, string[]> = DEFAULT_LABEL_ALIASES,
): LabeledExtraction {
  const norm = normalizeText(input);
  const pairs: Record<string, number> = {};
  const consumedRanges: Array<[number, number]> = [];

  // Build alias → canonical lookup, longest aliases first (avoid "me" eating "mẹ" inside "em").
  const aliasEntries: Array<{ canonical: string; alias: string }> = [];
  for (const [canonical, surfaces] of Object.entries(aliases)) {
    for (const a of surfaces) aliasEntries.push({ canonical, alias: a });
  }
  aliasEntries.sort((a, b) => b.alias.length - a.alias.length);

  const overlaps = (start: number, end: number): boolean =>
    consumedRanges.some(([s, e]) => start < e && end > s);

  for (const { canonical, alias } of aliasEntries) {
    if (pairs[canonical] !== undefined) continue;
    // Match alias as a word, followed by optional Vietnamese filler ("la", "co", ":", "="),
    // then a number. We scan all matches so we can skip ones that overlap with already-
    // consumed regions (defensive — keeps longer aliases like "so lon" from being re-matched
    // by hypothetical shorter aliases like "lon").
    const aliasEscaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(
      String.raw`\b${aliasEscaped}\b[\s:=]*(?:la|co|bang|=)?[\s:=]*(-?\d+(?:[.,]\d+)?(?:\/\d+)?)`,
      "gi",
    );
    for (const m of norm.matchAll(re)) {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      if (overlaps(start, end)) continue;
      const value = Number(m[1].replace(",", "."));
      if (Number.isFinite(value)) {
        pairs[canonical] = value;
        consumedRanges.push([start, end]);
        break;
      }
    }
  }

  // Numbers in `norm` that fall outside any consumed range = "unmatched".
  // We blank out consumed regions then run the full extractor on what's left.
  let leftover = norm;
  // Sort descending so slicing doesn't shift indices.
  const sorted = [...consumedRanges].sort((a, b) => b[0] - a[0]);
  for (const [s, e] of sorted) {
    leftover = leftover.slice(0, s) + " ".repeat(e - s) + leftover.slice(e);
  }
  const unmatchedNumbers = extractNumbers(leftover);

  return { pairs, unmatchedNumbers };
}
