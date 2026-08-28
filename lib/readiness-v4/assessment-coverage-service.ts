import { prisma } from "../prisma";
import {
  buildAssessmentIndex,
  resolveQuestionAssessment,
  type AssessmentResolutionState,
  type ResolvableQuestion,
} from "./assessment-resolution";
import { MATH_TAXONOMY_VERSION } from "./types";

export type QuestionBankSource = "official" | "mock" | "private" | "supplement";
export type QuestionBankAssessmentState = AssessmentResolutionState;

export interface QuestionBankAssessmentView {
  questionId: string;
  source: QuestionBankSource;
  state: QuestionBankAssessmentState;
  topicPrimary: string | null;
  difficultyBand: number | null;
  cognitiveLevel: string | null;
  reasoningType: string | null;
  confidence: number | null;
  model: string | null;
  sourceRunId: string | null;
  canonicalQuestionId: string | null;
  conflictingRunIds: string[];
}

export interface QuestionBankAssessmentSourceSummary {
  total: number;
  current: number;
  inherited: number;
  stale: number;
  missing: number;
  conflict: number;
}

export interface QuestionBankAssessmentCoverage {
  taxonomyVersion: string;
  total: QuestionBankAssessmentSourceSummary;
  bySource: Record<QuestionBankSource, QuestionBankAssessmentSourceSummary>;
  items: QuestionBankAssessmentView[];
}

export type QuestionBankAssessmentCoverageSummary = Omit<QuestionBankAssessmentCoverage, "items">;

export interface MathTaxonomyTopicCoverage {
  topic: string;
  usable: number;
  current: number;
  inherited: number;
  byDifficulty: Record<1 | 2 | 3 | 4 | 5, number>;
}

const SOURCES: QuestionBankSource[] = ["official", "mock", "private", "supplement"];

function emptySummary(): QuestionBankAssessmentSourceSummary {
  return { total: 0, current: 0, inherited: 0, stale: 0, missing: 0, conflict: 0 };
}

export function classifyQuestionBankSource(question: {
  examId: string | null;
  exam: { kind: string; ownerUserId: string | null } | null;
}): QuestionBankSource {
  if (!question.examId) return "supplement";
  if (question.exam?.ownerUserId) return "private";
  if (question.exam?.kind === "reference" || question.exam?.kind === "mixed") return "mock";
  return "official";
}

export async function getMathQuestionBankAssessmentCoverage(): Promise<QuestionBankAssessmentCoverage> {
  const approvedRuns = await prisma.assessmentRun.findMany({
    where: { subject: "math", taxonomyVersion: MATH_TAXONOMY_VERSION, status: "approved" },
    orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: { id: true },
  });
  const questions = await prisma.question.findMany({
    where: {
      subject: "math",
      active: true,
      OR: [{ examId: null }, { exam: { generated: false } }],
    },
    include: { exam: { select: { kind: true, generated: true, ownerUserId: true } } },
    orderBy: { id: "asc" },
  });
  const relevantQuestionIds = [...new Set(questions.flatMap((question) =>
    question.sourceQuestionId ? [question.id, question.sourceQuestionId] : [question.id]))];
  const assessments = approvedRuns.length > 0 && relevantQuestionIds.length > 0
    ? await prisma.questionAssessment.findMany({
        where: {
          subject: "math",
          taxonomyVersion: MATH_TAXONOMY_VERSION,
          sourceRunId: { in: approvedRuns.map((run) => run.id) },
          questionId: { in: relevantQuestionIds },
        },
      })
    : [];
  const index = buildAssessmentIndex(assessments, approvedRuns.map((run) => run.id));
  const items = questions.map((question): QuestionBankAssessmentView => {
    const source = classifyQuestionBankSource(question);
    const resolution = resolveQuestionAssessment(question as ResolvableQuestion, index);
    return {
      questionId: question.id,
      source,
      state: resolution.state,
      topicPrimary: resolution.assessment?.topicPrimary ?? null,
      difficultyBand: resolution.assessment?.difficultyBand ?? null,
      cognitiveLevel: resolution.assessment?.cognitiveLevel ?? null,
      reasoningType: resolution.assessment?.reasoningType ?? null,
      confidence: resolution.assessment?.confidence ?? null,
      model: resolution.assessment?.model ?? null,
      sourceRunId: resolution.assessment?.sourceRunId ?? null,
      canonicalQuestionId: resolution.canonicalQuestionId,
      conflictingRunIds: resolution.conflictingRunIds,
    };
  });
  return { ...summarizeQuestionBankAssessmentViews(items), items };
}

export function summarizeQuestionBankAssessmentViews(items: QuestionBankAssessmentView[]): QuestionBankAssessmentCoverageSummary {
  const bySource = Object.fromEntries(SOURCES.map((source) => [source, emptySummary()])) as Record<QuestionBankSource, QuestionBankAssessmentSourceSummary>;
  const total = emptySummary();
  for (const item of items) {
    bySource[item.source].total += 1;
    bySource[item.source][item.state] += 1;
    total.total += 1;
    total[item.state] += 1;
  }
  return { taxonomyVersion: MATH_TAXONOMY_VERSION, total, bySource };
}

export function summarizeMathTaxonomyTopicCoverage(
  items: QuestionBankAssessmentView[],
  topicIds: string[],
): MathTaxonomyTopicCoverage[] {
  const rows = new Map<string, MathTaxonomyTopicCoverage>(topicIds.map((topic) => [topic, {
    topic,
    usable: 0,
    current: 0,
    inherited: 0,
    byDifficulty: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  }]));

  for (const item of items) {
    if (!item.topicPrimary) continue;
    const row = rows.get(item.topicPrimary);
    if (!row) continue;
    if (item.state === "current" || item.state === "inherited") {
      row[item.state] += 1;
      row.usable += 1;
      if (item.difficultyBand && item.difficultyBand >= 1 && item.difficultyBand <= 5) {
        row.byDifficulty[item.difficultyBand as 1 | 2 | 3 | 4 | 5] += 1;
      }
    }
  }

  return topicIds.map((topic) => rows.get(topic)!);
}
