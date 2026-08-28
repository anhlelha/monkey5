import { gradeAnswer } from "../grading";
import { prisma } from "../prisma";
import { buildAssessmentIndex, resolveQuestionAssessment } from "./assessment-resolution";
import { stableHash } from "./hashing";
import { computeMasteryV4 } from "./mastery-engine";
import { policyFromRow } from "./policy-repository";
import { computeReadinessV4 } from "./readiness-engine";
import { cellKey, type AssessedAttemptFact, type ReadinessPolicy, type SchoolProfileV2 } from "./types";

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function isAnswered(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return false;
  if (typeof value === "object" && "text" in value) {
    return String((value as { text?: unknown }).text ?? "").trim().length > 0;
  }
  return true;
}

export interface LoadedUserFacts {
  facts: AssessedAttemptFact[];
  attemptSourceHash: string;
  assessmentRunIds: string[];
  unassessedQuestionIds: string[];
  staleAssessmentQuestionIds: string[];
  conflictingAssessmentQuestionIds: string[];
  missingEssayGradeQuestionIds: string[];
}

export async function loadUserAssessedFacts(
  userId: string,
  taxonomyVersion: string,
): Promise<LoadedUserFacts> {
  const approvedRuns = await prisma.assessmentRun.findMany({
    where: { subject: "math", taxonomyVersion, status: "approved" },
    orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
  });
  const assessments = await prisma.questionAssessment.findMany({
    where: { sourceRunId: { in: approvedRuns.map((run) => run.id) }, taxonomyVersion },
  });
  const assessmentIndex = buildAssessmentIndex(assessments, approvedRuns.map((run) => run.id));

  const attempts = await prisma.attempt.findMany({
    where: { userId, submitted: true, exam: { subject: "math" } },
    include: { exam: { include: { questions: true } }, essayGrades: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const facts: AssessedAttemptFact[] = [];
  const unassessed = new Set<string>();
  const stale = new Set<string>();
  const conflicting = new Set<string>();
  const missingEssayGrade = new Set<string>();
  const usedAssessmentRunIds = new Set<string>();
  const sourceRows: unknown[] = [];

  for (const attempt of attempts) {
    const answers = parseJson<Record<string, unknown>>(attempt.answers, {});
    const essayGradeByQuestion = new Map(attempt.essayGrades.map((row) => [row.questionId, row]));
    for (const question of attempt.exam.questions) {
      const answer = answers[question.id];
      if (!isAnswered(answer)) continue;
      const resolution = resolveQuestionAssessment(question, assessmentIndex);
      if (resolution.state === "missing") {
        unassessed.add(question.id);
        sourceRows.push({ attemptId: attempt.id, questionId: question.id, state: "unassessed" });
        continue;
      }
      if (resolution.state === "stale") {
        stale.add(question.id);
        sourceRows.push({ attemptId: attempt.id, questionId: question.id, state: "stale" });
        continue;
      }
      if (resolution.state === "conflict") {
        conflicting.add(question.id);
        sourceRows.push({
          attemptId: attempt.id,
          questionId: question.id,
          state: "assessment-conflict",
          conflictingRunIds: resolution.conflictingRunIds,
        });
        continue;
      }
      const assessment = resolution.assessment!;
      usedAssessmentRunIds.add(assessment.sourceRunId);

      let credit: number;
      if (question.type === "essay") {
        const essayGrade = essayGradeByQuestion.get(question.id);
        if (!essayGrade || essayGrade.status !== "graded") {
          missingEssayGrade.add(question.id);
          sourceRows.push({ attemptId: attempt.id, questionId: question.id, state: "missing-essay-grade" });
          continue;
        }
        credit = essayGrade.fraction;
      } else {
        const result = gradeAnswer(
          { type: question.type as "fill" | "mcq", correct: question.correct, answerSchema: question.answerSchema },
          answer as string | { text?: string } | null | undefined,
        );
        credit = result.correct ? 1 : 0;
      }

      facts.push({
        attemptId: attempt.id,
        questionId: question.id,
        canonicalQuestionId: resolution.canonicalQuestionId!,
        topic: assessment.topicPrimary,
        difficulty: assessment.difficultyBand as 1 | 2 | 3 | 4 | 5,
        cognitiveLevel: assessment.cognitiveLevel,
        credit,
      });
      sourceRows.push({
        attemptId: attempt.id,
        questionId: question.id,
        canonicalQuestionId: resolution.canonicalQuestionId!,
        assessmentRunId: assessment.sourceRunId,
        assessmentHash: assessment.questionContentHash,
        assessmentState: resolution.state,
        credit,
      });
    }
  }

  return {
    facts,
    attemptSourceHash: stableHash(sourceRows),
    assessmentRunIds: [...usedAssessmentRunIds].sort(),
    unassessedQuestionIds: [...unassessed].sort(),
    staleAssessmentQuestionIds: [...stale].sort(),
    conflictingAssessmentQuestionIds: [...conflicting].sort(),
    missingEssayGradeQuestionIds: [...missingEssayGrade].sort(),
  };
}

export function profileFromRow(row: Awaited<ReturnType<typeof prisma.schoolProfileVersion.findUniqueOrThrow>>): SchoolProfileV2 {
  const topics = parseJson<{ count?: Record<string, number>; point?: Record<string, number> }>(row.topicWeightsJson, {});
  const bands = parseJson<{
    count?: SchoolProfileV2["difficultyWeightsCount"];
    point?: SchoolProfileV2["difficultyWeightsPoint"];
  }>(row.difficultyWeightsJson, {});
  return {
    school: row.school,
    subject: "math",
    taxonomyVersion: row.taxonomyVersion,
    methodologyVersion: row.methodologyVersion,
    sourceHash: row.sourceHash,
    blueprintCount: parseJson(row.blueprintCountJson, {}),
    blueprintPoint: parseJson(row.blueprintPointJson, {}),
    topicWeightsCount: topics.count ?? {},
    topicWeightsPoint: topics.point ?? {},
    difficultyWeightsCount: bands.count ?? { foundation: 0, application: 0, advanced: 0 },
    difficultyWeightsPoint: bands.point ?? { foundation: 0, application: 0, advanced: 0 },
    cognitiveWeights: parseJson(row.cognitiveWeightsJson, {}),
    difficultyIndex: row.difficultyIndex,
    difficultyFactors: parseJson(row.difficultyFactorsJson, { base: 0, tail: 0, time: 0, composite: 0 }),
    reliability: parseJson(row.reliabilityJson, {
      examCount: row.examCount,
      questionCount: row.questionCount,
      yearCount: row.yearCount,
      yearRange: [],
      examIds: [],
      flags: [],
    }),
  };
}

function topicSummary(cells: ReturnType<typeof computeMasteryV4>["cells"]): Record<string, { mastery: number; total: number }> {
  const buckets = new Map<string, { mastery: number; total: number; cellCount: number }>();
  for (const cell of Object.values(cells)) {
    const bucket = buckets.get(cell.topic) ?? { mastery: 0, total: 0, cellCount: 0 };
    bucket.mastery += cell.mastery;
    bucket.total += cell.total;
    bucket.cellCount += 1;
    buckets.set(cell.topic, bucket);
  }
  return Object.fromEntries([...buckets].map(([topic, value]) => [topic, {
    mastery: value.cellCount ? value.mastery / value.cellCount : 0,
    total: value.total,
  }]));
}

export async function computeAndPersistUserShadowV4(input: {
  userId: string;
  policyVersionId: string;
  profileVersionIds?: string[];
  recomputeJobId?: string;
}): Promise<{ masterySnapshotId: string; readinessSnapshotIds: string[]; diagnostics: Omit<LoadedUserFacts, "facts" | "attemptSourceHash" | "assessmentRunIds"> }> {
  const policyRow = await prisma.readinessPolicyVersion.findUniqueOrThrow({ where: { id: input.policyVersionId } });
  if (policyRow.status !== "shadow" && policyRow.status !== "active") throw new Error("Policy must be shadow or active");
  const policy: ReadinessPolicy = policyFromRow(policyRow);
  const profileRows = await prisma.schoolProfileVersion.findMany({
    where: input.profileVersionIds?.length
      ? { id: { in: input.profileVersionIds } }
      : { subject: "math", status: { in: ["shadow", "active"] } },
    orderBy: { school: "asc" },
  });
  if (!profileRows.length) throw new Error("No shadow/active School Profile v2 found");
  const taxonomyVersions = [...new Set(profileRows.map((row) => row.taxonomyVersion))];
  if (taxonomyVersions.length !== 1) throw new Error("Profile versions use mixed taxonomy versions");
  const taxonomyVersion = taxonomyVersions[0];
  const loaded = await loadUserAssessedFacts(input.userId, taxonomyVersion);
  const knownCells = [...new Set(profileRows.flatMap((row) => [
    ...Object.keys(parseJson<Record<string, number>>(row.blueprintCountJson, {})),
    ...Object.keys(parseJson<Record<string, number>>(row.blueprintPointJson, {})),
  ]))].map((key) => {
    const [topic, band] = key.split("::");
    return { topic, band: band as "foundation" | "application" | "advanced" };
  });
  const masteryConfigHash = stableHash({
    priorStrength: policy.priorStrength,
    priorMastery: policy.priorMastery,
    creditSemantics: "essay-fraction-v1",
  });
  const mastery = computeMasteryV4(loaded.facts, {
    priorStrength: policy.priorStrength,
    priorMastery: policy.priorMastery,
    knownCells,
  });
  mastery.coverageSummary = {
    ...mastery.coverageSummary,
    answeredFacts: loaded.facts.length + loaded.unassessedQuestionIds.length + loaded.staleAssessmentQuestionIds.length + loaded.conflictingAssessmentQuestionIds.length + loaded.missingEssayGradeQuestionIds.length,
    assessedFacts: loaded.facts.length,
  };

  const assessmentRunIds = [...new Set([
    ...profileRows.map((row) => row.assessmentRunId),
    ...loaded.assessmentRunIds,
  ])].sort();
  const assessmentRunId = assessmentRunIds.join(",");
  let masterySnapshot = await prisma.masterySnapshot.findFirst({
    where: {
      userId: input.userId,
      subject: "math",
      methodologyVersion: "mastery-v4",
      taxonomyVersion,
      assessmentRunId,
      masteryConfigHash,
      attemptSourceHash: loaded.attemptSourceHash,
    },
  });
  masterySnapshot ??= await prisma.masterySnapshot.create({
    data: {
      userId: input.userId,
      subject: "math",
      methodologyVersion: "mastery-v4",
      taxonomyVersion,
      assessmentRunId,
      masteryConfigHash,
      attemptSourceHash: loaded.attemptSourceHash,
      recomputeJobId: input.recomputeJobId,
      cellsJson: JSON.stringify(mastery.cells),
      topicSummaryJson: JSON.stringify(topicSummary(mastery.cells)),
      cognitiveSummaryJson: JSON.stringify(mastery.cognitiveSummary),
      coverageSummaryJson: JSON.stringify({
        ...mastery.coverageSummary,
        unassessedQuestionIds: loaded.unassessedQuestionIds,
        staleAssessmentQuestionIds: loaded.staleAssessmentQuestionIds,
        conflictingAssessmentQuestionIds: loaded.conflictingAssessmentQuestionIds,
        missingEssayGradeQuestionIds: loaded.missingEssayGradeQuestionIds,
      }),
    },
  });

  const readinessSnapshotIds: string[] = [];
  for (const profileRow of profileRows) {
    const existing = await prisma.readinessSnapshot.findFirst({
      where: {
        userId: input.userId,
        school: profileRow.school,
        subject: "math",
        methodologyVersion: "readiness-v4",
        profileVersionId: profileRow.id,
        masterySnapshotId: masterySnapshot.id,
        policyVersionId: policyRow.id,
      },
    });
    if (existing) {
      readinessSnapshotIds.push(existing.id);
      continue;
    }
    const result = computeReadinessV4(mastery, profileFromRow(profileRow), policy);
    const created = await prisma.readinessSnapshot.create({
      data: {
        userId: input.userId,
        school: profileRow.school,
        subject: "math",
        methodologyVersion: "readiness-v4",
        profileVersionId: profileRow.id,
        masterySnapshotId: masterySnapshot.id,
        policyVersionId: policyRow.id,
        recomputeJobId: input.recomputeJobId,
        schoolMastery: result.schoolMastery,
        schoolEvidence: result.schoolEvidence,
        advancedEvidence: result.advancedEvidence,
        readiness: result.readiness,
        status: result.status,
        gatesJson: JSON.stringify({ passed: result.passedGates, failed: result.failedGates }),
        criticalTopicsJson: JSON.stringify(result.criticalTopics),
        reasonCodesJson: JSON.stringify(result.reasonCodes),
      },
    });
    readinessSnapshotIds.push(created.id);
  }

  return {
    masterySnapshotId: masterySnapshot.id,
    readinessSnapshotIds,
    diagnostics: {
      unassessedQuestionIds: loaded.unassessedQuestionIds,
      staleAssessmentQuestionIds: loaded.staleAssessmentQuestionIds,
      conflictingAssessmentQuestionIds: loaded.conflictingAssessmentQuestionIds,
      missingEssayGradeQuestionIds: loaded.missingEssayGradeQuestionIds,
    },
  };
}
