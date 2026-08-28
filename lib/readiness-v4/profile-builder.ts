import { cellKey, difficultyBandOf, type DifficultyBand, type SchoolProfileV2 } from "./types";
import { stableHash } from "./hashing";

export interface ProfileQuestionFact {
  questionId: string;
  questionContentHash: string;
  assessmentRunId: string;
  school: string;
  examId: string;
  year: string;
  examMinutes: number;
  topic: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  cognitiveLevel: string;
  questionType: string;
  points: number;
}

export interface BuiltSchoolProfile extends SchoolProfileV2 {
  sourceExamIds: string[];
  formatProfile: Record<string, number>;
}

function normalise(raw: Record<string, number>): Record<string, number> {
  const total = Object.values(raw).reduce((sum, value) => sum + value, 0);
  if (total <= 0) return {};
  return Object.fromEntries(
    Object.entries(raw)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [key, value / total]),
  );
}

function aggregateTopic(blueprint: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, weight] of Object.entries(blueprint)) {
    const [topic] = key.split("::");
    out[topic] = (out[topic] ?? 0) + weight;
  }
  return out;
}

function aggregateBand(blueprint: Record<string, number>): Record<DifficultyBand, number> {
  const out: Record<DifficultyBand, number> = { foundation: 0, application: 0, advanced: 0 };
  for (const [key, weight] of Object.entries(blueprint)) {
    const band = key.split("::")[1] as DifficultyBand;
    if (band in out) out[band] += weight;
  }
  return out;
}

function percentileRanks(values: Map<string, number>): Map<string, number> {
  const ordered = [...values.entries()].sort((left, right) => left[1] - right[1] || left[0].localeCompare(right[0]));
  const ranks = new Map<string, number>();
  if (ordered.length === 1) {
    ranks.set(ordered[0][0], 50);
    return ranks;
  }
  ordered.forEach(([school], index) => ranks.set(school, (index / (ordered.length - 1)) * 100));
  return ranks;
}

export function buildSchoolProfilesV2(
  facts: ProfileQuestionFact[],
  options: { taxonomyVersion: string; methodologyVersion?: string },
): BuiltSchoolProfile[] {
  const bySchool = new Map<string, ProfileQuestionFact[]>();
  for (const fact of facts) {
    const rows = bySchool.get(fact.school) ?? [];
    rows.push(fact);
    bySchool.set(fact.school, rows);
  }

  const questionsPerMinute = new Map<string, number>();
  for (const [school, rows] of bySchool) {
    const exams = new Map<string, { minutes: number; questions: number }>();
    for (const row of rows) {
      const exam = exams.get(row.examId) ?? { minutes: row.examMinutes, questions: 0 };
      exam.questions += 1;
      exams.set(row.examId, exam);
    }
    const totalMinutes = [...exams.values()].reduce((sum, exam) => sum + Math.max(1, exam.minutes), 0);
    questionsPerMinute.set(school, totalMinutes > 0 ? rows.length / totalMinutes : 0);
  }
  const timePercentiles = percentileRanks(questionsPerMinute);

  const drafts = [...bySchool.entries()].map(([school, rows]) => {
    const rawCount: Record<string, number> = {};
    const rawPoint: Record<string, number> = {};
    const cognitiveCount: Record<string, number> = {};
    const formatCount: Record<string, number> = {};
    const difficultyCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const exams = [...new Set(rows.map((row) => row.examId))].sort();
    const years = [...new Set(rows.map((row) => row.year))].sort();
    const flags: string[] = [];

    for (const row of rows) {
      const key = cellKey(row.topic, difficultyBandOf(row.difficulty));
      rawCount[key] = (rawCount[key] ?? 0) + 1;
      if (Number.isFinite(row.points) && row.points > 0) rawPoint[key] = (rawPoint[key] ?? 0) + row.points;
      cognitiveCount[row.cognitiveLevel] = (cognitiveCount[row.cognitiveLevel] ?? 0) + 1;
      formatCount[row.questionType] = (formatCount[row.questionType] ?? 0) + 1;
      difficultyCount[row.difficulty] += 1;
    }

    const blueprintCount = normalise(rawCount);
    const blueprintPoint = normalise(rawPoint);
    if (Object.keys(blueprintPoint).length === 0) flags.push("POINT_WEIGHT_UNAVAILABLE");
    if (exams.length < 3) flags.push("LOW_EXAM_COUNT");
    if (years.length < 2) flags.push("SINGLE_YEAR");

    const avgDifficulty = rows.reduce((sum, row) => sum + row.difficulty, 0) / rows.length;
    const base = (100 * (avgDifficulty - 1)) / 4;
    const pD4 = difficultyCount[4] / rows.length;
    const pD5 = difficultyCount[5] / rows.length;
    const tail = 100 * (0.75 * pD4 + pD5);
    const time = timePercentiles.get(school) ?? 50;
    const composite = 0.7 * base + 0.2 * tail + 0.1 * time;

    return {
      school,
      rows,
      blueprintCount,
      blueprintPoint,
      cognitiveWeights: normalise(cognitiveCount),
      formatProfile: normalise(formatCount),
      sourceExamIds: exams,
      years,
      flags,
      base,
      tail,
      time,
      composite,
    };
  });

  const totalQuestions = drafts.reduce((sum, draft) => sum + draft.rows.length, 0);
  const weightedCompositeMean = totalQuestions > 0
    ? drafts.reduce((sum, draft) => sum + draft.composite * draft.rows.length, 0) / totalQuestions
    : 0;

  return drafts
    .map((draft): BuiltSchoolProfile => {
      const sourceRows = [...draft.rows]
        .sort((left, right) => left.questionId.localeCompare(right.questionId))
        .map((row) => ({
          questionId: row.questionId,
          questionContentHash: row.questionContentHash,
          assessmentRunId: row.assessmentRunId,
          examId: row.examId,
          year: row.year,
          topic: row.topic,
          difficulty: row.difficulty,
          cognitiveLevel: row.cognitiveLevel,
          points: row.points,
          type: row.questionType,
        }));
      return {
        school: draft.school,
        subject: "math",
        taxonomyVersion: options.taxonomyVersion,
        methodologyVersion: options.methodologyVersion ?? "school-profile-v2",
        sourceHash: stableHash(sourceRows),
        blueprintCount: draft.blueprintCount,
        blueprintPoint: draft.blueprintPoint,
        topicWeightsCount: aggregateTopic(draft.blueprintCount),
        topicWeightsPoint: aggregateTopic(draft.blueprintPoint),
        difficultyWeightsCount: aggregateBand(draft.blueprintCount),
        difficultyWeightsPoint: aggregateBand(draft.blueprintPoint),
        cognitiveWeights: draft.cognitiveWeights,
        difficultyIndex: Math.max(0, Math.min(100, 50 + draft.composite - weightedCompositeMean)),
        difficultyFactors: {
          base: draft.base,
          tail: draft.tail,
          time: draft.time,
          composite: draft.composite,
        },
        reliability: {
          examCount: draft.sourceExamIds.length,
          questionCount: draft.rows.length,
          yearCount: draft.years.length,
          yearRange: draft.years,
          examIds: draft.sourceExamIds,
          flags: draft.flags,
        },
        sourceExamIds: draft.sourceExamIds,
        formatProfile: draft.formatProfile,
      };
    })
    .sort((left, right) => left.school.localeCompare(right.school));
}
