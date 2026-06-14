import { prisma } from "./prisma";
import { gradeAnswer } from "./grading";

const LEVELS = ["L4", "L5", "L4+5", "NC"] as const;
export type Level = (typeof LEVELS)[number];

export const MIN_SAMPLE = 5;
export const BASELINE_MASTERY = 0.5;

export interface MasterySnapshot {
  topicMastery: Record<string, number>;
  levelMastery: Record<Level, number>;
  topicSampleSize: Record<string, number>;
  levelSampleSize: Record<Level, number>;
}

export async function computeMastery(userId: string): Promise<MasterySnapshot> {
  const topicCorrect: Record<string, number> = {};
  const topicTotal: Record<string, number> = {};
  const levelCorrect: Record<string, number> = {};
  const levelTotal: Record<string, number> = {};

  // 1. TopicSession aggregation
  const sessions = await prisma.topicSession.findMany({
    where: { userId },
    select: { topic: true, level: true, score: true, qcount: true },
  });
  for (const s of sessions) {
    topicCorrect[s.topic] = (topicCorrect[s.topic] ?? 0) + s.score;
    topicTotal[s.topic] = (topicTotal[s.topic] ?? 0) + s.qcount;
    levelCorrect[s.level] = (levelCorrect[s.level] ?? 0) + s.score;
    levelTotal[s.level] = (levelTotal[s.level] ?? 0) + s.qcount;
  }

  // 2. Attempt aggregation
  const attempts = await prisma.attempt.findMany({
    where: { userId, submitted: true },
    include: { exam: { include: { questions: true } } },
  });
  for (const a of attempts) {
    let answers: Record<string, unknown> = {};
    try {
      answers = JSON.parse(a.answers) as Record<string, unknown>;
    } catch {
      continue;
    }
    for (const q of a.exam.questions) {
      const ans = answers[q.id];
      if (ans === undefined || ans === null || ans === "") continue;
      const result = gradeAnswer(
        {
          type: q.type as "fill" | "mcq" | "essay",
          correct: q.correct,
          answerSchema: q.answerSchema,
        },
        ans as string | { text?: string; drawings?: string[] } | null | undefined,
      );
      topicTotal[q.topic] = (topicTotal[q.topic] ?? 0) + 1;
      levelTotal[q.grade] = (levelTotal[q.grade] ?? 0) + 1;
      if (result.correct) {
        topicCorrect[q.topic] = (topicCorrect[q.topic] ?? 0) + 1;
        levelCorrect[q.grade] = (levelCorrect[q.grade] ?? 0) + 1;
      }
    }
  }

  const topicMastery: Record<string, number> = {};
  const topicSampleSize: Record<string, number> = {};
  for (const t of Object.keys(topicTotal)) {
    const total = topicTotal[t];
    topicSampleSize[t] = total;
    topicMastery[t] = total < MIN_SAMPLE ? BASELINE_MASTERY : (topicCorrect[t] ?? 0) / total;
  }

  const levelMastery: Record<Level, number> = { L4: BASELINE_MASTERY, L5: BASELINE_MASTERY, "L4+5": BASELINE_MASTERY, NC: BASELINE_MASTERY };
  const levelSampleSize: Record<Level, number> = { L4: 0, L5: 0, "L4+5": 0, NC: 0 };
  for (const l of LEVELS) {
    const total = levelTotal[l] ?? 0;
    levelSampleSize[l] = total;
    levelMastery[l] = total < MIN_SAMPLE ? BASELINE_MASTERY : (levelCorrect[l] ?? 0) / total;
  }

  return { topicMastery, levelMastery, topicSampleSize, levelSampleSize };
}
