import type { SchoolProfileData } from "./school-profiles";

const LEVELS = ["L4", "L5", "L4+5", "NC"] as const;
type Level = (typeof LEVELS)[number];

export const READINESS_BASELINE = 50;
export const READINESS_MIN = 0;
export const READINESS_MAX = 100;
export const ALPHA = 80;
export const BETA = 60;
export const DIFF_K = 0.3;
export const TARGET_MASTERY = 0.7;

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

export interface GapItem {
  topicId: string;
  currentMastery: number;
  targetMastery: number;
  potentialReadinessGain: number;
  topicWeight: number;
}

export function computeReadiness(
  topicMastery: Record<string, number>,
  levelMastery: Record<Level, number>,
  profile: SchoolProfileData,
): number {
  let topicTerm = 0;
  for (const t of Object.keys(profile.topicWeights)) {
    const m = topicMastery[t] ?? 0.5;
    topicTerm += profile.topicWeights[t] * (m - 0.5);
  }

  let levelTerm = 0;
  for (const l of LEVELS) {
    const m = levelMastery[l] ?? 0.5;
    levelTerm += profile.levelWeights[l] * (m - 0.5);
  }

  const diffPenalty = (profile.difficulty - 50) * DIFF_K;
  const raw = READINESS_BASELINE + topicTerm * ALPHA + levelTerm * BETA - diffPenalty;
  return clamp(Math.round(raw), READINESS_MIN, READINESS_MAX);
}

export function computeAllReadiness(
  topicMastery: Record<string, number>,
  levelMastery: Record<Level, number>,
  profiles: Record<string, SchoolProfileData>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const school of Object.keys(profiles)) {
    out[school] = computeReadiness(topicMastery, levelMastery, profiles[school]);
  }
  return out;
}

export function computeGapTop3(
  topicMastery: Record<string, number>,
  profile: SchoolProfileData,
  targetMastery = TARGET_MASTERY,
  limit = 3,
): GapItem[] {
  const gains: GapItem[] = [];
  for (const t of Object.keys(profile.topicWeights)) {
    const cur = topicMastery[t] ?? 0.5;
    if (cur >= targetMastery) continue;
    const w = profile.topicWeights[t];
    if (w <= 0) continue;
    const gap = targetMastery - cur;
    const gain = Math.round(w * gap * ALPHA);
    if (gain <= 0) continue;
    gains.push({
      topicId: t,
      currentMastery: cur,
      targetMastery,
      potentialReadinessGain: gain,
      topicWeight: w,
    });
  }
  return gains.sort((a, b) => b.potentialReadinessGain - a.potentialReadinessGain).slice(0, limit);
}
