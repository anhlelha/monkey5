// Essay grader: turns a student's free-text working into a score + feedback.
//
// The model returns a structured verdict (answer correct? method quality?
// guessed?); the actual points are computed deterministically from the admin's
// scoring policy so the score is auditable and not at the model's whim.

import { z } from "zod";
import { callLLM, extractJson } from "./client";
import type {
  EssayGradeResult,
  EssayQuestionInput,
  ResolvedLLMSettings,
  ScoringPolicy,
} from "./types";

const verdictSchema = z.object({
  answerCorrect: z.boolean(),
  methodScore: z.number().min(0).max(1),
  guessed: z.boolean(),
  feedback: z.string().max(2000),
});

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));
/** Round to quarter points — matches Vietnamese 0,25 grading granularity. */
const roundQuarter = (n: number): number => Math.round(n * 4) / 4;

/**
 * Map a verdict to a fraction (0..1) of the question's points.
 * - guessed + correct answer  → only `guessCredit`
 * - otherwise                 → methodScore·methodWeight + (answerCorrect ? answerWeight : 0)
 */
export function scoreFraction(
  verdict: { answerCorrect: boolean; methodScore: number; guessed: boolean },
  policy: ScoringPolicy,
): number {
  const method = clamp01(verdict.methodScore);
  if (verdict.guessed && verdict.answerCorrect) {
    return clamp01(policy.guessCredit / 100);
  }
  const frac =
    method * (policy.methodWeight / 100) +
    (verdict.answerCorrect ? policy.answerWeight / 100 : 0);
  return clamp01(frac);
}

function buildUserMessage(q: EssayQuestionInput, studentAnswer: string): string {
  const answerKey = q.correct?.trim() ? q.correct.trim() : "(không có đáp án mẫu — hãy tự suy luận đáp số đúng)";
  const solution = q.modelAnswer?.trim() ? q.modelAnswer.trim() : "(không có lời giải mẫu)";
  const unit = q.unit?.trim() ? ` (đơn vị: ${q.unit.trim()})` : "";
  return [
    `### Đề bài (Câu ${q.num}, tối đa ${q.points} điểm)`,
    q.stem.trim(),
    "",
    `### Đáp số đúng${unit}`,
    answerKey,
    "",
    `### Lời giải mẫu`,
    solution,
    "",
    `### Bài làm của học sinh`,
    studentAnswer.trim(),
    "",
    "### Yêu cầu trả về",
    "Chỉ trả về một đối tượng JSON (không kèm văn bản khác) theo đúng schema sau:",
    "{",
    '  "answerCorrect": boolean,   // đáp số cuối của học sinh có đúng không',
    '  "methodScore": number,      // 0..1 — mức độ đúng & đầy đủ của cách làm/lập luận',
    '  "guessed": boolean,         // true nếu ra đúng đáp số nhưng cách làm sai/không có (đoán mò)',
    '  "feedback": string          // nhận xét ngắn bằng tiếng Việt cho học sinh',
    "}",
  ].join("\n");
}

/** Grade one essay answer. Throws on provider/parse errors. */
export async function gradeEssayWithLLM(
  settings: ResolvedLLMSettings,
  q: EssayQuestionInput,
  studentAnswer: string,
): Promise<EssayGradeResult> {
  const { text: raw, usage } = await callLLM({
    provider: settings.provider,
    model: settings.model,
    apiKey: settings.apiKey,
    system: settings.gradingPrompt,
    user: buildUserMessage(q, studentAnswer),
    maxTokens: settings.maxTokens,
  });

  const verdict = verdictSchema.parse(extractJson(raw));
  const policy: ScoringPolicy = {
    methodWeight: settings.methodWeight,
    answerWeight: settings.answerWeight,
    guessCredit: settings.guessCredit,
  };
  const fraction = scoreFraction(verdict, policy);
  const earned = roundQuarter(fraction * q.points);

  return {
    fraction,
    earned,
    points: q.points,
    answerCorrect: verdict.answerCorrect,
    methodScore: clamp01(verdict.methodScore),
    guessed: verdict.guessed,
    feedback: verdict.feedback.trim(),
    provider: settings.provider,
    model: settings.model,
    status: "graded",
    error: null,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
  };
}

/** Never-throws wrapper: returns an error-tagged result on any failure. */
export async function gradeEssaySafe(
  settings: ResolvedLLMSettings,
  q: EssayQuestionInput,
  studentAnswer: string,
): Promise<EssayGradeResult> {
  try {
    return await gradeEssayWithLLM(settings, q, studentAnswer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định.";
    return {
      fraction: 0,
      earned: 0,
      points: q.points,
      answerCorrect: false,
      methodScore: 0,
      guessed: false,
      feedback: "AI chưa chấm được câu này. Quản trị viên có thể chấm lại sau.",
      provider: settings.provider,
      model: settings.model,
      status: "error",
      error: message,
      inputTokens: 0,
      outputTokens: 0,
    };
  }
}
