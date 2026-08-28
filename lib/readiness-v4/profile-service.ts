import { prisma } from "../prisma";
import { buildSchoolProfilesV2, type BuiltSchoolProfile, type ProfileQuestionFact } from "./profile-builder";

export async function loadApprovedProfileFacts(assessmentRunId: string): Promise<ProfileQuestionFact[]> {
  const run = await prisma.assessmentRun.findUnique({ where: { id: assessmentRunId } });
  if (!run || run.status !== "approved") throw new Error(`Assessment run ${assessmentRunId} is not approved`);

  const assessments = await prisma.questionAssessment.findMany({
    where: { sourceRunId: assessmentRunId, subject: "math" },
  });
  const questions = await prisma.question.findMany({
    where: {
      id: { in: assessments.map((row) => row.questionId) },
      active: true,
      exam: { subject: "math", kind: "official" },
    },
    select: {
      id: true,
      examId: true,
      type: true,
      points: true,
      exam: { select: { school: true, year: true, minutes: true } },
    },
  });
  const questionById = new Map(questions.map((row) => [row.id, row]));

  return assessments.flatMap((assessment): ProfileQuestionFact[] => {
    const question = questionById.get(assessment.questionId);
    if (!question?.examId || !question.exam) return [];
    return [{
      questionId: question.id,
      questionContentHash: assessment.questionContentHash,
      assessmentRunId,
      school: question.exam.school,
      examId: question.examId,
      year: question.exam.year,
      examMinutes: question.exam.minutes,
      topic: assessment.topicPrimary,
      difficulty: assessment.difficultyBand as 1 | 2 | 3 | 4 | 5,
      cognitiveLevel: assessment.cognitiveLevel,
      questionType: question.type,
      points: question.points,
    }];
  });
}

export async function buildApprovedSchoolProfiles(assessmentRunId: string): Promise<BuiltSchoolProfile[]> {
  const run = await prisma.assessmentRun.findUniqueOrThrow({ where: { id: assessmentRunId } });
  const facts = await loadApprovedProfileFacts(assessmentRunId);
  return buildSchoolProfilesV2(facts, {
    taxonomyVersion: run.taxonomyVersion,
    methodologyVersion: "school-profile-v2",
  });
}

export async function persistShadowSchoolProfile(
  assessmentRunId: string,
  profile: BuiltSchoolProfile,
  createdByUserId?: string,
): Promise<{ id: string; created: boolean }> {
  const existing = await prisma.schoolProfileVersion.findUnique({
    where: {
      school_subject_methodologyVersion_sourceHash: {
        school: profile.school,
        subject: profile.subject,
        methodologyVersion: profile.methodologyVersion,
        sourceHash: profile.sourceHash,
      },
    },
  });
  if (existing) return { id: existing.id, created: false };
  const row = await prisma.schoolProfileVersion.create({
    data: {
      school: profile.school,
      subject: profile.subject,
      schemaVersion: "school-profile-version-v1",
      methodologyVersion: profile.methodologyVersion,
      taxonomyVersion: profile.taxonomyVersion,
      assessmentRunId,
      status: "shadow",
      sourceHash: profile.sourceHash,
      sourceExamIdsJson: JSON.stringify(profile.sourceExamIds),
      examCount: profile.reliability.examCount,
      questionCount: profile.reliability.questionCount,
      yearCount: profile.reliability.yearCount,
      yearRangeJson: JSON.stringify(profile.reliability.yearRange),
      blueprintCountJson: JSON.stringify(profile.blueprintCount),
      blueprintPointJson: JSON.stringify(profile.blueprintPoint),
      topicWeightsJson: JSON.stringify({ count: profile.topicWeightsCount, point: profile.topicWeightsPoint }),
      difficultyWeightsJson: JSON.stringify({ count: profile.difficultyWeightsCount, point: profile.difficultyWeightsPoint }),
      cognitiveWeightsJson: JSON.stringify(profile.cognitiveWeights),
      difficultyIndex: profile.difficultyIndex,
      difficultyFactorsJson: JSON.stringify(profile.difficultyFactors),
      formatProfileJson: JSON.stringify(profile.formatProfile),
      reliabilityJson: JSON.stringify(profile.reliability),
    },
  });
  if (createdByUserId) {
    await prisma.readinessPolicyAuditLog.create({
      data: {
        profileVersionId: row.id,
        action: "create-profile",
        actorUserId: createdByUserId,
        toState: "shadow",
        diffJson: JSON.stringify({ assessmentRunId, sourceHash: profile.sourceHash, school: profile.school }),
        reason: "Build/refresh shadow School Profile from approved assessment run",
      },
    });
  }
  return { id: row.id, created: true };
}

export async function persistShadowSchoolProfiles(
  assessmentRunId: string,
  profiles: BuiltSchoolProfile[],
): Promise<{ created: string[]; unchanged: string[] }> {
  const created: string[] = [];
  const unchanged: string[] = [];
  for (const profile of profiles) {
    const result = await persistShadowSchoolProfile(assessmentRunId, profile);
    (result.created ? created : unchanged).push(result.id);
  }
  return { created, unchanged };
}
