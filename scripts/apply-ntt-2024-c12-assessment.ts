/**
 * Re-approve the V4 assessment for NTT 2024-25 C12 after its OCR-damaged
 * prompt, diagram, answer and worked solution were restored by human review.
 * Run after seed-all-exams.ts. Idempotent and immutable per run id.
 */

import { prisma } from "../lib/prisma";
import { ensureSchoolProfilesFresh } from "../lib/school-profiles";
import { sameImmutableAssessment } from "../lib/readiness-v4/assessment-artifact-contract";
import { questionContentHash, stableHash } from "../lib/readiness-v4/hashing";

const QUESTION_ID = "NTT-2024-25-C12";
const TAXONOMY_VERSION = "math-topic-taxonomy-v1";
const RUN_ID = "ntt-2024-c12-content-restored-human-reviewed-20260905";
const MODEL = "source-pdf+human-review";
const ASSESSED_AT = new Date("2026-09-05T03:15:00.000Z");

async function main(): Promise<void> {
  const [question, admin] = await Promise.all([
    prisma.question.findUnique({
      where: { id: QUESTION_ID },
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
    }),
    prisma.user.findFirst({
      where: { role: "admin", disabled: false },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
  ]);
  if (!question) throw new Error(`Missing question ${QUESTION_ID}; run seed-all-exams.ts first.`);
  if (!admin) throw new Error("No active admin available to approve the assessment run.");
  if (question.type !== "essay" || question.points !== 2 || question.figure !== "ntt-2024-c12") {
    throw new Error(`${QUESTION_ID} has not been restored to the reviewed essay/figure contract.`);
  }

  const candidate = {
    questionId: QUESTION_ID,
    subject: "math",
    taxonomyVersion: TAXONOMY_VERSION,
    topicPrimary: "plane_geometry",
    topicSecondaryJson: JSON.stringify(["ratio_percent"]),
    difficultyBand: 5,
    cognitiveLevel: "chuyen_sau",
    reasoningType: "proof_or_modeling",
    confidence: 96,
    model: MODEL,
    sourceRunId: RUN_ID,
    questionContentHash: questionContentHash(question),
    assessedAt: ASSESSED_AT,
  };
  const inputHash = stableHash({
    questionId: candidate.questionId,
    questionContentHash: candidate.questionContentHash,
    topicPrimary: candidate.topicPrimary,
    topicSecondaryJson: candidate.topicSecondaryJson,
    difficultyBand: candidate.difficultyBand,
    cognitiveLevel: candidate.cognitiveLevel,
    reasoningType: candidate.reasoningType,
  });
  const existing = await prisma.questionAssessment.findUnique({
    where: {
      questionId_taxonomyVersion_sourceRunId: {
        questionId: QUESTION_ID,
        taxonomyVersion: TAXONOMY_VERSION,
        sourceRunId: RUN_ID,
      },
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.assessmentRun.upsert({
      where: { id: RUN_ID },
      create: {
        id: RUN_ID,
        subject: "math",
        taxonomyVersion: TAXONOMY_VERSION,
        model: MODEL,
        status: "approved",
        artifactPath: "scripts/exam-overrides.ts",
        inputHash,
        metadataJson: JSON.stringify({
          source: "NTT 2024-2025 source PDF solution restored and reviewed by user",
          totalQuestions: 1,
        }),
        approvedByUserId: admin.id,
        approvedAt: ASSESSED_AT,
      },
      update: {},
    });
    if (existing) {
      if (!sameImmutableAssessment(existing, candidate)) {
        throw new Error(`Immutable assessment conflict for ${QUESTION_ID}; create a new run id.`);
      }
    } else {
      await tx.questionAssessment.create({ data: candidate });
    }
  });

  const profiles = await ensureSchoolProfilesFresh();
  console.log(`✓ ${RUN_ID}: ${existing ? "unchanged" : "created"}=1; profiles rebuilt=[${profiles.rebuilt.join(",")}]`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
