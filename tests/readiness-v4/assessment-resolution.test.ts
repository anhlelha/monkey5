import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAssessmentIndex,
  resolveQuestionAssessment,
  type ResolvableAssessment,
  type ResolvableQuestion,
} from "../../lib/readiness-v4/assessment-resolution";
import { questionContentHash } from "../../lib/readiness-v4/hashing";

function question(overrides: Partial<ResolvableQuestion> = {}): ResolvableQuestion {
  return {
    id: "q1",
    sourceQuestionId: null,
    subject: "math",
    type: "fill",
    stem: "1 + 1 = ?",
    options: "[]",
    correct: "2",
    answerSchema: null,
    points: 1,
    figure: null,
    ...overrides,
  };
}

function assessment(q: ResolvableQuestion, overrides: Partial<ResolvableAssessment> = {}): ResolvableAssessment {
  return {
    id: "a1",
    questionId: q.id,
    topicPrimary: "num_div",
    topicSecondaryJson: "[]",
    difficultyBand: 1,
    cognitiveLevel: "co_ban",
    reasoningType: "direct",
    confidence: 99,
    model: "test",
    sourceRunId: "run-new",
    taxonomyVersion: "math-topic-taxonomy-v1",
    questionContentHash: questionContentHash(q),
    ...overrides,
  };
}

test("assessment resolver returns the newest current direct assessment", () => {
  const q = question();
  const old = assessment(q, { id: "old", sourceRunId: "run-old" });
  const latest = assessment(q, { id: "latest", sourceRunId: "run-new" });
  const result = resolveQuestionAssessment(q, buildAssessmentIndex([old, latest], ["run-new", "run-old"]));
  assert.equal(result.state, "current");
  assert.equal(result.assessment?.id, "latest");
});

test("assessment resolver inherits only when clone content hash matches canonical", () => {
  const source = question({ id: "source" });
  const clone = question({ id: "clone", sourceQuestionId: source.id });
  const sourceAssessment = assessment(source, { questionId: source.id });
  const index = buildAssessmentIndex([sourceAssessment], ["run-new"]);
  assert.equal(resolveQuestionAssessment(clone, index).state, "inherited");
  assert.equal(resolveQuestionAssessment({ ...clone, stem: "Changed" }, index).state, "stale");
});

test("assessment resolver rejects conflicting approved semantics for the same hash", () => {
  const q = question();
  const first = assessment(q, { id: "first", sourceRunId: "run-new", difficultyBand: 1 });
  const second = assessment(q, { id: "second", sourceRunId: "run-old", difficultyBand: 4 });
  const result = resolveQuestionAssessment(q, buildAssessmentIndex([first, second], ["run-new", "run-old"]));
  assert.equal(result.state, "conflict");
  assert.deepEqual(result.conflictingRunIds, ["run-new", "run-old"]);
});

test("assessment resolver distinguishes missing from stale", () => {
  const q = question();
  assert.equal(resolveQuestionAssessment(q, buildAssessmentIndex([], [])).state, "missing");
  const stale = assessment(q, { questionContentHash: "old-hash" });
  assert.equal(resolveQuestionAssessment(q, buildAssessmentIndex([stale], ["run-new"])).state, "stale");
});
