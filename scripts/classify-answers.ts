// Dry-run classifier: scans all Questions, suggests an AnswerSchema for each.
// Writes a JSON report. Does NOT write to DB — use scripts/apply-classifications.ts.
//
// Usage: npx tsx scripts/classify-answers.ts [--out=path]

import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import { classifyAnswer } from "../lib/grading/classify";
import type { AnswerSchema } from "../lib/grading/types";

interface RowReport {
  id: string;
  examId: string | null;
  type: string;
  correct: string | null;
  suggestedSchema: AnswerSchema;
  confidence: "high" | "medium" | "low";
  reason: string;
  alreadyHasSchema: boolean;
}

interface Summary {
  total: number;
  byType: Record<string, number>;
  byConfidence: Record<"high" | "medium" | "low", number>;
  alreadyClassified: number;
  skippedNonFill: number;
}

function parseArgs(): { outPath: string } {
  const args = process.argv.slice(2);
  let outPath = "grading-classification.json";
  for (const a of args) {
    if (a.startsWith("--out=")) outPath = a.slice("--out=".length);
  }
  return { outPath };
}

async function main() {
  const { outPath } = parseArgs();

  const questions = await prisma.question.findMany({
    select: {
      id: true,
      examId: true,
      type: true,
      correct: true,
      answerSchema: true,
    },
  });

  const rows: RowReport[] = [];
  const summary: Summary = {
    total: questions.length,
    byType: {},
    byConfidence: { high: 0, medium: 0, low: 0 },
    alreadyClassified: 0,
    skippedNonFill: 0,
  };

  for (const q of questions) {
    summary.byType[q.type] = (summary.byType[q.type] ?? 0) + 1;

    // MCQ doesn't need a schema — exact ID match.
    if (q.type !== "fill") {
      summary.skippedNonFill += 1;
      continue;
    }

    const { schema, confidence, reason } = classifyAnswer(q.correct);
    summary.byConfidence[confidence] += 1;
    if (q.answerSchema) summary.alreadyClassified += 1;

    rows.push({
      id: q.id,
      examId: q.examId,
      type: q.type,
      correct: q.correct,
      suggestedSchema: schema,
      confidence,
      reason,
      alreadyHasSchema: q.answerSchema !== null,
    });
  }

  const output = {
    generatedAt: new Date().toISOString(),
    summary,
    rows,
  };

  fs.writeFileSync(path.resolve(outPath), JSON.stringify(output, null, 2));

  console.log("=== Classification Summary ===");
  console.log(`Total questions: ${summary.total}`);
  console.log(`  by type:`, summary.byType);
  console.log(`  skipped (non-fill): ${summary.skippedNonFill}`);
  console.log(`  already classified: ${summary.alreadyClassified}`);
  console.log(`Fill questions classified:`);
  console.log(`  high   : ${summary.byConfidence.high}`);
  console.log(`  medium : ${summary.byConfidence.medium}`);
  console.log(`  low    : ${summary.byConfidence.low}`);
  console.log(`\nReport written to: ${outPath}`);
  console.log(`Next: review the report, then run`);
  console.log(`  npx tsx scripts/apply-classifications.ts --in=${outPath} --confidence=high`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
