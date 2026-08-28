import { prisma } from "../prisma";
import { policyFromRow } from "./policy-repository";
import { computeReadinessV4 } from "./readiness-engine";
import { profileFromRow } from "./snapshot-service";
import type { MasteryV4Result, ReadinessPolicy } from "./types";
import { stableHash } from "./hashing";

export interface CandidateRow {
  userKey: string;
  school: string;
  legacy: number | null;
  pointReadiness: number;
  countReadiness: number;
  mastery: number;
  pointEvidence: number;
  countEvidence: number;
  pointStatus: string;
  countStatus: string;
}

function parse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export interface SimulationSchoolSummary {
  users: number;
  point: { min: number; max: number; median: number; ready: number };
  count: { min: number; max: number; median: number; ready: number };
  averageAbsolutePointCountDelta: number;
}

export interface SimulationSummary {
  policyVersionId: string;
  users: number;
  schools: number;
  snapshotsCompared: number;
  invariantViolations: number;
  bySchool: Record<string, SimulationSchoolSummary>;
}

export async function buildShadowComparison(policyVersionId: string, profileVersionIds?: string[]): Promise<{
  rows: CandidateRow[];
  summary: SimulationSummary;
}> {
  const [policyRow, profiles, users] = await Promise.all([
    prisma.readinessPolicyVersion.findUniqueOrThrow({ where: { id: policyVersionId } }),
    prisma.schoolProfileVersion.findMany({
      where: profileVersionIds?.length
        ? { id: { in: profileVersionIds }, subject: "math" }
        : { subject: "math", status: "shadow" },
      orderBy: { school: "asc" },
    }),
    prisma.user.findMany({ select: { id: true, readiness: true } }),
  ]);
  const basePolicy = policyFromRow(policyRow);
  const latestMastery = await prisma.masterySnapshot.findMany({
    where: { subject: "math", methodologyVersion: "mastery-v4" },
    orderBy: { computedAt: "desc" },
  });
  const masteryByUser = new Map<string, (typeof latestMastery)[number]>();
  for (const snapshot of latestMastery) if (!masteryByUser.has(snapshot.userId)) masteryByUser.set(snapshot.userId, snapshot);

  const rows: CandidateRow[] = [];
  let invariantViolations = 0;
  for (const user of users) {
    const snapshot = masteryByUser.get(user.id);
    if (!snapshot) continue;
    const mastery: MasteryV4Result = {
      cells: parse(snapshot.cellsJson, {}),
      cognitiveSummary: parse(snapshot.cognitiveSummaryJson, {}),
      coverageSummary: parse(snapshot.coverageSummaryJson, { answeredFacts: 0, assessedFacts: 0, unverifiedCellCount: 0 }),
    };
    const legacy = parse<Record<string, number>>(user.readiness, {});
    for (const profileRow of profiles) {
      const profile = profileFromRow(profileRow);
      const pointPolicy: ReadinessPolicy = { ...basePolicy, blueprintWeightMode: "point" };
      const countPolicy: ReadinessPolicy = { ...basePolicy, blueprintWeightMode: "count" };
      const point = computeReadinessV4(mastery, profile, pointPolicy);
      const count = computeReadinessV4(mastery, profile, countPolicy);
      if (point.readiness > point.schoolMastery * 100 + 1e-6 || count.readiness > count.schoolMastery * 100 + 1e-6) {
        invariantViolations += 1;
      }
      rows.push({
        userKey: stableHash({ userId: user.id }).slice(0, 12),
        school: profile.school,
        legacy: typeof legacy[profile.school] === "number" ? legacy[profile.school] : null,
        pointReadiness: point.readiness,
        countReadiness: count.readiness,
        mastery: point.schoolMastery,
        pointEvidence: point.schoolEvidence,
        countEvidence: count.schoolEvidence,
        pointStatus: point.status,
        countStatus: count.status,
      });
    }
  }

  const bySchool: Record<string, SimulationSchoolSummary> = {};
  for (const profile of profiles) {
    const schoolRows = rows.filter((row) => row.school === profile.school);
    const pointValues = schoolRows.map((row) => row.pointReadiness);
    const countValues = schoolRows.map((row) => row.countReadiness);
    bySchool[profile.school] = {
      users: schoolRows.length,
      point: {
        min: Math.min(...pointValues),
        max: Math.max(...pointValues),
        median: median(pointValues),
        ready: schoolRows.filter((row) => ["ready", "strong_ready"].includes(row.pointStatus)).length,
      },
      count: {
        min: Math.min(...countValues),
        max: Math.max(...countValues),
        median: median(countValues),
        ready: schoolRows.filter((row) => ["ready", "strong_ready"].includes(row.countStatus)).length,
      },
      averageAbsolutePointCountDelta: schoolRows.length
        ? schoolRows.reduce((sum, row) => sum + Math.abs(row.pointReadiness - row.countReadiness), 0) / schoolRows.length
        : 0,
    };
  }

  return {
    rows,
    summary: {
      policyVersionId,
      users: masteryByUser.size,
      schools: profiles.length,
      snapshotsCompared: rows.length,
      invariantViolations,
      bySchool,
    },
  };
}


export interface ActiveCandidateRow {
  userKey: string;
  school: string;
  activeProfileVersionId: string | null;
  candidateProfileVersionId: string | null;
  activeReadiness: number | null;
  candidateReadiness: number | null;
  readinessDelta: number | null;
  activeStatus: string | null;
  candidateStatus: string | null;
  activeMastery: number | null;
  candidateMastery: number | null;
  activeEvidence: number | null;
  candidateEvidence: number | null;
  gainedReady: boolean;
  lostReady: boolean;
  becameEvidenceLimited: boolean;
  activeReasonCodes: string[];
  candidateReasonCodes: string[];
  changedReasonCodes: string[];
}

export interface ActiveCandidateSchoolSummary {
  users: number;
  compared: number;
  gainedReady: number;
  lostReady: number;
  becameEvidenceLimited: number;
  medianReadinessDelta: number | null;
  activeStatusDistribution: Record<string, number>;
  candidateStatusDistribution: Record<string, number>;
  profileChanged: boolean;
  activeProfileVersionId: string | null;
  candidateProfileVersionId: string | null;
  activeDifficultyIndex: number | null;
  candidateDifficultyIndex: number | null;
}

export interface ActiveCandidateComparisonSummary {
  activePolicyVersionId: string | null;
  candidatePolicyVersionId: string;
  activeProfileVersionIds: string[];
  candidateProfileVersionIds: string[];
  users: number;
  schools: number;
  snapshotsCompared: number;
  invariantViolations: number;
  bySchool: Record<string, ActiveCandidateSchoolSummary>;
  policyChanges: Array<{ field: string; active: number | string; candidate: number | string }>;
}

function statusDistribution(values: Array<string | null>): Record<string, number> {
  return values.reduce<Record<string, number>>((result, value) => {
    if (value) result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {});
}

function medianNullable(values: number[]): number | null {
  return values.length ? median(values) : null;
}

const POLICY_COMPARISON_FIELDS = [
  "priorStrength",
  "priorMastery",
  "evidenceTarget",
  "evidenceExponent",
  "blueprintWeightMode",
  "preparingThreshold",
  "nearReadyThreshold",
  "readyThreshold",
  "strongReadyThreshold",
  "overallEvidenceGate",
  "advancedShareGate",
  "advancedEvidenceGate",
  "criticalTopicThreshold",
  "criticalMasteryGate",
  "criticalEvidenceGate",
] as const;

export async function buildActiveCandidateComparison(input: {
  candidatePolicyVersionId: string;
  candidateProfileVersionIds: string[];
}): Promise<{ rows: ActiveCandidateRow[]; summary: ActiveCandidateComparisonSummary }> {
  const candidateProfileVersionIds = [...new Set(input.candidateProfileVersionIds)].sort();
  const [candidatePolicyRow, activeAssignment, activeProfileAssignments, candidateProfiles, users, latestMastery] = await Promise.all([
    prisma.readinessPolicyVersion.findUniqueOrThrow({ where: { id: input.candidatePolicyVersionId } }),
    prisma.readinessPolicyAssignment.findFirst({
      where: { subject: "math", scopeType: "global", scopeKey: "global", status: "active", endedAt: null },
      orderBy: { effectiveFrom: "desc" },
    }),
    prisma.schoolProfileAssignment.findMany({
      where: { subject: "math", scopeType: "global", scopeKey: "global", status: "active", endedAt: null },
      select: { school: true, profileVersionId: true },
    }),
    prisma.schoolProfileVersion.findMany({
      where: { id: { in: candidateProfileVersionIds }, subject: "math" },
      orderBy: [{ school: "asc" }, { createdAt: "desc" }],
    }),
    prisma.user.findMany({ select: { id: true } }),
    prisma.masterySnapshot.findMany({ where: { subject: "math", methodologyVersion: "mastery-v4" }, orderBy: { computedAt: "desc" } }),
  ]);
  const activeProfileIds = activeProfileAssignments.map((assignment) => assignment.profileVersionId);
  const activeProfiles = activeProfileIds.length
    ? await prisma.schoolProfileVersion.findMany({ where: { id: { in: activeProfileIds }, subject: "math" } })
    : [];
  if (!["draft", "shadow"].includes(candidatePolicyRow.status)) throw new Error(`Candidate policy must be draft or shadow; got ${candidatePolicyRow.status}`);
  if (candidateProfiles.some((profile) => profile.status !== "shadow")) throw new Error("Candidate comparison accepts shadow profiles only");
  const candidatePolicy = policyFromRow(candidatePolicyRow);
  const activePolicy = activeAssignment
    ? policyFromRow(await prisma.readinessPolicyVersion.findUniqueOrThrow({ where: { id: activeAssignment.policyVersionId } }))
    : null;
  const activeBySchool = new Map(activeProfiles.map((profile) => [profile.school, profile]));
  const candidateBySchool = new Map<string, (typeof candidateProfiles)[number]>();
  for (const profile of candidateProfiles) if (!candidateBySchool.has(profile.school)) candidateBySchool.set(profile.school, profile);
  const masteryByUser = new Map<string, (typeof latestMastery)[number]>();
  for (const snapshot of latestMastery) if (!masteryByUser.has(snapshot.userId)) masteryByUser.set(snapshot.userId, snapshot);
  const rows: ActiveCandidateRow[] = [];
  let invariantViolations = 0;
  for (const user of users) {
    const snapshot = masteryByUser.get(user.id);
    if (!snapshot) continue;
    const mastery: MasteryV4Result = {
      cells: parse(snapshot.cellsJson, {}),
      cognitiveSummary: parse(snapshot.cognitiveSummaryJson, {}),
      coverageSummary: parse(snapshot.coverageSummaryJson, { answeredFacts: 0, assessedFacts: 0, unverifiedCellCount: 0 }),
    };
    for (const [school, candidateProfileRow] of candidateBySchool) {
      const activeProfileRow = activeBySchool.get(school);
      const activeResult = activeProfileRow && activePolicy
        ? computeReadinessV4(mastery, profileFromRow(activeProfileRow), activePolicy)
        : null;
      const candidateResult = computeReadinessV4(mastery, profileFromRow(candidateProfileRow), candidatePolicy);
      if (candidateResult.readiness > candidateResult.schoolMastery * 100 + 1e-6) invariantViolations += 1;
      if (activeResult && activeResult.readiness > activeResult.schoolMastery * 100 + 1e-6) invariantViolations += 1;
      const activeReasonCodes = activeResult?.reasonCodes ?? [];
      const candidateReasonCodes = candidateResult.reasonCodes;
      const changedReasonCodes = [...new Set([...activeReasonCodes, ...candidateReasonCodes])].filter((code) => activeReasonCodes.includes(code) !== candidateReasonCodes.includes(code));
      const activeReady = activeResult ? ["ready", "strong_ready"].includes(activeResult.status) : false;
      const candidateReady = ["ready", "strong_ready"].includes(candidateResult.status);
      rows.push({
        userKey: stableHash({ userId: user.id }).slice(0, 12),
        school,
        activeProfileVersionId: activeProfileRow?.id ?? null,
        candidateProfileVersionId: candidateProfileRow.id,
        activeReadiness: activeResult?.readiness ?? null,
        candidateReadiness: candidateResult.readiness,
        readinessDelta: activeResult ? candidateResult.readiness - activeResult.readiness : null,
        activeStatus: activeResult?.status ?? null,
        candidateStatus: candidateResult.status,
        activeMastery: activeResult?.schoolMastery ?? null,
        candidateMastery: candidateResult.schoolMastery,
        activeEvidence: activeResult?.schoolEvidence ?? null,
        candidateEvidence: candidateResult.schoolEvidence,
        gainedReady: !activeReady && candidateReady,
        lostReady: activeReady && !candidateReady,
        becameEvidenceLimited: activeResult?.status !== "evidence_limited" && candidateResult.status === "evidence_limited",
        activeReasonCodes,
        candidateReasonCodes,
        changedReasonCodes,
      });
    }
  }
  const schools = [...candidateBySchool.keys()].sort();
  const bySchool: Record<string, ActiveCandidateSchoolSummary> = {};
  for (const school of schools) {
    const schoolRows = rows.filter((row) => row.school === school);
    const activeProfile = activeBySchool.get(school);
    const candidateProfile = candidateBySchool.get(school);
    const deltas = schoolRows.flatMap((row) => row.readinessDelta == null ? [] : [row.readinessDelta]);
    bySchool[school] = {
      users: users.length,
      compared: schoolRows.length,
      gainedReady: schoolRows.filter((row) => row.gainedReady).length,
      lostReady: schoolRows.filter((row) => row.lostReady).length,
      becameEvidenceLimited: schoolRows.filter((row) => row.becameEvidenceLimited).length,
      medianReadinessDelta: medianNullable(deltas),
      activeStatusDistribution: statusDistribution(schoolRows.map((row) => row.activeStatus)),
      candidateStatusDistribution: statusDistribution(schoolRows.map((row) => row.candidateStatus)),
      profileChanged: activeProfile?.sourceHash !== candidateProfile?.sourceHash,
      activeProfileVersionId: activeProfile?.id ?? null,
      candidateProfileVersionId: candidateProfile?.id ?? null,
      activeDifficultyIndex: activeProfile?.difficultyIndex ?? null,
      candidateDifficultyIndex: candidateProfile?.difficultyIndex ?? null,
    };
  }
  const policyChanges = activePolicy
    ? POLICY_COMPARISON_FIELDS.flatMap((field) => activePolicy[field] === candidatePolicy[field] ? [] : [{ field, active: activePolicy[field], candidate: candidatePolicy[field] }])
    : POLICY_COMPARISON_FIELDS.map((field) => ({ field, active: "unavailable" as const, candidate: candidatePolicy[field] }));
  return {
    rows,
    summary: {
      activePolicyVersionId: activeAssignment?.policyVersionId ?? null,
      candidatePolicyVersionId: input.candidatePolicyVersionId,
      activeProfileVersionIds: activeProfileIds,
      candidateProfileVersionIds,
      users: users.length,
      schools: schools.length,
      snapshotsCompared: rows.length,
      invariantViolations,
      bySchool,
      policyChanges,
    },
  };
}
