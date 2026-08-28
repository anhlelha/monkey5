import assert from "node:assert/strict";
import test from "node:test";
import { buildSchoolProfilesV2, type ProfileQuestionFact } from "../../lib/readiness-v4";

const row = (overrides: Partial<ProfileQuestionFact>): ProfileQuestionFact => ({
  questionId: "q1",
  questionContentHash: "h1",
  assessmentRunId: "run-1",
  school: "ams",
  examId: "ams-2026",
  year: "2026-2027",
  examMinutes: 45,
  topic: "frac_decimal",
  difficulty: 2,
  cognitiveLevel: "co_ban",
  questionType: "fill",
  points: 1,
  ...overrides,
});

test("profile builder creates normalized count and point blueprints", () => {
  const profiles = buildSchoolProfilesV2(
    [
      row({ questionId: "q1", points: 1 }),
      row({ questionId: "q2", topic: "plane_geometry", difficulty: 4, points: 3 }),
    ],
    { taxonomyVersion: "math-topic-taxonomy-v1" },
  );
  assert.equal(profiles.length, 1);
  const profile = profiles[0];
  assert.equal(Object.values(profile.blueprintCount).reduce((a, b) => a + b, 0), 1);
  assert.equal(Object.values(profile.blueprintPoint).reduce((a, b) => a + b, 0), 1);
  assert.equal(profile.blueprintCount["frac_decimal::foundation"], 0.5);
  assert.equal(profile.blueprintPoint["plane_geometry::advanced"], 0.75);
  assert.equal(profile.difficultyWeightsCount.advanced, 0.5);
});

test("profile source hash changes for assessment-relevant changes", () => {
  const first = buildSchoolProfilesV2([row({})], { taxonomyVersion: "math-topic-taxonomy-v1" })[0];
  const changedContent = buildSchoolProfilesV2(
    [row({ questionContentHash: "changed" })],
    { taxonomyVersion: "math-topic-taxonomy-v1" },
  )[0];
  const changedPoints = buildSchoolProfilesV2([row({ points: 2 })], { taxonomyVersion: "math-topic-taxonomy-v1" })[0];
  assert.notEqual(first.sourceHash, changedContent.sourceHash);
  assert.notEqual(first.sourceHash, changedPoints.sourceHash);
});
