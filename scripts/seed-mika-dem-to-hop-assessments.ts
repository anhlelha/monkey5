/**
 * Seed the reviewed V4 assessments for Mika's 20-question counting set.
 *
 * Difficulty D1-D5 is authoritative from the source HTML. The remaining V4
 * dimensions are mapped independently from the section intent and solution
 * method, so cognitive level is not treated as another name for difficulty.
 *
 * Idempotent and immutable per source run: existing identical rows are kept;
 * a changed question or changed assessment requires a new run id.
 */

import { prisma } from "../lib/prisma";
import { questionContentHash, stableHash } from "../lib/readiness-v4/hashing";
import { sameImmutableAssessment } from "../lib/readiness-v4/assessment-artifact-contract";

const OWNER_EMAIL = "mikayeubo@gmail.com";
const TAXONOMY_VERSION = "math-topic-taxonomy-v1";
const RUN_ID = "mika-dem-to-hop-d1-d5-html-reviewed-20260828";
const MODEL = "source-html+human-review";
const ASSESSED_AT = new Date("2026-08-28T10:15:00.000Z");

type CognitiveLevel = "co_ban" | "van_dung" | "nang_cao" | "chuyen_sau";
type ReasoningType = "direct" | "multi_step" | "non_routine" | "proof_or_modeling";

interface Plan {
  globalNum: number;
  difficultyBand: 1 | 2 | 3 | 4 | 5;
  cognitiveLevel: CognitiveLevel;
  reasoningType: ReasoningType;
  topicSecondary: string[];
}

const SECONDARY_NUM_DIV = new Set([2, 5, 9, 15, 18]);

const PLANS: Plan[] = Array.from({ length: 20 }, (_, index) => {
  const globalNum = index + 1;
  const difficultyBand = (globalNum <= 4 ? 1 : globalNum <= 8 ? 2 : globalNum <= 12 ? 3 : globalNum <= 16 ? 4 : 5) as Plan["difficultyBand"];
  const cognitiveLevel: CognitiveLevel = difficultyBand <= 2
    ? "co_ban"
    : difficultyBand === 3
      ? "van_dung"
      : difficultyBand === 4
        ? "nang_cao"
        : "chuyen_sau";
  const reasoningType: ReasoningType = difficultyBand === 1
    ? "direct"
    : difficultyBand <= 3
      ? "multi_step"
      : "non_routine";
  return {
    globalNum,
    difficultyBand,
    cognitiveLevel,
    reasoningType,
    topicSecondary: SECONDARY_NUM_DIV.has(globalNum) ? ["num_div"] : [],
  };
});

function location(globalNum: number): { key: string; num: number } {
  if (globalNum <= 7) return { key: "dem-to-hop-d1-d5-phan-1", num: globalNum };
  if (globalNum <= 14) return { key: "dem-to-hop-d1-d5-phan-2", num: globalNum - 7 };
  return { key: "dem-to-hop-d1-d5-phan-3", num: globalNum - 14 };
}

async function main(): Promise<void> {
  const owner = await prisma.user.findUnique({ where: { email: OWNER_EMAIL }, select: { id: true } });
  if (!owner) throw new Error(`Missing owner ${OWNER_EMAIL}; run seed-remedial-mika.ts first.`);

  const admin = await prisma.user.findFirst({
    where: { role: "admin", disabled: false },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!admin) throw new Error("No active admin available to approve the assessment run.");

  const examIds = [1, 2, 3].map((part) => `rmd-${owner.id}-dem-to-hop-d1-d5-phan-${part}`);
  const questions = await prisma.question.findMany({
    where: { examId: { in: examIds } },
    select: {
      id: true,
      examId: true,
      num: true,
      subject: true,
      type: true,
      stem: true,
      options: true,
      correct: true,
      answerSchema: true,
      points: true,
      figure: true,
    },
  });
  if (questions.length !== 20) throw new Error(`Expected 20 questions, found ${questions.length}.`);

  const byLocation = new Map(questions.map((question) => [`${question.examId}:${question.num}`, question]));
  const candidates = PLANS.map((plan) => {
    const target = location(plan.globalNum);
    const examId = `rmd-${owner.id}-${target.key}`;
    const question = byLocation.get(`${examId}:${target.num}`);
    if (!question) throw new Error(`Missing question ${plan.globalNum} at ${examId}#${target.num}.`);
    return {
      questionId: question.id,
      subject: "math",
      taxonomyVersion: TAXONOMY_VERSION,
      topicPrimary: "counting_combinatorics",
      topicSecondaryJson: JSON.stringify(plan.topicSecondary),
      difficultyBand: plan.difficultyBand,
      cognitiveLevel: plan.cognitiveLevel,
      reasoningType: plan.reasoningType,
      confidence: 99,
      model: MODEL,
      sourceRunId: RUN_ID,
      questionContentHash: questionContentHash(question),
      assessedAt: ASSESSED_AT,
    };
  });
  const inputHash = stableHash(candidates.map(({ questionId, questionContentHash, difficultyBand, cognitiveLevel, reasoningType, topicSecondaryJson }) => ({
    questionId,
    questionContentHash,
    difficultyBand,
    cognitiveLevel,
    reasoningType,
    topicSecondaryJson,
  })));

  const existing = await prisma.questionAssessment.findMany({
    where: { sourceRunId: RUN_ID, taxonomyVersion: TAXONOMY_VERSION },
  });
  const existingByQuestion = new Map(existing.map((row) => [row.questionId, row]));
  let created = 0;
  let unchanged = 0;

  await prisma.$transaction(async (tx) => {
    await tx.assessmentRun.upsert({
      where: { id: RUN_ID },
      create: {
        id: RUN_ID,
        subject: "math",
        taxonomyVersion: TAXONOMY_VERSION,
        model: MODEL,
        status: "approved",
        artifactPath: ".analysis/math-reassessment-fresh-gpt56sol-20260824T120947Z/de-dem-to-hop-d1-d5-so-01.html",
        inputHash,
        metadataJson: JSON.stringify({
          source: "HTML section labels reviewed by user",
          difficultyMapping: { "1-4": 1, "5-8": 2, "9-12": 3, "13-16": 4, "17-20": 5 },
          totalQuestions: 20,
        }),
        approvedByUserId: admin.id,
        approvedAt: ASSESSED_AT,
      },
      update: {},
    });

    for (const candidate of candidates) {
      const row = existingByQuestion.get(candidate.questionId);
      if (row) {
        if (!sameImmutableAssessment(row, candidate)) {
          throw new Error(`Immutable assessment conflict for ${candidate.questionId}; create a new run id.`);
        }
        unchanged += 1;
      } else {
        await tx.questionAssessment.create({ data: candidate });
        created += 1;
      }
    }
  });

  console.log(`✓ ${RUN_ID}: created=${created}, unchanged=${unchanged}, total=${candidates.length}`);
  console.log("  D1=4, D2=4, D3=4, D4=4, D5=4 · topic=counting_combinatorics");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
