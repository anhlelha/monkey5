import { cellKey, type GateResult, type MasteryCell, type MasteryV4Result, type ReadinessPolicy, type ReadinessReasonCode, type ReadinessStatus, type ReadinessV4Result, type SchoolProfileV2 } from "./types";

const EPSILON = 1e-9;
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const round = (value: number, places = 8): number => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

function selectBlueprint(profile: SchoolProfileV2, policy: ReadinessPolicy): Record<string, number> {
  if (policy.blueprintWeightMode === "count") return profile.blueprintCount;
  if (policy.blueprintWeightMode === "point") return profile.blueprintPoint;
  const pointTotal = Object.values(profile.blueprintPoint).reduce((sum, value) => sum + value, 0);
  return Math.abs(pointTotal - 1) <= EPSILON ? profile.blueprintPoint : profile.blueprintCount;
}

function classifyStatus(readinessRatio: number, hasEvidence: boolean, passedAllGates: boolean, policy: ReadinessPolicy): ReadinessStatus {
  if (!hasEvidence) return "unverified";
  if (readinessRatio >= policy.readyThreshold && !passedAllGates) return "evidence_limited";
  if (readinessRatio >= policy.strongReadyThreshold) return "strong_ready";
  if (readinessRatio >= policy.readyThreshold) return "ready";
  if (readinessRatio >= policy.nearReadyThreshold) return "near_ready";
  if (readinessRatio >= policy.preparingThreshold) return "preparing";
  return "not_ready";
}

export function computeReadinessV4(
  mastery: MasteryV4Result,
  profile: SchoolProfileV2,
  policy: ReadinessPolicy,
): ReadinessV4Result {
  const blueprint = selectBlueprint(profile, policy);
  const entries = Object.entries(blueprint).filter(([, weight]) => weight > 0);
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (Math.abs(totalWeight - 1) > 1e-6) throw new Error(`Blueprint weights must sum to 1; got ${totalWeight}`);

  const cells: ReadinessV4Result["cells"] = {};
  let schoolMastery = 0;
  let schoolEvidence = 0;
  let advancedEvidenceNumerator = 0;
  let advancedShare = 0;
  const topicBuckets = new Map<string, { weight: number; mastery: number; evidence: number }>();

  for (const [key, weight] of entries) {
    const [topic, rawBand] = key.split("::");
    const band = rawBand as MasteryCell["band"];
    if (!topic || !band) throw new Error(`Invalid blueprint cell key: ${key}`);
    const source = mastery.cells[cellKey(topic, band)] ?? {
      topic,
      band,
      correct: 0,
      total: 0,
      mastery: policy.priorMastery,
      status: "unverified" as const,
    };
    const required = Math.max(1, policy.evidenceTarget * weight);
    const evidence = clamp01(source.total / required);
    cells[key] = { ...source, weight, required, evidence };
    schoolMastery += weight * source.mastery;
    schoolEvidence += weight * evidence;
    if (band === "advanced") {
      advancedShare += weight;
      advancedEvidenceNumerator += weight * evidence;
    }
    const topicBucket = topicBuckets.get(topic) ?? { weight: 0, mastery: 0, evidence: 0 };
    topicBucket.weight += weight;
    topicBucket.mastery += weight * source.mastery;
    topicBucket.evidence += weight * evidence;
    topicBuckets.set(topic, topicBucket);
  }

  schoolMastery = clamp01(schoolMastery);
  schoolEvidence = clamp01(schoolEvidence);
  const advancedEvidence = advancedShare > EPSILON ? clamp01(advancedEvidenceNumerator / advancedShare) : null;
  const readinessRatio = clamp01(schoolMastery * schoolEvidence ** policy.evidenceExponent);

  const gates: GateResult[] = [];
  gates.push({
    key: "overall-evidence",
    passed: schoolEvidence + EPSILON >= policy.overallEvidenceGate,
    actual: schoolEvidence,
    threshold: policy.overallEvidenceGate,
    reasonCode: "OVERALL_EVIDENCE_BELOW_GATE",
  });
  if (advancedShare + EPSILON >= policy.advancedShareGate) {
    gates.push({
      key: "advanced-evidence",
      passed: (advancedEvidence ?? 0) + EPSILON >= policy.advancedEvidenceGate,
      actual: advancedEvidence ?? 0,
      threshold: policy.advancedEvidenceGate,
      reasonCode: "ADVANCED_EVIDENCE_BELOW_GATE",
    });
  }

  const criticalTopics = [...topicBuckets.entries()]
    .filter(([, value]) => value.weight + EPSILON >= policy.criticalTopicThreshold)
    .map(([topic, value]) => {
      const topicMastery = value.mastery / value.weight;
      const topicEvidence = value.evidence / value.weight;
      const passedMastery = topicMastery + EPSILON >= policy.criticalMasteryGate;
      const passedEvidence = topicEvidence + EPSILON >= policy.criticalEvidenceGate;
      gates.push({
        key: `critical-mastery:${topic}`,
        topic,
        passed: passedMastery,
        actual: topicMastery,
        threshold: policy.criticalMasteryGate,
        reasonCode: "CRITICAL_TOPIC_MASTERY_BELOW_GATE",
      });
      gates.push({
        key: `critical-evidence:${topic}`,
        topic,
        passed: passedEvidence,
        actual: topicEvidence,
        threshold: policy.criticalEvidenceGate,
        reasonCode: "CRITICAL_TOPIC_EVIDENCE_BELOW_GATE",
      });
      return {
        topic,
        weight: value.weight,
        mastery: topicMastery,
        evidence: topicEvidence,
        passedMastery,
        passedEvidence,
      };
    });

  const passedGates = gates.filter((gate) => gate.passed);
  const failedGates = gates.filter((gate) => !gate.passed);
  const hasEvidence = schoolEvidence > EPSILON;
  const status = classifyStatus(readinessRatio, hasEvidence, failedGates.length === 0, policy);
  const reasonCodes = new Set<ReadinessReasonCode>();
  if (!hasEvidence) reasonCodes.add("NO_VERIFIED_EVIDENCE");
  for (const gate of failedGates) if (gate.reasonCode) reasonCodes.add(gate.reasonCode);
  if (readinessRatio + EPSILON < policy.readyThreshold) reasonCodes.add("SCORE_BELOW_READY_THRESHOLD");

  return {
    schoolMastery: round(schoolMastery),
    schoolEvidence: round(schoolEvidence),
    advancedEvidence: advancedEvidence === null ? null : round(advancedEvidence),
    advancedShare: round(advancedShare),
    readiness: round(readinessRatio * 100),
    status,
    cells,
    criticalTopics,
    passedGates,
    failedGates,
    reasonCodes: [...reasonCodes],
  };
}
