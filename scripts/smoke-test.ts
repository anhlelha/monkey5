// End-to-end smoke test for Phase 1-5 changes — runs the data-layer flow
// without the auth/HTTP layer. Creates a test user, spawns both a reference
// exam and a topic-set exam, simulates submitting them via the same logic the
// server action uses, then reads the history shapes back.
//
// Run with: npx tsx scripts/smoke-test.ts

import { prisma } from "../lib/prisma";
import { spawnReferenceExam, spawnTopicSetExam, parseTopicSetId } from "../lib/spawn-exam";
import { getExamHistory, getTopicSessions } from "../lib/user-data";

const TEST_EMAIL = "smoke-test@local";

async function ensureUser(): Promise<string> {
  const u = await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    create: { email: TEST_EMAIL, name: "Smoke Tester", role: "student" },
    update: {},
  });
  return u.id;
}

interface SubmitArgs {
  userId: string;
  examId: string;
  // Map of questionId → answer. Empty map = all wrong.
  answers: Record<string, string>;
}

// Mirror of the production submitExam logic (sans auth + revalidatePath).
async function fakeSubmit({ userId, examId, answers }: SubmitArgs) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: true },
  });
  if (!exam) throw new Error("Exam not found");

  let earned = 0;
  let total = 0;
  let correctCount = 0;
  for (const q of exam.questions) {
    total += q.points;
    const a = answers[q.id];
    if (a !== undefined && a === q.correct) {
      earned += q.points;
      correctCount += 1;
    }
  }
  const score = total > 0 ? Math.round((earned / total) * 100) : 0;

  const attempt = await prisma.attempt.create({
    data: {
      userId,
      examId,
      answers: JSON.stringify(answers),
      earned,
      total,
      score,
      durationSec: 60,
      submitted: true,
    },
  });

  const topicSet = parseTopicSetId(examId);
  if (topicSet) {
    await prisma.topicSession.create({
      data: {
        userId,
        topic: topicSet.topic,
        level: topicSet.level,
        qcount: exam.questions.length,
        score: correctCount,
        setId: examId,
      },
    });
  }

  return { attemptId: attempt.id, score, correctCount, total };
}

const must = (cond: unknown, msg: string): void => {
  if (!cond) {
    console.error(`✗ ${msg}`);
    process.exit(1);
  }
  console.log(`✓ ${msg}`);
};

async function main() {
  console.log("=== Smoke test: Phase 1-5 data layer ===\n");
  const userId = await ensureUser();

  // Clean prior runs so the test is deterministic.
  await prisma.topicSession.deleteMany({ where: { userId } });
  await prisma.attempt.deleteMany({ where: { userId } });
  // Remove any prior spawned exams for this user (cleanest: by prefix).
  const priorSpawns = await prisma.exam.findMany({
    where: { OR: [{ id: { startsWith: "ref-" } }, { id: { startsWith: "set-" } }], generated: true },
    select: { id: true },
  });
  if (priorSpawns.length > 0) {
    const ids = priorSpawns.map((e) => e.id);
    await prisma.question.deleteMany({ where: { examId: { in: ids } } });
    await prisma.exam.deleteMany({ where: { id: { in: ids } } });
  }

  // 1. Spawn a CG-style reference exam
  console.log("\n[1] spawnReferenceExam('cg')");
  const refId = await spawnReferenceExam("cg");
  must(refId.startsWith("ref-cg-"), `refId has correct prefix: ${refId}`);
  const refExam = await prisma.exam.findUnique({ where: { id: refId }, include: { questions: true } });
  must(refExam !== null, "reference exam row created");
  must(refExam!.kind === "reference", `kind = reference (got: ${refExam!.kind})`);
  must(refExam!.school === "cg", `school = cg (got: ${refExam!.school})`);
  console.log(`  → qcount: ${refExam!.questions.length}`);

  // 2. Submit it with all wrong answers
  console.log("\n[2] fakeSubmit reference exam (all wrong)");
  const refSubmit = await fakeSubmit({ userId, examId: refId, answers: {} });
  must(refSubmit.score === 0, `score = 0 (got: ${refSubmit.score})`);
  must(refSubmit.attemptId.length > 0, "attempt row written");

  // 3. Spawn a topic-set exam
  console.log("\n[3] spawnTopicSetExam('phan', 'L5')");
  const setId = await spawnTopicSetExam("phan", "L5", userId);
  must(setId.startsWith("set-phan-l5-"), `setId has correct prefix: ${setId}`);
  const setExam = await prisma.exam.findUnique({ where: { id: setId }, include: { questions: true } });
  must(setExam !== null, "topic-set exam row created");
  console.log(`  → qcount: ${setExam!.questions.length}, note: "${setExam!.note}"`);

  // 4. Submit topic-set with one correct
  console.log("\n[4] fakeSubmit topic-set (force one correct)");
  const firstQ = setExam!.questions[0];
  const answers: Record<string, string> = firstQ?.correct ? { [firstQ.id]: firstQ.correct } : {};
  const setSubmit = await fakeSubmit({ userId, examId: setId, answers });
  must(setSubmit.attemptId.length > 0, "attempt row written");
  if (firstQ?.correct) {
    must(setSubmit.correctCount === 1, `correctCount = 1 (got: ${setSubmit.correctCount})`);
  } else {
    console.log("  · skipped correctCount assertion (no Question.correct seeded)");
  }

  // 5. TopicSession row created with right shape
  console.log("\n[5] TopicSession row written");
  const sessions = await prisma.topicSession.findMany({ where: { userId, topic: "phan" } });
  must(sessions.length === 1, `1 topic session for 'phan' (got: ${sessions.length})`);
  must(sessions[0].level === "L5", `level = L5 (got: ${sessions[0].level})`);
  must(sessions[0].setId === setId, "setId stored");

  // 6. getExamHistory shape
  console.log("\n[6] getExamHistory shape");
  const history = await getExamHistory(userId);
  must(history.length === 2, `2 entries in history (got: ${history.length})`);
  must(history.every((h) => typeof h.when === "string" && h.when.length > 0), "all entries have Vietnamese 'when' label");
  must(history.every((h) => /^\d{2}\/\d{2}\/\d{4}$/.test(h.when_full)), "all entries have dd/mm/yyyy when_full");

  // 7. getTopicSessions resolves attemptId
  console.log("\n[7] getTopicSessions resolves attemptId");
  const phan = await getTopicSessions(userId, "phan");
  must(phan.length === 1, `1 session for 'phan' (got: ${phan.length})`);
  must(phan[0].examId === setId, "examId stored on TopicSessionItem");
  must(phan[0].attemptId !== null, `attemptId resolved (got: ${phan[0].attemptId})`);

  // 8. Empty topic returns []
  console.log("\n[8] getTopicSessions empty case");
  const empty = await getTopicSessions(userId, "tg");
  must(empty.length === 0, "no sessions for 'tg'");

  console.log("\n=== All smoke checks passed ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
