import assert from "node:assert/strict";
import test from "node:test";
import { rankReadinessRecommendations, type ReadinessV4Result } from "../../lib/readiness-v4";

test("recommendations prioritize blueprint impact and distinguish unverified cells", () => {
  const result: ReadinessV4Result = {
    schoolMastery: 0.6,
    schoolEvidence: 0.4,
    advancedEvidence: 0,
    advancedShare: 0.2,
    readiness: 38,
    status: "not_ready",
    passedGates: [],
    failedGates: [],
    reasonCodes: [],
    criticalTopics: [],
    cells: {
      "large::foundation": { topic: "large", band: "foundation", correct: 0, total: 0, mastery: 0.5, status: "unverified", weight: 0.5, required: 20, evidence: 0 },
      "small::advanced": { topic: "small", band: "advanced", correct: 1, total: 2, mastery: 0.5, status: "estimated", weight: 0.1, required: 4, evidence: 0.5 },
    },
  };
  const ranked = rankReadinessRecommendations(result);
  assert.equal(ranked[0].topic, "large");
  assert.equal(ranked[0].reasonCode, "UNVERIFIED_CELL");
  assert.equal(ranked[1].reasonCode, "ADVANCED_EVIDENCE_GAP");
});
