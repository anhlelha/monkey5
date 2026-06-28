// English Writing grader: scores a short free paragraph on 5 criteria
// (task/lexical/grammar/cohesion/length). The model returns the 5 sub-scores;
// the points are computed deterministically from the admin's weights so the
// score is auditable. Mirrors grade-essay.ts but for productive writing.

import { z } from "zod";
import { callLLM, extractJson } from "./client";
import { WRITING_CRITERIA } from "./providers";
import type { ResolvedLLMSettings, WritingGradeResult, WritingQuestionInput } from "./types";

const verdictSchema = z.object({
  task: z.number().min(0).max(1),
  lexical: z.number().min(0).max(1),
  grammar: z.number().min(0).max(1),
  cohesion: z.number().min(0).max(1),
  length: z.number().min(0).max(1),
  feedback: z.string().max(2000),
});

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));
const roundQuarter = (n: number): number => Math.round(n * 4) / 4;

/** Weighted blend of the 5 criteria (0..1) using admin weights (percent). */
export function writingFraction(
  criteria: Record<string, number>,
  weights: Record<string, number>,
): number {
  let wsum = 0;
  let acc = 0;
  for (const c of WRITING_CRITERIA) {
    const w = weights[c] ?? 0;
    wsum += w;
    acc += clamp01(criteria[c] ?? 0) * w;
  }
  return wsum > 0 ? clamp01(acc / wsum) : 0;
}

function buildUserMessage(q: WritingQuestionInput, studentAnswer: string): string {
  return [
    `### Writing prompt (Question ${q.num}, max ${q.points} points)`,
    q.stem.trim(),
    "",
    `### Pupil's paragraph`,
    studentAnswer.trim(),
    "",
    "### Required output",
    "Return ONLY one JSON object (no other text) matching this schema exactly:",
    "{",
    '  "task": number,      // 0..1 — addresses the prompt fully',
    '  "lexical": number,   // 0..1 — vocabulary range & accuracy',
    '  "grammar": number,   // 0..1 — grammatical accuracy & variety',
    '  "cohesion": number,  // 0..1 — linking & organisation',
    '  "length": number,    // 0..1 — meets required word count',
    '  "feedback": string   // short feedback in Vietnamese',
    "}",
  ].join("\n");
}

export async function gradeWritingWithLLM(
  settings: ResolvedLLMSettings,
  q: WritingQuestionInput,
  studentAnswer: string,
): Promise<WritingGradeResult> {
  const { text: raw, usage } = await callLLM({
    provider: settings.provider,
    model: settings.model,
    apiKey: settings.apiKey,
    system: settings.writingPrompt,
    user: buildUserMessage(q, studentAnswer),
    maxTokens: settings.maxTokens,
  });

  const v = verdictSchema.parse(extractJson(raw));
  const criteria: Record<string, number> = {
    task: clamp01(v.task),
    lexical: clamp01(v.lexical),
    grammar: clamp01(v.grammar),
    cohesion: clamp01(v.cohesion),
    length: clamp01(v.length),
  };
  const fraction = writingFraction(criteria, settings.writingWeights);
  const earned = roundQuarter(fraction * q.points);

  return {
    fraction,
    earned,
    points: q.points,
    criteria,
    feedback: v.feedback.trim(),
    provider: settings.provider,
    model: settings.model,
    status: "graded",
    error: null,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
  };
}

/** Never-throws wrapper. */
export async function gradeWritingSafe(
  settings: ResolvedLLMSettings,
  q: WritingQuestionInput,
  studentAnswer: string,
): Promise<WritingGradeResult> {
  try {
    return await gradeWritingWithLLM(settings, q, studentAnswer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định.";
    return {
      fraction: 0,
      earned: 0,
      points: q.points,
      criteria: {},
      feedback: "AI chưa chấm được bài viết này. Quản trị viên có thể chấm lại sau.",
      provider: settings.provider,
      model: settings.model,
      status: "error",
      error: message,
      inputTokens: 0,
      outputTokens: 0,
    };
  }
}
