"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  WATERMARKS,
  IMPLEMENTED_FIGURES,
  RAW_MATH_PATTERNS,
  type QAIssue,
  type FlaggedQ,
} from "./qa-constants";

const requireAdmin = async () => {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") throw new Error("Unauthorized");
  return session.user;
};

// ─── Topics ──────────────────────────────────────────────────────────────────

const topicSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  short: z.string().min(1),
  ico: z.string().min(1),
  color: z.string().min(1),
});

const saveSchema = z.object({
  topics: z.array(topicSchema),
});

export async function saveTopics(payload: unknown) {
  await requireAdmin();
  const parsed = saveSchema.parse(payload);
  const { topics } = parsed;

  await prisma.$transaction([
    prisma.topic.deleteMany({}),
    prisma.topic.createMany({
      data: topics.map((t, i) => ({
        id: t.id,
        name: t.name,
        short: t.short,
        ico: t.ico,
        color: t.color,
        position: i,
      })),
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/home");
  revalidatePath("/topics");
  return { ok: true };
}

// ─── QA: Update a single question ────────────────────────────────────────────

const updateQuestionSchema = z.object({
  questionId: z.string().min(1),
  stem: z.string().optional(),
  correct: z.string().optional(),
  modelAnswer: z.string().optional(),
  figure: z.string().nullable().optional(),
});

export async function updateQuestion(payload: unknown) {
  await requireAdmin();
  const { questionId, stem, correct, modelAnswer, figure } =
    updateQuestionSchema.parse(payload);

  const data: Record<string, unknown> = {};
  if (stem !== undefined) data.stem = stem;
  if (correct !== undefined) data.correct = correct;
  if (modelAnswer !== undefined) data.modelAnswer = modelAnswer;
  if (figure !== undefined) data.figure = figure;

  await prisma.question.update({ where: { id: questionId }, data });

  revalidatePath("/admin");
  return { ok: true };
}

// ─── QA: Auto-fix watermarks across all questions ─────────────────────────────

const WATERMARK_PATTERNS = [
  /\s*MathExpress\s*Education\s*/gi,
  /\s*Math\s*Express\s*Education\s*/gi,
  /\s*Toán\s*Tuổi\s*Thơ\s*/gi,
];

export async function autoFixWatermarks(): Promise<{ fixed: number }> {
  await requireAdmin();

  // Find all questions with watermarks
  const questions = await prisma.question.findMany({
    where: {
      OR: WATERMARKS.map((wm) => ({
        stem: { contains: wm },
      })),
    },
    select: { id: true, stem: true },
  });

  let fixed = 0;
  for (const q of questions) {
    let cleaned = q.stem;
    for (const pat of WATERMARK_PATTERNS) {
      cleaned = cleaned.replace(pat, " ");
    }
    // Also clean up trailing/multiple spaces
    cleaned = cleaned.replace(/\s{2,}/g, " ").trim();

    if (cleaned !== q.stem) {
      await prisma.question.update({
        where: { id: q.id },
        data: { stem: cleaned },
      });
      fixed++;
    }
  }

  revalidatePath("/admin");
  return { fixed };
}

// ─── QA: Auto-fix raw math in all flagged questions ───────────────────────────

function applyMathFormatting(text: string): string {
  if (!text) return text;

  // Skip if stem already has many $ (already formatted)
  const dollarCount = (text.match(/\$/g) ?? []).length;
  if (dollarCount >= 4) return text;

  // 1. cm2/m2/dm2 → cm²/m²/dm²
  text = text.replace(/\bcm2\b/gi, "cm²");
  text = text.replace(/\bm2\b/g, "m²"); // lowercase only to avoid M2
  text = text.replace(/\bdm2\b/gi, "dm²");

  // 2. Fractions a/b (skip dates: ngày X, tháng X, giờ X)
  text = text.replace(
    /(?<!ngày\s+)(?<!tháng\s+)(?<!giờ\s+)(?<!\$)(?<!\{)\b(\d+)\/(\d+)\b(?!\})/g,
    "$\\frac{$1}{$2}$"
  );

  // 3. Percentages: 20% → $20\%$ (skip if already in $)
  text = text.replace(/(?<!\$)\b(\d+(?:[,.]\d+)?)\s*%(?!\$)/g, "$$$1\\%$$");

  // 4. × → $\times$ , ÷ → $\div$ (only when not already inside $)
  text = text.replace(/(?<!\$)\s*×\s*/g, " $\\times$ ");
  text = text.replace(/(?<!\$)\s*÷\s*/g, " $\\div$ ");

  // 5. Normalize multiple spaces
  text = text.replace(/\s{2,}/g, " ").trim();

  return text;
}

export async function autoFixMathRaw(): Promise<{ fixed: number }> {
  await requireAdmin();

  const RAW_CHECK = [
    /(?<!\$)(?<!ngày )(?<!tháng )\b(\d+)\/(\d+)\b(?!\})/,
    /(?<!\$)\b\d+[,.]?\d*\s*%(?!\$)/,
    /(?<!\$)[×÷](?!\$)/,
    /\bcm2\b|\bm2\b|\bdm2\b/i,
  ];

  const questions = await prisma.question.findMany({
    select: { id: true, stem: true, examId: true },
  });

  let fixed = 0;
  for (const q of questions) {
    if (q.examId?.startsWith("ref-") || q.examId?.startsWith("set-")) continue;
    const dollarCount = (q.stem.match(/\$/g) ?? []).length;
    if (dollarCount >= 4) continue; // skip already formatted
    const hasProblem = RAW_CHECK.some((p) => p.test(q.stem));
    if (!hasProblem) continue;

    const cleaned = applyMathFormatting(q.stem);
    if (cleaned !== q.stem) {
      await prisma.question.update({ where: { id: q.id }, data: { stem: cleaned } });
      fixed++;
    }
  }

  revalidatePath("/admin");
  return { fixed };
}

// ─── QA: Get all questions that have a figure ────────────────────────────────

export interface FigureQ {
  id: string;
  examId: string;
  school: string;
  year: string;
  num: number;
  stem: string;
  figure: string;
  implemented: boolean;
}

export async function getQuestionsWithFigures(): Promise<FigureQ[]> {
  await requireAdmin();

  const questions = await prisma.question.findMany({
    where: { figure: { not: null } },
    include: { exam: { select: { school: true, year: true } } },
    orderBy: [{ examId: "asc" }, { num: "asc" }],
  });

  return questions
    .filter((q) => !q.examId?.startsWith("ref-") && !q.examId?.startsWith("set-"))
    .filter((q) => q.figure)
    .map((q) => ({
      id: q.id,
      examId: q.examId ?? "?",
      school: q.exam?.school ?? "?",
      year: q.exam?.year ?? "?",
      num: q.num,
      stem: q.stem.slice(0, 120) + (q.stem.length > 120 ? "…" : ""),
      figure: q.figure!,
      implemented: IMPLEMENTED_FIGURES.has(q.figure!),
    }));
}

// ─── Bank: Stats ─────────────────────────────────────────────────────────────

export interface BankStats {
  official: number;
  mock: number;
  supplement: number;
  totalActive: number;
  totalInactive: number;
  byTopic: Record<string, number>;
}

export async function getBankStats(): Promise<BankStats> {
  await requireAdmin();

  const [official, mock, supplement, totalActive, totalInactive, byTopicRows] =
    await Promise.all([
      prisma.question.count({
        where: { examId: { not: null }, exam: { kind: "official", generated: false } },
      }),
      prisma.question.count({
        where: {
          examId: { not: null },
          exam: { kind: { in: ["reference", "mixed"] }, generated: false },
        },
      }),
      prisma.question.count({
        where: { examId: null },
      }),
      prisma.question.count({
        where: {
          OR: [
            { examId: null },
            { exam: { generated: false } },
          ],
          active: true,
        },
      }),
      prisma.question.count({
        where: {
          OR: [
            { examId: null },
            { exam: { generated: false } },
          ],
          active: false,
        },
      }),
      prisma.question.groupBy({
        by: ["topic"],
        where: {
          OR: [
            { examId: null },
            { exam: { generated: false } },
          ],
        },
        _count: { id: true },
      }),
    ]);

  const byTopic: Record<string, number> = {};
  for (const row of byTopicRows) {
    byTopic[row.topic] = row._count.id;
  }

  return { official, mock, supplement, totalActive, totalInactive, byTopic };
}

// ─── Bank: List questions ─────────────────────────────────────────────────────

export interface BankRow {
  id: string;
  num: number;
  type: string;
  topic: string;
  grade: string;
  stem: string;
  active: boolean;
  source: "official" | "mock" | "supplement";
  examYear: string | null;
  examSchool: string | null;
}

export interface BankPage {
  rows: BankRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BankFilters {
  source?: "official" | "mock" | "supplement" | "all";
  topic?: string;
  grade?: string;
  q?: string;
  page?: number;
}

export async function getBankQuestions(filters: BankFilters): Promise<BankPage> {
  await requireAdmin();

  const pageSize = 25;
  const page = filters.page ?? 1;
  const skip = (page - 1) * pageSize;

  let where: any = {};

  if (filters.source === "official") {
    where = {
      examId: { not: null },
      exam: { kind: "official", generated: false },
    };
  } else if (filters.source === "mock") {
    where = {
      examId: { not: null },
      exam: { kind: { in: ["reference", "mixed"] }, generated: false },
    };
  } else if (filters.source === "supplement") {
    where = {
      examId: null,
    };
  } else {
    where = {
      OR: [
        { examId: null },
        { examId: { not: null }, exam: { generated: false } },
      ],
    };
  }

  if (filters.topic || filters.grade || filters.q) {
    where = {
      AND: [
        where,
        filters.topic ? { topic: filters.topic } : {},
        filters.grade ? { grade: filters.grade } : {},
        filters.q ? { stem: { contains: filters.q } } : {},
      ],
    };
  }

  const [total, questions] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      include: { exam: { select: { kind: true, generated: true, year: true, school: true } } },
      orderBy: [{ examId: "asc" }, { num: "asc" }],
      skip,
      take: pageSize,
    }),
  ]);

  const rows: BankRow[] = questions.map((q) => {
    const source: "official" | "mock" | "supplement" =
      q.examId === null
        ? "supplement"
        : q.exam?.kind === "reference" || q.exam?.kind === "mixed"
        ? "mock"
        : "official";

    return {
      id: q.id,
      num: q.num,
      type: q.type,
      topic: q.topic,
      grade: q.grade,
      stem: q.stem.length > 160 ? q.stem.slice(0, 160) + "…" : q.stem,
      active: q.active,
      source,
      examYear: q.exam?.year ?? null,
      examSchool: q.exam?.school ?? null,
    };
  });

  return { rows, total, page, pageSize };
}

// ─── Bank: Question detail ────────────────────────────────────────────────────

export interface QuestionDetail {
  id: string;
  num: number;
  type: string;
  topic: string;
  grade: string;
  points: number;
  stem: string;
  unit: string | null;
  placeholder: string | null;
  options: { id: string; text: string }[];
  correct: string | null;
  modelAnswer: string | null;
  figure: string | null;
  source: "official" | "mock" | "supplement";
  examSchool: string | null;
  examYear: string | null;
  examKind: string | null;
}

export async function getQuestionDetail(id: string): Promise<QuestionDetail> {
  await requireAdmin();

  const q = await prisma.question.findUnique({
    where: { id },
    include: {
      exam: { select: { school: true, year: true, kind: true, generated: true } },
    },
  });

  if (!q) throw new Error("Question not found");

  let parsedOptions: { id: string; text: string }[] = [];
  try {
    const raw = JSON.parse(q.options) as unknown;
    if (Array.isArray(raw)) {
      parsedOptions = raw as { id: string; text: string }[];
    }
  } catch {
    parsedOptions = [];
  }

  const source: "official" | "mock" | "supplement" =
    q.examId === null
      ? "supplement"
      : q.exam?.kind === "reference" || q.exam?.kind === "mixed"
      ? "mock"
      : "official";

  return {
    id: q.id,
    num: q.num,
    type: q.type,
    topic: q.topic,
    grade: q.grade,
    points: q.points,
    stem: q.stem,
    unit: q.unit ?? null,
    placeholder: q.placeholder ?? null,
    options: parsedOptions,
    correct: q.correct ?? null,
    modelAnswer: q.modelAnswer ?? null,
    figure: q.figure ?? null,
    source,
    examSchool: q.exam?.school ?? null,
    examYear: q.exam?.year ?? null,
    examKind: q.exam?.kind ?? null,
  };
}

// ─── Bank: Toggle question active ─────────────────────────────────────────────

export async function toggleQuestionActive(id: string): Promise<{ active: boolean }> {
  await requireAdmin();

  const current = await prisma.question.findUnique({ where: { id }, select: { active: true } });
  if (!current) throw new Error("Question not found");

  const updated = await prisma.question.update({
    where: { id },
    data: { active: !current.active },
    select: { active: true },
  });

  revalidatePath("/admin");
  return { active: updated.active };
}

// ─── Plans: Fetch config rows ─────────────────────────────────────────────────

export interface PlanConfigRow {
  plan: string;
  label: string;
  topicSetLimit: number;
  referenceExamLimit: number;
  position: number;
}

export interface LevelConfigRow {
  level: string;
  label: string;
  sub: string;
  qcount: number;
  minutes: number;
  active: boolean;
  position: number;
}

export async function getPlanConfigs(): Promise<PlanConfigRow[]> {
  await requireAdmin();
  const rows = await prisma.planConfig.findMany({ orderBy: { position: "asc" } });
  return rows.map((r) => ({
    plan: r.plan,
    label: r.label,
    topicSetLimit: r.topicSetLimit,
    referenceExamLimit: r.referenceExamLimit,
    position: r.position,
  }));
}

export async function getLevelConfigRows(): Promise<LevelConfigRow[]> {
  await requireAdmin();
  const rows = await prisma.levelConfig.findMany({ orderBy: { position: "asc" } });
  return rows.map((r) => ({
    level: r.level,
    label: r.label,
    sub: r.sub,
    qcount: r.qcount,
    minutes: r.minutes,
    active: r.active,
    position: r.position,
  }));
}

// ─── Plans: Update plan config ────────────────────────────────────────────────

export async function updatePlanConfig(
  plan: string,
  data: { topicSetLimit: number; referenceExamLimit: number },
): Promise<{ ok: boolean }> {
  await requireAdmin();

  await prisma.planConfig.updateMany({
    where: { plan },
    data: {
      topicSetLimit: data.topicSetLimit,
      referenceExamLimit: data.referenceExamLimit,
    },
  });

  revalidatePath("/admin");
  return { ok: true };
}

// ─── Plans: Update level config ───────────────────────────────────────────────

export async function updateLevelConfig(
  level: string,
  data: { qcount: number; minutes: number; active?: boolean },
): Promise<{ ok: boolean }> {
  await requireAdmin();

  const patch: { qcount: number; minutes: number; active?: boolean } = {
    qcount: data.qcount,
    minutes: data.minutes,
  };
  if (data.active !== undefined) patch.active = data.active;

  await prisma.levelConfig.updateMany({
    where: { level },
    data: patch,
  });

  revalidatePath("/admin");
  return { ok: true };
}

// ─── Schools CRUD ────────────────────────────────────────────────────────────

import { invalidateSchoolsCache } from "@/lib/schools";
import { ensureSchoolProfilesFresh, getAllSchoolProfiles } from "@/lib/school-profiles";
import { computeMastery } from "@/lib/mastery";
import { computeAllReadiness } from "@/lib/readiness";

const schoolUpsertSchema = z.object({
  id: z.string().min(1).max(16).regex(/^[a-z][a-z0-9]*$/, "id phải là chữ thường+số, bắt đầu bằng chữ"),
  short: z.string().min(1).max(8),
  name: z.string().min(1).max(80),
  full: z.string().min(1).max(120),
  color: z.string().min(1).max(60),
  tone: z.string().max(20).default(""),
  desc: z.string().max(200).default(""),
  minutes: z.coerce.number().int().min(1).max(180),
  style: z.string().max(200).default(""),
  position: z.coerce.number().int().min(0).max(999).default(0),
  active: z.coerce.boolean().default(true),
});

export async function createSchool(payload: unknown) {
  await requireAdmin();
  const data = schoolUpsertSchema.parse(payload);
  const existing = await prisma.school.findUnique({ where: { id: data.id } });
  if (existing) throw new Error(`School với id "${data.id}" đã tồn tại`);
  await prisma.school.create({ data });
  invalidateSchoolsCache();
  revalidatePath("/admin");
  revalidatePath("/home");
  return { ok: true };
}

export async function updateSchool(payload: unknown) {
  await requireAdmin();
  const data = schoolUpsertSchema.parse(payload);
  await prisma.school.update({
    where: { id: data.id },
    data: {
      short: data.short, name: data.name, full: data.full,
      color: data.color, tone: data.tone, desc: data.desc,
      minutes: data.minutes, style: data.style, position: data.position,
      active: data.active,
    },
  });
  invalidateSchoolsCache();
  revalidatePath("/admin");
  revalidatePath("/home");
  return { ok: true };
}

export async function deactivateSchool(id: string) {
  await requireAdmin();
  await prisma.school.update({ where: { id }, data: { active: false } });
  invalidateSchoolsCache();
  revalidatePath("/admin");
  revalidatePath("/home");
  return { ok: true };
}

// ─── Readiness admin ─────────────────────────────────────────────────────────

export async function refreshSchoolProfilesAction() {
  await requireAdmin();
  const result = await ensureSchoolProfilesFresh();
  revalidatePath("/admin");
  return result;
}

export interface RecomputeResult {
  processed: number;
  total: number;
  errors: { userId: string; email: string | null; error: string }[];
  durationMs: number;
}

export async function recomputeAllReadinessAction(): Promise<RecomputeResult> {
  await requireAdmin();
  const t0 = Date.now();
  await ensureSchoolProfilesFresh();
  const profiles = await getAllSchoolProfiles();
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const errors: RecomputeResult["errors"] = [];
  let processed = 0;
  for (const u of users) {
    try {
      const mastery = await computeMastery(u.id);
      const readiness = computeAllReadiness(mastery.topicMastery, mastery.levelMastery, profiles);
      await prisma.user.update({
        where: { id: u.id },
        data: {
          topicMastery: JSON.stringify(mastery.topicMastery),
          readiness: JSON.stringify(readiness),
        },
      });
      processed++;
    } catch (err) {
      errors.push({ userId: u.id, email: u.email, error: String(err) });
    }
  }
  revalidatePath("/admin");
  revalidatePath("/home");
  return { processed, total: users.length, errors, durationMs: Date.now() - t0 };
}

export interface ReadinessHistogramBucket {
  range: string;
  min: number;
  max: number;
  count: number;
  label: string;
}

export interface ReadinessHistogram {
  school: string;
  total: number;
  avg: number;
  median: number;
  buckets: ReadinessHistogramBucket[];
}

export async function getReadinessDistribution(): Promise<ReadinessHistogram[]> {
  await requireAdmin();
  const users = await prisma.user.findMany({ select: { readiness: true } });
  const schools = await prisma.school.findMany({ where: { active: true }, orderBy: { position: "asc" } });

  const histograms: ReadinessHistogram[] = [];
  const bucketDefs = [
    { min: 80, max: 101, label: "Sẵn sàng (80-100%)" },
    { min: 60, max: 80, label: "Đang tiến (60-79%)" },
    { min: 40, max: 60, label: "Cần luyện (40-59%)" },
    { min: 20, max: 40, label: "Yếu (20-39%)" },
    { min: 0, max: 20, label: "Rất yếu (0-19%)" },
  ];

  for (const school of schools) {
    const values: number[] = [];
    for (const u of users) {
      let r: Record<string, number> = {};
      try { r = JSON.parse(u.readiness) as Record<string, number>; } catch { /* ignore */ }
      values.push(r[school.id] ?? 50);
    }
    const total = values.length;
    const avg = total > 0 ? values.reduce((s, v) => s + v, 0) / total : 0;
    const sorted = [...values].sort((a, b) => a - b);
    const median = total > 0 ? sorted[Math.floor(total / 2)] : 0;
    const buckets = bucketDefs.map((b) => ({
      range: `${b.min}-${b.max - 1}`,
      min: b.min,
      max: b.max,
      label: b.label,
      count: values.filter((v) => v >= b.min && v < b.max).length,
    }));
    histograms.push({ school: school.id, total, avg: Math.round(avg), median, buckets });
  }
  return histograms;
}

// ─── QA: Get flagged questions (server-side audit) ───────────────────────────

export async function getAuditResults(
  schoolFilter?: string,
  issueFilter?: string,
): Promise<FlaggedQ[]> {
  await requireAdmin();

  const questions = await prisma.question.findMany({
    include: { exam: { select: { school: true, year: true } } },
    orderBy: [{ examId: "asc" }, { num: "asc" }],
  });

  const filtered =
    schoolFilter && schoolFilter !== "all"
      ? questions.filter((q) => q.exam?.school === schoolFilter)
      : questions;

  const flagged: FlaggedQ[] = [];

  for (const q of filtered) {
    // Skip auto-generated reference/practice exams
    if (q.examId?.startsWith("ref-") || q.examId?.startsWith("set-")) continue;

    const issues: QAIssue[] = [];
    const stem = q.stem ?? "";

    // 1a. Figure field set but SVG not implemented yet
    if (q.figure && !IMPLEMENTED_FIGURES.has(q.figure)) {
      issues.push({ type: "FIGURE_MISSING", detail: `"${q.figure}" not in ExamFigure.tsx` });
    }

    // 1b. Figure likely needed but not mapped — stem contains figure references
    const FIGURE_HINTS = [
      /hình\s*(vẽ|bên|dưới|sau)/i,
      /biểu\s*đồ/i,
      /bảng\s*(số\s*liệu|sau|dưới)/i,
      /theo\s*hình/i,
      /như\s*hình/i,
      /quan\s*sát\s*hình/i,
    ];
    if (!q.figure && FIGURE_HINTS.some((p) => p.test(stem))) {
      issues.push({
        type: "FIGURE_LIKELY",
        detail: "Stem đề cập đến hình/biểu đồ nhưng chưa có figure field",
      });
    }

    // 2. No answer — mcq/fill without a correct answer will always mark wrong
    if (
      (q.type === "mcq" || q.type === "fill") &&
      (!q.correct || q.correct.trim() === "")
    ) {
      issues.push({ type: "NO_ANSWER", detail: "Missing correct answer" });
    }

    // 3. Short stem — parser likely missed content, needs human check
    if (stem.trim().length < 10) {
      issues.push({ type: "SHORT_STEM", detail: `Stem too short: "${stem.trim()}"` });
    }

    if (issues.length === 0) continue;

    const matchesIssueFilter =
      !issueFilter ||
      issueFilter === "all" ||
      issues.some((i) => i.type === issueFilter);
    if (!matchesIssueFilter) continue;

    flagged.push({
      id: q.id,
      examId: q.examId ?? "?",
      school: q.exam?.school ?? "?",
      year: q.exam?.year ?? "?",
      num: q.num,
      type: q.type,
      issues,
      stem,
      figure: q.figure,
      correct: q.correct,
      modelAnswer: q.modelAnswer,
    });
  }

  return flagged;
}
