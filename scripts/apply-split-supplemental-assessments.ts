/**
 * Apply the user-reviewed V4 assessments for the atomic questions split from
 * four bundled 4B0 supplemental worksheet rows.
 *
 * Run after seed-supplemental.ts. Idempotent and immutable per assessment run.
 */

import { prisma } from "../lib/prisma";
import { sameImmutableAssessment } from "../lib/readiness-v4/assessment-artifact-contract";
import { questionContentHash, stableHash } from "../lib/readiness-v4/hashing";

const TAXONOMY_VERSION = "math-topic-taxonomy-v1";
const RUN_ID = "supplemental-atomic-split-human-reviewed-20260905";
const MODEL = "source-content+human-review";
const ASSESSED_AT = new Date("2026-09-05T02:00:00.000Z");
const RETIRED_IDS = [
  "supp-4b0-w21-q11",
  "supp-4b0-w23-q11",
  "supp-4b0-w24-qb1",
  "supp-4b0-w25-qb1",
];

type CognitiveLevel = "co_ban" | "van_dung" | "nang_cao" | "chuyen_sau";
type ReasoningType = "direct" | "multi_step" | "non_routine" | "proof_or_modeling";

interface Plan {
  questionId: string;
  topicPrimary: string;
  topicSecondary: string[];
  difficultyBand: 1 | 2 | 3 | 4 | 5;
  cognitiveLevel: CognitiveLevel;
  reasoningType: ReasoningType;
  confidence: number;
}

const PLANS: Plan[] = [
  { questionId: "supp-4b0-w21-q11a", topicPrimary: "plane_geometry", topicSecondary: [], difficultyBand: 2, cognitiveLevel: "co_ban", reasoningType: "multi_step", confidence: 97 },
  { questionId: "supp-4b0-w21-q11b", topicPrimary: "plane_geometry", topicSecondary: ["measurement", "num_div"], difficultyBand: 3, cognitiveLevel: "van_dung", reasoningType: "multi_step", confidence: 96 },
  { questionId: "supp-4b0-w23-q11a", topicPrimary: "data_probability", topicSecondary: ["num_div"], difficultyBand: 2, cognitiveLevel: "co_ban", reasoningType: "direct", confidence: 98 },
  { questionId: "supp-4b0-w23-q11b", topicPrimary: "plane_geometry", topicSecondary: ["frac_decimal", "ratio_percent"], difficultyBand: 3, cognitiveLevel: "van_dung", reasoningType: "multi_step", confidence: 96 },
  { questionId: "supp-4b0-w24-qb1a", topicPrimary: "num_div", topicSecondary: [], difficultyBand: 2, cognitiveLevel: "co_ban", reasoningType: "multi_step", confidence: 98 },
  { questionId: "supp-4b0-w24-qb1b", topicPrimary: "plane_geometry", topicSecondary: ["ratio_percent"], difficultyBand: 3, cognitiveLevel: "van_dung", reasoningType: "multi_step", confidence: 97 },
  { questionId: "supp-4b0-w25-qb1a", topicPrimary: "sequence_pattern", topicSecondary: ["num_div"], difficultyBand: 2, cognitiveLevel: "co_ban", reasoningType: "multi_step", confidence: 96 },
  { questionId: "supp-4b0-w25-qb1b", topicPrimary: "data_probability", topicSecondary: ["logic_strategy"], difficultyBand: 3, cognitiveLevel: "van_dung", reasoningType: "proof_or_modeling", confidence: 94 },
  { questionId: "supp-4b0-w25-qb1c", topicPrimary: "logic_strategy", topicSecondary: ["num_div"], difficultyBand: 4, cognitiveLevel: "nang_cao", reasoningType: "proof_or_modeling", confidence: 97 },
];

async function main(): Promise<void> {
  const admin = await prisma.user.findFirst({
    where: { role: "admin", disabled: false },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!admin) throw new Error("No active admin available to approve the assessment run.");

  const questions = await prisma.question.findMany({
    where: { id: { in: [...PLANS.map((plan) => plan.questionId), ...RETIRED_IDS] } },
    select: {
      id: true,
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
  const retiredPresent = questions.filter((question) => RETIRED_IDS.includes(question.id));
  if (retiredPresent.length) {
    throw new Error(`Bundled supplemental rows still present: ${retiredPresent.map((row) => row.id).join(", ")}`);
  }
  const byId = new Map(questions.map((question) => [question.id, question]));
  if (byId.size !== PLANS.length) throw new Error(`Expected ${PLANS.length} split questions, found ${byId.size}.`);

  const candidates = PLANS.map((plan) => {
    const question = byId.get(plan.questionId);
    if (!question) throw new Error(`Missing split question ${plan.questionId}.`);
    return {
      questionId: plan.questionId,
      subject: "math",
      taxonomyVersion: TAXONOMY_VERSION,
      topicPrimary: plan.topicPrimary,
      topicSecondaryJson: JSON.stringify(plan.topicSecondary),
      difficultyBand: plan.difficultyBand,
      cognitiveLevel: plan.cognitiveLevel,
      reasoningType: plan.reasoningType,
      confidence: plan.confidence,
      model: MODEL,
      sourceRunId: RUN_ID,
      questionContentHash: questionContentHash(question),
      assessedAt: ASSESSED_AT,
    };
  });
  const inputHash = stableHash(candidates.map(({ questionId, questionContentHash, topicPrimary, topicSecondaryJson, difficultyBand, cognitiveLevel, reasoningType }) => ({
    questionId,
    questionContentHash,
    topicPrimary,
    topicSecondaryJson,
    difficultyBand,
    cognitiveLevel,
    reasoningType,
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
        artifactPath: "scripts/supplemental-questions.json",
        inputHash,
        metadataJson: JSON.stringify({
          source: "Four bundled 4B0 rows split into nine atomic questions and reviewed by user",
          retiredQuestionIds: RETIRED_IDS,
          totalQuestions: PLANS.length,
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
