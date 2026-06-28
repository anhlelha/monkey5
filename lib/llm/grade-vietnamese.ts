// Vietnamese Writing grader: scores a short văn answer (đặt câu / đoạn cảm thụ /
// viết đoạn / viết bài) on 5 criteria (noidung/camthu/dienden/chinhta/sangtao).
// The model returns the 5 sub-scores; points are computed deterministically from
// fixed weights so the score is auditable. Mirrors grade-writing.ts but for
// Vietnamese literature. Unlike the english grader, the rubric + weights are
// module constants (not admin-configurable) — only provider/model/key come from
// settings.

import { z } from "zod";
import { callLLM, extractJson } from "./client";
import { VN_WRITING_CRITERIA } from "./providers";
import type { ResolvedLLMSettings, WritingGradeResult, WritingQuestionInput } from "./types";

const verdictSchema = z.object({
  noidung: z.number().min(0).max(1),
  camthu: z.number().min(0).max(1),
  dienden: z.number().min(0).max(1),
  chinhta: z.number().min(0).max(1),
  sangtao: z.number().min(0).max(1),
  feedback: z.string().max(2000),
});

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));
const roundQuarter = (n: number): number => Math.round(n * 4) / 4;

/** Weighted blend of the 5 vietnamese criteria (0..1) using admin weights (percent). */
export function vietnameseWritingFraction(
  criteria: Record<string, number>,
  weights: Record<string, number>,
): number {
  let wsum = 0;
  let acc = 0;
  for (const c of VN_WRITING_CRITERIA) {
    const w = weights[c] ?? 0;
    wsum += w;
    acc += clamp01(criteria[c] ?? 0) * w;
  }
  return wsum > 0 ? clamp01(acc / wsum) : 0;
}

function buildUserMessage(q: WritingQuestionInput, studentAnswer: string, modelAnswer: string | null): string {
  return [
    `### Đề bài (Câu ${q.num}, tối đa ${q.points} điểm)`,
    q.stem.trim(),
    ...(modelAnswer && modelAnswer.trim().length > 0
      ? ["", "### Đáp án mẫu / Yêu cầu cần đạt (tham khảo, không bắt buộc giống hệt)", modelAnswer.trim()]
      : []),
    "",
    "### Bài làm của học sinh",
    studentAnswer.trim(),
    "",
    "### Định dạng kết quả",
    "Chỉ trả về DUY NHẤT một đối tượng JSON (không kèm chữ nào khác) đúng theo schema sau:",
    "{",
    '  "noidung": number,  // 0..1 — đúng yêu cầu đề, đủ ý',
    '  "camthu": number,   // 0..1 — cảm nhận tinh tế, cảm xúc chân thật',
    '  "dienden": number,  // 0..1 — dùng từ, đặt câu, mạch lạc',
    '  "chinhta": number,  // 0..1 — chính tả, dấu câu, hình thức/độ dài',
    '  "sangtao": number,  // 0..1 — ý tưởng & cách diễn đạt riêng',
    '  "feedback": string  // nhận xét ngắn bằng tiếng Việt',
    "}",
  ].join("\n");
}

export async function gradeVietnameseWithLLM(
  settings: ResolvedLLMSettings,
  q: WritingQuestionInput,
  studentAnswer: string,
  modelAnswer: string | null,
): Promise<WritingGradeResult> {
  const { text: raw, usage } = await callLLM({
    provider: settings.provider,
    model: settings.model,
    apiKey: settings.apiKey,
    system: settings.vnWritingPrompt,
    user: buildUserMessage(q, studentAnswer, modelAnswer),
    maxTokens: settings.maxTokens,
  });

  const v = verdictSchema.parse(extractJson(raw));
  const criteria: Record<string, number> = {
    noidung: clamp01(v.noidung),
    camthu: clamp01(v.camthu),
    dienden: clamp01(v.dienden),
    chinhta: clamp01(v.chinhta),
    sangtao: clamp01(v.sangtao),
  };
  const fraction = vietnameseWritingFraction(criteria, settings.vnWritingWeights);
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
export async function gradeVietnameseSafe(
  settings: ResolvedLLMSettings,
  q: WritingQuestionInput,
  studentAnswer: string,
  modelAnswer: string | null,
): Promise<WritingGradeResult> {
  try {
    return await gradeVietnameseWithLLM(settings, q, studentAnswer, modelAnswer);
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
