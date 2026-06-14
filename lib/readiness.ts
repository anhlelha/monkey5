import type { SchoolProfileData } from "./school-profiles";

const LEVELS = ["L4", "L5", "L4+5", "NC"] as const;
type Level = (typeof LEVELS)[number];

export const READINESS_BASELINE = 50;
export const READINESS_MIN = 0;
export const READINESS_MAX = 100;
export const ALPHA = 80;
export const BETA = 60;
// DIFF_K is the per-point penalty applied for difficulty above the mean
// across all known schools. With school difficulties spanning ~10 units in
// the current dataset, DIFF_K = 1.0 widens the new-user readiness spread to
// roughly 10 percentage points (hardest vs. easiest).
export const DIFF_K = 1.0;
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
  referenceDifficulty: number = 50,
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

  const diffPenalty = (profile.difficulty - referenceDifficulty) * DIFF_K;
  const raw = READINESS_BASELINE + topicTerm * ALPHA + levelTerm * BETA - diffPenalty;
  return clamp(Math.round(raw), READINESS_MIN, READINESS_MAX);
}

export function computeAllReadiness(
  topicMastery: Record<string, number>,
  levelMastery: Record<Level, number>,
  profiles: Record<string, SchoolProfileData>,
): Record<string, number> {
  const profileList = Object.values(profiles);
  // Re-center difficulty around the mean so new users (mastery = 0.5)
  // sit around the baseline (50%) rather than being pushed up by the
  // hard-coded "50" reference. Combined with DIFF_K = 1.0 this gives a
  // ~10-point spread between hardest and easiest school.
  const referenceDifficulty =
    profileList.length > 0
      ? profileList.reduce((s, p) => s + p.difficulty, 0) / profileList.length
      : 50;

  const out: Record<string, number> = {};
  for (const school of Object.keys(profiles)) {
    out[school] = computeReadiness(topicMastery, levelMastery, profiles[school], referenceDifficulty);
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
