import type { ReadinessV4Result } from "./types";

export const GAP_ADVICE_VERSION = "gap-advice-v1" as const;

export type RecommendationReasonCode =
  | "UNVERIFIED_CELL"
  | "LOW_CELL_EVIDENCE"
  | "CONFIRMED_CELL_WEAKNESS"
  | "ADVANCED_EVIDENCE_GAP";

export interface ReadinessRecommendation {
  topic: string;
  band: string;
  reasonCode: RecommendationReasonCode;
  priority: number;
  impact: number;
}

export function rankReadinessRecommendations(
  result: ReadinessV4Result,
  options: { targetMastery?: number; targetEvidence?: number; limit?: number } = {},
): ReadinessRecommendation[] {
  const targetMastery = options.targetMastery ?? 0.7;
  const targetEvidence = options.targetEvidence ?? 0.85;
  const limit = options.limit ?? 3;
  const criticalByTopic = new Map(result.criticalTopics.map((topic) => [topic.topic, topic]));
  const rows: ReadinessRecommendation[] = [];

  for (const cell of Object.values(result.cells)) {
    const masteryGap = Math.max(0, targetMastery - cell.mastery);
    const evidenceGap = Math.max(0, targetEvidence - cell.evidence);
    if (masteryGap === 0 && evidenceGap === 0) continue;
    const critical = criticalByTopic.get(cell.topic);
    const gateBoost = critical && (!critical.passedEvidence || !critical.passedMastery) ? 1.5 : 1;
    const advancedBoost = cell.band === "advanced" && result.advancedShare > 0 ? 1.15 : 1;
    const impact = cell.weight * (masteryGap + evidenceGap * 0.5);
    let reasonCode: RecommendationReasonCode;
    if (cell.total === 0) reasonCode = "UNVERIFIED_CELL";
    else if (cell.evidence < targetEvidence) reasonCode = cell.band === "advanced" ? "ADVANCED_EVIDENCE_GAP" : "LOW_CELL_EVIDENCE";
    else reasonCode = "CONFIRMED_CELL_WEAKNESS";
    rows.push({
      topic: cell.topic,
      band: cell.band,
      reasonCode,
      impact,
      priority: impact * gateBoost * advancedBoost,
    });
  }
  return rows.sort((left, right) => right.priority - left.priority || left.topic.localeCompare(right.topic)).slice(0, limit);
}
