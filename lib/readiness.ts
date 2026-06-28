import type { SchoolProfileData } from "./school-profiles";
import { prisma } from "./prisma";
import { computeMastery } from "./mastery";
import { getAllSchoolProfiles } from "./school-profiles";
import { SUBJECT_LEVELS, type Subject } from "./subjects";

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
  levelMastery: Record<string, number>,
  profile: SchoolProfileData,
  referenceDifficulty: number = 50,
): number {
  let topicTerm = 0;
  for (const t of Object.keys(profile.topicWeights)) {
    const m = topicMastery[t] ?? 0.5;
    topicTerm += profile.topicWeights[t] * (m - 0.5);
  }

  let levelTerm = 0;
  for (const l of SUBJECT_LEVELS[profile.subject].levels) {
    const m = levelMastery[l] ?? 0.5;
    levelTerm += (profile.levelWeights[l] ?? 0) * (m - 0.5);
  }

  const diffPenalty = (profile.difficulty - referenceDifficulty) * DIFF_K;
  const raw = READINESS_BASELINE + topicTerm * ALPHA + levelTerm * BETA - diffPenalty;
  return clamp(Math.round(raw), READINESS_MIN, READINESS_MAX);
}

export function computeAllReadiness(
  topicMastery: Record<string, number>,
  levelMastery: Record<string, number>,
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

/**
 * Returns the readiness map a page should display for `userId`. If the
 * persisted map already covers every school in `requiredSchools`, it is
 * returned as-is (no DB write). Otherwise we recompute from mastery + school
 * profiles, write the result back to User.readiness (so subsequent loads are
 * fast and consistent across pages), and return the new map.
 *
 * This is what gives a brand-new user a meaningful "mức độ phù hợp" the
 * very first time they reach /home or /library — before this, the persisted
 * map was "{}" so every school fell back to a hard-coded 50.
 */
export async function getEffectiveReadiness(
  userId: string,
  persistedReadiness: Record<string, number>,
  requiredSchools: string[],
  subject: Subject = "math",
): Promise<Record<string, number>> {
  const hasAll =
    requiredSchools.length > 0 &&
    requiredSchools.every((s) => typeof persistedReadiness[s] === "number");
  if (hasAll) return persistedReadiness;

  const [mastery, profiles] = await Promise.all([
    computeMastery(userId, subject),
    getAllSchoolProfiles(subject),
  ]);
  // If profiles are not yet built (fresh DB), keep whatever we had.
  if (Object.keys(profiles).length === 0) return persistedReadiness;

  const fresh = computeAllReadiness(mastery.topicMastery, mastery.levelMastery, profiles);

  // User.readiness is a flat {schoolId: pct} map shared across subjects, but
  // english reuses the same school ids (cg/ntt) → persisting would clobber the
  // math values. Only the math map is persisted; english is computed per load.
  if (subject !== "math") return fresh;

  // Merge: prefer freshly computed values for required schools; preserve any
  // existing entries for schools not in `profiles` (defensive).
  const merged: Record<string, number> = { ...persistedReadiness, ...fresh };
  await prisma.user
    .update({
      where: { id: userId },
      data: { readiness: JSON.stringify(merged) },
    })
    .catch(() => {
      // Best-effort persistence; surfacing a write error to the page render
      // would be worse than just rendering with the computed values.
    });
  return merged;
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
