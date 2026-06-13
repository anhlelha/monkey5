// Lightweight test runner for the grading module — `tsx scripts/test-grading.ts`.

import { gradeAnswer } from "../lib/grading";
import type { GradeQuestion } from "../lib/grading/types";
import { extractNumbers, extractLabeledPairs } from "../lib/grading/extractors";
import { normalizeText } from "../lib/grading/normalize";
import { classifyAnswer } from "../lib/grading/classify";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function stableStringify(v: unknown): string {
  return JSON.stringify(v, (_k, val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(val).sort()) sorted[k] = (val as Record<string, unknown>)[k];
      return sorted;
    }
    return val;
  });
}

function expect(name: string, actual: unknown, expected: unknown) {
  const a = stableStringify(actual);
  const e = stableStringify(expected);
  if (a === e) {
    passed += 1;
  } else {
    failed += 1;
    failures.push(`  ✗ ${name}\n    expected: ${e}\n    actual:   ${a}`);
  }
}

function expectCorrect(name: string, q: GradeQuestion, input: string) {
  const r = gradeAnswer(q, input);
  if (r.correct) {
    passed += 1;
  } else {
    failed += 1;
    failures.push(`  ✗ ${name} — expected correct\n    got: ${JSON.stringify(r)}`);
  }
}

function expectWrong(name: string, q: GradeQuestion, input: string) {
  const r = gradeAnswer(q, input);
  if (!r.correct) {
    passed += 1;
  } else {
    failed += 1;
    failures.push(`  ✗ ${name} — expected wrong\n    got: ${JSON.stringify(r)}`);
  }
}

// ─── normalize ────────────────────────────────────────────────────────────
console.log("\n[normalize]");
expect("diacritics", normalizeText("Mẹ"), "me");
expect("diacritics đ", normalizeText("Đại"), "dai");
expect("collapse spaces", normalizeText("  hello   world  "), "hello world");

// ─── extractNumbers ───────────────────────────────────────────────────────
console.log("\n[extractNumbers]");
expect("single int", extractNumbers("42"), [42]);
expect("two ints comma+space", extractNumbers("50, 25"), [50, 25]);
expect("two ints semicolon", extractNumbers("50;25"), [50, 25]);
expect("with text", extractNumbers("Mẹ 50 tuổi, con 25"), [50, 25]);
expect("decimal dot", extractNumbers("1.5"), [1.5]);
expect("decimal comma", extractNumbers("1,5"), [1.5]);
expect("fraction", extractNumbers("3/4"), [0.75]);
expect("mixed fraction", extractNumbers("1 3/4"), [1.75]);
expect("thousands separator", extractNumbers("1.000"), [1000]);
expect("thousands comma", extractNumbers("1,000"), [1000]);
expect("negative", extractNumbers("-5"), [-5]);
expect("empty", extractNumbers(""), []);
expect("no numbers", extractNumbers("không có gì"), []);

// Vietnamese decimal vs list disambiguation
console.log("\n[decimal vs list disambiguation]");
expect("pi = 3,14", extractNumbers("3,14"), [3.14]);
expect("pi inside text", extractNumbers("số pi là 3,14"), [3.14]);
expect("1,5 (one half)", extractNumbers("1,5"), [1.5]);
expect("0,125 (one eighth)", extractNumbers("0,125"), [0.125]);
expect("0,5", extractNumbers("0,5"), [0.5]);
expect("0,0625", extractNumbers("0,0625"), [0.0625]);
expect("1,55 (two-decimal)", extractNumbers("1,55"), [1.55]);
expect("two decimals separated by space", extractNumbers("1,5 và 2,5"), [1.5, 2.5]);
expect("two decimals semicolon", extractNumbers("1,5; 2,5"), [1.5, 2.5]);
expect("two ints comma+space", extractNumbers("50, 25"), [50, 25]);
expect("two ints no space", extractNumbers("884,1105"), [884, 1105]);
expect("four ints comma", extractNumbers("24,26,28,30"), [24, 26, 28, 30]);
expect("thousands 10.000", extractNumbers("10.000"), [10000]);
expect("thousands 1.000.000", extractNumbers("1.000.000"), [1000000]);
expect("european 1.000,5", extractNumbers("1.000,5"), [1000.5]);
expect("decimal in question text", extractNumbers("Diện tích là 12,5 cm²"), [12.5]);

// ─── extractLabeledPairs ──────────────────────────────────────────────────
console.log("\n[extractLabeledPairs]");
expect(
  "mẹ-con basic",
  extractLabeledPairs("mẹ 50, con 25").pairs,
  { me: 50, con: 25 },
);
expect(
  "mẹ-con với 'là'",
  extractLabeledPairs("mẹ là 50 tuổi, con 25").pairs,
  { me: 50, con: 25 },
);
expect(
  "reversed order",
  extractLabeledPairs("con 25, mẹ 50").pairs,
  { me: 50, con: 25 },
);
expect(
  "colon syntax",
  extractLabeledPairs("mẹ: 50, con: 25").pairs,
  { me: 50, con: 25 },
);

// ─── gradeAnswer: exact (legacy) ──────────────────────────────────────────
console.log("\n[gradeAnswer: exact fallback]");
const qExact: GradeQuestion = { type: "fill", correct: "42" };
expectCorrect("exact match", qExact, "42");
expectCorrect("exact with whitespace", qExact, " 42 ");
expectWrong("exact mismatch", qExact, "43");

// ─── gradeAnswer: MCQ ────────────────────────────────────────────────────
console.log("\n[gradeAnswer: mcq]");
const qMcq: GradeQuestion = { type: "mcq", correct: "B" };
expectCorrect("mcq right", qMcq, "B");
expectWrong("mcq wrong", qMcq, "A");
expectWrong("mcq empty", qMcq, "");

// ─── gradeAnswer: numeric ────────────────────────────────────────────────
console.log("\n[gradeAnswer: numeric]");
const qNum: GradeQuestion = {
  type: "fill",
  correct: "42",
  answerSchema: { kind: "numeric", value: 42 },
};
expectCorrect("numeric match", qNum, "42");
expectCorrect("numeric with text", qNum, "kết quả là 42");
expectWrong("numeric mismatch", qNum, "41");

const qNumTol: GradeQuestion = {
  type: "fill",
  correct: "3.14",
  answerSchema: { kind: "numeric", value: 3.14159, tolerance: 0.01 },
};
expectCorrect("numeric within tolerance", qNumTol, "3.14");
expectWrong("numeric outside tolerance", qNumTol, "3.2");

// ─── gradeAnswer: numeric_set ────────────────────────────────────────────
console.log("\n[gradeAnswer: numeric_set]");
const qSet: GradeQuestion = {
  type: "fill",
  correct: "50, 25",
  answerSchema: { kind: "numeric_set", values: [50, 25], ordered: false },
};
expectCorrect("unordered same order", qSet, "50, 25");
expectCorrect("unordered reverse order", qSet, "25, 50");
expectCorrect("unordered with labels", qSet, "mẹ 50, con 25");
expectCorrect("unordered labels reversed", qSet, "con 25, mẹ 50");
expectCorrect("unordered prose", qSet, "Mẹ là 50 tuổi, còn con 25 tuổi");
expectWrong("unordered wrong number", qSet, "50, 26");
expectWrong("unordered missing one", qSet, "50");
expectWrong("unordered extra number", qSet, "50, 25, 10");

const qSetOrdered: GradeQuestion = {
  type: "fill",
  correct: "50, 25",
  answerSchema: { kind: "numeric_set", values: [50, 25], ordered: true },
};
expectCorrect("ordered match", qSetOrdered, "50, 25");
expectWrong("ordered reversed (must fail)", qSetOrdered, "25, 50");

// ─── gradeAnswer: labeled ────────────────────────────────────────────────
console.log("\n[gradeAnswer: labeled]");
const qLabeled: GradeQuestion = {
  type: "fill",
  correct: "mẹ 50, con 25",
  answerSchema: { kind: "labeled", pairs: { me: 50, con: 25 } },
};
expectCorrect("labeled — both labels", qLabeled, "mẹ 50, con 25");
expectCorrect("labeled — reversed labels", qLabeled, "con 25, mẹ 50");
expectCorrect("labeled — multiset only", qLabeled, "50, 25");
expectCorrect("labeled — multiset reversed", qLabeled, "25, 50");
expectWrong("labeled — swapped values", qLabeled, "mẹ 25, con 50");
expectWrong("labeled — partial", qLabeled, "mẹ 50");

// ─── gradeAnswer: regex ──────────────────────────────────────────────────
console.log("\n[gradeAnswer: regex]");
const qRegex: GradeQuestion = {
  type: "fill",
  correct: "any",
  answerSchema: { kind: "regex", pattern: "^\\d+\\s*viên$" },
};
expectCorrect("regex match", qRegex, "50 viên");
expectCorrect("regex match no space", qRegex, "50viên");
expectWrong("regex mismatch", qRegex, "viên 50");

// ─── empty / null ────────────────────────────────────────────────────────
console.log("\n[edge: empty]");
expectWrong("empty string", qExact, "");
expectWrong("undefined input", qExact, undefined as unknown as string);
expectWrong("null input", qExact, null as unknown as string);

// ─── classifyAnswer ──────────────────────────────────────────────────────
console.log("\n[classifyAnswer]");
expect("single int → numeric high", classifyAnswer("42").schema.kind, "numeric");
expect("single int confidence", classifyAnswer("42").confidence, "high");
expect("single decimal", classifyAnswer("3,14").schema.kind, "numeric");
expect("fraction", classifyAnswer("3/4").schema.kind, "numeric");
expect("two numbers → numeric_set", classifyAnswer("50, 25").schema.kind, "numeric_set");
expect("two numbers confidence", classifyAnswer("50, 25").confidence, "medium");
expect("labeled → labeled", classifyAnswer("mẹ 50, con 25").schema.kind, "labeled");
// "khoảng 50 viên" — single number with prose. New behavior: fallback to numeric.
expect("prose with 1 number → numeric medium", classifyAnswer("khoảng 50 viên").schema.kind, "numeric");
expect("prose with 1 number confidence", classifyAnswer("khoảng 50 viên").confidence, "medium");
expect("60% → numeric", classifyAnswer("60%").schema.kind, "numeric");
expect("7km → numeric", classifyAnswer("7km").schema.kind, "numeric");
expect("232 và 63 → numeric_set", classifyAnswer("232 và 63").schema.kind, "numeric_set");
expect("Màu đỏ → exact", classifyAnswer("Màu đỏ").schema.kind, "exact");
expect("empty → exact low", classifyAnswer("").confidence, "low");
expect("null → exact low", classifyAnswer(null).confidence, "low");

// "tìm a" answers
expect("a=3 → numeric high", classifyAnswer("a=3").schema.kind, "numeric");
expect("a=3 confidence", classifyAnswer("a=3").confidence, "high");
expect("x = 5 with spaces", classifyAnswer("x = 5").schema.kind, "numeric");
expect("x = -2,5", classifyAnswer("x = -2,5").schema.kind, "numeric");
expect("n=3/4 fraction", classifyAnswer("n=3/4").schema.kind, "numeric");
expect("a=3, b=4 → numeric_set", classifyAnswer("a=3, b=4").schema.kind, "numeric_set");

// Round-trip: DB stores "a=3" → user can type either form
{
  const c = classifyAnswer("a=3");
  const q: GradeQuestion = { type: "fill", correct: "a=3", answerSchema: c.schema };
  expectCorrect("a=3 user types 3", q, "3");
  expectCorrect("a=3 user types a=3", q, "a=3");
  expectCorrect("a=3 user types a = 3", q, "a = 3");
  expectCorrect("a=3 user types Vậy a=3", q, "Vậy a=3");
  expectWrong("a=3 user types 4", q, "4");
}

// Round-trip: DB stores "3" → user can still type a=3
{
  const c = classifyAnswer("3");
  const q: GradeQuestion = { type: "fill", correct: "3", answerSchema: c.schema };
  expectCorrect("3 user types 3", q, "3");
  expectCorrect("3 user types a=3", q, "a=3");
  expectCorrect("3 user types x = 3", q, "x = 3");
}

// Real example #1: "Số lớn: 1105; Số bé: 884"
{
  console.log("\n[real example: tổng-tỉ 1989]");
  const c = classifyAnswer("Số lớn: 1105; Số bé: 884");
  expect("classify kind", c.schema.kind, "labeled");
  const q: GradeQuestion = {
    type: "fill",
    correct: "Số lớn: 1105; Số bé: 884",
    answerSchema: c.schema,
  };
  expectCorrect("user: 884,1105 (số bé trước)", q, "884,1105");
  expectCorrect("user: 1105,884", q, "1105,884");
  expectCorrect("user: Số lớn: 1105; Số bé: 884", q, "Số lớn: 1105; Số bé: 884");
  expectCorrect("user: Số bé: 884, Số lớn: 1105", q, "Số bé: 884, Số lớn: 1105");
  expectCorrect("user: số lớn 1105, số bé 884", q, "số lớn 1105, số bé 884");
  expectWrong("user: swap (số lớn: 884)", q, "Số lớn: 884; Số bé: 1105");
  expectWrong("user: chỉ 1 số", q, "1105");
  expectWrong("user: số sai", q, "1000, 989");
}

// Real example #2: "24; 26; 28; 30"
{
  console.log("\n[real example: 4 số chẵn liên tiếp, TBC=27]");
  const c = classifyAnswer("24; 26; 28; 30");
  expect("classify kind", c.schema.kind, "numeric_set");
  const q: GradeQuestion = {
    type: "fill",
    correct: "24; 26; 28; 30",
    answerSchema: c.schema,
  };
  expectCorrect("user: 24,26,28,30", q, "24,26,28,30");
  expectCorrect("user: 24, 26, 28, 30 (spaces)", q, "24, 26, 28, 30");
  expectCorrect("user: 30, 28, 26, 24 (reversed)", q, "30, 28, 26, 24");
  expectCorrect("user: 24; 26; 28; 30 (semicolons)", q, "24; 26; 28; 30");
  expectWrong("user: missing 30", q, "24, 26, 28");
  expectWrong("user: wrong value", q, "24, 26, 28, 31");
}

// Context-aware: same input "3,5" disambiguated by expected count
{
  console.log("\n[context disambiguation: '3,5']");

  // Câu "tìm 1 số": expect 1 value, "3,5" → 3.5
  const q1: GradeQuestion = {
    type: "fill",
    correct: "3,5",
    answerSchema: { kind: "numeric", value: 3.5 },
  };
  expectCorrect("expect 1 number — '3,5' = 3.5", q1, "3,5");

  // Câu "tìm 2 số": expect 2 values, "3,5" → [3, 5]
  const q2: GradeQuestion = {
    type: "fill",
    correct: "3; 5",
    answerSchema: { kind: "numeric_set", values: [3, 5], ordered: false },
  };
  expectCorrect("expect 2 numbers — '3,5' = [3,5]", q2, "3,5");
  expectCorrect("expect 2 numbers — '5,3' = [5,3]", q2, "5,3");
  expectCorrect("expect 2 numbers — '3, 5' with space", q2, "3, 5");
  expectCorrect("expect 2 numbers — '3 và 5'", q2, "3 và 5");

  // Câu "tìm 2 số" với value đúng là decimals: expect [1.5, 2.5]
  const q3: GradeQuestion = {
    type: "fill",
    correct: "1,5; 2,5",
    answerSchema: { kind: "numeric_set", values: [1.5, 2.5], ordered: false },
  };
  expectCorrect("expect 2 decimals — '1,5; 2,5'", q3, "1,5; 2,5");
  expectCorrect("expect 2 decimals — '1,5 và 2,5'", q3, "1,5 và 2,5");
  expectCorrect("expect 2 decimals — '1.5, 2.5'", q3, "1.5, 2.5");
  expectWrong("expect 2 decimals — '1,5,2,5' ambiguous fail", q3, "1,5,2,5");

  // Câu "tìm 2 số" với π và 14: ví dụ giả định
  const q4: GradeQuestion = {
    type: "fill",
    correct: "3; 14",
    answerSchema: { kind: "numeric_set", values: [3, 14], ordered: false },
  };
  expectCorrect("expect [3,14] — user gõ '3,14'", q4, "3,14");
  expectCorrect("expect [3,14] — user gõ '14, 3'", q4, "14, 3");

  // Labeled with comma in user input
  const q5: GradeQuestion = {
    type: "fill",
    correct: "Số lớn: 1105; Số bé: 884",
    answerSchema: { kind: "labeled", pairs: { so_lon: 1105, so_be: 884 } },
  };
  expectCorrect("labeled with comma no space", q5, "884,1105");
  expectCorrect("labeled with comma + space", q5, "884, 1105");
}

// Round-trip: "a=3, b=4"
{
  const c = classifyAnswer("a=3, b=4");
  const q: GradeQuestion = { type: "fill", correct: "a=3, b=4", answerSchema: c.schema };
  expectCorrect("a=3,b=4 same", q, "a=3, b=4");
  expectCorrect("a=3,b=4 reversed", q, "b=4, a=3");
  expectCorrect("a=3,b=4 plain", q, "3, 4");
  expectWrong("a=3,b=4 wrong", q, "a=4, b=5");
}

// Round-trip: classify "50, 25" → apply schema → grade the various user inputs.
{
  const c = classifyAnswer("50, 25");
  const q: GradeQuestion = { type: "fill", correct: "50, 25", answerSchema: c.schema };
  expectCorrect("round-trip 50, 25", q, "50, 25");
  expectCorrect("round-trip reversed", q, "25, 50");
  expectCorrect("round-trip with labels", q, "mẹ 50, con 25");
}

// Round-trip: classify "mẹ 50, con 25" → apply schema → grade.
{
  const c = classifyAnswer("mẹ 50, con 25");
  const q: GradeQuestion = { type: "fill", correct: "mẹ 50, con 25", answerSchema: c.schema };
  expectCorrect("labeled round-trip both labels", q, "mẹ 50, con 25");
  expectCorrect("labeled round-trip reversed", q, "con 25, mẹ 50");
  expectCorrect("labeled round-trip unlabeled", q, "50, 25");
  expectWrong("labeled round-trip swapped values", q, "mẹ 25, con 50");
}

// ─── result ──────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(f);
  process.exit(1);
}
process.exit(0);
