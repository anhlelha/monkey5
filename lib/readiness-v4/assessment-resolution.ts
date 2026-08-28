import { questionContentHash, stableHash, type AssessmentRelevantQuestion } from "./hashing";

export interface ResolvableQuestion extends AssessmentRelevantQuestion {
  id: string;
  sourceQuestionId: string | null;
}

export interface ResolvableAssessment {
  id: string;
  questionId: string;
  topicPrimary: string;
  topicSecondaryJson: string;
  difficultyBand: number;
  cognitiveLevel: string;
  reasoningType: string;
  confidence: number;
  model: string;
  sourceRunId: string;
  taxonomyVersion: string;
  questionContentHash: string;
}

export type AssessmentResolutionState = "current" | "inherited" | "stale" | "missing" | "conflict";

export interface AssessmentResolution<T extends ResolvableAssessment = ResolvableAssessment> {
  state: AssessmentResolutionState;
  assessment: T | null;
  canonicalQuestionId: string | null;
  conflictingRunIds: string[];
}

export interface AssessmentIndex<T extends ResolvableAssessment = ResolvableAssessment> {
  byQuestionId: Map<string, T[]>;
  runRank: Map<string, number>;
}

function semanticFingerprint(assessment: ResolvableAssessment): string {
  return stableHash({
    topicPrimary: assessment.topicPrimary,
    topicSecondaryJson: assessment.topicSecondaryJson,
    difficultyBand: assessment.difficultyBand,
    cognitiveLevel: assessment.cognitiveLevel,
    reasoningType: assessment.reasoningType,
  });
}

export function buildAssessmentIndex<T extends ResolvableAssessment>(
  assessments: T[],
  approvedRunIdsNewestFirst: string[],
): AssessmentIndex<T> {
  const runRank = new Map(approvedRunIdsNewestFirst.map((id, index) => [id, index]));
  const byQuestionId = new Map<string, T[]>();
  for (const assessment of assessments) {
    const rows = byQuestionId.get(assessment.questionId) ?? [];
    rows.push(assessment);
    byQuestionId.set(assessment.questionId, rows);
  }
  for (const rows of byQuestionId.values()) {
    rows.sort((left, right) =>
      (runRank.get(left.sourceRunId) ?? Number.MAX_SAFE_INTEGER) -
      (runRank.get(right.sourceRunId) ?? Number.MAX_SAFE_INTEGER) ||
      left.id.localeCompare(right.id));
  }
  return { byQuestionId, runRank };
}

export function resolveQuestionAssessment<T extends ResolvableAssessment>(
  question: ResolvableQuestion,
  index: AssessmentIndex<T>,
): AssessmentResolution<T> {
  const currentHash = questionContentHash(question);
  const direct = index.byQuestionId.get(question.id) ?? [];
  const inherited = question.sourceQuestionId
    ? index.byQuestionId.get(question.sourceQuestionId) ?? []
    : [];
  const currentDirect = direct.filter((assessment) => assessment.questionContentHash === currentHash);
  const currentInherited = inherited.filter((assessment) => assessment.questionContentHash === currentHash);
  const candidates = currentDirect.length > 0 ? currentDirect : currentInherited;
  if (candidates.length === 0) {
    return {
      state: direct.length > 0 || inherited.length > 0 ? "stale" : "missing",
      assessment: null,
      canonicalQuestionId: null,
      conflictingRunIds: [],
    };
  }
  const fingerprints = new Set(candidates.map(semanticFingerprint));
  if (fingerprints.size > 1) {
    return {
      state: "conflict",
      assessment: null,
      canonicalQuestionId: candidates[0].questionId,
      conflictingRunIds: [...new Set(candidates.map((assessment) => assessment.sourceRunId))],
    };
  }
  const assessment = candidates[0];
  return {
    state: currentDirect.length > 0 ? "current" : "inherited",
    assessment,
    canonicalQuestionId: assessment.questionId,
    conflictingRunIds: [],
  };
}
