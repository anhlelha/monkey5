import { prisma } from "./prisma";
import { gradeAnswer } from "./grading";

const LEVELS = ["L4", "L5", "L4+5", "NC"] as const;
export type Level = (typeof LEVELS)[number];

// ── Difficulty bands for the topic-mastery blend ─────────────────────────────
// "Thuần thục" một chuyên đề đòi hỏi chứng minh ở cả 3 dải độ khó, không chỉ L4.
// L4+5 (tổng hợp) gộp về dải L4.
const BANDS = ["L4", "L5", "NC"] as const;
type Band = (typeof BANDS)[number];
const bandOf = (grade: string): Band => (grade === "NC" ? "NC" : grade === "L5" ? "L5" : "L4");

// Beta (Laplace) smoothing: PRIOR_STRENGTH pseudo-quan sát ở mức 0.5. Kéo mẫu
// nhỏ về 0.5 và xoá "vách đá" MIN_SAMPLE cũ (6/6 không còn = 100%, mà = 80%).
export const PRIOR_STRENGTH = 4;
export const PRIOR_MASTERY = 0.5;

// Trọng số dải khi gộp thành mastery chuyên đề. Dải CHƯA làm đóng góp prior 0.5
// (qua smooth(0,0)), nên topic chỉ luyện L4 bị chặn ở ~0.59.
export const BAND_WEIGHTS: Record<Band, number> = { L4: 0.3, L5: 0.45, NC: 0.25 };

// Hằng số tương thích ngược: UI vẫn import BASELINE_MASTERY làm giá trị mặc định
// hiển thị cho chuyên đề chưa có dữ liệu.
export const BASELINE_MASTERY = 0.5;
/** @deprecated Vách đá MIN_SAMPLE đã thay bằng Beta smoothing (PRIOR_STRENGTH). */
export const MIN_SAMPLE = 5;

const smooth = (correct: number, total: number): number =>
  (correct + PRIOR_STRENGTH * PRIOR_MASTERY) / (total + PRIOR_STRENGTH);

export interface MasterySnapshot {
  topicMastery: Record<string, number>;
  levelMastery: Record<Level, number>;
  topicSampleSize: Record<string, number>;
  levelSampleSize: Record<Level, number>;
}

/**
 * Mastery thực của một học sinh, tính lại từ đầu mỗi lần gọi.
 *
 * Thay đổi so với bản cũ (2026-06-18):
 *  1. Gom CHỈ từ Attempt (theo từng câu) — bỏ gộp TopicSession để hết đếm trùng
 *     (bài luyện chuyên đề tạo cả Attempt lẫn TopicSession cùng bộ câu).
 *  2. Beta smoothing thay cho ngưỡng MIN_SAMPLE cứng.
 *  3. Mastery chuyên đề = trung bình có trọng số theo dải L4/L5/NC; dải chưa làm
 *     giữ prior 0.5 → phản ánh "đã đảo qua các mức chưa".
 */
export async function computeMastery(userId: string): Promise<MasterySnapshot> {
  const attempts = await prisma.attempt.findMany({
    where: { userId, submitted: true },
    include: { exam: { include: { questions: true } } },
  });

  // topic × band cells (cho mastery chuyên đề) + per-level cells (cho mastery cấp độ).
  const topicCell: Record<string, Record<Band, { c: number; t: number }>> = {};
  const levelCell: Record<Level, { c: number; t: number }> = {
    L4: { c: 0, t: 0 },
    L5: { c: 0, t: 0 },
    "L4+5": { c: 0, t: 0 },
    NC: { c: 0, t: 0 },
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
      const band = bandOf(q.grade);
      topicCell[q.topic] ??= { L4: { c: 0, t: 0 }, L5: { c: 0, t: 0 }, NC: { c: 0, t: 0 } };
      topicCell[q.topic][band].t += 1;
      const lvl: Level = (LEVELS as readonly string[]).includes(q.grade) ? (q.grade as Level) : "L4";
      levelCell[lvl].t += 1;
      if (result.correct) {
        topicCell[q.topic][band].c += 1;
        levelCell[lvl].c += 1;
      }
    }
  }

  // Mastery chuyên đề = Σ_band w·smooth(band); dải chưa làm → smooth(0,0)=0.5.
  const topicMastery: Record<string, number> = {};
  const topicSampleSize: Record<string, number> = {};
  for (const t of Object.keys(topicCell)) {
    const cells = topicCell[t];
    topicMastery[t] = BANDS.reduce((sum, b) => sum + BAND_WEIGHTS[b] * smooth(cells[b].c, cells[b].t), 0);
    topicSampleSize[t] = BANDS.reduce((sum, b) => sum + cells[b].t, 0);
  }

  // Mastery cấp độ = Beta-smoothed accuracy theo từng grade tag.
  const levelMastery: Record<Level, number> = { L4: PRIOR_MASTERY, L5: PRIOR_MASTERY, "L4+5": PRIOR_MASTERY, NC: PRIOR_MASTERY };
  const levelSampleSize: Record<Level, number> = { L4: 0, L5: 0, "L4+5": 0, NC: 0 };
  for (const l of LEVELS) {
    levelMastery[l] = smooth(levelCell[l].c, levelCell[l].t);
    levelSampleSize[l] = levelCell[l].t;
  }

  return { topicMastery, levelMastery, topicSampleSize, levelSampleSize };
}
