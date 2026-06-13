// Re-grade all Attempts using the new gradeAnswer() pipeline.
// Updates Attempt.score / earned / total, and TopicSession.score where applicable.
//
// Usage:
//   npx tsx scripts/regrade-attempts.ts --dry-run     # show summary, no writes
//   npx tsx scripts/regrade-attempts.ts               # apply
//   npx tsx scripts/regrade-attempts.ts --limit=10    # cap how many to update
//
// The script writes a backup JSON of pre-regrade values to ./regrade-backup-<timestamp>.json
// so changes are reversible.

import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import { gradeAnswer } from "../lib/grading";
import { parseTopicSetId } from "../lib/spawn-exam";

interface Args {
  dryRun: boolean;
  limit: number | null;
}

interface AttemptBackup {
  id: string;
  earned: number;
  total: number;
  score: number;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  let dryRun = false;
  let limit: number | null = null;
  for (const a of args) {
    if (a === "--dry-run") dryRun = true;
    else if (a.startsWith("--limit=")) limit = Number(a.slice("--limit=".length));
  }
  return { dryRun, limit };
}

function parseAnswers(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

async function main() {
  const { dryRun, limit } = parseArgs();

  const attempts = await prisma.attempt.findMany({
    where: { submitted: true },
    select: { id: true, examId: true, userId: true, answers: true, earned: true, total: true, score: true },
    orderBy: { createdAt: "asc" },
    take: limit ?? undefined,
  });

  console.log(`=== Regrade Attempts ===`);
  console.log(`Dry run    : ${dryRun}`);
  console.log(`Attempts   : ${attempts.length}`);

  if (attempts.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  // Group questions per exam to avoid N+1.
  const examIds = [...new Set(attempts.map((a) => a.examId))];
  const exams = await prisma.exam.findMany({
    where: { id: { in: examIds } },
    include: { questions: true },
  });
  const examMap = new Map(exams.map((e) => [e.id, e]));

  const backups: AttemptBackup[] = [];
  const stats = {
    unchanged: 0,
    improved: 0,
    worsened: 0,    // should be 0 — new matchers are at-least-as-lenient
    missingExam: 0,
  };
  const changes: Array<{ id: string; before: { earned: number; total: number; score: number }; after: { earned: number; total: number; score: number } }> = [];

  for (const attempt of attempts) {
    const exam = examMap.get(attempt.examId);
    if (!exam) {
      stats.missingExam += 1;
      continue;
    }

    const answers = parseAnswers(attempt.answers);
    let earned = 0;
    let total = 0;
    let correctCount = 0;

    for (const q of exam.questions) {
      total += q.points;
      const a = answers[q.id] as
        | string
        | { text?: string; drawings?: string[] }
        | null
        | undefined;
      const result = gradeAnswer(
        {
          type: q.type as "fill" | "mcq" | "essay",
          correct: q.correct,
          answerSchema: q.answerSchema,
        },
        a,
      );
      if (result.correct) {
        earned += q.points;
        correctCount += 1;
      }
    }

    const score = total > 0 ? Math.round((earned / total) * 100) : 0;

    if (earned === attempt.earned && total === attempt.total && score === attempt.score) {
      stats.unchanged += 1;
      continue;
    }

    if (earned > attempt.earned) stats.improved += 1;
    else if (earned < attempt.earned) stats.worsened += 1;

    backups.push({ id: attempt.id, earned: attempt.earned, total: attempt.total, score: attempt.score });
    changes.push({
      id: attempt.id,
      before: { earned: attempt.earned, total: attempt.total, score: attempt.score },
      after: { earned, total, score },
    });

    if (!dryRun) {
      await prisma.attempt.update({
        where: { id: attempt.id },
        data: { earned, total, score },
      });

      // Mirror to TopicSession when this attempt is a topic-set spawn.
      const topicSet = parseTopicSetId(attempt.examId);
      if (topicSet) {
        await prisma.topicSession.updateMany({
          where: { userId: attempt.userId, setId: attempt.examId },
          data: { score: correctCount },
        });
      }
    }
  }

  // Write backup file (so dry-run also produces a record of "would have changed").
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.resolve(`regrade-backup-${ts}.json`);
  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      { ranAt: new Date().toISOString(), dryRun, stats, changes, backups },
      null,
      2,
    ),
  );

  console.log(`\nResults:`);
  console.log(`  unchanged    : ${stats.unchanged}`);
  console.log(`  improved     : ${stats.improved}`);
  console.log(`  worsened     : ${stats.worsened}`);
  console.log(`  missingExam  : ${stats.missingExam}`);
  console.log(`\nBackup written : ${backupPath}`);

  if (changes.length > 0 && changes.length <= 10) {
    console.log(`\nChanges:`);
    for (const c of changes) {
      console.log(`  ${c.id}: ${c.before.earned}/${c.before.total} (${c.before.score}%) → ${c.after.earned}/${c.after.total} (${c.after.score}%)`);
    }
  } else if (changes.length > 10) {
    console.log(`\nFirst 10 changes:`);
    for (const c of changes.slice(0, 10)) {
      console.log(`  ${c.id}: ${c.before.earned}/${c.before.total} (${c.before.score}%) → ${c.after.earned}/${c.after.total} (${c.after.score}%)`);
    }
    console.log(`  ... ${changes.length - 10} more (see backup file)`);
  }

  if (dryRun) console.log(`\nDry run — no DB writes performed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
