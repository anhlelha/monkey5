import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyQuestionBankSource,
  summarizeMathTaxonomyTopicCoverage,
  summarizeQuestionBankAssessmentViews,
  type QuestionBankAssessmentView,
} from "../../lib/readiness-v4/assessment-coverage-service";

function view(questionId: string, source: QuestionBankAssessmentView["source"], state: QuestionBankAssessmentView["state"]): QuestionBankAssessmentView {
  return {
    questionId,
    source,
    state,
    topicPrimary: null,
    difficultyBand: null,
    cognitiveLevel: null,
    reasoningType: null,
    confidence: null,
    model: null,
    sourceRunId: null,
    canonicalQuestionId: null,
    conflictingRunIds: [],
  };
}

test("question bank source classification keeps private separate from mock", () => {
  assert.equal(classifyQuestionBankSource({ examId: null, exam: null }), "supplement");
  assert.equal(classifyQuestionBankSource({ examId: "e1", exam: { kind: "official", ownerUserId: null } }), "official");
  assert.equal(classifyQuestionBankSource({ examId: "e2", exam: { kind: "reference", ownerUserId: null } }), "mock");
  assert.equal(classifyQuestionBankSource({ examId: "e3", exam: { kind: "reference", ownerUserId: "internal-user" } }), "private");
});

test("coverage summary preserves every resolution state by source", () => {
  const summary = summarizeQuestionBankAssessmentViews([
    view("q1", "official", "current"),
    view("q2", "supplement", "missing"),
    view("q3", "private", "stale"),
    view("q4", "mock", "conflict"),
    view("q5", "private", "inherited"),
  ]);
  assert.deepEqual(summary.total, { total: 5, current: 1, inherited: 1, stale: 1, missing: 1, conflict: 1 });
  assert.equal(summary.bySource.private.total, 2);
  assert.equal(summary.bySource.private.inherited, 1);
  assert.equal(summary.bySource.supplement.missing, 1);
});

test("taxonomy topic coverage counts only usable current and inherited assessments by D1-D5", () => {
  const current = { ...view("q1", "official", "current"), topicPrimary: "num_div", difficultyBand: 2 };
  const inherited = { ...view("q2", "supplement", "inherited"), topicPrimary: "num_div", difficultyBand: 4 };
  const stale = { ...view("q3", "official", "stale"), topicPrimary: null, difficultyBand: null };
  const rows = summarizeMathTaxonomyTopicCoverage(
    [current, inherited, stale],
    ["num_div", "logic_strategy"],
  );

  assert.deepEqual(rows[0], {
    topic: "num_div",
    usable: 2,
    current: 1,
    inherited: 1,
    byDifficulty: { 1: 0, 2: 1, 3: 0, 4: 1, 5: 0 },
  });
  assert.equal(rows[1].usable, 0);
});
