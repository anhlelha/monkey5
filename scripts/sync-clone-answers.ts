// Re-sync spawned clone questions from their source bank questions.
//
// WHY: `seed-all-exams.ts` only deleteMany/re-inserts questions whose examId is in
// official_exams_metadata.json. Practice-set clones (examId `set-*` / `ref-*`) are
// NEVER touched by the seed, so when we correct a bank question's `correct` /
// `modelAnswer` / `answerSchema`, every clone made before the fix keeps the stale
// values — silently mis-grading attempts (see CLAUDE.md pitfall #5).
//
// Clones carry `sourceQuestionId` pointing back to the original bank row. This
// script walks every clone and, when its answer-bearing fields drift from the
// source, rewrites them. Run it after any answer/explanation correction (and it
// is wired into deploy-full.sh after SEED).
//
// Usage:
//   npx tsx scripts/sync-clone-answers.ts --dry-run   # show what would change
//   npx tsx scripts/sync-clone-answers.ts             # apply
//
// After applying, run scripts/regrade-attempts.ts so frozen Attempt scores update.

import { prisma } from "../lib/prisma";
import { classifyAnswer } from "../lib/grading/classify";

// Mirror of resolveAnswerSchema in lib/spawn-exam.ts (kept local to avoid widening
// that module's public surface). Returns the schema JSON a clone *should* hold.
function resolveAnswerSchema(
  type: string,
  correct: string | null,
  existing: string | null,
): string | null {
  if (type !== "fill" || !correct) return existing ?? null;
  const cls = classifyAnswer(correct);
  if (cls.confidence === "low") return existing ?? null;
  if (cls.schema.kind === "exact") return existing ?? null;
  return JSON.stringify(cls.schema);
}

function parseArgs(): { dryRun: boolean } {
  return { dryRun: process.argv.slice(2).includes("--dry-run") };
}

async function main() {
  const { dryRun } = parseArgs();
  console.log(`=== Sync clone answers ===`);
  console.log(`Dry run : ${dryRun}`);

  const clones = await prisma.question.findMany({
    where: { sourceQuestionId: { not: null } },
    select: {
      id: true,
      examId: true,
      type: true,
      correct: true,
      modelAnswer: true,
      answerSchema: true,
      sourceQuestionId: true,
    },
  });
  console.log(`Clones found : ${clones.length}`);

  // Batch-load the distinct source rows.
  const sourceIds = Array.from(new Set(clones.map((c) => c.sourceQuestionId!).filter(Boolean)));
  const sources = await prisma.question.findMany({
    where: { id: { in: sourceIds } },
    select: { id: true, type: true, correct: true, modelAnswer: true, answerSchema: true },
  });
  const sourceById = new Map(sources.map((s) => [s.id, s]));

  let updated = 0;
  let orphaned = 0;
  const touchedExamIds = new Set<string>();

  for (const c of clones) {
    const src = sourceById.get(c.sourceQuestionId!);
    if (!src) {
      orphaned++;
      continue; // source deleted; leave clone as-is
    }

    const wantCorrect = src.correct;
    const wantModelAnswer = src.modelAnswer;
    // Prefer the source's stored schema; fall back to live classification of the
    // (corrected) answer so the clone is always gradable.
    const wantSchema = resolveAnswerSchema(c.type, wantCorrect, src.answerSchema);

    const drift =
      c.correct !== wantCorrect ||
      c.modelAnswer !== wantModelAnswer ||
      c.answerSchema !== wantSchema;

    if (!drift) continue;

    console.log(
      `  ${c.examId} / ${c.id}\n` +
        `    correct     : ${JSON.stringify(c.correct)} → ${JSON.stringify(wantCorrect)}\n` +
        `    answerSchema: ${JSON.stringify(c.answerSchema)} → ${JSON.stringify(wantSchema)}`,
    );

    if (!dryRun) {
      await prisma.question.update({
        where: { id: c.id },
        data: { correct: wantCorrect, modelAnswer: wantModelAnswer, answerSchema: wantSchema },
      });
    }
    updated++;
    if (c.examId) touchedExamIds.add(c.examId);
  }

  console.log(`\nResults:`);
  console.log(`  drifted/updated : ${updated}`);
  console.log(`  orphaned (no src): ${orphaned}`);
  console.log(`  exams touched    : ${touchedExamIds.size}`);
  if (dryRun) console.log(`\nDry run — no DB writes performed.`);
  else if (updated > 0)
    console.log(`\nNext: run scripts/regrade-attempts.ts to refresh frozen Attempt scores.`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
