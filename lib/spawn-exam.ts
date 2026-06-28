// Spawns a fresh "reference" exam by cloning questions from the official bank.
// Triggered when a user clicks a "Phỏng đề X" CTA on the library page; the URL
// /exam/ref-<schoolId>-<rand> resolves to a 404 on the first visit, the page
// route detects it and calls this helper, then redirects to the new examId.

import { prisma } from "./prisma";
import { MIX_SCHOOL, SCHOOLS } from "./static";
import {
  effectivePlan,
  getPlanConfig,
  getLevelConfig,
  countTopicSets,
} from "@/lib/plan-config";
import { classifyAnswer } from "@/lib/grading/classify";

// Spawned clones lose their answerSchema if we just copy q.answerSchema — older
// source rows in the bank may still be null because seed-all-exams hasn't been
// re-run after the auto-classify integration landed. Fall back to live
// classification so the clone always has a usable schema.
function resolveAnswerSchema(
  type: string,
  correct: string | null,
  existing: string | null,
): string | null {
  if (existing) return existing;
  if (type !== "fill" || !correct) return null;
  const cls = classifyAnswer(correct);
  if (cls.confidence === "low") return null;
  if (cls.schema.kind === "exact") return null;
  return JSON.stringify(cls.schema);
}

export class TopicSetLimitError extends Error {
  constructor() {
    super("Đã hết lượt luyện chuyên đề");
    this.name = "TopicSetLimitError";
  }
}

export class TopicSetEmptyError extends Error {
  constructor() {
    super("Chuyên đề này chưa có câu hỏi ở mức đã chọn");
    this.name = "TopicSetEmptyError";
  }
}

const POOL_OVERFETCH = 5;

const randSuffix = () => Math.random().toString(36).slice(2, 10);

const todayLabelVi = (): string => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const shuffle = <T,>(arr: T[]): T[] =>
  arr
    .map((v) => ({ v, k: Math.random() }))
    .sort((a, b) => a.k - b.k)
    .map(({ v }) => v);

const TOPIC_SET_MAX = 12;

// Topic-practice selection that keeps reading-comprehension groups intact.
// Reading questions share a `passageId`; the đọc hiểu block must travel with
// ALL its sub-questions, never a random subset. Standalone questions (no
// passageId) are singleton units. We shuffle UNITS (not questions), then pack
// units into the set while keeping each group whole and staying near `max`.
// Input rows are assumed ordered by `num` asc so sub-questions stay in order.
function pickKeepingPassageGroups<T extends { passageId: string | null }>(
  pool: T[],
  max = TOPIC_SET_MAX,
): T[] {
  const groups = new Map<string, T[]>();
  const units: T[][] = [];
  for (const q of pool) {
    if (!q.passageId) {
      units.push([q]);
      continue;
    }
    const existing = groups.get(q.passageId);
    if (existing) {
      existing.push(q);
    } else {
      const unit = [q];
      groups.set(q.passageId, unit);
      units.push(unit);
    }
  }

  const picked: T[] = [];
  for (const unit of shuffle(units)) {
    if (picked.length === 0 || picked.length + unit.length <= max) {
      picked.push(...unit);
    }
    if (picked.length >= max) break;
  }
  return picked;
}

// Returns the id of a newly-created `reference` Exam with cloned Question rows.
export async function spawnReferenceExam(schoolId: string): Promise<string> {
  const school = SCHOOLS.find((s) => s.id === schoolId) ?? MIX_SCHOOL;
  const isMix = school.id === "mix";
  const minutes = school.minutes;
  const targetQcount = Math.max(8, Math.round(minutes / 4.5));

  // Pool: questions belonging to a real official exam. Prefer same-school for
  // non-MIX; fall back to all official questions if the same-school bank is thin.
  let pool = await prisma.question.findMany({
    where: isMix
      ? { examId: { not: null }, exam: { kind: "official" } }
      : { examId: { not: null }, exam: { school: school.id, kind: "official" } },
    include: { exam: true },
    take: targetQcount * POOL_OVERFETCH,
  });

  if (!isMix && pool.length < targetQcount) {
    pool = await prisma.question.findMany({
      where: { examId: { not: null }, exam: { kind: "official" } },
      include: { exam: true },
      take: targetQcount * POOL_OVERFETCH,
    });
  }

  const picked = shuffle(pool).slice(0, Math.min(targetQcount, pool.length));

  const newId = `ref-${school.id}-${Date.now().toString(36)}-${randSuffix()}`;

  await prisma.exam.create({
    data: {
      id: newId,
      school: school.id,
      kind: "reference",
      year: `Phỏng ${school.short} · ${todayLabelVi()}`,
      title: `Phỏng đề ${school.name}`,
      intro:
        "Đề tham khảo phỏng tạo từ ngân hàng câu hỏi. Không phải đề thật — không tính vào % sẵn sàng.",
      minutes,
      qcount: picked.length,
      generated: true,
      note: `Phỏng phong cách ${school.short}`,
    },
  });

  if (picked.length > 0) {
    await prisma.question.createMany({
      data: picked.map((q, i) => {
        const schoolObj = SCHOOLS.find((s) => s.id === q.exam?.school);
        const sourceLabel = q.source || (q.exam?.kind === "official" ? `Trích đề ${schoolObj?.short ?? q.exam?.school?.toUpperCase() ?? ""} ${q.exam?.year || ""}`.trim() : "Bài tập hệ thống");
        return {
          examId: newId,
          num: i + 1,
          type: q.type,
          topic: q.topic,
          grade: q.grade,
          points: q.points,
          stem: q.stem,
          unit: q.unit,
          placeholder: q.placeholder,
          correct: q.correct,
          answerSchema: resolveAnswerSchema(q.type, q.correct, q.answerSchema),
          options: q.options,
          modelAnswer: q.modelAnswer,
          figure: q.figure,
          source: sourceLabel,
        };
      }),
    });
  }

  return newId;
}

// ─── Topic-set spawn (called from /exam/set-<topic>-<level>-<rand>) ─────────
// Each level CTA on the topic detail page produces a stub URL. On first visit
// the page route detects the missing exam, calls this helper, then redirects
// to the new examId. Submitting the exam writes a TopicSession row too.

export async function spawnTopicSetExam(
  topicId: string,
  level: string,
  userId: string,
  sourceFilter: "official" | "supplement" | "all" = "all",
): Promise<string> {
  const lvl = level.toUpperCase();

  // ── Quota check ────────────────────────────────────────────────────────────
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, plan: true },
  });
  const plan = effectivePlan({ role: dbUser?.role, plan: dbUser?.plan });
  const { topicSetLimit } = await getPlanConfig(plan);
  const used = await countTopicSets(userId);
  if (used >= topicSetLimit) {
    throw new TopicSetLimitError();
  }

  // ── Level config from DB (falls back to hardcoded defaults) ────────────────
  const cfg = await getLevelConfig(lvl);

  // ── Build query filters based on source ────────────────────────────────────
  const baseWhere: any = {
    active: true,
    topic: topicId,
    grade: { in: cfg.grades },
  };

  if (sourceFilter === "official") {
    baseWhere.examId = { not: null };
    baseWhere.exam = { kind: "official", generated: false };
  } else if (sourceFilter === "supplement") {
    baseWhere.examId = null;
  } else {
    // all: either standalone/supplementary (examId is null) or from an official non-generated exam
    baseWhere.OR = [
      { examId: null },
      {
        examId: { not: null },
        exam: { kind: "official", generated: false },
      },
    ];
  }

  // Strict per-level pool. We intentionally do NOT relax the grade filter when
  // the pool is thin: padding an "L4 · Cơ bản" set with L5/NC questions defeats
  // the level's purpose and mislabels harder questions as basic ones. A thin
  // pool simply yields fewer questions (capped below); an empty pool means the
  // topic has no content at this level and the level card is locked upstream.
  const pool = await prisma.question.findMany({
    where: baseWhere,
    include: { exam: true },
  });

  if (pool.length === 0) {
    throw new TopicSetEmptyError();
  }

  // ── Query previously seen questions by user to enable deduplication ───────
  const userTopicSets = await prisma.userTopicSet.findMany({
    where: { userId },
    select: { examId: true },
  });
  const userExamIds = userTopicSets.map((x) => x.examId);

  const seenQuestions = await prisma.question.findMany({
    where: {
      examId: { in: userExamIds },
      sourceQuestionId: { not: null },
    },
    select: { sourceQuestionId: true },
  });
  const seenQuestionIds = new Set(
    seenQuestions
      .map((q) => q.sourceQuestionId)
      .filter((id): id is string => !!id)
  );

  // ── Shuffle and Pick Questions ─────────────────────────────────────────────
  const shuffledPool = shuffle(pool);
  let picked: typeof pool = [];

  if (sourceFilter === "supplement") {
    // Supplementary: strictly use once (exclude seen)
    const unseenPool = shuffledPool.filter((q) => !seenQuestionIds.has(q.id));
    picked = unseenPool.slice(0, Math.min(cfg.qcount, unseenPool.length));
  } else if (sourceFilter === "official") {
    // Official: allow reuse
    picked = shuffledPool.slice(0, Math.min(cfg.qcount, shuffledPool.length));
  } else {
    // All (Mix): prioritize unseen questions (from both sources), fill remaining slots with seen official questions
    const unseenPool = shuffledPool.filter((q) => !seenQuestionIds.has(q.id));
    const seenOfficialPool = shuffledPool.filter(
      (q) => seenQuestionIds.has(q.id) && q.examId !== null
    );
    const combined = [...unseenPool, ...seenOfficialPool];
    picked = combined.slice(0, Math.min(cfg.qcount, combined.length));
  }

  const newId = `set-${topicId}-${lvl.toLowerCase()}-${sourceFilter === "all" ? "all" : sourceFilter === "official" ? "off" : "sup"}-${Date.now().toString(36)}-${randSuffix()}`;

  await prisma.exam.create({
    data: {
      id: newId,
      school: "mix",
      kind: "reference",
      year: `Luyện ${lvl} · ${todayLabelVi()}`,
      title: `Luyện chuyên đề · ${lvl}`,
      intro:
        "Bài luyện theo chuyên đề. Khỉ con đẩy ra câu hỏi mới từ ngân hàng — không trùng bài cũ.",
      minutes: cfg.minutes,
      qcount: picked.length,
      generated: true,
      note: `topic:${topicId} · level:${lvl} · filter:${sourceFilter}`,
    },
  });

  if (picked.length > 0) {
    await prisma.question.createMany({
      data: picked.map((q, i) => {
        const schoolObj = SCHOOLS.find((s) => s.id === q.exam?.school);
        const sourceLabel =
          q.source ||
          (q.exam?.kind === "official"
            ? `Trích đề ${schoolObj?.short ?? q.exam?.school?.toUpperCase() ?? ""} ${q.exam?.year || ""}`.trim()
            : "Bài tập hệ thống");
        return {
          examId: newId,
          num: i + 1,
          type: q.type,
          topic: q.topic,
          grade: q.grade,
          points: q.points,
          stem: q.stem,
          unit: q.unit,
          placeholder: q.placeholder,
          correct: q.correct,
          answerSchema: resolveAnswerSchema(q.type, q.correct, q.answerSchema),
          options: q.options,
          modelAnswer: q.modelAnswer,
          figure: q.figure,
          source: sourceLabel,
          sourceQuestionId: q.id,
        };
      }),
    });
  }

  // ── Record in ledger ────────────────────────────────────────────────────────
  await prisma.userTopicSet.create({
    data: { userId, examId: newId, topic: topicId, level: lvl },
  });

  return newId;
}

// ─── English topic-practice spawn ───────────────────────────────────────────
// Clicking an english topic card spawns a practice set from that topic's
// questions across the official english exams. Simpler than the math version:
// no level tiers / quota — english uses CEFR within the pooled questions.
// School "mix" + kind "reference" keep it out of the cg/ntt difficulty profile
// (mix is a pseudo-school) while still feeding english mastery on submit.
export async function spawnEnglishTopicSet(topicId: string, _userId: string): Promise<string> {
  const pool = await prisma.question.findMany({
    where: {
      active: true,
      topic: topicId,
      subject: "english",
      examId: { not: null },
      exam: { kind: "official", subject: "english" },
    },
    include: { exam: true },
    orderBy: { num: "asc" },
  });

  if (pool.length === 0) throw new TopicSetEmptyError();

  const picked = pickKeepingPassageGroups(pool);
  const newId = `enset-${Date.now().toString(36)}-${randSuffix()}`;

  await prisma.exam.create({
    data: {
      id: newId,
      subject: "english",
      school: "mix",
      kind: "reference",
      year: `Luyện · ${todayLabelVi()}`,
      title: "Luyện chuyên đề Tiếng Anh",
      intro: "Bài luyện theo chuyên đề Tiếng Anh — câu hỏi rút từ các đề chính thức.",
      minutes: Math.max(10, picked.length * 2),
      qcount: picked.length,
      generated: true,
      note: `en-topic:${topicId}`,
    },
  });

  await prisma.question.createMany({
    data: picked.map((q, i) => ({
      examId: newId,
      subject: "english",
      num: i + 1,
      type: q.type,
      topic: q.topic,
      skill: q.skill,
      grade: q.grade,
      tags: q.tags,
      points: q.points,
      stem: q.stem,
      unit: q.unit,
      placeholder: q.placeholder,
      correct: q.correct,
      answerSchema: q.answerSchema,
      options: q.options,
      modelAnswer: q.modelAnswer,
      figure: q.figure,
      passageId: q.passageId,
      source: q.source,
      sourceQuestionId: q.id,
    })),
  });

  return newId;
}

// ─── Vietnamese topic-practice spawn ────────────────────────────────────────
// Clicking a vietnamese topic card spawns a practice set from that topic's
// questions across the official vietnamese exams. Mirrors spawnEnglishTopicSet:
// no level tiers — 12 questions max, school "mix", kind "reference", prefix
// "vnset-". Passages are carried so reading questions keep their passage block.
export async function spawnVietnameseTopicSet(topicId: string, _userId: string): Promise<string> {
  const pool = await prisma.question.findMany({
    where: {
      active: true,
      topic: topicId,
      subject: "vietnamese",
      examId: { not: null },
      exam: { kind: "official", subject: "vietnamese" },
    },
    include: { exam: true },
    orderBy: { num: "asc" },
  });

  if (pool.length === 0) throw new TopicSetEmptyError();

  const picked = pickKeepingPassageGroups(pool);
  const newId = `vnset-${Date.now().toString(36)}-${randSuffix()}`;

  await prisma.exam.create({
    data: {
      id: newId,
      subject: "vietnamese",
      school: "mix",
      kind: "reference",
      year: `Luyện · ${todayLabelVi()}`,
      title: "Luyện chuyên đề Tiếng Việt",
      intro: "Bài luyện theo chuyên đề Tiếng Việt — câu hỏi rút từ các đề chính thức.",
      minutes: Math.max(10, picked.length * 2),
      qcount: picked.length,
      generated: true,
      note: `vn-topic:${topicId}`,
    },
  });

  await prisma.question.createMany({
    data: picked.map((q, i) => ({
      examId: newId,
      subject: "vietnamese",
      num: i + 1,
      type: q.type,
      topic: q.topic,
      skill: q.skill,
      grade: q.grade,
      tags: q.tags,
      points: q.points,
      stem: q.stem,
      unit: q.unit,
      placeholder: q.placeholder,
      correct: q.correct,
      answerSchema: q.answerSchema,
      options: q.options,
      modelAnswer: q.modelAnswer,
      figure: q.figure,
      passageId: q.passageId,
      source: q.source,
      sourceQuestionId: q.id,
    })),
  });

  return newId;
}

// Parses "set-<topic>-<level>-..." into its components for the submit hook.
export function parseTopicSetId(examId: string): { topic: string; level: string } | null {
  if (!examId.startsWith("set-")) return null;
  const [, topic, level] = examId.split("-");
  if (!topic || !level) return null;
  return { topic, level: level.toUpperCase() };
}
