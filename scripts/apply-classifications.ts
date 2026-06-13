// Apply a classification report to the DB: writes Question.answerSchema.
// Skips rows that already have a schema unless --overwrite is passed.
//
// Usage:
//   npx tsx scripts/apply-classifications.ts --in=grading-classification.json --confidence=high
//   npx tsx scripts/apply-classifications.ts --in=grading-classification.json --confidence=high,medium --dry-run
//   npx tsx scripts/apply-classifications.ts --in=grading-classification.json --confidence=high --overwrite

import fs from "fs";
import { prisma } from "../lib/prisma";
import type { AnswerSchema } from "../lib/grading/types";

interface Row {
  id: string;
  correct: string | null;
  suggestedSchema: AnswerSchema;
  confidence: "high" | "medium" | "low";
  reason: string;
  alreadyHasSchema: boolean;
}

interface Report {
  generatedAt: string;
  rows: Row[];
}

interface Args {
  inPath: string;
  confidence: Set<"high" | "medium" | "low">;
  dryRun: boolean;
  overwrite: boolean;
  limit: number | null;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  let inPath = "grading-classification.json";
  let confidence = new Set<"high" | "medium" | "low">(["high"]);
  let dryRun = false;
  let overwrite = false;
  let limit: number | null = null;

  for (const a of args) {
    if (a.startsWith("--in=")) inPath = a.slice("--in=".length);
    else if (a.startsWith("--confidence=")) {
      const parts = a.slice("--confidence=".length).split(",");
      confidence = new Set(parts as Array<"high" | "medium" | "low">);
    } else if (a === "--dry-run") dryRun = true;
    else if (a === "--overwrite") overwrite = true;
    else if (a.startsWith("--limit=")) limit = Number(a.slice("--limit=".length));
  }

  return { inPath, confidence, dryRun, overwrite, limit };
}

async function main() {
  const { inPath, confidence, dryRun, overwrite, limit } = parseArgs();

  if (!fs.existsSync(inPath)) {
    console.error(`Report not found: ${inPath}`);
    process.exit(1);
  }

  const report: Report = JSON.parse(fs.readFileSync(inPath, "utf-8"));

  const eligible = report.rows.filter((r) => {
    if (!confidence.has(r.confidence)) return false;
    if (r.alreadyHasSchema && !overwrite) return false;
    // Skip "exact" suggestions — they add no info beyond the legacy behavior.
    if (r.suggestedSchema.kind === "exact") return false;
    return true;
  });

  const target = limit !== null ? eligible.slice(0, limit) : eligible;

  console.log(`=== Apply Classifications ===`);
  console.log(`Input         : ${inPath}`);
  console.log(`Confidence    : ${[...confidence].join(", ")}`);
  console.log(`Overwrite     : ${overwrite}`);
  console.log(`Dry run       : ${dryRun}`);
  console.log(`Eligible rows : ${eligible.length}`);
  console.log(`Will write    : ${target.length}\n`);

  if (target.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  // Preview first 5
  console.log("Preview (first 5):");
  for (const r of target.slice(0, 5)) {
    console.log(`  ${r.id}: "${r.correct}" → ${JSON.stringify(r.suggestedSchema)} [${r.confidence}/${r.reason}]`);
  }
  console.log();

  if (dryRun) {
    console.log("Dry run — no DB writes performed.");
    return;
  }

  let written = 0;
  for (const r of target) {
    await prisma.question.update({
      where: { id: r.id },
      data: { answerSchema: JSON.stringify(r.suggestedSchema) },
    });
    written += 1;
    if (written % 200 === 0) console.log(`  ... ${written}/${target.length}`);
  }
  console.log(`\nDone. ${written} questions updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
