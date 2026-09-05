import assert from "node:assert/strict";
import test from "node:test";
import {
  isPrivateMathPracticeExam,
  resolvePrivatePracticeTopicContext,
} from "../../lib/admin-activity-classification";

test("classifies only owned math exams as private topic practice", () => {
  assert.equal(isPrivateMathPracticeExam({ subject: "math", ownerUserId: "mika" }), true);
  assert.equal(isPrivateMathPracticeExam({ subject: "math", ownerUserId: null }), false);
  assert.equal(isPrivateMathPracticeExam({ subject: "english", ownerUserId: "mika" }), false);
});

test("uses distinct effective V4 topics for a private practice set", () => {
  const context = resolvePrivatePracticeTopicContext(
    [
      { id: "q1", topic: "xs" },
      { id: "q2", topic: "xs" },
      { id: "q3", topic: "log" },
    ],
    {
      q1: { topicPrimary: "counting_combinatorics" },
      q2: { topicPrimary: "counting_combinatorics" },
      q3: { topicPrimary: "logic_strategy" },
    },
  );

  assert.deepEqual(context, {
    topicIds: ["counting_combinatorics", "logic_strategy"],
    taxonomy: "analytical-v4",
  });
});

test("falls back to distinct legacy topics when V4 is unavailable", () => {
  const context = resolvePrivatePracticeTopicContext(
    [
      { id: "q1", topic: "phan" },
      { id: "q2", topic: "phan" },
    ],
    {},
  );

  assert.deepEqual(context, { topicIds: ["phan"], taxonomy: "legacy" });
});

test("falls back to legacy topics when V4 coverage is only partial", () => {
  const context = resolvePrivatePracticeTopicContext(
    [
      { id: "q1", topic: "phan" },
      { id: "q2", topic: "phan" },
    ],
    { q1: { topicPrimary: "frac_decimal" } },
  );

  assert.deepEqual(context, { topicIds: ["phan"], taxonomy: "legacy" });
});
