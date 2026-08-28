import { prisma } from "../prisma";
import { MATH_ANALYTICAL_TOPICS } from "./analytical-topics";
import { difficultyBandOf, type DifficultyBand } from "./types";

const TOPIC_COLORS = [
  "#4267a7",
  "#6f4fb2",
  "#3d87a1",
  "#8a6ca8",
  "#c36d52",
  "#b8586e",
  "#b8843d",
  "#2f8990",
  "#4f9d78",
  "#60778d",
  "#8065a5",
  "#a46083",
  "#7e618f",
] as const;

export interface SchoolProfileMetricItem {
  id: string;
  label: string;
  count: number;
  share: number;
  color: string;
}

export interface SchoolProfileTopicBand {
  count: number;
  countWeight: number;
  pointWeight: number | null;
}

export interface SchoolProfileTopicRow {
  id: string;
  label: string;
  color: string;
  count: number;
  countWeight: number;
  pointWeight: number | null;
  critical: boolean;
  bands: Record<DifficultyBand, SchoolProfileTopicBand>;
}

export interface SchoolProfileExamRow {
  id: string;
  title: string;
  year: string;
  minutes: number;
  questionCount: number;
  expectedQuestions: number;
  questionsPerMinute: number;
  averageDifficulty: number | null;
  advancedShare: number;
  totalPoints: number;
}

export interface ActiveSchoolProfileView {
  id: string;
  taxonomyVersion: string;
  methodologyVersion: string;
  assessmentRunId: string;
  assessmentModel: string;
  examCount: number;
  questionCount: number;
  yearCount: number;
  yearRange: string[];
  difficultyIndex: number;
  averageDifficulty: number;
  advancedShare: number;
  averageQuestionsPerMinute: number;
  assessmentCoverage: number;
  averageAssessmentConfidence: number;
  confidence: "high" | "medium" | "low";
  criticalTopicThreshold: number;
  difficultyDistribution: SchoolProfileMetricItem[];
  cognitiveDistribution: SchoolProfileMetricItem[];
  formatDistribution: SchoolProfileMetricItem[];
  topics: SchoolProfileTopicRow[];
  exams: SchoolProfileExamRow[];
  reliabilityFlags: string[];
  sourceHash: string;
  activatedAt: string | null;
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function confidencePercent(value: number): number {
  const percent = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, percent));
}

function roundedCount(share: number, total: number): number {
  return Math.round(share * total);
}

export async function getActiveSchoolProfileView(
  school: string,
): Promise<ActiveSchoolProfileView | null> {
  const [profileAssignment, policyAssignment] = await Promise.all([
    prisma.schoolProfileAssignment.findFirst({
      where: {
        school,
        subject: "math",
        scopeType: "global",
        scopeKey: "global",
        status: "active",
        endedAt: null,
      },
      orderBy: { effectiveFrom: "desc" },
    }),
    prisma.readinessPolicyAssignment.findFirst({
      where: {
        subject: "math",
        scopeType: "global",
        scopeKey: "global",
        status: "active",
        endedAt: null,
      },
      orderBy: { effectiveFrom: "desc" },
    }),
  ]);
  if (!profileAssignment) return null;

  const [profile, policy] = await Promise.all([
    prisma.schoolProfileVersion.findUnique({ where: { id: profileAssignment.profileVersionId } }),
    policyAssignment
      ? prisma.readinessPolicyVersion.findUnique({ where: { id: policyAssignment.policyVersionId } })
      : null,
  ]);
  if (!profile) return null;

  const sourceExamIds = parseJson<string[]>(profile.sourceExamIdsJson, []);
  const exams = sourceExamIds.length
    ? await prisma.exam.findMany({
        where: { id: { in: sourceExamIds }, subject: "math", kind: "official" },
        include: { questions: { select: { id: true, points: true } } },
      })
    : [];
  const questionIds = exams.flatMap((exam) => exam.questions.map((question) => question.id));
  const assessments = questionIds.length
    ? await prisma.questionAssessment.findMany({
        where: {
          questionId: { in: questionIds },
          sourceRunId: profile.assessmentRunId,
          taxonomyVersion: profile.taxonomyVersion,
        },
      })
    : [];
  const assessmentByQuestion = new Map(assessments.map((assessment) => [assessment.questionId, assessment]));
  const run = await prisma.assessmentRun.findUnique({ where: { id: profile.assessmentRunId } });

  const blueprintCount = parseJson<Record<string, number>>(profile.blueprintCountJson, {});
  const blueprintPoint = parseJson<Record<string, number>>(profile.blueprintPointJson, {});
  const topicWeights = parseJson<{
    count?: Record<string, number>;
    point?: Record<string, number>;
  }>(profile.topicWeightsJson, {});
  const cognitiveWeights = parseJson<Record<string, number>>(profile.cognitiveWeightsJson, {});
  const formatWeights = parseJson<Record<string, number>>(profile.formatProfileJson, {});
  const reliability = parseJson<{
    flags?: string[];
    yearRange?: string[];
  }>(profile.reliabilityJson, {});
  const yearRange = parseJson<string[]>(profile.yearRangeJson, reliability.yearRange ?? []);
  const criticalTopicThreshold = policy?.criticalTopicThreshold ?? 0.05;

  const topicMetaById = new Map(
    MATH_ANALYTICAL_TOPICS.map((topic, index) => [
      topic.id,
      { ...topic, color: TOPIC_COLORS[index % TOPIC_COLORS.length] },
    ]),
  );
  const topicIds = new Set<string>([
    ...Object.keys(topicWeights.count ?? {}),
    ...Object.keys(blueprintCount).map((key) => key.split("::")[0]),
  ]);
  const topics: SchoolProfileTopicRow[] = [...topicIds]
    .map((topicId) => {
      const countWeight = topicWeights.count?.[topicId] ?? 0;
      const pointWeight = topicWeights.point?.[topicId];
      const meta = topicMetaById.get(topicId);
      const bands = Object.fromEntries(
        (["foundation", "application", "advanced"] as DifficultyBand[]).map((band) => {
          const key = `${topicId}::${band}`;
          const weight = blueprintCount[key] ?? 0;
          return [
            band,
            {
              count: roundedCount(weight, profile.questionCount),
              countWeight: weight,
              pointWeight: blueprintPoint[key] ?? null,
            },
          ];
        }),
      ) as Record<DifficultyBand, SchoolProfileTopicBand>;
      return {
        id: topicId,
        label: meta?.name ?? topicId.replaceAll("_", " "),
        color: meta?.color ?? "#64748b",
        count: roundedCount(countWeight, profile.questionCount),
        countWeight,
        pointWeight: pointWeight ?? null,
        critical: countWeight >= criticalTopicThreshold,
        bands,
      };
    })
    .sort((left, right) => right.countWeight - left.countWeight || left.label.localeCompare(right.label, "vi"));

  const difficultyCounts = new Map<number, number>([1, 2, 3, 4, 5].map((difficulty) => [difficulty, 0]));
  let assessedDifficultyTotal = 0;
  let assessedAdvanced = 0;
  let assessmentConfidenceTotal = 0;
  for (const assessment of assessments) {
    difficultyCounts.set(
      assessment.difficultyBand,
      (difficultyCounts.get(assessment.difficultyBand) ?? 0) + 1,
    );
    assessedDifficultyTotal += assessment.difficultyBand;
    if (assessment.difficultyBand >= 4) assessedAdvanced += 1;
    assessmentConfidenceTotal += confidencePercent(assessment.confidence);
  }
  const assessmentCount = assessments.length;
  const difficultyColors = ["#2f806d", "#4f9d78", "#6f4fb2", "#b96876", "#94445f"];
  const difficultyDistribution = [1, 2, 3, 4, 5].map((difficulty, index) => {
    const count = difficultyCounts.get(difficulty) ?? 0;
    return {
      id: `D${difficulty}`,
      label: `D${difficulty}`,
      count,
      share: profile.questionCount > 0 ? count / profile.questionCount : 0,
      color: difficultyColors[index],
    };
  });

  const cognitiveLabels: Record<string, string> = {
    co_ban: "Cơ bản",
    van_dung: "Vận dụng",
    nang_cao: "Nâng cao",
    chuyen_sau: "Chuyên sâu",
  };
  const cognitiveColors: Record<string, string> = {
    co_ban: "#64748b",
    van_dung: "#3d6fa9",
    nang_cao: "#a94f6b",
    chuyen_sau: "#71468d",
  };
  const cognitiveOrder = ["co_ban", "van_dung", "nang_cao", "chuyen_sau"];
  const cognitiveDistribution = cognitiveOrder.map((id) => ({
    id,
    label: cognitiveLabels[id],
    count: roundedCount(cognitiveWeights[id] ?? 0, profile.questionCount),
    share: cognitiveWeights[id] ?? 0,
    color: cognitiveColors[id],
  }));

  const formatLabels: Record<string, string> = {
    mcq: "Trắc nghiệm",
    choice: "Trắc nghiệm",
    fill: "Điền đáp án",
    essay: "Tự luận",
  };
  const formatColors: Record<string, string> = {
    mcq: "#3d6fa9",
    choice: "#3d6fa9",
    fill: "#6f4fb2",
    essay: "#a94f6b",
  };
  const formatDistribution = Object.entries(formatWeights)
    .map(([id, share]) => ({
      id,
      label: formatLabels[id] ?? id,
      count: roundedCount(share, profile.questionCount),
      share,
      color: formatColors[id] ?? "#64748b",
    }))
    .sort((left, right) => right.share - left.share);

  const examRows: SchoolProfileExamRow[] = exams
    .map((exam) => {
      const rows = exam.questions
        .map((question) => ({ question, assessment: assessmentByQuestion.get(question.id) }))
        .filter((row): row is { question: (typeof exam.questions)[number]; assessment: NonNullable<typeof row.assessment> } => Boolean(row.assessment));
      const difficultyTotal = rows.reduce((sum, row) => sum + row.assessment.difficultyBand, 0);
      const advancedCount = rows.filter((row) => row.assessment.difficultyBand >= 4).length;
      return {
        id: exam.id,
        title: exam.title ?? `Đề ${exam.school} · ${exam.year}`,
        year: exam.year,
        minutes: exam.minutes,
        questionCount: rows.length,
        expectedQuestions: exam.qcount,
        questionsPerMinute: exam.minutes > 0 ? rows.length / exam.minutes : 0,
        averageDifficulty: rows.length > 0 ? difficultyTotal / rows.length : null,
        advancedShare: rows.length > 0 ? advancedCount / rows.length : 0,
        totalPoints: rows.reduce((sum, row) => sum + row.question.points, 0),
      };
    })
    .sort((left, right) => right.year.localeCompare(left.year) || left.id.localeCompare(right.id));

  const totalMinutes = examRows.reduce((sum, exam) => sum + Math.max(0, exam.minutes), 0);
  const averageAssessmentConfidence = assessmentCount > 0
    ? assessmentConfidenceTotal / assessmentCount
    : 0;
  const confidence: ActiveSchoolProfileView["confidence"] =
    profile.examCount >= 5 && profile.questionCount >= 50
      ? "high"
      : profile.examCount >= 3 && profile.questionCount >= 40
        ? "medium"
        : "low";

  return {
    id: profile.id,
    taxonomyVersion: profile.taxonomyVersion,
    methodologyVersion: profile.methodologyVersion,
    assessmentRunId: profile.assessmentRunId,
    assessmentModel: run?.model ?? "—",
    examCount: profile.examCount,
    questionCount: profile.questionCount,
    yearCount: profile.yearCount,
    yearRange,
    difficultyIndex: profile.difficultyIndex,
    averageDifficulty: assessmentCount > 0 ? assessedDifficultyTotal / assessmentCount : 0,
    advancedShare: assessmentCount > 0 ? assessedAdvanced / assessmentCount : 0,
    averageQuestionsPerMinute: totalMinutes > 0 ? profile.questionCount / totalMinutes : 0,
    assessmentCoverage: profile.questionCount > 0 ? assessmentCount / profile.questionCount : 0,
    averageAssessmentConfidence,
    confidence,
    criticalTopicThreshold,
    difficultyDistribution,
    cognitiveDistribution,
    formatDistribution,
    topics,
    exams: examRows,
    reliabilityFlags: reliability.flags ?? [],
    sourceHash: profile.sourceHash,
    activatedAt: profile.activatedAt?.toISOString() ?? null,
  };
}
