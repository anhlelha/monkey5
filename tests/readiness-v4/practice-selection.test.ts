import assert from "node:assert/strict";
import test from "node:test";
import {
  candidateMatchesTarget,
  selectPracticeCandidates,
  type PracticeCandidate,
} from "../../lib/readiness-v4/practice-service";

function candidate(input: {
  id: string;
  canonical?: string;
  topic?: string;
  difficulty?: number;
  sourceKind?: "official" | "supplement";
}): PracticeCandidate {
  return {
    sourceQuestion: { id: input.id } as PracticeCandidate["sourceQuestion"],
    canonicalQuestionId: input.canonical ?? input.id,
    sourceKind: input.sourceKind ?? "official",
    assessment: {
      id: `assessment-${input.id}`,
      questionId: input.id,
      topicPrimary: input.topic ?? "num_div",
      difficultyBand: input.difficulty ?? 3,
      sourceRunId: "run-1",
    } as PracticeCandidate["assessment"],
  };
}

test("practice target requires exact analytical topic, V4 band and source", () => {
  const row = candidate({ id: "q1", topic: "sequence_pattern", difficulty: 3, sourceKind: "official" });
  assert.equal(candidateMatchesTarget(row, "sequence_pattern", "application", "all"), true);
  assert.equal(candidateMatchesTarget(row, "num_div", "application", "all"), false);
  assert.equal(candidateMatchesTarget(row, "sequence_pattern", "foundation", "all"), false);
  assert.equal(candidateMatchesTarget(row, "sequence_pattern", "application", "supplement"), false);
});

test("selector is deterministic and always places unseen questions before repeats", () => {
  const rows = [
    candidate({ id: "q1" }),
    candidate({ id: "q2" }),
    candidate({ id: "q3" }),
    candidate({ id: "q4" }),
  ];
  const seen = new Set(["q1", "q2"]);
  const first = selectPracticeCandidates(rows, seen, 3, "stable-seed");
  const second = selectPracticeCandidates([...rows].reverse(), seen, 3, "stable-seed");
  assert.deepEqual(first.map((row) => row.canonicalQuestionId), second.map((row) => row.canonicalQuestionId));
  assert.deepEqual(first.map((row) => row.isRepeat), [false, false, true]);
});

test("selector deduplicates canonical questions and prefers the official source", () => {
  const rows = [
    candidate({ id: "supplement-clone", canonical: "canonical-1", sourceKind: "supplement" }),
    candidate({ id: "official-source", canonical: "canonical-1", sourceKind: "official" }),
    candidate({ id: "q2", sourceKind: "supplement" }),
  ];
  const selected = selectPracticeCandidates(rows, new Set(), 5, "seed");
  assert.equal(selected.length, 2);
  assert.equal(selected.find((row) => row.canonicalQuestionId === "canonical-1")?.sourceKind, "official");
});
