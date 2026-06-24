/**
 * Seed 30 standalone reference exercises for the "Toán tuổi" topic.
 *
 * These are BANK questions (examId = null) — they feed topic practice via
 * spawnTopicSetExam() with sourceFilter "supplement" or "all". They are NOT
 * tied to any exam and do not appear in any exam list.
 *
 * Source content: prompt/bai-tap-tuoi-L4-L5.md (self-solved & verified).
 *
 * Idempotent: deletes existing rows with the same SOURCE_TAG before inserting,
 * so re-running never duplicates. Run with:
 *   npx tsx scripts/seed-tuoi-reference.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TOPIC = "tuoi";
const SOURCE_TAG = "Hệ thống · Toán tuổi";

type NumericSchema = { kind: "numeric"; value: number };
type SetSchema = { kind: "numeric_set"; values: number[]; ordered: false };

interface Q {
  num: number;
  grade: "L4" | "L5" | "NC";
  stem: string;
  correct: string; // human-readable answer (shown in UI)
  schema: NumericSchema | SetSchema; // deterministic grading
  unit: string | null;
  modelAnswer: string;
}

// Helper builders keep the data table compact and consistent.
const setOf = (...values: number[]): SetSchema => ({
  kind: "numeric_set",
  values,
  ordered: false,
});
const num = (value: number): NumericSchema => ({ kind: "numeric", value });

const SET_PLACEHOLDER = "VD: 12; 9";
const SINGLE_PLACEHOLDER = "Đáp số...";

const questions: Q[] = [
  // ─── PHẦN A · LỚP 4 (hiện tại) ──────────────────────────────────────────────
  {
    num: 1,
    grade: "L4",
    stem: "Tổng số tuổi của hai anh em là 21 tuổi, anh hơn em 3 tuổi. Tính tuổi mỗi người.",
    correct: "Anh 12 tuổi, em 9 tuổi",
    schema: setOf(12, 9),
    unit: null,
    modelAnswer:
      "Bài toán Tổng – hiệu.\nTuổi anh = $(21 + 3) : 2 = 12$ (tuổi).\nTuổi em = $12 - 3 = 9$ (tuổi).",
  },
  {
    num: 2,
    grade: "L4",
    stem: "Tổng số tuổi của bố và con là 40 tuổi, bố hơn con 28 tuổi. Tính tuổi mỗi người.",
    correct: "Bố 34 tuổi, con 6 tuổi",
    schema: setOf(34, 6),
    unit: null,
    modelAnswer:
      "Bài toán Tổng – hiệu.\nTuổi bố = $(40 + 28) : 2 = 34$ (tuổi).\nTuổi con = $34 - 28 = 6$ (tuổi).",
  },
  {
    num: 3,
    grade: "L4",
    stem: "Hai chị em có tổng số tuổi là 24, chị hơn em 4 tuổi. Tính tuổi mỗi người.",
    correct: "Chị 14 tuổi, em 10 tuổi",
    schema: setOf(14, 10),
    unit: null,
    modelAnswer:
      "Bài toán Tổng – hiệu.\nTuổi chị = $(24 + 4) : 2 = 14$ (tuổi).\nTuổi em = $14 - 4 = 10$ (tuổi).",
  },
  {
    num: 4,
    grade: "L4",
    stem: "Tổng số tuổi của hai mẹ con là 36 tuổi. Tuổi mẹ gấp 5 lần tuổi con. Tính tuổi mỗi người.",
    correct: "Con 6 tuổi, mẹ 30 tuổi",
    schema: setOf(6, 30),
    unit: null,
    modelAnswer:
      "Bài toán Tổng – tỉ. Coi tuổi con là 1 phần, tuổi mẹ là 5 phần.\nTổng số phần: $5 + 1 = 6$ (phần).\nTuổi con = $36 : 6 = 6$ (tuổi); tuổi mẹ = $6 \\times 5 = 30$ (tuổi).",
  },
  {
    num: 5,
    grade: "L4",
    stem: "Tổng số tuổi của ông và cháu là 70 tuổi. Tuổi ông gấp 6 lần tuổi cháu. Tính tuổi mỗi người.",
    correct: "Cháu 10 tuổi, ông 60 tuổi",
    schema: setOf(10, 60),
    unit: null,
    modelAnswer:
      "Bài toán Tổng – tỉ. Cháu 1 phần, ông 6 phần → tổng 7 phần.\nTuổi cháu = $70 : 7 = 10$ (tuổi); tuổi ông = $10 \\times 6 = 60$ (tuổi).",
  },
  {
    num: 6,
    grade: "L4",
    stem: "Tổng số tuổi của hai chị em là 28 tuổi. Tuổi em bằng $\\dfrac{2}{5}$ tuổi chị. Tính tuổi mỗi người.",
    correct: "Em 8 tuổi, chị 20 tuổi",
    schema: setOf(8, 20),
    unit: null,
    modelAnswer:
      "Bài toán Tổng – tỉ. Em 2 phần, chị 5 phần → tổng 7 phần $= 28$ → 1 phần $= 4$.\nTuổi em = $2 \\times 4 = 8$; tuổi chị = $5 \\times 4 = 20$.",
  },
  {
    num: 7,
    grade: "L4",
    stem: "Tổng số tuổi của bố và con là 42 tuổi. Tuổi con bằng $\\dfrac{1}{6}$ tuổi bố. Tính tuổi mỗi người.",
    correct: "Con 6 tuổi, bố 36 tuổi",
    schema: setOf(6, 36),
    unit: null,
    modelAnswer:
      "Bài toán Tổng – tỉ. Con 1 phần, bố 6 phần → tổng 7 phần $= 42$ → 1 phần $= 6$.\nTuổi con = $6$; tuổi bố = $6 \\times 6 = 36$.",
  },
  {
    num: 8,
    grade: "L4",
    stem: "Mẹ hơn con 24 tuổi. Tuổi mẹ gấp 3 lần tuổi con. Tính tuổi mỗi người.",
    correct: "Con 12 tuổi, mẹ 36 tuổi",
    schema: setOf(12, 36),
    unit: null,
    modelAnswer:
      "Bài toán Hiệu – tỉ. Con 1 phần, mẹ 3 phần → hiệu 2 phần $= 24$ → 1 phần $= 12$.\nTuổi con = $12$; tuổi mẹ = $12 \\times 3 = 36$.",
  },
  {
    num: 9,
    grade: "L4",
    stem: "Bố hơn con 28 tuổi. Tuổi con bằng $\\dfrac{1}{5}$ tuổi bố. Tính tuổi mỗi người.",
    correct: "Con 7 tuổi, bố 35 tuổi",
    schema: setOf(7, 35),
    unit: null,
    modelAnswer:
      "Bài toán Hiệu – tỉ. Con 1 phần, bố 5 phần → hiệu 4 phần $= 28$ → 1 phần $= 7$.\nTuổi con = $7$; tuổi bố = $7 \\times 5 = 35$.",
  },
  {
    num: 10,
    grade: "L4",
    stem: "Chị hơn em 8 tuổi. Tuổi em bằng $\\dfrac{3}{5}$ tuổi chị. Tính tuổi mỗi người.",
    correct: "Em 12 tuổi, chị 20 tuổi",
    schema: setOf(12, 20),
    unit: null,
    modelAnswer:
      "Bài toán Hiệu – tỉ. Em 3 phần, chị 5 phần → hiệu 2 phần $= 8$ → 1 phần $= 4$.\nTuổi em = $3 \\times 4 = 12$; tuổi chị = $5 \\times 4 = 20$.",
  },
  {
    num: 11,
    grade: "L4",
    stem: "Ông hơn cháu 50 tuổi. Tuổi cháu bằng $\\dfrac{1}{6}$ tuổi ông. Tính tuổi mỗi người.",
    correct: "Cháu 10 tuổi, ông 60 tuổi",
    schema: setOf(10, 60),
    unit: null,
    modelAnswer:
      "Bài toán Hiệu – tỉ. Cháu 1 phần, ông 6 phần → hiệu 5 phần $= 50$ → 1 phần $= 10$.\nTuổi cháu = $10$; tuổi ông = $10 \\times 6 = 60$.",
  },
  {
    num: 12,
    grade: "L4",
    stem: "Tổng số tuổi của ba mẹ con là 54 tuổi. Tuổi mẹ gấp 3 lần tuổi con gái, tuổi con gái gấp 2 lần tuổi con trai. Tính tuổi mỗi người.",
    correct: "Con trai 6 tuổi, con gái 12 tuổi, mẹ 36 tuổi",
    schema: setOf(6, 12, 36),
    unit: null,
    modelAnswer:
      "Coi tuổi con trai là 1 phần → con gái 2 phần, mẹ $2 \\times 3 = 6$ phần.\nTổng $1 + 2 + 6 = 9$ phần $= 54$ → 1 phần $= 6$.\nCon trai $= 6$; con gái $= 12$; mẹ $= 36$.",
  },
  {
    num: 13,
    grade: "L4",
    stem: "Tổng số tuổi của con, bố và ông là 75 tuổi. Tuổi bố gấp 5 lần tuổi con, tuổi ông gấp 9 lần tuổi con. Tính tuổi mỗi người.",
    correct: "Con 5 tuổi, bố 25 tuổi, ông 45 tuổi",
    schema: setOf(5, 25, 45),
    unit: null,
    modelAnswer:
      "Coi tuổi con là 1 phần → bố 5 phần, ông 9 phần.\nTổng $1 + 5 + 9 = 15$ phần $= 75$ → 1 phần $= 5$.\nCon $= 5$; bố $= 25$; ông $= 45$.",
  },
  {
    num: 14,
    grade: "L4",
    stem: "Tổng số tuổi của hai ông cháu là 65 tuổi, ông hơn cháu 55 tuổi. Tính tuổi mỗi người.",
    correct: "Ông 60 tuổi, cháu 5 tuổi",
    schema: setOf(60, 5),
    unit: null,
    modelAnswer:
      "Bài toán Tổng – hiệu.\nTuổi ông = $(65 + 55) : 2 = 60$; tuổi cháu = $60 - 55 = 5$.",
  },
  {
    num: 15,
    grade: "L4",
    stem: "Tổng số tuổi của hai chị em là 35 tuổi. Tuổi em bằng $\\dfrac{3}{4}$ tuổi chị. Tính tuổi mỗi người.",
    correct: "Em 15 tuổi, chị 20 tuổi",
    schema: setOf(15, 20),
    unit: null,
    modelAnswer:
      "Bài toán Tổng – tỉ. Em 3 phần, chị 4 phần → tổng 7 phần $= 35$ → 1 phần $= 5$.\nTuổi em = $15$; tuổi chị = $20$.",
  },

  // ─── PHẦN B · LỚP 5 & NÂNG CAO (yếu tố thời gian) ───────────────────────────
  {
    num: 16,
    grade: "L5",
    stem: "Hiện nay mẹ 30 tuổi, con 6 tuổi. Hỏi sau bao nhiêu năm nữa thì tuổi mẹ gấp 3 lần tuổi con?",
    correct: "Sau 6 năm",
    schema: num(6),
    unit: "năm",
    modelAnswer:
      "Hiệu số tuổi không đổi $= 30 - 6 = 24$.\nKhi mẹ gấp 3 lần con: con 1 phần, mẹ 3 phần → hiệu 2 phần $= 24$ → tuổi con lúc đó $= 12$.\nSố năm cần thêm: $12 - 6 = \\mathbf{6}$ năm. (Kiểm: mẹ 36, con 12; $36 = 3 \\times 12$.)",
  },
  {
    num: 17,
    grade: "L5",
    stem: "Mẹ hơn con 28 tuổi. Sau 2 năm nữa tuổi con bằng $\\dfrac{1}{5}$ tuổi mẹ. Tính tuổi con hiện nay.",
    correct: "Con 5 tuổi (mẹ 33 tuổi)",
    schema: num(5),
    unit: "tuổi",
    modelAnswer:
      "Hiệu số tuổi luôn $= 28$. Sau 2 năm: con 1 phần, mẹ 5 phần → hiệu 4 phần $= 28$ → 1 phần $= 7$.\nTuổi con sau 2 năm $= 7$ → con hiện nay $= 7 - 2 = \\mathbf{5}$ (mẹ 33).",
  },
  {
    num: 18,
    grade: "L5",
    stem: "Năm nay con 8 tuổi, bố 38 tuổi. Hỏi sau bao nhiêu năm nữa tuổi bố gấp đôi tuổi con?",
    correct: "Sau 22 năm",
    schema: num(22),
    unit: "năm",
    modelAnswer:
      "Hiệu số tuổi không đổi $= 38 - 8 = 30$.\nKhi bố gấp đôi con: hiệu $= 1$ phần con $= 30$ → tuổi con lúc đó $= 30$.\nSố năm cần thêm: $30 - 8 = \\mathbf{22}$ năm. (Kiểm: bố 60, con 30.)",
  },
  {
    num: 19,
    grade: "L5",
    stem: "Hiện nay tuổi mẹ gấp 4 lần tuổi con. Sau 3 năm nữa tổng số tuổi hai mẹ con là 46 tuổi. Tính tuổi mỗi người hiện nay.",
    correct: "Con 8 tuổi, mẹ 32 tuổi",
    schema: setOf(8, 32),
    unit: null,
    modelAnswer:
      "Sau 3 năm tổng tăng $2 \\times 3 = 6$ → tổng hiện nay $= 46 - 6 = 40$.\nMẹ 4 phần, con 1 phần → tổng 5 phần $= 40$ → con $= 8$, mẹ $= 32$.",
  },
  {
    num: 20,
    grade: "L5",
    stem: "Cách đây 3 năm tuổi con bằng $\\dfrac{1}{4}$ tuổi mẹ. Hiện nay mẹ hơn con 27 tuổi. Tính tuổi hai người hiện nay.",
    correct: "Con 12 tuổi, mẹ 39 tuổi",
    schema: setOf(12, 39),
    unit: null,
    modelAnswer:
      "Hiệu số tuổi luôn $= 27$. Cách đây 3 năm: con 1 phần, mẹ 4 phần → hiệu 3 phần $= 27$ → 1 phần $= 9$.\nCon cách đây 3 năm $= 9$ → con hiện nay $= 12$, mẹ $= 39$.",
  },
  {
    num: 21,
    grade: "L5",
    stem: "Tổng số tuổi của hai bố con hiện nay là 50 tuổi. Cách đây 5 năm tuổi con bằng $\\dfrac{1}{4}$ tuổi bố. Tính tuổi mỗi người hiện nay.",
    correct: "Con 13 tuổi, bố 37 tuổi",
    schema: setOf(13, 37),
    unit: null,
    modelAnswer:
      "Cách đây 5 năm tổng giảm $2 \\times 5 = 10$ → tổng lúc đó $= 40$.\nCon 1 phần, bố 4 phần → tổng 5 phần $= 40$ → con lúc đó $= 8$, bố $= 32$.\nHiện nay: con $= 13$, bố $= 37$.",
  },
  {
    num: 22,
    grade: "NC",
    stem: "Hiện nay tuổi anh gấp 3 lần tuổi em. Sau 4 năm nữa tuổi anh gấp 2 lần tuổi em. Tính tuổi mỗi người hiện nay.",
    correct: "Em 4 tuổi, anh 12 tuổi",
    schema: setOf(4, 12),
    unit: null,
    modelAnswer:
      "Hiệu số tuổi không đổi. Hiện nay hiệu $= 3 - 1 = 2$ lần tuổi em; sau 4 năm hiệu $= 2 - 1 = 1$ lần tuổi em (lúc đó).\nVì hiệu không đổi: tuổi em sau 4 năm $= 2 \\times$ tuổi em hiện nay → em hiện nay $= 4$, anh $= 12$.\n(Kiểm: sau 4 năm em 8, anh 16 $= 2 \\times 8$.)",
  },
  {
    num: 23,
    grade: "NC",
    stem: "Cách đây 4 năm tuổi mẹ gấp 6 lần tuổi con. Hiện nay tuổi mẹ gấp 4 lần tuổi con. Tính tuổi hai người hiện nay.",
    correct: "Con 10 tuổi, mẹ 40 tuổi",
    schema: setOf(10, 40),
    unit: null,
    modelAnswer:
      "Gọi tuổi con cách đây 4 năm là 1 phần → mẹ 6 phần, hiệu $= 5$ phần (không đổi).\nHiện nay mẹ gấp 4 lần con nên hiệu $= 3$ lần tuổi con hiện nay $= 3 \\times (1\\text{ phần} + 4)$.\n$5\\text{ phần} = 3\\text{ phần} + 12 → 2\\text{ phần} = 12 → 1\\text{ phần} = 6$.\nCon cách đây 4 năm $= 6$ → con hiện nay $= 10$, mẹ $= 40$.",
  },
  {
    num: 24,
    grade: "L5",
    stem: "Hiện nay tổng số tuổi của hai mẹ con là 36 tuổi. Sau 2 năm nữa tuổi mẹ gấp 4 lần tuổi con. Tính tuổi mỗi người hiện nay.",
    correct: "Con 6 tuổi, mẹ 30 tuổi",
    schema: setOf(6, 30),
    unit: null,
    modelAnswer:
      "Sau 2 năm tổng tăng $2 \\times 2 = 4$ → tổng lúc đó $= 40$.\nMẹ 4 phần, con 1 phần → 5 phần $= 40$ → con sau 2 năm $= 8$, mẹ $= 32$.\nHiện nay: con $= 6$, mẹ $= 30$.",
  },
  {
    num: 25,
    grade: "L5",
    stem: "Hiện nay tổng số tuổi của hai chị em là 32 tuổi. Cách đây 4 năm tuổi chị gấp 3 lần tuổi em. Tính tuổi mỗi người hiện nay.",
    correct: "Em 10 tuổi, chị 22 tuổi",
    schema: setOf(10, 22),
    unit: null,
    modelAnswer:
      "Cách đây 4 năm tổng giảm $2 \\times 4 = 8$ → tổng lúc đó $= 24$.\nChị 3 phần, em 1 phần → 4 phần $= 24$ → em lúc đó $= 6$, chị $= 18$.\nHiện nay: em $= 10$, chị $= 22$.",
  },
  {
    num: 26,
    grade: "L5",
    stem: "Hiện nay bố hơn con 30 tuổi. Sau 6 năm nữa tuổi con bằng $\\dfrac{1}{3}$ tuổi bố. Tính tuổi hai người hiện nay.",
    correct: "Con 9 tuổi, bố 39 tuổi",
    schema: setOf(9, 39),
    unit: null,
    modelAnswer:
      "Hiệu số tuổi luôn $= 30$. Sau 6 năm: con 1 phần, bố 3 phần → hiệu 2 phần $= 30$ → 1 phần $= 15$.\nCon sau 6 năm $= 15$ → con hiện nay $= 9$, bố $= 39$.",
  },
  {
    num: 27,
    grade: "L5",
    stem: "Hiện nay con 10 tuổi, mẹ 34 tuổi. Hỏi sau bao nhiêu năm nữa tuổi mẹ gấp đôi tuổi con?",
    correct: "Sau 14 năm",
    schema: num(14),
    unit: "năm",
    modelAnswer:
      "Hiệu số tuổi không đổi $= 34 - 10 = 24$.\nKhi mẹ gấp đôi con: hiệu $= 1$ phần con $= 24$ → tuổi con lúc đó $= 24$.\nSố năm cần thêm: $24 - 10 = \\mathbf{14}$ năm. (Kiểm: mẹ 48, con 24.)",
  },
  {
    num: 28,
    grade: "L5",
    stem: "Mẹ hơn con 25 tuổi. Cách đây 7 năm tuổi con bằng $\\dfrac{1}{6}$ tuổi mẹ. Tính tuổi hai người hiện nay.",
    correct: "Con 12 tuổi, mẹ 37 tuổi",
    schema: setOf(12, 37),
    unit: null,
    modelAnswer:
      "Hiệu số tuổi luôn $= 25$. Cách đây 7 năm: con 1 phần, mẹ 6 phần → hiệu 5 phần $= 25$ → 1 phần $= 5$.\nCon lúc đó $= 5$ → con hiện nay $= 12$, mẹ $= 37$.",
  },
  {
    num: 29,
    grade: "NC",
    stem: "Cách đây 5 năm tuổi anh gấp 4 lần tuổi em. Sau 1 năm nữa tuổi anh gấp 2 lần tuổi em. Tính tuổi mỗi người hiện nay.",
    correct: "Em 8 tuổi, anh 17 tuổi",
    schema: setOf(8, 17),
    unit: null,
    modelAnswer:
      "Hiệu số tuổi không đổi $= $ anh $-$ em.\nCách đây 5 năm hiệu $= 3$ lần tuổi em (lúc đó); sau 1 năm hiệu $= 1$ lần tuổi em (lúc đó).\nTuổi em cách đây 5 năm là $a$: $3a = (a + 6)$ → ... giải ra em hiện nay $= 8$, anh $= 17$.\n(Kiểm: cách đây 5 năm anh 12 $= 4 \\times 3$; sau 1 năm anh 18 $= 2 \\times 9$.)",
  },
  {
    num: 30,
    grade: "NC",
    stem: "Hiện nay tuổi bố hơn tổng số tuổi của hai con là 18 tuổi. Hỏi sau bao nhiêu năm nữa tuổi bố bằng tổng số tuổi của hai con?",
    correct: "Sau 18 năm",
    schema: num(18),
    unit: "năm",
    modelAnswer:
      "Mỗi năm bố thêm 1 tuổi, còn tổng tuổi hai con thêm 2 tuổi → khoảng cách giảm 1 tuổi mỗi năm.\nHiện chênh 18 tuổi → sau $\\mathbf{18}$ năm tuổi bố bằng tổng tuổi hai con.",
  },
];

async function main() {
  console.log(`=== Seeding ${questions.length} reference 'tuoi' bank questions ===`);

  // Idempotency: remove previously-seeded rows from this source (standalone only).
  const del = await prisma.question.deleteMany({
    where: { examId: null, topic: TOPIC, source: SOURCE_TAG },
  });
  if (del.count > 0) console.log(`  cleared ${del.count} existing rows (re-seed)`);

  for (const q of questions) {
    await prisma.question.create({
      data: {
        examId: null,
        num: q.num,
        type: "fill",
        topic: TOPIC,
        grade: q.grade,
        points: 1,
        stem: q.stem,
        options: "[]",
        correct: q.correct,
        answerSchema: JSON.stringify(q.schema),
        unit: q.unit,
        placeholder: q.schema.kind === "numeric_set" ? SET_PLACEHOLDER : SINGLE_PLACEHOLDER,
        modelAnswer: q.modelAnswer,
        figure: null,
        source: SOURCE_TAG,
        active: true,
      },
    });
    const ans =
      q.schema.kind === "numeric_set"
        ? `[${q.schema.values.join(", ")}]`
        : `${q.schema.value}`;
    console.log(`  ✓ Bài ${q.num} (${q.grade}) → ${ans}`);
  }

  const byGrade = await prisma.question.groupBy({
    by: ["grade"],
    where: { examId: null, topic: TOPIC, source: SOURCE_TAG },
    _count: true,
  });
  console.log(`\n✓ Done. Bank 'tuoi' standalone by grade:`, JSON.stringify(byGrade));
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
