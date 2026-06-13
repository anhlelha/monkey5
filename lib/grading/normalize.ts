// Text normalization for Vietnamese-friendly comparison.

export function stripDiacritics(input: string): string {
  // NFD splits combined chars; then remove combining marks.
  const decomposed = input.normalize("NFD").replace(/[̀-ͯ]/g, "");
  // Vietnamese đ/Đ has no NFD decomposition into base+mark — map manually.
  return decomposed.replace(/đ/g, "d").replace(/Đ/g, "D");
}

export function normalizeText(input: string): string {
  return stripDiacritics(input)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Aggressive normalization for exact-match fallback: also strips
// trailing punctuation and common filler words.
export function normalizeForExact(input: string): string {
  return normalizeText(input)
    .replace(/[.,;!?]+$/g, "")
    .trim();
}
