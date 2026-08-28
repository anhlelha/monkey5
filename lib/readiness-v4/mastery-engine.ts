import {
  cellKey,
  difficultyBandOf,
  type AssessedAttemptFact,
  type CognitiveSummaryItem,
  type MasteryCell,
  type MasteryV4Result,
} from "./types";

export interface MasteryConfig {
  priorStrength: number;
  priorMastery: number;
  knownCells?: Array<{ topic: string; band: "foundation" | "application" | "advanced" }>;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export function smoothMastery(
  correct: number,
  total: number,
  priorStrength: number,
  priorMastery: number,
): number {
  if (priorStrength <= 0) throw new Error("priorStrength must be positive");
  if (priorMastery < 0 || priorMastery > 1) throw new Error("priorMastery must be within 0..1");
  return (correct + priorStrength * priorMastery) / (total + priorStrength);
}

export function computeMasteryV4(
  facts: AssessedAttemptFact[],
  config: MasteryConfig,
): MasteryV4Result {
  const accum = new Map<string, { topic: string; band: MasteryCell["band"]; correct: number; total: number }>();
  const cognition = new Map<string, { correct: number; total: number }>();

  for (const known of config.knownCells ?? []) {
    accum.set(cellKey(known.topic, known.band), { ...known, correct: 0, total: 0 });
  }

  for (const fact of facts) {
    const band = difficultyBandOf(fact.difficulty);
    const key = cellKey(fact.topic, band);
    const row = accum.get(key) ?? { topic: fact.topic, band, correct: 0, total: 0 };
    row.correct += clamp01(fact.credit);
    row.total += 1;
    accum.set(key, row);

    const cognitive = cognition.get(fact.cognitiveLevel) ?? { correct: 0, total: 0 };
    cognitive.correct += clamp01(fact.credit);
    cognitive.total += 1;
    cognition.set(fact.cognitiveLevel, cognitive);
  }

  const cells: Record<string, MasteryCell> = {};
  for (const [key, row] of [...accum.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    cells[key] = {
      ...row,
      mastery: smoothMastery(row.correct, row.total, config.priorStrength, config.priorMastery),
      status: row.total === 0 ? "unverified" : "estimated",
    };
  }

  const cognitiveSummary: Record<string, CognitiveSummaryItem> = {};
  for (const [key, row] of [...cognition.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    cognitiveSummary[key] = {
      ...row,
      accuracy: row.total > 0 ? row.correct / row.total : null,
    };
  }

  return {
    cells,
    cognitiveSummary,
    coverageSummary: {
      answeredFacts: facts.length,
      assessedFacts: facts.length,
      unverifiedCellCount: Object.values(cells).filter((cell) => cell.total === 0).length,
    },
  };
}
