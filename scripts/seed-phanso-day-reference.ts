/**
 * Seed the "Dãy phân số — tách thành hiệu (khử liên tiếp)" problems as
 * standalone bank questions for chuyên đề Phân số / Tỉ số (topic "phan").
 *
 * These are BANK questions (examId = null) — they feed topic practice via
 * spawnTopicSetExam() with sourceFilter "supplement" or "all". They are NOT
 * tied to any exam and do not appear in any exam list.
 *
 * Source content: scripts/phanso-day-problems.ts (shared with the mika "Bài
 * thầy giao"). All answers verified by hand via the telescoping method.
 *
 * Grading: fraction answers ("a/b") → answerSchema left null so the fill grader
 * uses matchExact (a numeric schema would be wrong: 100/101 has no clean decimal).
 *
 * Idempotent: deletes existing rows with the same SOURCE_TAG before inserting,
 * so re-running never duplicates. Run with:
 *   npx tsx scripts/seed-phanso-day-reference.ts
 */

import { PrismaClient } from "@prisma/client";
import { PHANSO_DAY_PROBLEMS } from "./phanso-day-problems";

const prisma = new PrismaClient();

const TOPIC = "phan";
const GRADE = "NC"; // dãy phân số khử liên tiếp là nội dung nâng cao
const SOURCE_TAG = "Hệ thống · Dãy phân số";
const PLACEHOLDER = "VD: 9/10";

async function main() {
  console.log(`=== Seeding ${PHANSO_DAY_PROBLEMS.length} reference 'phan' bank questions (dãy phân số) ===`);

  // Idempotency: remove previously-seeded rows from this source (standalone only).
  const del = await prisma.question.deleteMany({
    where: { examId: null, topic: TOPIC, source: SOURCE_TAG },
  });
  if (del.count > 0) console.log(`  cleared ${del.count} existing rows (re-seed)`);

  for (const p of PHANSO_DAY_PROBLEMS) {
    await prisma.question.create({
      data: {
        examId: null,
        num: p.num,
        type: "fill",
        topic: TOPIC,
        grade: GRADE,
        points: 1,
        stem: p.stem,
        options: "[]",
        correct: p.answer,
        answerSchema: null, // fraction → matchExact fallback
        unit: null,
        placeholder: PLACEHOLDER,
        modelAnswer: p.modelAnswer,
        figure: null,
        source: SOURCE_TAG,
        active: true,
      },
    });
    console.log(`  ✓ Bài ${p.num} (nhóm ${p.group}) → ${p.answer}`);
  }

  const count = await prisma.question.count({
    where: { examId: null, topic: TOPIC, source: SOURCE_TAG },
  });
  console.log(`\n✓ Done. Bank 'phan' standalone (${SOURCE_TAG}): ${count} câu.`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
