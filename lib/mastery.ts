import { prisma } from "./prisma";
import { gradeAnswer } from "./grading";
import { SUBJECT_LEVELS, type Subject } from "./subjects";

// Kept for backward-compat imports. Math level type (UI still references it).
export type Level = "L4" | "L5" | "L4+5" | "NC";

// Beta (Laplace) smoothing: PRIOR_STRENGTH pseudo-quan sát ở mức 0.5. Kéo mẫu
// nhỏ về 0.5 và xoá "vách đá" MIN_SAMPLE cũ (6/6 không còn = 100%, mà = 80%).
export const PRIOR_STRENGTH = 4;
export const PRIOR_MASTERY = 0.5;

// Trọng số dải khi gộp thành mastery chuyên đề (math). English dùng bộ riêng
// trong SUBJECT_LEVELS — giữ hằng số này để tương thích import cũ.
export const BAND_WEIGHTS: Record<string, number> = SUBJECT_LEVELS.math.bandWeights;

// Hằng số tương thích ngược: UI vẫn import BASELINE_MASTERY làm giá trị mặc định
// hiển thị cho chuyên đề chưa có dữ liệu.
export const BASELINE_MASTERY = 0.5;
/** @deprecated Vách đá MIN_SAMPLE đã thay bằng Beta smoothing (PRIOR_STRENGTH). */
export const MIN_SAMPLE = 5;

const smooth = (correct: number, total: number): number =>
  (correct + PRIOR_STRENGTH * PRIOR_MASTERY) / (total + PRIOR_STRENGTH);

export interface MasterySnapshot {
  topicMastery: Record<string, number>;
  levelMastery: Record<string, number>;
  topicSampleSize: Record<string, number>;
  levelSampleSize: Record<string, number>;
}

/**
 * Mastery thực của một học sinh cho một MÔN, tính lại từ đầu mỗi lần gọi.
 *
 * Subject scoping (2026-06-27): chỉ gom Attempt của exam đúng `subject` để
 * Toán và Tiếng Anh không trộn lẫn. Level/band lấy theo SUBJECT_LEVELS[subject]
 * (math: L4/L5/NC · english: A1/A2/B1).
 */
export async function computeMastery(
  userId: string,
  subject: Subject = "math",
): Promise<MasterySnapshot> {
  const cfg = SUBJECT_LEVELS[subject];
  const attempts = await prisma.attempt.findMany({
    where: { userId, submitted: true, exam: { subject } },
    include: { exam: { include: { questions: true } } },
  });

  // topic × band cells (cho mastery chuyên đề) + per-level cells (cho mastery cấp độ).
  const topicCell: Record<string, Record<string, { c: number; t: number }>> = {};
  const levelCell: Record<string, { c: number; t: number }> = {};
  for (const l of cfg.levels) levelCell[l] = { c: 0, t: 0 };

  const blankBands = (): Record<string, { c: number; t: number }> => {
    const o: Record<string, { c: number; t: number }> = {};
    for (const b of cfg.bands) o[b] = { c: 0, t: 0 };
    return o;
  };

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
      const band = cfg.bandOf(q.grade);
      topicCell[q.topic] ??= blankBands();
      if (topicCell[q.topic][band]) topicCell[q.topic][band].t += 1;
      const lvl = cfg.levels.includes(q.grade) ? q.grade : cfg.defaultLevel;
      levelCell[lvl].t += 1;
      if (result.correct) {
        if (topicCell[q.topic][band]) topicCell[q.topic][band].c += 1;
        levelCell[lvl].c += 1;
      }
    }
  }

  // Mastery chuyên đề = Σ_band w·smooth(band); dải chưa làm → smooth(0,0)=0.5.
  const topicMastery: Record<string, number> = {};
  const topicSampleSize: Record<string, number> = {};
  for (const t of Object.keys(topicCell)) {
    const cells = topicCell[t];
    topicMastery[t] = cfg.bands.reduce(
      (sum, b) => sum + cfg.bandWeights[b] * smooth(cells[b].c, cells[b].t),
      0,
    );
    topicSampleSize[t] = cfg.bands.reduce((sum, b) => sum + cells[b].t, 0);
  }

  // Mastery cấp độ = Beta-smoothed accuracy theo từng grade tag.
  const levelMastery: Record<string, number> = {};
  const levelSampleSize: Record<string, number> = {};
  for (const l of cfg.levels) {
    levelMastery[l] = smooth(levelCell[l].c, levelCell[l].t);
    levelSampleSize[l] = levelCell[l].t;
  }

  return { topicMastery, levelMastery, topicSampleSize, levelSampleSize };
}
