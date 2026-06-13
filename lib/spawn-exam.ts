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

export class TopicSetLimitError extends Error {
  constructor() {
    super("Đã hết lượt luyện chuyên đề");
    this.name = "TopicSetLimitError";
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

  let pool = await prisma.question.findMany({
    where: baseWhere,
    include: { exam: true },
  });

  // Fall back to any grade within the topic if the per-level pool is thin.
  if (pool.length < cfg.qcount) {
    const fallbackWhere = { ...baseWhere };
    delete fallbackWhere.grade;
    pool = await prisma.question.findMany({
      where: fallbackWhere,
      include: { exam: true },
    });
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

// Parses "set-<topic>-<level>-..." into its components for the submit hook.
export function parseTopicSetId(examId: string): { topic: string; level: string } | null {
  if (!examId.startsWith("set-")) return null;
  const [, topic, level] = examId.split("-");
  if (!topic || !level) return null;
  return { topic, level: level.toUpperCase() };
}
