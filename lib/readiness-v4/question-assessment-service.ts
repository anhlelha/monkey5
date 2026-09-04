import { prisma } from "../prisma";
import type { ExamQuestionAssessmentV4 } from "../exam";
import {
  buildAssessmentIndex,
  resolveQuestionAssessment,
  type ResolvableQuestion,
} from "./assessment-resolution";
import { MATH_TAXONOMY_VERSION } from "./types";

/** Resolve only the questions on the current screen, instead of loading the bank. */
export async function getEffectiveQuestionAssessmentsV4(
  questions: ResolvableQuestion[],
): Promise<Record<string, ExamQuestionAssessmentV4>> {
  if (questions.length === 0) return {};

  const approvedRuns = await prisma.assessmentRun.findMany({
    where: {
      subject: "math",
      taxonomyVersion: MATH_TAXONOMY_VERSION,
      status: "approved",
    },
    orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: { id: true },
  });
  if (approvedRuns.length === 0) return {};

  const questionIds = [...new Set(questions.flatMap((question) =>
    question.sourceQuestionId ? [question.id, question.sourceQuestionId] : [question.id]))];
  const assessments = await prisma.questionAssessment.findMany({
    where: {
      subject: "math",
      taxonomyVersion: MATH_TAXONOMY_VERSION,
      sourceRunId: { in: approvedRuns.map((run) => run.id) },
      questionId: { in: questionIds },
    },
  });
  const index = buildAssessmentIndex(assessments, approvedRuns.map((run) => run.id));

  return Object.fromEntries(questions.flatMap((question) => {
    const resolution = resolveQuestionAssessment(question, index);
    if (
      (resolution.state !== "current" && resolution.state !== "inherited") ||
      !resolution.assessment
    ) return [];
    return [[question.id, {
      state: resolution.state,
      topicPrimary: resolution.assessment.topicPrimary,
      difficultyBand: resolution.assessment.difficultyBand,
      cognitiveLevel: resolution.assessment.cognitiveLevel,
      reasoningType: resolution.assessment.reasoningType,
    } satisfies ExamQuestionAssessmentV4]];
  }));
}
