import { prisma } from "../prisma";
import { getActiveSchools } from "../schools";
import { MATH_ANALYTICAL_TOPICS } from "./analytical-topics";

export type ComparisonWeightMode = "count" | "point";
export type ComparisonSortMetric =
  | "difficultyIndex"
  | "averageDifficulty"
  | "advancedShare"
  | "questionsPerMinute"
  | "examCount"
  | "assessmentCoverage"
  | "assessmentConfidence";

export interface SchoolProfileComparisonRow {
  school: string;
  schoolShort: string;
  schoolName: string;
  schoolFull: string;
  color: string;
  profileVersionId: string;
  taxonomyVersion: string;
  methodologyVersion: string;
  examCount: number;
  questionCount: number;
  yearCount: number;
  yearRange: string[];
  difficultyIndex: number;
  averageDifficulty: number;
  advancedShare: number;
  questionsPerMinute: number;
  assessmentCoverage: number;
  assessmentConfidence: number;
  confidence: "high" | "medium" | "low";
  reliabilityFlags: string[];
  pointWeightAvailable: boolean;
  difficultyDistribution: Record<"D1" | "D2" | "D3" | "D4" | "D5", number>;
  bandWeights: Record<ComparisonWeightMode, Record<"foundation" | "application" | "advanced", number>>;
  topicWeights: Record<ComparisonWeightMode, Record<string, number>>;
  topicBandWeights: Record<
    ComparisonWeightMode,
    Record<string, Record<"foundation" | "application" | "advanced", number>>
  >;
}

export interface SchoolProfileComparisonSummary {
  schoolCount: number;
  examCount: number;
  questionCount: number;
  yearRange: string[];
  averageCoverage: number;
  averageConfidence: number;
  reliabilityWarningCount: number;
}

export interface SchoolProfileComparisonView {
  rows: SchoolProfileComparisonRow[];
  summary: SchoolProfileComparisonSummary;
  topics: typeof MATH_ANALYTICAL_TOPICS;
}

const BAND_IDS = ["foundation", "application", "advanced"] as const;
const DIFFICULTY_IDS = ["D1", "D2", "D3", "D4", "D5"] as const;

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function confidencePercent(value: number): number {
  const percent = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, percent));
}

function normalizedRecord(values: Record<string, number> | undefined): Record<string, number> {
  return Object.fromEntries(MATH_ANALYTICAL_TOPICS.map((topic) => [topic.id, values?.[topic.id] ?? 0]));
}

function bandRecord(values: Record<string, number> | undefined) {
  return Object.fromEntries(BAND_IDS.map((band) => [band, values?.[band] ?? 0])) as Record<(typeof BAND_IDS)[number], number>;
}

function topicBandRecord(blueprint: Record<string, number>): SchoolProfileComparisonRow["topicBandWeights"]["count"] {
  return Object.fromEntries(MATH_ANALYTICAL_TOPICS.map((topic) => [
    topic.id,
    Object.fromEntries(BAND_IDS.map((band) => [band, blueprint[`${topic.id}::${band}`] ?? 0])),
  ])) as SchoolProfileComparisonRow["topicBandWeights"]["count"];
}

function nearOne(values: Record<string, number>): boolean {
  const total = Object.values(values).reduce((sum, value) => sum + value, 0);
  return Math.abs(total - 1) <= 0.01;
}

export function summarizeSchoolProfileComparison(
  rows: SchoolProfileComparisonRow[],
): SchoolProfileComparisonSummary {
  const years = [...new Set(rows.flatMap((row) => row.yearRange))].sort();
  const questionTotal = rows.reduce((sum, row) => sum + row.questionCount, 0);
  const weighted = (field: "assessmentCoverage" | "assessmentConfidence") =>
    questionTotal > 0
      ? rows.reduce((sum, row) => sum + row[field] * row.questionCount, 0) / questionTotal
      : 0;
  return {
    schoolCount: rows.length,
    examCount: rows.reduce((sum, row) => sum + row.examCount, 0),
    questionCount: questionTotal,
    yearRange: years,
    averageCoverage: weighted("assessmentCoverage"),
    averageConfidence: weighted("assessmentConfidence"),
    reliabilityWarningCount: rows.filter((row) => row.reliabilityFlags.length > 0).length,
  };
}

export function sortSchoolProfileComparisonRows(
  rows: SchoolProfileComparisonRow[],
  metric: ComparisonSortMetric,
  direction: "asc" | "desc" = "desc",
): SchoolProfileComparisonRow[] {
  const multiplier = direction === "asc" ? 1 : -1;
  return [...rows].sort((left, right) => {
    const delta = (left[metric] - right[metric]) * multiplier;
    return delta || left.schoolShort.localeCompare(right.schoolShort, "vi");
  });
}

export async function getActiveSchoolProfileComparison(): Promise<SchoolProfileComparisonView> {
  const [assignments, schools] = await Promise.all([
    prisma.schoolProfileAssignment.findMany({
      where: {
        subject: "math",
        scopeType: "global",
        scopeKey: "global",
        status: "active",
        endedAt: null,
      },
      orderBy: { effectiveFrom: "desc" },
    }),
    getActiveSchools(),
  ]);
  const latestAssignmentBySchool = new Map<string, (typeof assignments)[number]>();
  for (const assignment of assignments) {
    if (!latestAssignmentBySchool.has(assignment.school)) latestAssignmentBySchool.set(assignment.school, assignment);
  }
  const profileIds = [...latestAssignmentBySchool.values()].map((assignment) => assignment.profileVersionId);
  if (profileIds.length === 0) return { rows: [], summary: summarizeSchoolProfileComparison([]), topics: MATH_ANALYTICAL_TOPICS };

  const profiles = await prisma.schoolProfileVersion.findMany({ where: { id: { in: profileIds }, subject: "math" } });
  const sourceExamIds = [...new Set(profiles.flatMap((profile) => parseJson<string[]>(profile.sourceExamIdsJson, [])))];
  const exams = sourceExamIds.length > 0
    ? await prisma.exam.findMany({
        where: { id: { in: sourceExamIds }, subject: "math", kind: "official", generated: false },
        include: { questions: { select: { id: true } } },
      })
    : [];
  const questionIds = [...new Set(exams.flatMap((exam) => exam.questions.map((question) => question.id)))];
  const runIds = [...new Set(profiles.map((profile) => profile.assessmentRunId))];
  const taxonomyVersions = [...new Set(profiles.map((profile) => profile.taxonomyVersion))];
  const assessments = questionIds.length > 0
    ? await prisma.questionAssessment.findMany({
        where: {
          questionId: { in: questionIds },
          sourceRunId: { in: runIds },
          taxonomyVersion: { in: taxonomyVersions },
        },
      })
    : [];

  const schoolById = new Map(schools.map((school) => [school.id, school]));
  const examById = new Map(exams.map((exam) => [exam.id, exam]));
  const assessmentByKey = new Map(
    assessments.map((assessment) => [
      `${assessment.sourceRunId}:${assessment.taxonomyVersion}:${assessment.questionId}`,
      assessment,
    ]),
  );

  const rows = profiles.flatMap((profile): SchoolProfileComparisonRow[] => {
    const assignment = latestAssignmentBySchool.get(profile.school);
    const school = schoolById.get(profile.school);
    if (!assignment || assignment.profileVersionId !== profile.id || !school) return [];
    const profileExamIds = parseJson<string[]>(profile.sourceExamIdsJson, []);
    const profileExams = profileExamIds.flatMap((id) => examById.get(id) ? [examById.get(id)!] : []);
    const profileAssessments = profileExams.flatMap((exam) => exam.questions.flatMap((question) => {
      const assessment = assessmentByKey.get(`${profile.assessmentRunId}:${profile.taxonomyVersion}:${question.id}`);
      return assessment ? [assessment] : [];
    }));
    const difficultyCounts = Object.fromEntries(DIFFICULTY_IDS.map((id) => [id, 0])) as Record<(typeof DIFFICULTY_IDS)[number], number>;
    let difficultyTotal = 0;
    let confidenceTotal = 0;
    for (const assessment of profileAssessments) {
      const key = `D${assessment.difficultyBand}` as (typeof DIFFICULTY_IDS)[number];
      if (key in difficultyCounts) difficultyCounts[key] += 1;
      difficultyTotal += assessment.difficultyBand;
      confidenceTotal += confidencePercent(assessment.confidence);
    }
    const assessmentCount = profileAssessments.length;
    const difficultyDistribution = Object.fromEntries(DIFFICULTY_IDS.map((id) => [
      id,
      profile.questionCount > 0 ? difficultyCounts[id] / profile.questionCount : 0,
    ])) as SchoolProfileComparisonRow["difficultyDistribution"];
    const blueprintCount = parseJson<Record<string, number>>(profile.blueprintCountJson, {});
    const blueprintPoint = parseJson<Record<string, number>>(profile.blueprintPointJson, {});
    const topicWeights = parseJson<{ count?: Record<string, number>; point?: Record<string, number> }>(profile.topicWeightsJson, {});
    const difficultyWeights = parseJson<{ count?: Record<string, number>; point?: Record<string, number> }>(profile.difficultyWeightsJson, {});
    const reliability = parseJson<{ flags?: string[]; yearRange?: string[] }>(profile.reliabilityJson, {});
    const yearRange = parseJson<string[]>(profile.yearRangeJson, reliability.yearRange ?? []);
    const minutes = profileExams.reduce((sum, exam) => sum + Math.max(0, exam.minutes), 0);
    const pointWeightAvailable = nearOne(blueprintPoint) && nearOne(topicWeights.point ?? {});
    const confidence: SchoolProfileComparisonRow["confidence"] =
      profile.examCount >= 5 && profile.questionCount >= 50
        ? "high"
        : profile.examCount >= 3 && profile.questionCount >= 40
          ? "medium"
          : "low";
    return [{
      school: profile.school,
      schoolShort: school.short,
      schoolName: school.name,
      schoolFull: school.full,
      color: school.color,
      profileVersionId: profile.id,
      taxonomyVersion: profile.taxonomyVersion,
      methodologyVersion: profile.methodologyVersion,
      examCount: profile.examCount,
      questionCount: profile.questionCount,
      yearCount: profile.yearCount,
      yearRange,
      difficultyIndex: profile.difficultyIndex,
      averageDifficulty: assessmentCount > 0 ? difficultyTotal / assessmentCount : 0,
      advancedShare: profile.questionCount > 0 ? (difficultyCounts.D4 + difficultyCounts.D5) / profile.questionCount : 0,
      questionsPerMinute: minutes > 0 ? profile.questionCount / minutes : 0,
      assessmentCoverage: profile.questionCount > 0 ? assessmentCount / profile.questionCount : 0,
      assessmentConfidence: assessmentCount > 0 ? confidenceTotal / assessmentCount : 0,
      confidence,
      reliabilityFlags: reliability.flags ?? [],
      pointWeightAvailable,
      difficultyDistribution,
      bandWeights: {
        count: bandRecord(difficultyWeights.count),
        point: bandRecord(pointWeightAvailable ? difficultyWeights.point : difficultyWeights.count),
      },
      topicWeights: {
        count: normalizedRecord(topicWeights.count),
        point: normalizedRecord(pointWeightAvailable ? topicWeights.point : topicWeights.count),
      },
      topicBandWeights: {
        count: topicBandRecord(blueprintCount),
        point: topicBandRecord(pointWeightAvailable ? blueprintPoint : blueprintCount),
      },
    }];
  }).sort((left, right) => left.schoolShort.localeCompare(right.schoolShort, "vi"));

  return { rows, summary: summarizeSchoolProfileComparison(rows), topics: MATH_ANALYTICAL_TOPICS };
}
