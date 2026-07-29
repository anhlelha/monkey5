/**
 * Shared source of truth for the "Dãy phân số — tách thành hiệu (khử liên
 * tiếp)" problem set, chuyên đề Phân số / Tỉ số (topic "phan").
 *
 * Used by BOTH:
 *   - scripts/seed-phanso-day-reference.ts  → standalone bank (examId = null),
 *     feeds topic practice via spawnTopicSetExam().
 *   - scripts/seed-remedial-mika.ts         → a private "Bài thầy giao" for mika.
 *
 * Keeping the 10 problems here (instead of duplicating in two seed scripts)
 * means an edit to a stem / answer / lời giải propagates to both places on the
 * next re-seed — no drift.
 *
 * Grading: answers are fractions in "a/b" form. The seed leaves answerSchema
 * null so the fill grader falls through to matchExact (strips spaces / diacritics)
 * — a numeric schema would be wrong here (100/101 has no clean decimal). The stem
 * tells the student to write the result as a/b.
 *
 * All answers were verified by hand via the telescoping (khử liên tiếp) method.
 */

export interface PhanSoDayProblem {
  /** 1-based position within the set. */
  num: number;
  /** 1 = cùng dấu, tách thành hiệu · 2 = tử số 1 (hệ số ½) · 3 = đan dấu (tử = tổng). */
  group: 1 | 2 | 3;
  /** Full LaTeX stem; ends with the "(Viết … dạng a/b)" instruction. */
  stem: string;
  /** Đáp số dạng a/b (matchExact). */
  answer: string;
  /** Lời giải mẫu (LaTeX). */
  modelAnswer: string;
}

export const PHANSO_DAY_PROBLEMS: PhanSoDayProblem[] = [
  // ── Nhóm 1 — cùng dấu, tách thành hiệu rồi khử liên tiếp ──────────────────
  {
    num: 1,
    group: 1,
    stem: "Nhóm 1 (tách thành hiệu). Tính $A=\\dfrac{1}{1\\times2}+\\dfrac{1}{2\\times3}+\\dfrac{1}{3\\times4}+\\dots+\\dfrac{1}{9\\times10}$. (Viết kết quả dạng a/b)",
    answer: "9/10",
    modelAnswer:
      "Mỗi số hạng $\\dfrac{1}{n\\times(n+1)}=\\dfrac1n-\\dfrac1{n+1}$. Khử liên tiếp:\n$A=1-\\dfrac1{10}=\\dfrac{9}{10}$.",
  },
  {
    num: 2,
    group: 1,
    stem: "Nhóm 1 (tách thành hiệu). Tính $A=\\dfrac{2}{1\\times3}+\\dfrac{2}{3\\times5}+\\dfrac{2}{5\\times7}+\\dots+\\dfrac{2}{99\\times101}$. (Viết kết quả dạng a/b)",
    answer: "100/101",
    modelAnswer:
      "Tử số 2 đúng bằng hiệu hai thừa số nên $\\dfrac{2}{(2k-1)\\times(2k+1)}=\\dfrac1{2k-1}-\\dfrac1{2k+1}$.\n$A=1-\\dfrac1{101}=\\dfrac{100}{101}$.",
  },
  {
    num: 3,
    group: 1,
    stem: "Nhóm 1 (tách thành hiệu). Tính $A=\\dfrac{3}{1\\times4}+\\dfrac{3}{4\\times7}+\\dfrac{3}{7\\times10}+\\dots+\\dfrac{3}{28\\times31}$. (Viết kết quả dạng a/b)",
    answer: "30/31",
    modelAnswer:
      "Tử số 3 đúng bằng hiệu hai thừa số nên $\\dfrac{3}{n\\times(n+3)}=\\dfrac1n-\\dfrac1{n+3}$.\n$A=1-\\dfrac1{31}=\\dfrac{30}{31}$.",
  },
  {
    num: 4,
    group: 1,
    stem: "Nhóm 1 (tách thành hiệu). Tính $A=\\dfrac{5}{1\\times6}+\\dfrac{5}{6\\times11}+\\dfrac{5}{11\\times16}+\\dots+\\dfrac{5}{31\\times36}$. (Viết kết quả dạng a/b)",
    answer: "35/36",
    modelAnswer:
      "Tử số 5 đúng bằng hiệu hai thừa số nên $\\dfrac{5}{n\\times(n+5)}=\\dfrac1n-\\dfrac1{n+5}$.\n$A=1-\\dfrac1{36}=\\dfrac{35}{36}$.",
  },

  // ── Nhóm 2 — tử số bằng 1 (nhỏ hơn hiệu hai thừa số → có hệ số ½) ──────────
  {
    num: 5,
    group: 2,
    stem: "Nhóm 2 (hệ số ½). Tính $A=\\dfrac{1}{1\\times3}+\\dfrac{1}{3\\times5}+\\dfrac{1}{5\\times7}+\\dots+\\dfrac{1}{13\\times15}$. (Viết kết quả dạng a/b)",
    answer: "7/15",
    modelAnswer:
      "Hiệu hai thừa số là 2 mà tử chỉ là 1 nên nhân thêm $\\dfrac12$: $\\dfrac{1}{(2k-1)\\times(2k+1)}=\\dfrac12\\left(\\dfrac1{2k-1}-\\dfrac1{2k+1}\\right)$.\n$A=\\dfrac12\\left(1-\\dfrac1{15}\\right)=\\dfrac12\\times\\dfrac{14}{15}=\\dfrac{7}{15}$.",
  },
  {
    num: 6,
    group: 2,
    stem: "Nhóm 2 (hệ số ½). Tính $A=\\dfrac{1}{2\\times4}+\\dfrac{1}{4\\times6}+\\dfrac{1}{6\\times8}+\\dots+\\dfrac{1}{18\\times20}$. (Viết kết quả dạng a/b)",
    answer: "9/40",
    modelAnswer:
      "Hiệu hai thừa số là 2 mà tử là 1 nên $\\dfrac{1}{n\\times(n+2)}=\\dfrac12\\left(\\dfrac1n-\\dfrac1{n+2}\\right)$.\n$A=\\dfrac12\\left(\\dfrac12-\\dfrac1{20}\\right)=\\dfrac12\\times\\dfrac{9}{20}=\\dfrac{9}{40}$.",
  },

  // ── Nhóm 3 — đan dấu, tử số liên quan tổng hai thừa số ở mẫu ───────────────
  {
    num: 7,
    group: 3,
    stem: "Nhóm 3 (đan dấu, tử = tổng hai thừa số). Tính $A=\\dfrac{3}{1\\times2}-\\dfrac{5}{2\\times3}+\\dfrac{7}{3\\times4}-\\dots-\\dfrac{21}{10\\times11}$. (Viết kết quả dạng a/b)",
    answer: "10/11",
    modelAnswer:
      "Tử bằng tổng hai thừa số nên $\\dfrac{k+(k+1)}{k\\times(k+1)}=\\dfrac1k+\\dfrac1{k+1}$. Cộng đan dấu, các số hạng ở giữa khử nhau, chỉ còn số đầu và số cuối:\n$A=1-\\dfrac1{11}=\\dfrac{10}{11}$.",
  },
  {
    num: 8,
    group: 3,
    stem: "Nhóm 3 (đan dấu, tử = tổng hai thừa số). Tính $A=\\dfrac{4}{1\\times3}-\\dfrac{8}{3\\times5}+\\dfrac{12}{5\\times7}-\\dots+\\dfrac{28}{13\\times15}$. (Viết kết quả dạng a/b)",
    answer: "16/15",
    modelAnswer:
      "Tử bằng tổng hai thừa số nên $\\dfrac{a+b}{a\\times b}=\\dfrac1a+\\dfrac1b$. Đan dấu, số hạng cuối mang dấu $+$; các phần giữa khử nhau:\n$A=1+\\dfrac1{15}=\\dfrac{16}{15}$.",
  },
  {
    num: 9,
    group: 3,
    stem: "Nhóm 3 (biến tấu: tử = 2 lần tổng hai thừa số). Tính $A=\\dfrac{6}{1\\times2}-\\dfrac{10}{2\\times3}+\\dfrac{14}{3\\times4}-\\dots-\\dfrac{34}{8\\times9}$. (Viết kết quả dạng a/b)",
    answer: "16/9",
    modelAnswer:
      "Tử bằng 2 lần tổng hai thừa số nên mỗi số hạng $=2\\left(\\dfrac1k+\\dfrac1{k+1}\\right)$. Đan dấu, khử liên tiếp:\n$A=2\\left(1-\\dfrac19\\right)=2\\times\\dfrac89=\\dfrac{16}{9}$.",
  },
  {
    num: 10,
    group: 3,
    stem: "Nhóm 3 (biến tấu: tử = một nửa tổng hai thừa số). Tính $A=\\dfrac{2}{1\\times3}-\\dfrac{4}{3\\times5}+\\dfrac{6}{5\\times7}-\\dots+\\dfrac{14}{13\\times15}$. (Viết kết quả dạng a/b)",
    answer: "8/15",
    modelAnswer:
      "Tử bằng một nửa tổng hai thừa số nên mỗi số hạng $=\\dfrac12\\left(\\dfrac1a+\\dfrac1b\\right)$. Đan dấu, số hạng cuối dấu $+$:\n$A=\\dfrac12\\left(1+\\dfrac1{15}\\right)=\\dfrac12\\times\\dfrac{16}{15}=\\dfrac{8}{15}$.",
  },
];
