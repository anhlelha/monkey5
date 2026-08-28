import assert from "node:assert/strict";
import test from "node:test";

import {
  assertExportedContentUnchanged,
  sameImmutableAssessment,
  validateAssessmentArtifactCoverage,
  validateDifficultyAssessment,
  validateTopicAssessment,
} from "../../lib/readiness-v4/assessment-artifact-contract";

const base = {
  topicPrimary: "num_div",
  topicSecondaryJson: "[]",
  difficultyBand: 2,
  cognitiveLevel: "co_ban",
  reasoningType: "direct",
  confidence: 91,
  model: "test-model",
  questionContentHash: "hash-a",
};

test("assessment import reconciliation is idempotent and immutable", () => {
  assert.equal(sameImmutableAssessment(base, { ...base }), true);
  assert.equal(sameImmutableAssessment(base, { ...base, difficultyBand: 3 }), false);
  assert.doesNotThrow(() => assertExportedContentUnchanged("hash-a", "hash-a"));
  assert.throws(() => assertExportedContentUnchanged("hash-a", "hash-b"), /CONTENT_HASH_CHANGED/);
});

test("artifact manifest rejects missing and duplicate results", () => {
  assert.doesNotThrow(() => validateAssessmentArtifactCoverage(
    ["q1", "q2"],
    [{ questionId: "q2" }, { questionId: "q1" }],
    [{ questionId: "q1" }, { questionId: "q2" }],
  ));
  assert.throws(() => validateAssessmentArtifactCoverage(
    ["q1", "q2"],
    [{ questionId: "q1" }],
    [{ questionId: "q1" }, { questionId: "q2" }],
  ), /TOPIC_MANIFEST_MISMATCH/);
  assert.throws(() => validateAssessmentArtifactCoverage(
    ["q1"],
    [{ questionId: "q1" }, { questionId: "q1" }],
    [{ questionId: "q1" }],
  ), /TOPIC_DUPLICATE_ID/);
});

test("assessment rows enforce taxonomy, enum and text-only figure contract", () => {
  assert.doesNotThrow(() => validateDifficultyAssessment({
    questionId: "q1",
    cognitiveLevel: "van_dung",
    difficulty: 3,
    reasoningType: "multi_step",
    assessmentConfidence: 90,
    figureRead: "Không có hình minh họa",
    assessmentNote: "Hai bước tính.",
  }, "q1"));
  assert.doesNotThrow(() => validateTopicAssessment({
    questionId: "q1",
    topicPrimary: "ratio_percent",
    topicSecondary: ["frac_decimal"],
    contextTags: [],
    topicConfidence: 92,
    topicRationale: "Tỉ lệ mở khóa lời giải.",
    figureRead: "Không có hình minh họa",
  }, "q1", false));
  assert.throws(() => validateTopicAssessment({
    questionId: "q1",
    topicPrimary: "legacy-topic",
    topicSecondary: [],
    contextTags: [],
    topicConfidence: 92,
    topicRationale: "invalid",
    figureRead: "Không có hình minh họa",
  }, "q1", false), /INVALID_TOPIC/);
});
