/**
 * scripts/audit-questions.ts
 *
 * Scans ALL questions in the DB and flags potential issues:
 *   1. WATERMARK   — stem contains known watermark strings
 *   2. FIGURE_MISSING — figure field set but ID not implemented in ExamFigure.tsx
 *   3. MATH_RAW    — likely unformatted math (fractions x/y, %, formulas without $)
 *   4. NO_ANSWER   — correct is null/empty
 *   5. SHORT_STEM  — stem suspiciously short (< 10 chars, possible parse failure)
 *
 * Usage:
 *   npx tsx scripts/audit-questions.ts              # all schools
 *   npx tsx scripts/audit-questions.ts --school tx  # one school
 *   npx tsx scripts/audit-questions.ts --json       # output JSON for admin UI
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Known watermark strings ─────────────────────────────────────────────────
const WATERMARKS = [
  "MathExpress Education",
  "mathexpress",
  "Math Express",
  "Toán Tuổi Thơ",
  "violympic",
  "Violympic",
];

// ─── Figure IDs already implemented in ExamFigure.tsx ─────────────────────────
const IMPLEMENTED_FIGURES = new Set([
  "cg-2020-c5", "cg-2020-c8", "cg-2022-c8", "cg-2023-c7", "cg-2023-c8",
  "cg-2024-c5", "cg-2024-c7", "cg-2026-c7", "cg-2026-c8",
  "tx-2019-c9", "tx-2021-c8", "tx-2022-c3", "tx-2023-c13", "tx-2024-c11", "tx-2024-c12", "tx-2025-b2", "tx-2026-c5",
  "ltv-2013-c12", "ltv-2013-c15", "ltv-2013-c18",
  "ltv-2018-c10", "ltv-2018-c13", "ltv-2019-c12", "ltv-2019-c20",
  "ltv-2020-c11", "ltv-2020-c15", "ltv-2020-c20", "ltv-2021-c8",
  "ltv-2022-c19", "ltv-2022-c20",
  "ltv-2023-c9", "ltv-2023-c17", "ltv-2023-c20",
  "ltv-2024-c14", "ltv-2024-c17", "ltv-2024-c20", "ltv-2025-c5", "ltv-2025-c12",
  "ntt-2018-c7", "ntt-2022-c8", "ntt-2024-c4", "ntt-2024-c6", "ntt-2024-c10",
  "ntt-2025-c1", "ntt-2025-c2", "ntt-2025-c7", "ntt-2025-c8", "ntt-2025-b3",
  "ntt-2026-c1", "ntt-2026-c6", "ntt-2026-c8", "ntt-2026-c12", "ntt-2026-c15",
  "nn-2019-c4", "nn-2022-c5",
  "ntl-2022-c11", "ntl-2022-b2", "ntl-2023-c7", "ntl-2023-c10", "ntl-2023-b2",
  "ntl-2025-c8", "ntl-2025-c9", "ntl-2025-b2",
  "nshn-2026-c8", "nshn-2026-c9", "nshn-2026-b2",
  "nshn-2021-c5", "nshn-2021-c9", "nshn-2021-c10",
  "nshn-2022-c7", "nshn-2022-c9",
]);

// ─── Heuristics for unformatted math ─────────────────────────────────────────
const RAW_MATH_PATTERNS = [
  // Fraction a/b NOT wrapped in $ (not a date, not already in LaTeX)
  /(?<!\$)(?<!ngày )(?<!tháng )\b(\d+)\/(\d+)\b(?!\})/,
  // % not wrapped
  /(?<!\$)\b\d+[,.]?\d*\s*%(?!\$)/,
  // × or ÷ not wrapped in $
  /(?<!\$)[×÷](?!\$)/,
  // Superscript written as ^2, ^3 outside $
  /\^[23]/,
  // cm2 or m2 (missing ²)
  /\bcm2\b|\bm2\b|\bdm2\b/i,
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface Issue {
  type: "WATERMARK" | "FIGURE_MISSING" | "FIGURE_LIKELY" | "MATH_RAW" | "NO_ANSWER" | "SHORT_STEM";
  detail: string;
}

interface FlaggedQuestion {
  examId: string;
  school: string;
  year: string;
  num: number;
  type: string;
  issues: Issue[];
  stem: string;
  figure: string | null;
  correct: string | null;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const schoolFilter = args.includes("--school") ? args[args.indexOf("--school") + 1] : null;
  const jsonOutput = args.includes("--json");

  // Load all questions with exam info
  const questions = await prisma.question.findMany({
    include: { exam: { select: { school: true, year: true } } },
    orderBy: [{ examId: "asc" }, { num: "asc" }],
  });

  const filtered = schoolFilter
    ? questions.filter((q) => q.exam?.school === schoolFilter)
    : questions;

  const flagged: FlaggedQuestion[] = [];

  for (const q of filtered) {
    const issues: Issue[] = [];
    const stem = q.stem ?? "";

    // 1. WATERMARK
    for (const wm of WATERMARKS) {
      if (stem.toLowerCase().includes(wm.toLowerCase())) {
        issues.push({ type: "WATERMARK", detail: `Contains "${wm}"` });
        break;
      }
    }

    // 2. FIGURE_MISSING
    if (q.figure && !IMPLEMENTED_FIGURES.has(q.figure)) {
      issues.push({ type: "FIGURE_MISSING", detail: `Figure "${q.figure}" not implemented in ExamFigure.tsx` });
    }

    // 2.5 FIGURE_LIKELY
    if (!q.figure) {
      const FIGURE_LIKELY_KEYWORDS = ["hình", "biểu đồ", "quỹ đạo", "đồ thị", "sơ đồ", "bản đồ"];
      const lowerStem = stem.toLowerCase();
      const matchedKeyword = FIGURE_LIKELY_KEYWORDS.find((kw) => lowerStem.includes(kw));
      if (matchedKeyword) {
        issues.push({ type: "FIGURE_LIKELY", detail: `Stem contains keyword "${matchedKeyword}" but figure field is empty` });
      }
    }

    // 3. MATH_RAW (only check stem & modelAnswer)
    const mathText = stem + " " + (q.modelAnswer ?? "");
    // Skip if already has LaTeX (many $ signs = likely formatted)
    const dollarCount = (mathText.match(/\$/g) ?? []).length;
    if (dollarCount < 2) {
      // No LaTeX at all — check for raw math patterns
      for (const pattern of RAW_MATH_PATTERNS) {
        if (pattern.test(mathText)) {
          issues.push({ type: "MATH_RAW", detail: `Raw math detected: ${pattern.source.slice(0, 40)}` });
          break;
        }
      }
    }

    // 4. NO_ANSWER (MCQ and fill should have correct)
    if ((q.type === "mcq" || q.type === "fill") && (!q.correct || q.correct.trim() === "")) {
      issues.push({ type: "NO_ANSWER", detail: "No correct answer set" });
    }

    // 5. SHORT_STEM
    if (stem.trim().length < 10) {
      issues.push({ type: "SHORT_STEM", detail: `Stem very short: "${stem.trim()}"` });
    }

    if (issues.length > 0) {
      flagged.push({
        examId: q.examId ?? "?",
        school: q.exam?.school ?? "?",
        year: q.exam?.year ?? "?",
        num: q.num,
        type: q.type,
        issues,
        stem: stem.slice(0, 120) + (stem.length > 120 ? "…" : ""),
        figure: q.figure,
        correct: q.correct,
      });
    }
  }

  if (jsonOutput) {
    // Write JSON for admin UI consumption
    const outPath = "scripts/audit-results.json";
    const fs = await import("fs");
    fs.writeFileSync(outPath, JSON.stringify(flagged, null, 2), "utf-8");
    console.log(`✓ Wrote ${flagged.length} flagged questions to ${outPath}`);
    return;
  }

  // ─── Human-readable report ───────────────────────────────────────────────
  const totalScanned = filtered.length;
  const totalFlagged = flagged.length;

  // Group by exam
  const byExam = new Map<string, FlaggedQuestion[]>();
  for (const fq of flagged) {
    const key = fq.examId;
    if (!byExam.has(key)) byExam.set(key, []);
    byExam.get(key)!.push(fq);
  }

  // Group by issue type
  const issueCount: Record<string, number> = {};
  for (const fq of flagged) {
    for (const issue of fq.issues) {
      issueCount[issue.type] = (issueCount[issue.type] ?? 0) + 1;
    }
  }

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║          AUDIT REPORT — Exam Questions                  ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
  console.log(`Scanned : ${totalScanned} questions`);
  console.log(`Flagged : ${totalFlagged} questions\n`);

  console.log("Issue breakdown:");
  for (const [type, count] of Object.entries(issueCount)) {
    const icon = { WATERMARK: "⚠️ ", FIGURE_MISSING: "🖼️ ", MATH_RAW: "📐", NO_ANSWER: "❌", SHORT_STEM: "⚡" }[type] ?? "•";
    console.log(`  ${icon}  ${type.padEnd(16)} ${count} câu`);
  }

  console.log("\n─── Details by exam ───────────────────────────────────────\n");

  for (const [examId, qs] of Array.from(byExam.entries()).sort()) {
    const school = qs[0].school.toUpperCase();
    const year = qs[0].year;
    console.log(`📋 ${examId} [${school} · ${year}] — ${qs.length} vấn đề`);
    for (const q of qs) {
      const issueLabels = q.issues.map((i) => i.type).join(", ");
      console.log(`   C${String(q.num).padEnd(3)} (${q.type.padEnd(5)}) [${issueLabels}]`);
      console.log(`          Stem: ${q.stem}`);
      if (q.figure) console.log(`          Figure: ${q.figure}`);
    }
    console.log();
  }

  console.log("══════════════════════════════════════════════════════════\n");
  console.log(`💡 Tip: Run with --json to export for the admin QA page`);
  console.log(`       npx tsx scripts/audit-questions.ts --json\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
