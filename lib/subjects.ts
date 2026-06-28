// Multi-subject registry. Math is the original subject; English is added on top.
// Everything subject-aware (mastery bands, level sets, difficulty formula,
// taxonomy) is centralised here so the math path keeps its exact behaviour while
// english plugs in its own taxonomy and 6-factor difficulty model.
//
// Source of the english taxonomy + radar weights: the CG-vs-NTT exam analysis
// dashboard (dashboard_so_sanh_de_thi_tieng_anh.html). See
// docs/ENGLISH-SUBJECT-DESIGN.md.

export type Subject = "math" | "english" | "vietnamese";

export const SUBJECTS: readonly Subject[] = ["math", "english", "vietnamese"] as const;

export function isSubject(v: string | null | undefined): v is Subject {
  return v === "math" || v === "english" || v === "vietnamese";
}

export interface SubjectMeta {
  id: Subject;
  name: string;
  short: string;
  ico: string;
  color: string;
  desc: string;
}

export const SUBJECT_META: Record<Subject, SubjectMeta> = {
  math: {
    id: "math",
    name: "Toán",
    short: "Toán",
    ico: "123",
    color: "var(--cg)",
    desc: "Luyện thi vào lớp 6 — 10 chuyên đề Toán.",
  },
  english: {
    id: "english",
    name: "Tiếng Anh",
    short: "Anh",
    ico: "EN",
    color: "oklch(0.6 0.14 250)",
    desc: "Luyện thi vào lớp 6 — Use of English · Reading · Writing.",
  },
  vietnamese: {
    id: "vietnamese",
    name: "Tiếng Việt",
    short: "Việt",
    ico: "TV",
    color: "oklch(0.62 0.16 25)",
    desc: "Luyện thi vào lớp 6 — Luyện từ & câu · Đọc hiểu · Cảm thụ · Viết.",
  },
};

// ─── Level sets + mastery bands per subject ──────────────────────────────────
// `levels` drives levelMastery (per-grade accuracy). `bands` is the coarser
// blend used for topic mastery (a topic is mastered only across all bands).

export interface SubjectLevelConfig {
  levels: readonly string[];
  bands: readonly string[];
  bandWeights: Record<string, number>;
  bandOf: (grade: string) => string;
  defaultLevel: string;
}

const MATH_LEVELS = ["L4", "L5", "L4+5", "NC"] as const;
const MATH_BANDS = ["L4", "L5", "NC"] as const;
const ENGLISH_LEVELS = ["A1", "A2", "B1"] as const;
const ENGLISH_BANDS = ["A1", "A2", "B1"] as const;
// Vietnamese cognitive tiers (3 mức độ nhận thức): Nhận biết / Thông hiểu / Vận dụng.
const VIETNAMESE_LEVELS = ["NB", "TH", "VD"] as const;
const VIETNAMESE_BANDS = ["NB", "TH", "VD"] as const;

export const SUBJECT_LEVELS: Record<Subject, SubjectLevelConfig> = {
  math: {
    levels: MATH_LEVELS,
    bands: MATH_BANDS,
    bandWeights: { L4: 0.3, L5: 0.45, NC: 0.25 },
    bandOf: (g) => (g === "NC" ? "NC" : g === "L5" ? "L5" : "L4"),
    defaultLevel: "L4",
  },
  english: {
    levels: ENGLISH_LEVELS,
    bands: ENGLISH_BANDS,
    bandWeights: { A1: 0.3, A2: 0.45, B1: 0.25 },
    bandOf: (g) => (g === "B1" ? "B1" : g === "A2" ? "A2" : "A1"),
    defaultLevel: "A1",
  },
  vietnamese: {
    levels: VIETNAMESE_LEVELS,
    bands: VIETNAMESE_BANDS,
    bandWeights: { NB: 0.3, TH: 0.45, VD: 0.25 },
    bandOf: (g) => (g === "VD" ? "VD" : g === "TH" ? "TH" : "NB"),
    defaultLevel: "TH",
  },
};

// ─── English skill domains (top level over the 10 topics) ────────────────────

export interface EnglishSkill {
  id: string;
  name: string;
  color: string;
}

export const ENGLISH_SKILLS: readonly EnglishSkill[] = [
  { id: "pron", name: "Ngữ âm", color: "#06b6d4" },
  { id: "useofenglish", name: "Kiến thức ngôn ngữ", color: "#3b82f6" },
  { id: "comm", name: "Giao tiếp", color: "#84cc16" },
  { id: "reading", name: "Đọc hiểu", color: "#ef4444" },
  { id: "writing", name: "Viết", color: "#8b5cf6" },
] as const;

// ─── English topics (10) — ids/colours mirror the dashboard groups ───────────

export interface EnglishTopic {
  id: string;
  skill: string;
  name: string;
  short: string;
  ico: string;
  color: string;
  position: number;
}

export const ENGLISH_TOPICS: readonly EnglishTopic[] = [
  { id: "en-phon", skill: "pron", name: "Ngữ âm", short: "Ngữ âm", ico: "ðə", color: "#06b6d4", position: 0 },
  { id: "en-stress", skill: "pron", name: "Trọng âm", short: "Trọng âm", ico: "´", color: "#14b8a6", position: 1 },
  { id: "en-gram", skill: "useofenglish", name: "Ngữ pháp", short: "Ngữ pháp", ico: "G", color: "#3b82f6", position: 2 },
  { id: "en-vocab", skill: "useofenglish", name: "Từ vựng", short: "Từ vựng", ico: "W", color: "#f59e0b", position: 3 },
  { id: "en-synant", skill: "useofenglish", name: "Đồng/Trái nghĩa", short: "Đồng/Trái", ico: "⇄", color: "#a855f7", position: 4 },
  { id: "en-error", skill: "useofenglish", name: "Sửa lỗi", short: "Sửa lỗi", ico: "✗", color: "#ec4899", position: 5 },
  { id: "en-comm", skill: "comm", name: "Giao tiếp", short: "Giao tiếp", ico: "💬", color: "#84cc16", position: 6 },
  { id: "en-read", skill: "reading", name: "Đọc hiểu", short: "Đọc hiểu", ico: "📖", color: "#ef4444", position: 7 },
  { id: "en-cwrite", skill: "writing", name: "Viết câu (kiểm soát)", short: "Viết câu", ico: "✎", color: "#f97316", position: 8 },
  { id: "en-fwrite", skill: "writing", name: "Viết đoạn (tự do)", short: "Viết đoạn", ico: "¶", color: "#8b5cf6", position: 9 },
] as const;

export const englishTopicById = (id: string): EnglishTopic | undefined =>
  ENGLISH_TOPICS.find((t) => t.id === id);

export const skillOfTopic = (topicId: string): string =>
  englishTopicById(topicId)?.skill ?? "useofenglish";

export const englishSkillById = (id: string): EnglishSkill | undefined =>
  ENGLISH_SKILLS.find((s) => s.id === id);

// ─── English 6-factor difficulty (radar) ─────────────────────────────────────
// Weights copied verbatim from the dashboard's "Đánh giá độ khó" tab.

export interface EnglishFactorDef {
  key: string;
  label: string;
  weight: number; // 0..1, sums to 1.0
}

export const ENGLISH_FACTORS: readonly EnglishFactorDef[] = [
  { key: "readingLoad", label: "Tải đọc hiểu", weight: 0.25 },
  { key: "productiveWriting", label: "Viết sản sinh", weight: 0.2 },
  { key: "higherOrder", label: "Vận dụng/suy luận", weight: 0.2 },
  { key: "timePressure", label: "Áp lực thời gian", weight: 0.15 },
  { key: "vocabDepth", label: "Độ sâu từ vựng", weight: 0.1 },
  { key: "skillDiversity", label: "Đa dạng kỹ năng", weight: 0.1 },
] as const;

export type EnglishFactors = Record<string, number>;

/** Weighted composite (0..100) from the 6 english factors. */
export function englishDifficultyScore(factors: EnglishFactors): number {
  return ENGLISH_FACTORS.reduce((sum, f) => sum + (factors[f.key] ?? 0) * f.weight, 0);
}

// ─── Vietnamese skill domains (top level over the 10 topics) ─────────────────
// Mirrors ENGLISH_SKILLS: 5 skill groups over the 10 chuyên đề. Source: the
// "So sánh đề thi Tiếng Việt" dashboard (CG · NTT · LTV) — 10 nhóm chuyên đề.

export interface VietnameseSkill {
  id: string;
  name: string;
  color: string;
}

export const VIETNAMESE_SKILLS: readonly VietnameseSkill[] = [
  { id: "tungu", name: "Từ ngữ", color: "#f59e0b" },
  { id: "nguphap", name: "Ngữ pháp & câu", color: "#3b82f6" },
  { id: "tuturct", name: "Tu từ & Chính tả", color: "#a855f7" },
  { id: "dochieu", name: "Đọc hiểu & cảm thụ", color: "#ef4444" },
  { id: "viet", name: "Viết", color: "#8b5cf6" },
] as const;

// ─── Vietnamese topics (10) — ids/colours mirror the dashboard groups ────────

export interface VietnameseTopic {
  id: string;
  skill: string;
  name: string;
  short: string;
  ico: string;
  color: string;
  position: number;
}

export const VIETNAMESE_TOPICS: readonly VietnameseTopic[] = [
  { id: "vn-vocab", skill: "tungu", name: "Từ vựng & nghĩa từ", short: "Từ vựng", ico: "Tn", color: "#f59e0b", position: 0 },
  { id: "vn-wordform", skill: "tungu", name: "Cấu tạo từ (láy/ghép)", short: "Cấu tạo từ", ico: "Lg", color: "#14b8a6", position: 1 },
  { id: "vn-syntax", skill: "nguphap", name: "Ngữ pháp câu", short: "Ngữ pháp", ico: "C", color: "#3b82f6", position: 2 },
  { id: "vn-senttype", skill: "nguphap", name: "Kiểu câu (mục đích nói)", short: "Kiểu câu", ico: "?!", color: "#06b6d4", position: 3 },
  { id: "vn-cohesion", skill: "nguphap", name: "Liên kết câu", short: "Liên kết", ico: "↔", color: "#84cc16", position: 4 },
  { id: "vn-rhetoric", skill: "tuturct", name: "Biện pháp tu từ", short: "Tu từ", ico: "✦", color: "#a855f7", position: 5 },
  { id: "vn-spelling", skill: "tuturct", name: "Chính tả / Dấu câu / Viết hoa", short: "Chính tả", ico: "Aa", color: "#ec4899", position: 6 },
  { id: "vn-reading", skill: "dochieu", name: "Đọc hiểu & cảm thụ", short: "Đọc hiểu", ico: "📖", color: "#ef4444", position: 7 },
  { id: "vn-makesent", skill: "viet", name: "Đặt câu / viết câu", short: "Đặt câu", ico: "✎", color: "#f97316", position: 8 },
  { id: "vn-writing", skill: "viet", name: "Viết đoạn / viết bài", short: "Viết", ico: "¶", color: "#8b5cf6", position: 9 },
] as const;

export const vietnameseTopicById = (id: string): VietnameseTopic | undefined =>
  VIETNAMESE_TOPICS.find((t) => t.id === id);

export const vnSkillOfTopic = (topicId: string): string =>
  vietnameseTopicById(topicId)?.skill ?? "tungu";

export const vietnameseSkillById = (id: string): VietnameseSkill | undefined =>
  VIETNAMESE_SKILLS.find((s) => s.id === id);

// ─── Vietnamese 6-factor difficulty (radar) ──────────────────────────────────
// Weights copied from the dashboard's "Đánh giá độ khó" tab (Tiếng Việt):
// Cảm thụ 25 · Viết sản sinh 25 · Độ rộng kiến thức 20 · Vận dụng 15 ·
// Áp lực thời gian 10 · Bẫy/phân hóa 5.

export interface VietnameseFactorDef {
  key: string;
  label: string;
  weight: number; // 0..1, sums to 1.0
}

export const VIETNAMESE_FACTORS: readonly VietnameseFactorDef[] = [
  { key: "litComprehension", label: "Cảm thụ văn học", weight: 0.25 },
  { key: "productiveWriting", label: "Viết sản sinh", weight: 0.25 },
  { key: "breadth", label: "Độ rộng kiến thức", weight: 0.2 },
  { key: "higherOrder", label: "Vận dụng / suy luận", weight: 0.15 },
  { key: "timePressure", label: "Áp lực thời gian", weight: 0.1 },
  { key: "trickiness", label: "Bẫy / phân hóa", weight: 0.05 },
] as const;

export type VietnameseFactors = Record<string, number>;

/** Weighted composite (0..100) from the 6 vietnamese factors. */
export function vietnameseDifficultyScore(factors: VietnameseFactors): number {
  return VIETNAMESE_FACTORS.reduce((sum, f) => sum + (factors[f.key] ?? 0) * f.weight, 0);
}
