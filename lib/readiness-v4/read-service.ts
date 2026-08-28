import { prisma } from "../prisma";
import { resolveGlobalAssignments } from "./assignment-service";
import { getReadinessV4Flags } from "./feature-flags";
import type { ReadinessReasonCode, ReadinessStatus } from "./types";

export type ReadinessFreshnessState = "current" | "computing" | "stale" | "unavailable";
export type ReadinessViewSource = "v4" | "legacy-fallback";

export interface EffectiveReadinessView {
  school: string;
  score: number | null;
  scoreScale: 100;
  schoolMastery: number | null;
  evidence: number | null;
  advancedEvidence: number | null;
  status: ReadinessStatus | "legacy";
  reasonCodes: ReadinessReasonCode[];
  profileVersion: string | null;
  policyVersion: string | null;
  computedAt: string | null;
  freshnessState: ReadinessFreshnessState;
  source: ReadinessViewSource;
  snapshotId: string | null;
}

function legacyView(school: string, score: number | undefined): EffectiveReadinessView {
  return {
    school,
    score: typeof score === "number" ? score : null,
    scoreScale: 100,
    schoolMastery: null,
    evidence: null,
    advancedEvidence: null,
    status: "legacy",
    reasonCodes: [],
    profileVersion: null,
    policyVersion: null,
    computedAt: null,
    freshnessState: typeof score === "number" ? "current" : "unavailable",
    source: "legacy-fallback",
    snapshotId: null,
  };
}

export async function getEffectiveReadinessV4(
  userId: string,
  schoolIds: string[],
  legacyReadiness: Record<string, number>,
): Promise<Record<string, EffectiveReadinessView>> {
  const flags = await getReadinessV4Flags();
  if (!flags.readEnabled) {
    return Object.fromEntries(schoolIds.map((school) => [school, legacyView(school, legacyReadiness[school])]));
  }

  const assignments = await resolveGlobalAssignments();
  if (!assignments.policyVersionId) {
    return Object.fromEntries(schoolIds.map((school) => [school, legacyView(school, legacyReadiness[school])]));
  }
  const profileIds = schoolIds.flatMap((school) => assignments.profileVersionIds[school] ? [assignments.profileVersionIds[school]] : []);
  const [snapshots, latestAttempt, pendingItems] = await Promise.all([
    prisma.readinessSnapshot.findMany({
      where: {
        userId,
        subject: "math",
        policyVersionId: assignments.policyVersionId,
        profileVersionId: { in: profileIds },
      },
      orderBy: { computedAt: "desc" },
    }),
    prisma.attempt.findFirst({
      where: { userId, submitted: true, exam: { subject: "math" } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.readinessRecomputeJobItem.findMany({
      where: { itemKey: `user:${userId}`, status: { in: ["queued", "running"] } },
      select: { status: true },
    }),
  ]);
  const snapshotByProfile = new Map<string, (typeof snapshots)[number]>();
  for (const snapshot of snapshots) {
    if (!snapshotByProfile.has(snapshot.profileVersionId)) snapshotByProfile.set(snapshot.profileVersionId, snapshot);
  }
  const isComputing = pendingItems.length > 0;

  return Object.fromEntries(schoolIds.map((school) => {
    const profileVersionId = assignments.profileVersionIds[school];
    const snapshot = profileVersionId ? snapshotByProfile.get(profileVersionId) : undefined;
    if (!snapshot) {
      const fallback = legacyView(school, legacyReadiness[school]);
      return [school, { ...fallback, freshnessState: isComputing ? "computing" : fallback.freshnessState }];
    }
    const stale = Boolean(latestAttempt && snapshot.computedAt < latestAttempt.createdAt);
    const status = snapshot.status as ReadinessStatus;
    return [school, {
      school,
      score: status === "unverified" ? null : snapshot.readiness,
      scoreScale: 100 as const,
      schoolMastery: snapshot.schoolMastery,
      evidence: snapshot.schoolEvidence,
      advancedEvidence: snapshot.advancedEvidence,
      status,
      reasonCodes: JSON.parse(snapshot.reasonCodesJson) as ReadinessReasonCode[],
      profileVersion: snapshot.profileVersionId,
      policyVersion: snapshot.policyVersionId,
      computedAt: snapshot.computedAt.toISOString(),
      freshnessState: isComputing ? "computing" : stale ? "stale" : "current",
      source: "v4" as const,
      snapshotId: snapshot.id,
    }];
  }));
}
