// Attempt-level scoring that combines rule-based grading (mcq/fill) with
// AI essay grading. Single source of truth for both submit and regrade.

import { prisma } from "@/lib/prisma";
import { gradeAnswer } from "@/lib/grading";
import { gradeEssaySafe } from "@/lib/llm/grade-essay";
import { getResolvedLLMSettings } from "@/lib/llm-settings";
import type { EssayGradeResult, EssayQuestionInput, ResolvedLLMSettings } from "@/lib/llm/types";

/** An essay is counted as a "correct" question (for stats) at/above this fraction. */
const ESSAY_PASS_FRACTION = 0.5;

const flatText = (a: unknown): string => {
  if (a === null || a === undefined) return "";
  if (typeof a === "string") return a.trim();
  if (typeof a === "object" && "text" in a) return String((a as { text?: unknown }).text ?? "").trim();
  return "";
};

function parseAnswers(raw: string): Record<string, unknown> {
  try {
    return (JSON.parse(raw) as Record<string, unknown>) ?? {};
  } catch {
    return {};
  }
}

export interface RecomputeResult {
  earned: number;
  total: number;
  score: number;
  correctCount: number;
  essaysGraded: number;
  essaysErrored: number;
}

interface RecomputeOptions {
  /**
   * When true, (re)grade essays via the LLM now. When false, reuse any existing
   * EssayGrade rows and skip ungraded essays (award 0).
   */
  gradeEssays: boolean;
  /** Pre-resolved settings (avoids a second DB read). Falsy → fetch lazily. */
  settings?: ResolvedLLMSettings | null;
}

/**
 * Recompute an attempt's earned/score from scratch and (optionally) AI-grade its
 * essay questions, persisting EssayGrade rows and the updated Attempt totals.
 */
export async function recomputeAttemptScore(
  attemptId: string,
  options: RecomputeOptions,
): Promise<RecomputeResult> {
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt) throw new Error("Attempt not found");

  const exam = await prisma.exam.findUnique({
    where: { id: attempt.examId },
    include: { questions: true },
  });
  if (!exam) throw new Error("Exam not found");

  const answers = parseAnswers(attempt.answers);

  const settings = options.gradeEssays
    ? options.settings ?? (await getResolvedLLMSettings())
    : null;

  // Existing essay grades — reused when not regrading.
  const existing = await prisma.essayGrade.findMany({ where: { attemptId } });
  const existingByQ = new Map(existing.map((g) => [g.questionId, g]));

  let earned = 0;
  let total = 0;
  let correctCount = 0;
  let essaysGraded = 0;
  let essaysErrored = 0;

  // Grade essays first (in parallel) so the main loop can sum synchronously.
  const newGrades = new Map<string, EssayGradeResult>();
  if (options.gradeEssays && settings) {
    const essayJobs = exam.questions
      .filter((q) => q.type === "essay")
      .map((q) => ({ q, text: flatText(answers[q.id]) }))
      .filter((j) => j.text.length > 0);

    const results = await Promise.all(
      essayJobs.map(async (j) => {
        const input: EssayQuestionInput = {
          num: j.q.num,
          stem: j.q.stem,
          correct: j.q.correct,
          modelAnswer: j.q.modelAnswer,
          unit: j.q.unit,
          points: j.q.points,
        };
        return { qid: j.q.id, result: await gradeEssaySafe(settings, input, j.text) };
      }),
    );
    for (const r of results) newGrades.set(r.qid, r.result);
  }

  for (const q of exam.questions) {
    total += q.points;
    const raw = answers[q.id];

    if (q.type === "essay") {
      const fresh = newGrades.get(q.id);
      if (fresh) {
        earned += fresh.earned;
        if (fresh.fraction >= ESSAY_PASS_FRACTION) correctCount += 1;
        if (fresh.status === "graded") essaysGraded += 1;
        else essaysErrored += 1;
      } else if (!options.gradeEssays) {
        const prev = existingByQ.get(q.id);
        if (prev) {
          earned += prev.earned;
          if (prev.fraction >= ESSAY_PASS_FRACTION) correctCount += 1;
        }
      }
      // else: regrade requested but answer empty / no settings → 0 points.
      continue;
    }

    const result = gradeAnswer(
      { type: q.type as "fill" | "mcq", correct: q.correct, answerSchema: q.answerSchema },
      raw as string | { text?: string } | null | undefined,
    );
    if (result.correct) {
      earned += q.points;
      correctCount += 1;
    }
  }

  // Persist fresh essay grades (replace prior rows for graded questions).
  if (newGrades.size > 0) {
    await prisma.$transaction([
      prisma.essayGrade.deleteMany({
        where: { attemptId, questionId: { in: [...newGrades.keys()] } },
      }),
      prisma.essayGrade.createMany({
        data: [...newGrades.entries()].map(([questionId, g]) => ({
          attemptId,
          questionId,
          fraction: g.fraction,
          earned: g.earned,
          points: g.points,
          answerCorrect: g.answerCorrect,
          methodScore: g.methodScore,
          guessed: g.guessed,
          feedback: g.feedback,
          provider: g.provider,
          model: g.model,
          status: g.status,
          error: g.error,
        })),
      }),
    ]);
  }

  const roundedEarned = Math.round(earned * 100) / 100;
  const score = total > 0 ? Math.round((roundedEarned / total) * 100) : 0;

  await prisma.attempt.update({
    where: { id: attemptId },
    data: { earned: roundedEarned, total, score },
  });

  return {
    earned: roundedEarned,
    total,
    score,
    correctCount,
    essaysGraded,
    essaysErrored,
  };
}
