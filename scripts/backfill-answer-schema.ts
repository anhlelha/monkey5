// Backfill Question.answerSchema for fill rows still missing it.
//
// Why: lib/spawn-exam.ts used to clone questions without carrying over
// answerSchema. Existing spawned exams (set-*, ref-*, CUID examIds) ended up
// with null schemas, so a question whose correct="x = 4" silently fell back
// to matchExact and rejected the user's "4".
//
// What this does: for each fill row whose answerSchema is null, run
// classifyAnswer(correct). If the classifier returns a non-exact, non-low
// schema, write it. Text-only rows ("Siêu thị", "Chủ nhật", …) stay null on
// purpose — those are designed for the matchExact fallback.

import { prisma } from "../lib/prisma";
import { classifyAnswer } from "../lib/grading/classify";

async function main() {
  const candidates = await prisma.question.findMany({
    where: { type: "fill", correct: { not: null }, answerSchema: null },
    select: { id: true, examId: true, correct: true },
  });

  let updated = 0;
  let skippedLow = 0;
  let skippedExact = 0;

  for (const q of candidates) {
    const cls = classifyAnswer(q.correct ?? "");
    if (cls.confidence === "low") {
      skippedLow++;
      continue;
    }
    if (cls.schema.kind === "exact") {
      skippedExact++;
      continue;
    }
    await prisma.question.update({
      where: { id: q.id },
      data: { answerSchema: JSON.stringify(cls.schema) },
    });
    console.log(
      `✓ ${q.id} (${q.examId})  correct=${JSON.stringify(q.correct)}  -> ${cls.schema.kind} (${cls.reason})`,
    );
    updated++;
  }

  console.log(
    `\nTổng: ${candidates.length} câu fill thiếu schema. Updated=${updated}, skip(low)=${skippedLow}, skip(exact)=${skippedExact}.`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
