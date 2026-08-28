import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_MATH_READINESS_POLICY_V1,
  computeMasteryV4,
  computeReadinessV4,
  smoothMastery,
  validateReadinessPolicy,
  type AssessedAttemptFact,
  type SchoolProfileV2,
} from "../../lib/readiness-v4";

const profile = (blueprint: Record<string, number>): SchoolProfileV2 => ({
  school: "test",
  subject: "math",
  taxonomyVersion: "math-topic-taxonomy-v1",
  methodologyVersion: "school-profile-v2",
  sourceHash: "fixture",
  blueprintCount: blueprint,
  blueprintPoint: blueprint,
  topicWeightsCount: {},
  topicWeightsPoint: {},
  difficultyWeightsCount: { foundation: 0, application: 0, advanced: 0 },
  difficultyWeightsPoint: { foundation: 0, application: 0, advanced: 0 },
  cognitiveWeights: {},
  difficultyIndex: 50,
  difficultyFactors: { base: 0, tail: 0, time: 0, composite: 0 },
  reliability: { examCount: 1, questionCount: 1, yearCount: 1, yearRange: ["2026"], examIds: ["fixture"], flags: [] },
});

const fact = (overrides: Partial<AssessedAttemptFact> = {}): AssessedAttemptFact => ({
  attemptId: "a1",
  questionId: "q1",
  canonicalQuestionId: "q1",
  topic: "frac_decimal",
  difficulty: 2,
  cognitiveLevel: "co_ban",
  credit: 1,
  ...overrides,
});

test("Beta smoothing uses policy prior and supports fractional credit", () => {
  assert.equal(smoothMastery(0, 0, 4, 0.5), 0.5);
  assert.equal(smoothMastery(1, 1, 4, 0.5), 0.6);
  assert.equal(smoothMastery(2, 2, 4, 0.5), 2 / 3);
  assert.equal(smoothMastery(0, 2, 4, 0.5), 1 / 3);
  assert.equal(smoothMastery(0.5, 1, 4, 0.5), 0.5);
});

test("new user is unverified and prior 50% is not presented as verified readiness", () => {
  const mastery = computeMasteryV4([], {
    priorStrength: 4,
    priorMastery: 0.5,
    knownCells: [{ topic: "frac_decimal", band: "foundation" }],
  });
  const result = computeReadinessV4(
    mastery,
    profile({ "frac_decimal::foundation": 1 }),
    DEFAULT_MATH_READINESS_POLICY_V1,
  );
  assert.equal(result.schoolMastery, 0.5);
  assert.equal(result.schoolEvidence, 0);
  assert.equal(result.readiness, 0);
  assert.equal(result.status, "unverified");
  assert.ok(result.reasonCodes.includes("NO_VERIFIED_EVIDENCE"));
});

test("evidence is calculated per blueprint cell and cannot spill across cells", () => {
  const facts = Array.from({ length: 20 }, (_, index) =>
    fact({ attemptId: `a${index}`, questionId: `q${index}`, credit: 1 }),
  );
  const mastery = computeMasteryV4(facts, {
    priorStrength: 4,
    priorMastery: 0.5,
    knownCells: [
      { topic: "frac_decimal", band: "foundation" },
      { topic: "plane_geometry", band: "advanced" },
    ],
  });
  const result = computeReadinessV4(
    mastery,
    profile({ "frac_decimal::foundation": 0.5, "plane_geometry::advanced": 0.5 }),
    DEFAULT_MATH_READINESS_POLICY_V1,
  );
  assert.equal(result.cells["frac_decimal::foundation"].evidence, 1);
  assert.equal(result.cells["plane_geometry::advanced"].evidence, 0);
  assert.equal(result.schoolEvidence, 0.5);
});

test("readiness never exceeds school mastery on the 0..100 scale", () => {
  for (let total = 0; total <= 100; total += 5) {
    const facts = Array.from({ length: total }, (_, index) =>
      fact({ attemptId: `a${index}`, questionId: `q${index}`, credit: index % 3 === 0 ? 0 : 1 }),
    );
    const mastery = computeMasteryV4(facts, { priorStrength: 4, priorMastery: 0.5 });
    const result = computeReadinessV4(
      mastery,
      profile({ "frac_decimal::foundation": 1 }),
      DEFAULT_MATH_READINESS_POLICY_V1,
    );
    assert.ok(result.readiness >= 0 && result.readiness <= 100);
    assert.ok(result.readiness <= result.schoolMastery * 100 + 1e-6);
  }
});

test("a ready score with a failed evidence gate is evidence_limited", () => {
  const facts = Array.from({ length: 25 }, (_, index) =>
    fact({ attemptId: `a${index}`, questionId: `q${index}`, credit: 1 }),
  );
  const mastery = computeMasteryV4(facts, { priorStrength: 4, priorMastery: 0.5 });
  const policy = {
    ...DEFAULT_MATH_READINESS_POLICY_V1,
    evidenceTarget: 40,
    evidenceExponent: 0.1,
  };
  const result = computeReadinessV4(mastery, profile({ "frac_decimal::foundation": 1 }), policy);
  assert.ok(result.readiness >= 75);
  assert.ok(result.schoolEvidence < policy.overallEvidenceGate);
  assert.equal(result.status, "evidence_limited");
});

test("policy thresholds must be strictly increasing", () => {
  assert.throws(() =>
    validateReadinessPolicy({
      ...DEFAULT_MATH_READINESS_POLICY_V1,
      nearReadyThreshold: 0.8,
      readyThreshold: 0.75,
    }),
  );
});

test("status boundaries are stable at 50, 65, 75, and 85 percent", () => {
  const policy = {
    ...DEFAULT_MATH_READINESS_POLICY_V1,
    evidenceTarget: 1,
    overallEvidenceGate: 0,
    criticalMasteryGate: 0,
    criticalEvidenceGate: 0,
  };
  const expected = [
    [0.499, "not_ready"],
    [0.5, "preparing"],
    [0.65, "near_ready"],
    [0.75, "ready"],
    [0.85, "strong_ready"],
  ] as const;
  for (const [masteryValue, status] of expected) {
    const mastery = computeMasteryV4([], { priorStrength: 4, priorMastery: masteryValue });
    mastery.cells["frac_decimal::foundation"] = {
      topic: "frac_decimal",
      band: "foundation",
      correct: 1,
      total: 1,
      mastery: masteryValue,
      status: "estimated",
    };
    const result = computeReadinessV4(mastery, profile({ "frac_decimal::foundation": 1 }), policy);
    assert.equal(result.status, status, `${masteryValue} should be ${status}`);
  }
});

test("advanced evidence denominator only includes advanced blueprint weight", () => {
  const mastery = computeMasteryV4([], { priorStrength: 4, priorMastery: 0.5 });
  mastery.cells["frac_decimal::foundation"] = {
    topic: "frac_decimal", band: "foundation", correct: 40, total: 40, mastery: 1, status: "estimated",
  };
  mastery.cells["plane_geometry::advanced"] = {
    topic: "plane_geometry", band: "advanced", correct: 4, total: 4, mastery: 1, status: "estimated",
  };
  const result = computeReadinessV4(
    mastery,
    profile({ "frac_decimal::foundation": 0.8, "plane_geometry::advanced": 0.2 }),
    DEFAULT_MATH_READINESS_POLICY_V1,
  );
  assert.equal(result.cells["plane_geometry::advanced"].evidence, 0.5);
  assert.equal(result.advancedEvidence, 0.5);
  assert.equal(result.advancedShare, 0.2);
  assert.ok(result.reasonCodes.includes("ADVANCED_EVIDENCE_BELOW_GATE"));
});

test("critical topic threshold includes a topic exactly at the boundary", () => {
  const mastery = computeMasteryV4([], { priorStrength: 4, priorMastery: 0.5 });
  mastery.cells["critical::foundation"] = {
    topic: "critical", band: "foundation", correct: 0, total: 2, mastery: 0.3, status: "estimated",
  };
  mastery.cells["other::foundation"] = {
    topic: "other", band: "foundation", correct: 38, total: 38, mastery: 0.9, status: "estimated",
  };
  const result = computeReadinessV4(
    mastery,
    profile({ "critical::foundation": 0.05, "other::foundation": 0.95 }),
    DEFAULT_MATH_READINESS_POLICY_V1,
  );
  assert.ok(result.criticalTopics.some((topic) => topic.topic === "critical"));
  assert.ok(result.reasonCodes.includes("CRITICAL_TOPIC_MASTERY_BELOW_GATE"));
});

test("invalid blueprint total is rejected instead of silently normalized", () => {
  const mastery = computeMasteryV4([fact()], { priorStrength: 4, priorMastery: 0.5 });
  assert.throws(
    () => computeReadinessV4(
      mastery,
      profile({ "frac_decimal::foundation": 0.6, "plane_geometry::advanced": 0.3 }),
      DEFAULT_MATH_READINESS_POLICY_V1,
    ),
    /sum to 1/,
  );
});
