// Shared QA constants — NOT a server file, safe to import anywhere

export const IMPLEMENTED_FIGURES_LIST = [
  "cg-2020-c5", "cg-2020-c8", "cg-2022-c8", "cg-2023-c7", "cg-2023-c8",
  "cg-2024-c5", "cg-2024-c7", "cg-2026-c7", "cg-2026-c8",
  "tx-2019-c9", "tx-2021-c8", "tx-2022-c3", "tx-2023-c13", "tx-2024-c11", "tx-2024-c12", "tx-2025-b2", "tx-2026-c5",
  "ltv-2013-c12", "ltv-2013-c15", "ltv-2013-c18",
  "ltv-2018-c10", "ltv-2018-c13", "ltv-2019-c12", "ltv-2019-c20",
  "ltv-2020-c11", "ltv-2020-c15", "ltv-2020-c20", "ltv-2021-c8",
  "ltv-2022-c19", "ltv-2022-c20",
  "ltv-2023-c9", "ltv-2023-c17", "ltv-2023-c20",
  "ltv-2024-c14", "ltv-2024-c17", "ltv-2024-c20", "ltv-2025-c5", "ltv-2025-c12",
  "ntt-2018-c7", "ntt-2022-c8", "ntt-2023-c4", "ntt-2023-c8", "ntt-2024-c4", "ntt-2024-c6", "ntt-2024-c10",
  "ntt-2025-c1", "ntt-2025-c2", "ntt-2025-c7", "ntt-2025-c8", "ntt-2025-b3",
  "ntt-2026-c1", "ntt-2026-c6", "ntt-2026-c8", "ntt-2026-c12", "ntt-2026-c15",
  "nn-2019-c4", "nn-2022-c5",
  "ntl-2022-c11", "ntl-2022-b2", "ntl-2023-c7", "ntl-2023-c10", "ntl-2023-b2",
  "ntl-2025-c8", "ntl-2025-c9", "ntl-2025-b2",
  "nshn-2026-c8", "nshn-2026-c9", "nshn-2026-b2",
] as const;

export const IMPLEMENTED_FIGURES = new Set<string>(IMPLEMENTED_FIGURES_LIST);

export const WATERMARKS = [
  "MathExpress Education",
  "mathexpress",
  "Math Express",
  "Toán Tuổi Thơ",
];

export const RAW_MATH_PATTERNS = [
  /(?<!\$)(?<!ngày )(?<!tháng )\b(\d+)\/(\d+)\b(?!\})/,
  /(?<!\$)\b\d+[,.]?\d*\s*%(?!\$)/,
  /(?<!\$)[×÷](?!\$)/,
  /\bcm2\b|\bm2\b|\bdm2\b/i,
];

export interface QAIssue {
  type: "WATERMARK" | "FIGURE_MISSING" | "FIGURE_LIKELY" | "MATH_RAW" | "NO_ANSWER" | "SHORT_STEM";
  detail: string;
}

export interface FlaggedQ {
  id: string;
  examId: string;
  school: string;
  year: string;
  num: number;
  type: string;
  issues: QAIssue[];
  stem: string;
  figure: string | null;
  correct: string | null;
  modelAnswer: string | null;
}

export interface FigureQ {
  id: string;
  examId: string;
  school: string;
  year: string;
  num: number;
  stem: string;
  figure: string;
  implemented: boolean;
}
