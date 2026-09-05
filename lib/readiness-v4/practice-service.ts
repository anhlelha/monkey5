import { prisma } from "../prisma";
import { effectivePlan, getPlanConfig, countTopicSets } from "../plan-config";
import { SCHOOLS } from "../static";
import { buildAssessmentIndex, resolveQuestionAssessment } from "./assessment-resolution";
import { resolveGlobalAssignments } from "./assignment-service";
import { getEffectiveAnalyticalMasteryCellsV4 } from "./content-mastery-service";
import { stableHash } from "./hashing";
import { getMathAnalyticalTopic, MATH_ANALYTICAL_TOPICS } from "./analytical-topics";
import { getSnapshotRecommendations, type LinkedReadinessRecommendation } from "./recommendation-service";
import { cellKey, difficultyBandOf, MATH_TAXONOMY_VERSION, type DifficultyBand } from "./types";

export const PRACTICE_V4_ALGORITHM = "practice-selector-v4-1" as const;
export const MIN_PRACTICE_QUESTION_COUNT = 1;
export const MAX_PRACTICE_QUESTION_COUNT = 50;

export type PracticeSourceFilter = "all" | "official" | "supplement";

export const PRACTICE_BANDS: Array<{
  id: DifficultyBand;
  label: string;
  shortLabel: string;
  description: string;
  difficultyLabel: string;
  qcount: number;
  minutes: number;
  tone: string;
}> = [
  {
    id: "foundation",
    label: "Nền tảng",
    shortLabel: "D1–D2",
    description: "Kiến thức nền và thao tác trực tiếp",
    difficultyLabel: "D1–D2",
    qcount: 10,
    minutes: 20,
    tone: "var(--success)",
  },
  {
    id: "application",
    label: "Vận dụng",
    shortLabel: "D3",
    description: "Kết hợp dữ kiện và nhiều bước giải",
    difficultyLabel: "D3",
    qcount: 10,
    minutes: 20,
    tone: "var(--cg)",
  },
  {
    id: "advanced",
    label: "Phân hóa",
    shortLabel: "D4–D5",
    description: "Suy luận sâu và bài toán phân hóa",
    difficultyLabel: "D4–D5",
    qcount: 8,
    minutes: 25,
    tone: "var(--ntt)",
  },
];

export function isValidPracticeQuestionCount(value: number): boolean {
  return Number.isInteger(value) &&
    value >= MIN_PRACTICE_QUESTION_COUNT &&
    value <= MAX_PRACTICE_QUESTION_COUNT;
}

export function estimatePracticeMinutes(
  band: Pick<(typeof PRACTICE_BANDS)[number], "qcount" | "minutes">,
  questionCount: number,
): number {
  if (questionCount <= 0) return 0;
  return Math.max(1, Math.round((band.minutes / band.qcount) * questionCount));
}

interface SourceQuestion {
  id: string;
  sourceQuestionId: string | null;
  subject: string;
  type: string;
  topic: string;
  skill: string | null;
  grade: string;
  tags: string;
  groupId: string | null;
  passageId: string | null;
  points: number;
  stem: string;
  unit: string | null;
  placeholder: string | null;
  correct: string | null;
  answerSchema: string | null;
  options: string;
  modelAnswer: string | null;
  figure: string | null;
  source: string | null;
  examId: string | null;
  exam: {
    kind: string;
    generated: boolean;
    ownerUserId: string | null;
    school: string;
    year: string;
  } | null;
}

interface CandidateAssessment {
  id: string;
  questionId: string;
  topicPrimary: string;
  topicSecondaryJson: string;
  difficultyBand: number;
  cognitiveLevel: string;
  reasoningType: string;
  confidence: number;
  model: string;
  sourceRunId: string;
  taxonomyVersion: string;
  questionContentHash: string;
}

export interface PracticeCandidate {
  sourceQuestion: SourceQuestion;
  assessment: CandidateAssessment;
  canonicalQuestionId: string;
  sourceKind: "official" | "supplement";
}

export interface SelectedPracticeCandidate extends PracticeCandidate {
  isRepeat: boolean;
}

export class PracticeV4LimitError extends Error {
  constructor() {
    super("Đã hết lượt luyện chuyên đề");
    this.name = "PracticeV4LimitError";
  }
}

export class PracticeV4EmptyError extends Error {
  constructor() {
    super("Chưa có đủ câu hỏi V4 hợp lệ cho lựa chọn này");
    this.name = "PracticeV4EmptyError";
  }
}

export function isAtomicPracticeStem(stem: string): boolean {
  const bundledTasks = stem.match(/\*\*Bài\s+\d+\s*[:.]?\*\*/giu) ?? [];
  return bundledTasks.length <= 1;
}

function sourceKind(question: SourceQuestion): "official" | "supplement" | null {
  if (question.examId === null) return "supplement";
  if (question.exam?.kind === "official" && question.exam.generated === false) return "official";
  if (
    question.exam?.kind === "reference" &&
    question.exam.generated === false &&
    question.exam.ownerUserId !== null
  ) return "supplement";
  return null;
}

function sourceAllowed(kind: "official" | "supplement", filter: PracticeSourceFilter): boolean {
  return filter === "all" || filter === kind;
}

export function candidateMatchesTarget(
  candidate: PracticeCandidate,
  topic: string,
  band: DifficultyBand,
  filter: PracticeSourceFilter,
): boolean {
  return candidate.assessment.topicPrimary === topic &&
    difficultyBandOf(candidate.assessment.difficultyBand) === band &&
    sourceAllowed(candidate.sourceKind, filter);
}

function deterministicRank(seed: string, candidate: PracticeCandidate): string {
  return stableHash({ seed, canonicalQuestionId: candidate.canonicalQuestionId });
}

export function selectPracticeCandidates(
  candidates: PracticeCandidate[],
  seenCanonicalIds: Set<string>,
  count: number,
  seed: string,
): SelectedPracticeCandidate[] {
  const byCanonical = new Map<string, PracticeCandidate>();
  for (const candidate of candidates) {
    const existing = byCanonical.get(candidate.canonicalQuestionId);
    if (!existing || (candidate.sourceKind === "official" && existing.sourceKind !== "official")) {
      byCanonical.set(candidate.canonicalQuestionId, candidate);
    }
  }
  const ranked = [...byCanonical.values()].sort((left, right) =>
    deterministicRank(seed, left).localeCompare(deterministicRank(seed, right)),
  );
  const unseen = ranked.filter((candidate) => !seenCanonicalIds.has(candidate.canonicalQuestionId));
  const repeats = ranked.filter((candidate) => seenCanonicalIds.has(candidate.canonicalQuestionId));
  return [
    ...unseen.map((candidate) => ({ ...candidate, isRepeat: false })),
    ...repeats.map((candidate) => ({ ...candidate, isRepeat: true })),
  ].slice(0, Math.max(0, count));
}

async function loadSeenCanonicalIds(userId: string): Promise<Set<string>> {
  const [v4Items, legacySets] = await Promise.all([
    prisma.practiceSetItem.findMany({
      where: { practiceSet: { userId } },
      select: { canonicalQuestionId: true },
    }),
    prisma.userTopicSet.findMany({ where: { userId }, select: { examId: true } }),
  ]);
  const legacyQuestions = legacySets.length
    ? await prisma.question.findMany({
        where: { examId: { in: legacySets.map((row) => row.examId) }, sourceQuestionId: { not: null } },
        select: { sourceQuestionId: true },
      })
    : [];
  return new Set([
    ...v4Items.map((row) => row.canonicalQuestionId),
    ...legacyQuestions.flatMap((row) => row.sourceQuestionId ? [row.sourceQuestionId] : []),
  ]);
}

export async function loadResolvedPracticeCandidates(): Promise<PracticeCandidate[]> {
  const approvedRuns = await prisma.assessmentRun.findMany({
    where: { subject: "math", taxonomyVersion: MATH_TAXONOMY_VERSION, status: "approved" },
    orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
  });
  if (!approvedRuns.length) return [];

  const questions = await prisma.question.findMany({
    where: {
      subject: "math",
      active: true,
      OR: [
        { examId: null },
        { exam: { kind: "official", generated: false } },
        { exam: { kind: "reference", generated: false, ownerUserId: { not: null } } },
      ],
    },
    include: { exam: true },
  }) as SourceQuestion[];
  const assessmentQuestionIds = [...new Set(questions.flatMap((question) =>
    question.sourceQuestionId ? [question.id, question.sourceQuestionId] : [question.id],
  ))];
  const assessments = await prisma.questionAssessment.findMany({
    where: {
      questionId: { in: assessmentQuestionIds },
      sourceRunId: { in: approvedRuns.map((run) => run.id) },
      taxonomyVersion: MATH_TAXONOMY_VERSION,
    },
  }) as CandidateAssessment[];
  const index = buildAssessmentIndex(assessments, approvedRuns.map((run) => run.id));

  return questions.flatMap((question): PracticeCandidate[] => {
    // A topic-practice item must be one coherent task. Some legacy supplemental
    // rows bundled multiple independent worksheet exercises into one Question;
    // a single V4 topicPrimary cannot make those rows topic-pure.
    if (!isAtomicPracticeStem(question.stem)) return [];
    const kind = sourceKind(question);
    if (!kind) return [];
    const resolution = resolveQuestionAssessment(question, index);
    if ((resolution.state !== "current" && resolution.state !== "inherited") || !resolution.assessment) return [];
    return [{
      sourceQuestion: question,
      assessment: resolution.assessment,
      canonicalQuestionId: resolution.canonicalQuestionId ?? question.id,
      sourceKind: kind,
    }];
  });
}

export interface PracticeAvailability {
  total: number;
  unseen: number;
  official: number;
  supplement: number;
  unseenOfficial: number;
  unseenSupplement: number;
}

export async function getPracticeAvailabilityCatalog(
  userId: string,
): Promise<Record<string, PracticeAvailability>> {
  const [candidates, seen] = await Promise.all([
    loadResolvedPracticeCandidates(),
    loadSeenCanonicalIds(userId),
  ]);
  const result: Record<string, PracticeAvailability> = {};
  for (const topic of MATH_ANALYTICAL_TOPICS) {
    for (const band of PRACTICE_BANDS) {
      const rows = candidates.filter((candidate) => candidateMatchesTarget(candidate, topic.id, band.id, "all"));
      const unique = new Map(rows.map((candidate) => [candidate.canonicalQuestionId, candidate]));
      const values = [...unique.values()];
      result[cellKey(topic.id, band.id)] = {
        total: values.length,
        unseen: values.filter((candidate) => !seen.has(candidate.canonicalQuestionId)).length,
        official: values.filter((candidate) => candidate.sourceKind === "official").length,
        supplement: values.filter((candidate) => candidate.sourceKind === "supplement").length,
        unseenOfficial: values.filter((candidate) => candidate.sourceKind === "official" && !seen.has(candidate.canonicalQuestionId)).length,
        unseenSupplement: values.filter((candidate) => candidate.sourceKind === "supplement" && !seen.has(candidate.canonicalQuestionId)).length,
      };
    }
  }
  return result;
}

function sourceLabel(question: SourceQuestion): string {
  if (question.exam?.ownerUserId) return "Bài tập hệ thống";
  if (question.source) return question.source;
  if (question.exam?.kind === "official") {
    const school = SCHOOLS.find((candidate) => candidate.id === question.exam?.school);
    return `Trích đề ${school?.short ?? question.exam.school.toUpperCase()} ${question.exam.year}`.trim();
  }
  return "Bài tập hệ thống";
}

export interface CreateTargetedPracticeInput {
  userId: string;
  topic: string;
  band: DifficultyBand;
  sourceFilter: PracticeSourceFilter;
  questionCount: number;
  idempotencyKey: string;
  targetSchool?: string | null;
}

export async function createTargetedPracticeSet(input: CreateTargetedPracticeInput): Promise<{
  examId: string;
  selectedCount: number;
  unseenCount: number;
}> {
  const meta = getMathAnalyticalTopic(input.topic);
  const bandMeta = PRACTICE_BANDS.find((band) => band.id === input.band);
  if (!meta || !bandMeta || !isValidPracticeQuestionCount(input.questionCount)) {
    throw new PracticeV4EmptyError();
  }
  const normalizedKey = `practice-v4:${input.userId}:${input.idempotencyKey.slice(0, 100)}`;
  const existing = await prisma.practiceSet.findUnique({ where: { idempotencyKey: normalizedKey } });
  if (existing) {
    if (existing.userId !== input.userId) throw new Error("Invalid idempotency key");
    return { examId: existing.examId, selectedCount: existing.selectedCount, unseenCount: existing.unseenCount };
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { role: true, plan: true },
  });
  const limits = await getPlanConfig(effectivePlan(user ?? {}));
  if (await countTopicSets(input.userId) >= limits.topicSetLimit) throw new PracticeV4LimitError();

  const [allCandidates, seen, assignments] = await Promise.all([
    loadResolvedPracticeCandidates(),
    loadSeenCanonicalIds(input.userId),
    resolveGlobalAssignments(),
  ]);
  const candidates = allCandidates.filter((candidate) =>
    candidateMatchesTarget(candidate, input.topic, input.band, input.sourceFilter),
  );
  const selected = selectPracticeCandidates(candidates, seen, input.questionCount, normalizedKey);
  if (!selected.length) throw new PracticeV4EmptyError();

  const suffix = stableHash({ normalizedKey, now: Date.now() }).slice(0, 10);
  const examId = `practice-v4-${Date.now().toString(36)}-${suffix}`;
  const profileVersionId = input.targetSchool ? assignments.profileVersionIds[input.targetSchool] ?? null : null;
  const assessmentRunIds = [...new Set(selected.map((candidate) => candidate.assessment.sourceRunId))].sort();
  const unseenCount = selected.filter((candidate) => !candidate.isRepeat).length;

  const persisted = await prisma.$transaction(async (tx) => {
    const duplicate = await tx.practiceSet.findUnique({ where: { idempotencyKey: normalizedKey } });
    if (duplicate) {
      return {
        examId: duplicate.examId,
        selectedCount: duplicate.selectedCount,
        unseenCount: duplicate.unseenCount,
      };
    }
    await tx.exam.create({
      data: {
        id: examId,
        subject: "math",
        school: "mix",
        kind: "reference",
        year: `${bandMeta.difficultyLabel} · ${new Date().toLocaleDateString("vi-VN")}`,
        title: `Luyện ${meta.name} · ${bandMeta.label}`,
        intro: unseenCount === selected.length
          ? "Bài luyện V4 theo đúng chuyên đề và dải độ khó. Các câu trong bài đều là câu con chưa làm."
          : `Bài luyện V4 theo đúng chuyên đề và dải độ khó. Có ${selected.length - unseenCount} câu ôn lại do ngân hàng câu mới không còn đủ.`,
        minutes: estimatePracticeMinutes(bandMeta, selected.length),
        qcount: selected.length,
        generated: true,
        note: `practice-v4:${input.topic}:${input.band}:${input.sourceFilter}`,
      },
    });
    const practiceSet = await tx.practiceSet.create({
      data: {
        userId: input.userId,
        examId,
        taxonomyVersion: MATH_TAXONOMY_VERSION,
        analyticalTopic: input.topic,
        difficultyBand: input.band,
        targetSchool: input.targetSchool ?? null,
        profileVersionId,
        policyVersionId: assignments.policyVersionId,
        sourceFilter: input.sourceFilter,
        algorithmVersion: PRACTICE_V4_ALGORITHM,
        idempotencyKey: normalizedKey,
        requestedCount: input.questionCount,
        selectedCount: selected.length,
        unseenCount,
        assessmentRunIdsJson: JSON.stringify(assessmentRunIds),
      },
    });
    for (const [index, candidate] of selected.entries()) {
      const question = candidate.sourceQuestion;
      const clone = await tx.question.create({
        data: {
          examId,
          subject: question.subject,
          num: index + 1,
          type: question.type,
          topic: question.topic,
          skill: question.skill,
          grade: question.grade,
          tags: question.tags,
          groupId: question.groupId,
          passageId: question.passageId,
          points: question.points,
          stem: question.stem,
          unit: question.unit,
          placeholder: question.placeholder,
          correct: question.correct,
          // Preserve every assessment-relevant field byte-for-byte so the clone
          // inherits the approved canonical assessment instead of becoming stale.
          answerSchema: question.answerSchema,
          options: question.options,
          modelAnswer: question.modelAnswer,
          figure: question.figure,
          source: sourceLabel(question),
          sourceQuestionId: candidate.canonicalQuestionId,
        },
      });
      await tx.practiceSetItem.create({
        data: {
          practiceSetId: practiceSet.id,
          questionId: clone.id,
          sourceQuestionId: question.id,
          canonicalQuestionId: candidate.canonicalQuestionId,
          assessmentId: candidate.assessment.id,
          analyticalTopic: candidate.assessment.topicPrimary,
          difficulty: candidate.assessment.difficultyBand,
          cognitiveLevel: candidate.assessment.cognitiveLevel,
          reasoningType: candidate.assessment.reasoningType,
          isRepeat: candidate.isRepeat,
          position: index + 1,
        },
      });
    }
    await tx.userTopicSet.create({
      data: { userId: input.userId, examId, topic: input.topic, level: `V4_${input.band.toUpperCase()}` },
    });
    return { examId, selectedCount: selected.length, unseenCount };
  });
  return persisted;
}

export interface PracticeHistoryItem {
  id: string;
  examId: string;
  attemptId: string;
  band: DifficultyBand;
  qcount: number;
  scorePct: number;
  unseenCount: number;
  sourceFilter: string;
  createdAt: Date;
}

export async function getPracticeHistory(userId: string, topic: string): Promise<PracticeHistoryItem[]> {
  const sets = await prisma.practiceSet.findMany({
    where: { userId, analyticalTopic: topic, subject: "math" },
    include: {
      exam: {
        include: {
          attempts: {
            where: { userId, submitted: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return sets.flatMap((set): PracticeHistoryItem[] => {
    const attempt = set.exam.attempts[0];
    if (!attempt || !set.difficultyBand) return [];
    return [{
      id: set.id,
      examId: set.examId,
      attemptId: attempt.id,
      band: set.difficultyBand as DifficultyBand,
      qcount: set.selectedCount,
      scorePct: attempt.score,
      unseenCount: set.unseenCount,
      sourceFilter: set.sourceFilter,
      createdAt: attempt.createdAt,
    }];
  });
}

export interface PracticeBandState {
  band: DifficultyBand;
  mastery: number | null;
  total: number;
  correct: number;
  required: number | null;
  evidence: number | null;
  availability: PracticeAvailability;
}

function parseNumberMap(value: string): Record<string, number> {
  try { return JSON.parse(value) as Record<string, number>; } catch { return {}; }
}

export async function getPracticeBandStates(
  userId: string,
  topic: string,
  targetSchool?: string | null,
): Promise<PracticeBandState[]> {
  const [cells, availability, assignments] = await Promise.all([
    getEffectiveAnalyticalMasteryCellsV4(userId, [topic]),
    getPracticeAvailabilityCatalog(userId),
    resolveGlobalAssignments(),
  ]);
  const [policy, profile] = await Promise.all([
    assignments.policyVersionId
      ? prisma.readinessPolicyVersion.findUnique({ where: { id: assignments.policyVersionId } })
      : null,
    targetSchool && assignments.profileVersionIds[targetSchool]
      ? prisma.schoolProfileVersion.findUnique({ where: { id: assignments.profileVersionIds[targetSchool] } })
      : null,
  ]);
  let blueprint: Record<string, number> = {};
  if (profile && policy) {
    const point = parseNumberMap(profile.blueprintPointJson);
    const count = parseNumberMap(profile.blueprintCountJson);
    blueprint = policy.blueprintWeightMode === "count"
      ? count
      : policy.blueprintWeightMode === "point" || Object.values(point).some((value) => value > 0)
        ? point
        : count;
  }
  return PRACTICE_BANDS.map((band) => {
    const key = cellKey(topic, band.id);
    const cell = cells[key];
    const weight = blueprint[key] ?? 0;
    const required = policy && profile && weight > 0 ? Math.max(1, policy.evidenceTarget * weight) : null;
    return {
      band: band.id,
      mastery: cell?.score ?? null,
      total: cell?.total ?? 0,
      correct: cell?.correct ?? 0,
      required,
      evidence: required ? Math.min(1, (cell?.total ?? 0) / required) : null,
      availability: availability[key] ?? {
        total: 0,
        unseen: 0,
        official: 0,
        supplement: 0,
        unseenOfficial: 0,
        unseenSupplement: 0,
      },
    };
  });
}

export async function getUserPracticeRecommendations(
  userId: string,
  school: string | null,
  limit = 3,
): Promise<LinkedReadinessRecommendation[]> {
  if (!school) return [];
  const assignments = await resolveGlobalAssignments();
  const profileVersionId = assignments.profileVersionIds[school];
  if (!assignments.policyVersionId || !profileVersionId) return [];
  const snapshot = await prisma.readinessSnapshot.findFirst({
    where: {
      userId,
      school,
      subject: "math",
      policyVersionId: assignments.policyVersionId,
      profileVersionId,
    },
    orderBy: { computedAt: "desc" },
  });
  return snapshot ? getSnapshotRecommendations(snapshot.id, limit, school) : [];
}
