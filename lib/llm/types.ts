// Shared types for the AI essay-grading subsystem.

export type LLMProvider = "anthropic" | "openai" | "google";

export const LLM_PROVIDERS: readonly LLMProvider[] = ["anthropic", "openai", "google"] as const;

export function isLLMProvider(value: string): value is LLMProvider {
  return (LLM_PROVIDERS as readonly string[]).includes(value);
}

/** A selectable model in the admin catalog. */
export interface ModelOption {
  id: string;
  label: string;
}

export interface ProviderMeta {
  id: LLMProvider;
  label: string;
  /** Env var consulted when the admin leaves the API key blank. */
  envVar: string;
  /** Where to get a key (shown in the admin UI). */
  keyHint: string;
  models: ModelOption[];
}

/** Effective settings used by the grader (key already resolved from db|env). */
export interface ResolvedLLMSettings {
  enabled: boolean;
  provider: LLMProvider;
  model: string;
  apiKey: string;
  gradingPrompt: string;
  methodWeight: number;
  answerWeight: number;
  guessCredit: number;
  maxTokens: number;
  /** English Writing rubric + 5-criteria weights (percent, sum 100). */
  writingPrompt: string;
  writingWeights: Record<string, number>;
  /** Vietnamese văn rubric + 5-criteria weights (percent, sum 100). */
  vnWritingPrompt: string;
  vnWritingWeights: Record<string, number>;
}

/** Raw structured verdict the model returns for an english Writing task. */
export interface WritingVerdict {
  task: number;
  lexical: number;
  grammar: number;
  cohesion: number;
  length: number;
  feedback: string;
}

/** Result of grading one Writing answer — shaped for the EssayGrade table. */
export interface WritingGradeResult {
  fraction: number;
  earned: number;
  points: number;
  criteria: Record<string, number>; // each 0..1
  feedback: string;
  provider: string;
  model: string;
  status: "graded" | "error";
  error: string | null;
  inputTokens: number;
  outputTokens: number;
}

/** The fields the Writing grader needs (no answer key — it's free production). */
export interface WritingQuestionInput {
  num: number;
  stem: string;
  points: number;
}

/** Scoring policy slice (percent of a question's points). */
export interface ScoringPolicy {
  methodWeight: number;
  answerWeight: number;
  guessCredit: number;
}

/** Raw structured verdict the model is asked to return. */
export interface EssayVerdict {
  answerCorrect: boolean;
  /** 0..1 — correctness & completeness of the working/reasoning. */
  methodScore: number;
  /** Right final answer reached with a wrong/absent method (đoán mò). */
  guessed: boolean;
  /** Short Vietnamese feedback for the student. */
  feedback: string;
}

/** Result of grading one essay answer — shaped for the EssayGrade table. */
export interface EssayGradeResult {
  fraction: number;
  earned: number;
  points: number;
  answerCorrect: boolean;
  methodScore: number;
  guessed: boolean;
  feedback: string;
  provider: string;
  model: string;
  status: "graded" | "error";
  error: string | null;
  inputTokens: number;
  outputTokens: number;
}

/** The question fields the grader needs. */
export interface EssayQuestionInput {
  num: number;
  stem: string;
  correct: string | null;
  modelAnswer: string | null;
  unit: string | null;
  points: number;
}
