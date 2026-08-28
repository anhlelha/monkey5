import assert from "node:assert/strict";
import test from "node:test";
import {
  sortSchoolProfileComparisonRows,
  summarizeSchoolProfileComparison,
  type SchoolProfileComparisonRow,
} from "../../lib/readiness-v4/school-profile-comparison-service";

function row(input: Partial<SchoolProfileComparisonRow> & Pick<SchoolProfileComparisonRow, "school" | "schoolShort">): SchoolProfileComparisonRow {
  const { school, schoolShort, ...overrides } = input;
  return {
    school,
    schoolShort,
    schoolName: schoolShort,
    schoolFull: schoolShort,
    color: "#000",
    profileVersionId: `profile-${input.school}`,
    taxonomyVersion: "math-topic-taxonomy-v1",
    methodologyVersion: "school-profile-v2",
    examCount: 1,
    questionCount: 10,
    yearCount: 1,
    yearRange: ["2025"],
    difficultyIndex: 50,
    averageDifficulty: 2.5,
    advancedShare: 0.2,
    questionsPerMinute: 0.25,
    assessmentCoverage: 1,
    assessmentConfidence: 90,
    confidence: "medium",
    reliabilityFlags: [],
    pointWeightAvailable: true,
    difficultyDistribution: { D1: 0.2, D2: 0.2, D3: 0.2, D4: 0.2, D5: 0.2 },
    bandWeights: {
      count: { foundation: 0.4, application: 0.2, advanced: 0.4 },
      point: { foundation: 0.4, application: 0.2, advanced: 0.4 },
    },
    topicWeights: { count: {}, point: {} },
    topicBandWeights: { count: {}, point: {} },
    ...overrides,
  };
}

test("comparison summary weights coverage and confidence by question count", () => {
  const rows = [
    row({ school: "a", schoolShort: "A", examCount: 2, questionCount: 10, assessmentCoverage: 1, assessmentConfidence: 90, yearRange: ["2024"] }),
    row({ school: "b", schoolShort: "B", examCount: 3, questionCount: 30, assessmentCoverage: 0.5, assessmentConfidence: 70, yearRange: ["2025"], reliabilityFlags: ["LOW_EXAM_COUNT"] }),
  ];
  const summary = summarizeSchoolProfileComparison(rows);
  assert.equal(summary.schoolCount, 2);
  assert.equal(summary.examCount, 5);
  assert.equal(summary.questionCount, 40);
  assert.deepEqual(summary.yearRange, ["2024", "2025"]);
  assert.equal(summary.averageCoverage, 0.625);
  assert.equal(summary.averageConfidence, 75);
  assert.equal(summary.reliabilityWarningCount, 1);
});

test("comparison sorting is deterministic at equal metric values", () => {
  const rows = [
    row({ school: "b", schoolShort: "B", difficultyIndex: 60 }),
    row({ school: "a", schoolShort: "A", difficultyIndex: 60 }),
    row({ school: "c", schoolShort: "C", difficultyIndex: 40 }),
  ];
  assert.deepEqual(
    sortSchoolProfileComparisonRows(rows, "difficultyIndex", "desc").map((item) => item.school),
    ["a", "b", "c"],
  );
  assert.deepEqual(
    sortSchoolProfileComparisonRows(rows, "difficultyIndex", "asc").map((item) => item.school),
    ["c", "a", "b"],
  );
});

test("comparison view model has no user-level readiness fields", () => {
  const value = row({ school: "cg", schoolShort: "CG" }) as unknown as Record<string, unknown>;
  for (const forbidden of ["userId", "readiness", "schoolMastery", "evidence", "snapshotId"]) {
    assert.equal(forbidden in value, false, `${forbidden} must not be exposed by School Profile comparison`);
  }
});
