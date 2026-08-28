import assert from "node:assert/strict";
import test from "node:test";

import { presentReadiness } from "../../lib/readiness-v4/presentation";
import type { EffectiveReadinessView } from "../../lib/readiness-v4/read-service";

function view(overrides: Partial<EffectiveReadinessView>): EffectiveReadinessView {
  return {
    school: "cg",
    score: 80,
    scoreScale: 100,
    schoolMastery: 0.82,
    evidence: 0.4,
    advancedEvidence: 0.2,
    status: "evidence_limited",
    reasonCodes: ["OVERALL_EVIDENCE_BELOW_GATE"],
    profileVersion: "profile-1",
    policyVersion: "policy-1",
    computedAt: new Date(0).toISOString(),
    freshnessState: "current",
    source: "v4",
    snapshotId: "snapshot-1",
    ...overrides,
  };
}

test("high score that fails a V4 gate never presents as Ready", () => {
  const presentation = presentReadiness(view({ score: 86, status: "evidence_limited" }));
  assert.equal(presentation.statusLabel, "Điểm tổng đã đạt nhưng chưa đủ bằng chứng");
  assert.notEqual(presentation.statusLabel, "Sẵn sàng");
  assert.equal(presentation.tone, "amber");
});

test("unverified and freshness states use shared copy", () => {
  const presentation = presentReadiness(view({
    score: null,
    status: "unverified",
    reasonCodes: ["NO_VERIFIED_EVIDENCE"],
    freshnessState: "computing",
  }));
  assert.equal(presentation.scoreLabel, "Chưa đủ dữ liệu");
  assert.match(presentation.freshnessLabel, /Đang cập nhật/);
  assert.match(presentation.reason ?? "", /Chưa có đủ bài làm/);
});

test("legacy fallback is explicitly labelled and not reclassified by score", () => {
  const presentation = presentReadiness(view({
    score: 90,
    status: "legacy",
    reasonCodes: [],
    source: "legacy-fallback",
  }));
  assert.equal(presentation.statusLabel, "Chỉ số theo hệ cũ");
  assert.equal(presentation.sourceLabel, "Hệ cũ (fallback)");
});
