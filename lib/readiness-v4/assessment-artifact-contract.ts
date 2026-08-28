import { MATH_ANALYTICAL_TOPICS } from "./analytical-topics";

export const ASSESSMENT_COGNITIVE_LEVELS = ["co_ban", "van_dung", "nang_cao", "chuyen_sau"] as const;
export const ASSESSMENT_REASONING_TYPES = ["direct", "multi_step", "non_routine", "proof_or_modeling"] as const;
export const ASSESSMENT_CONTEXT_TAGS = ["ctx_age", "ctx_map_scale", "ctx_finance_commerce", "rep_diagram_required", "cross_domain"] as const;
export const ASSESSMENT_TOPIC_IDS = MATH_ANALYTICAL_TOPICS.map((topic) => topic.id);

export interface DifficultyAssessmentArtifact {
  questionId: string;
  cognitiveLevel: string;
  difficulty: number;
  reasoningType: string;
  assessmentConfidence: number;
  figureRead: string;
  assessmentNote: string;
  model?: string;
  assessedAt?: string;
}

export interface TopicAssessmentArtifact {
  questionId: string;
  topicPrimary: string;
  topicSecondary: string[];
  contextTags: string[];
  topicConfidence: number;
  topicRationale: string;
  figureRead: string;
  model?: string;
  assessedAt?: string;
}

function isIntegerPercent(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 100;
}

export function validateDifficultyAssessment(row: DifficultyAssessmentArtifact, expectedId: string): void {
  if (row.questionId !== expectedId) throw new Error(`PASS_A_WRONG_QUESTION_ID:${expectedId}`);
  if (!(ASSESSMENT_COGNITIVE_LEVELS as readonly string[]).includes(row.cognitiveLevel)) throw new Error(`PASS_A_INVALID_COGNITIVE:${expectedId}`);
  if (!Number.isInteger(row.difficulty) || row.difficulty < 1 || row.difficulty > 5) throw new Error(`PASS_A_INVALID_DIFFICULTY:${expectedId}`);
  if (!(ASSESSMENT_REASONING_TYPES as readonly string[]).includes(row.reasoningType)) throw new Error(`PASS_A_INVALID_REASONING:${expectedId}`);
  if (!isIntegerPercent(row.assessmentConfidence)) throw new Error(`PASS_A_INVALID_CONFIDENCE:${expectedId}`);
  if (typeof row.figureRead !== "string" || !row.figureRead.trim() || typeof row.assessmentNote !== "string" || !row.assessmentNote.trim()) {
    throw new Error(`PASS_A_MISSING_RATIONALE:${expectedId}`);
  }
}

export function validateTopicAssessment(row: TopicAssessmentArtifact, expectedId: string, hasFigure: boolean): void {
  if (row.questionId !== expectedId) throw new Error(`PASS_B_WRONG_QUESTION_ID:${expectedId}`);
  if (!ASSESSMENT_TOPIC_IDS.includes(row.topicPrimary)) throw new Error(`PASS_B_INVALID_TOPIC:${expectedId}`);
  if (!Array.isArray(row.topicSecondary) || row.topicSecondary.length > 2 || new Set(row.topicSecondary).size !== row.topicSecondary.length || row.topicSecondary.includes(row.topicPrimary) || row.topicSecondary.some((topic) => !ASSESSMENT_TOPIC_IDS.includes(topic))) {
    throw new Error(`PASS_B_INVALID_SECONDARY:${expectedId}`);
  }
  if (!Array.isArray(row.contextTags) || new Set(row.contextTags).size !== row.contextTags.length || row.contextTags.some((tag) => !(ASSESSMENT_CONTEXT_TAGS as readonly string[]).includes(tag))) {
    throw new Error(`PASS_B_INVALID_CONTEXT:${expectedId}`);
  }
  if (!isIntegerPercent(row.topicConfidence)) throw new Error(`PASS_B_INVALID_CONFIDENCE:${expectedId}`);
  if (!hasFigure && (row.figureRead !== "Không có hình minh họa" || row.contextTags.includes("rep_diagram_required"))) {
    throw new Error(`PASS_B_INVALID_TEXT_FIGURE:${expectedId}`);
  }
  if (typeof row.figureRead !== "string" || !row.figureRead.trim() || typeof row.topicRationale !== "string" || !row.topicRationale.trim()) {
    throw new Error(`PASS_B_MISSING_RATIONALE:${expectedId}`);
  }
}

export function validateAssessmentArtifactCoverage(
  expectedIds: string[],
  topicRows: Array<Pick<TopicAssessmentArtifact, "questionId">>,
  difficultyRows: Array<Pick<DifficultyAssessmentArtifact, "questionId">>,
): void {
  const expected = [...new Set(expectedIds)].sort();
  if (expected.length !== expectedIds.length) throw new Error("MANIFEST_DUPLICATE_ID");
  for (const [label, rows] of [["TOPIC", topicRows], ["DIFFICULTY", difficultyRows]] as const) {
    const ids = rows.map((row) => row.questionId);
    if (new Set(ids).size !== ids.length) throw new Error(`${label}_DUPLICATE_ID`);
    if (ids.length !== expected.length || [...ids].sort().some((id, index) => id !== expected[index])) {
      throw new Error(`${label}_MANIFEST_MISMATCH`);
    }
  }
}

export interface ImmutableAssessmentShape {
  topicPrimary: string;
  topicSecondaryJson: string;
  difficultyBand: number;
  cognitiveLevel: string;
  reasoningType: string;
  confidence: number;
  model: string;
  questionContentHash: string;
}

export function sameImmutableAssessment(left: ImmutableAssessmentShape, right: ImmutableAssessmentShape): boolean {
  return left.topicPrimary === right.topicPrimary &&
    left.topicSecondaryJson === right.topicSecondaryJson &&
    left.difficultyBand === right.difficultyBand &&
    left.cognitiveLevel === right.cognitiveLevel &&
    left.reasoningType === right.reasoningType &&
    left.confidence === right.confidence &&
    left.model === right.model &&
    left.questionContentHash === right.questionContentHash;
}

export function assertExportedContentUnchanged(exportedHash: string | undefined, currentHash: string): void {
  if (exportedHash && exportedHash !== currentHash) throw new Error("CONTENT_HASH_CHANGED_SINCE_EXPORT");
}
