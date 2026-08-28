export const READINESS_V4_METHODOLOGY = "readiness-v4" as const;
export const MASTERY_V4_METHODOLOGY = "mastery-v4" as const;
export const MATH_TAXONOMY_VERSION = "math-topic-taxonomy-v1" as const;

export const DIFFICULTY_BANDS = ["foundation", "application", "advanced"] as const;
export type DifficultyBand = (typeof DIFFICULTY_BANDS)[number];

export type CognitiveLevel = "co_ban" | "van_dung" | "nang_cao" | "chuyen_sau" | string;

export interface AssessedAttemptFact {
  attemptId: string;
  questionId: string;
  canonicalQuestionId: string;
  topic: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  cognitiveLevel: CognitiveLevel;
  /** Credit earned for mastery, from 0 to 1. */
  credit: number;
}

export interface MasteryCell {
  topic: string;
  band: DifficultyBand;
  correct: number;
  total: number;
  mastery: number;
  status: "unverified" | "estimated";
}

export interface CognitiveSummaryItem {
  correct: number;
  total: number;
  accuracy: number | null;
}

export interface MasteryV4Result {
  cells: Record<string, MasteryCell>;
  cognitiveSummary: Record<string, CognitiveSummaryItem>;
  coverageSummary: {
    answeredFacts: number;
    assessedFacts: number;
    unverifiedCellCount: number;
  };
}

export type BlueprintWeightMode = "point" | "count" | "controlled-fallback";

export interface ProfileReliability {
  examCount: number;
  questionCount: number;
  yearCount: number;
  yearRange: string[];
  examIds: string[];
  flags: string[];
}

export interface SchoolProfileV2 {
  school: string;
  subject: "math";
  taxonomyVersion: string;
  methodologyVersion: string;
  sourceHash: string;
  blueprintCount: Record<string, number>;
  blueprintPoint: Record<string, number>;
  topicWeightsCount: Record<string, number>;
  topicWeightsPoint: Record<string, number>;
  difficultyWeightsCount: Record<DifficultyBand, number>;
  difficultyWeightsPoint: Record<DifficultyBand, number>;
  cognitiveWeights: Record<string, number>;
  difficultyIndex: number;
  difficultyFactors: {
    base: number;
    tail: number;
    time: number;
    composite: number;
  };
  reliability: ProfileReliability;
}

export interface ReadinessPolicy {
  formulaKey: "mastery-evidence-v4";
  priorStrength: number;
  priorMastery: number;
  evidenceTarget: number;
  evidenceExponent: number;
  blueprintWeightMode: BlueprintWeightMode;
  preparingThreshold: number;
  nearReadyThreshold: number;
  readyThreshold: number;
  strongReadyThreshold: number;
  overallEvidenceGate: number;
  advancedShareGate: number;
  advancedEvidenceGate: number;
  criticalTopicThreshold: number;
  criticalMasteryGate: number;
  criticalEvidenceGate: number;
}

export type ReadinessStatus =
  | "unverified"
  | "not_ready"
  | "preparing"
  | "near_ready"
  | "evidence_limited"
  | "ready"
  | "strong_ready";

export type ReadinessReasonCode =
  | "NO_VERIFIED_EVIDENCE"
  | "SCORE_BELOW_READY_THRESHOLD"
  | "OVERALL_EVIDENCE_BELOW_GATE"
  | "ADVANCED_EVIDENCE_BELOW_GATE"
  | "CRITICAL_TOPIC_MASTERY_BELOW_GATE"
  | "CRITICAL_TOPIC_EVIDENCE_BELOW_GATE";

export interface GateResult {
  key: string;
  passed: boolean;
  actual: number;
  threshold: number;
  topic?: string;
  reasonCode?: ReadinessReasonCode;
}

export interface ReadinessCellResult extends MasteryCell {
  weight: number;
  required: number;
  evidence: number;
}

export interface CriticalTopicResult {
  topic: string;
  weight: number;
  mastery: number;
  evidence: number;
  passedMastery: boolean;
  passedEvidence: boolean;
}

export interface ReadinessV4Result {
  schoolMastery: number;
  schoolEvidence: number;
  advancedEvidence: number | null;
  advancedShare: number;
  readiness: number;
  status: ReadinessStatus;
  cells: Record<string, ReadinessCellResult>;
  criticalTopics: CriticalTopicResult[];
  passedGates: GateResult[];
  failedGates: GateResult[];
  reasonCodes: ReadinessReasonCode[];
}

export function difficultyBandOf(difficulty: number): DifficultyBand {
  if (difficulty >= 4) return "advanced";
  if (difficulty === 3) return "application";
  return "foundation";
}

export function cellKey(topic: string, band: DifficultyBand): string {
  return `${topic}::${band}`;
}
