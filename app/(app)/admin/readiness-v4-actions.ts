"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getReadinessV4Flags, setReadinessV4Flags } from "@/lib/readiness-v4/feature-flags";
import {
  cancelRecomputeJob,
  createShadowBackfillJob,
  pauseRecomputeJob,
  resumeRecomputeJob,
  retryFailedRecomputeItems,
  retryFailedRecomputeItem,
  enqueueSchoolProfileBuild,
} from "@/lib/readiness-v4/job-service";
import { requireReadinessPermission } from "@/lib/readiness-v4/permissions";
import { activateGlobalPolicy, activateGlobalProfile, rollbackGlobalReadinessV4, resolveGlobalAssignments } from "@/lib/readiness-v4/assignment-service";
import { buildShadowComparison } from "@/lib/readiness-v4/simulator-service";
import { clonePolicyToDraft, movePolicyDraftToShadow, updatePolicyDraft } from "@/lib/readiness-v4/policy-repository";
import { approveSchoolProfile, activateApprovedSchoolProfile, retireShadowSchoolProfile, reviewSchoolProfile } from "@/lib/readiness-v4/profile-lifecycle-actions";
import { getActiveSchools } from "@/lib/schools";
import type { ReadinessPolicy } from "@/lib/readiness-v4/types";

export interface ReadinessV4AdminState {
  flags: Awaited<ReturnType<typeof getReadinessV4Flags>>;
  policies: Array<{
    id: string;
    version: string;
    status: string;
    createdAt: string;
    reviewed: boolean;
  }>;
  profiles: { shadow: number; active: number; retired: number };
  schoolProfiles: Array<{
    id: string;
    school: string;
    status: string;
    taxonomyVersion: string;
    methodologyVersion: string;
    assessmentRunId: string;
    examCount: number;
    questionCount: number;
    yearCount: number;
    yearRange: string[];
    difficultyIndex: number;
    reliabilityFlags: string[];
    topBlueprintTopics: Array<{ topic: string; weight: number }>;
    sourceHash: string;
  }>;
  snapshots: { mastery: number; readiness: number };
  monitoring: {
    queuedItems: number;
    runningItems: number;
    latestStatusCounts: Record<string, number>;
  };
  audits: Array<{
    id: string;
    action: string;
    fromState: string | null;
    toState: string | null;
    reason: string;
    createdAt: string;
  }>;
  jobs: Array<{
    id: string;
    status: string;
    mode: string;
    reason: string;
    totalItems: number;
    processedItems: number;
    successItems: number;
    failedItems: number;
    createdAt: string;
  }>;
}

export async function getReadinessV4AdminState(): Promise<ReadinessV4AdminState> {
  await requireReadinessPermission("readiness.view");
  const [flags, policyRows, profiles, masteryCount, readinessCount, jobs, itemStatuses, audits] = await Promise.all([
    getReadinessV4Flags(),
    prisma.readinessPolicyVersion.findMany({ where: { subject: "math" }, orderBy: { createdAt: "desc" } }),
    prisma.schoolProfileVersion.findMany({
      where: { subject: "math" },
      orderBy: [{ status: "asc" }, { school: "asc" }, { createdAt: "desc" }],
    }),
    prisma.masterySnapshot.count({ where: { subject: "math" } }),
    prisma.readinessSnapshot.count({ where: { subject: "math" } }),
    prisma.readinessRecomputeJob.findMany({
      where: { subject: "math" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.readinessRecomputeJobItem.groupBy({ by: ["status"], _count: true }),
    prisma.readinessPolicyAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  const latestPolicy = policyRows.find((row) => row.status === "shadow" || row.status === "active");
  const matchingJob = latestPolicy
    ? jobs.find((job) => job.policyVersionId === latestPolicy.id && job.status === "completed")
    : undefined;
  const monitoredProfileIds = matchingJob
    ? JSON.parse(matchingJob.profileVersionIdsJson) as string[]
    : [];
  const monitoredSnapshots = latestPolicy && monitoredProfileIds.length
    ? await prisma.readinessSnapshot.findMany({
        where: { policyVersionId: latestPolicy.id, profileVersionId: { in: monitoredProfileIds } },
        orderBy: { computedAt: "desc" },
        select: { userId: true, school: true, status: true },
      })
    : [];
  const latestLogicalSnapshots = new Map<string, string>();
  for (const snapshot of monitoredSnapshots) {
    const key = `${snapshot.userId}:${snapshot.school}`;
    if (!latestLogicalSnapshots.has(key)) latestLogicalSnapshots.set(key, snapshot.status);
  }
  const latestStatusCounts: Record<string, number> = {};
  for (const status of latestLogicalSnapshots.values()) {
    latestStatusCounts[status] = (latestStatusCounts[status] ?? 0) + 1;
  }
  const itemStatusCounts = Object.fromEntries(itemStatuses.map((row) => [row.status, row._count]));
  const profileCount = profiles.reduce<Record<string, number>>((counts, row) => {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
    return counts;
  }, {});
  return {
    flags,
    policies: policyRows.map((row) => ({
      id: row.id,
      version: row.version,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      reviewed: Boolean(row.reviewedByUserId),
    })),
    profiles: {
      shadow: profileCount.shadow ?? 0,
      active: profileCount.active ?? 0,
      retired: profileCount.retired ?? 0,
    },
    schoolProfiles: profiles.map((profile) => {
      const blueprint = JSON.parse(profile.blueprintPointJson) as Record<string, number>;
      const topicWeights = new Map<string, number>();
      for (const [cell, weight] of Object.entries(blueprint)) {
        const topic = cell.split("::")[0];
        topicWeights.set(topic, (topicWeights.get(topic) ?? 0) + weight);
      }
      const reliability = JSON.parse(profile.reliabilityJson) as { flags?: string[] };
      return {
        id: profile.id,
        school: profile.school,
        status: profile.status,
        taxonomyVersion: profile.taxonomyVersion,
        methodologyVersion: profile.methodologyVersion,
        assessmentRunId: profile.assessmentRunId,
        examCount: profile.examCount,
        questionCount: profile.questionCount,
        yearCount: profile.yearCount,
        yearRange: JSON.parse(profile.yearRangeJson) as string[],
        difficultyIndex: profile.difficultyIndex,
        reliabilityFlags: reliability.flags ?? [],
        topBlueprintTopics: [...topicWeights.entries()]
          .sort((left, right) => right[1] - left[1])
          .slice(0, 5)
          .map(([topic, weight]) => ({ topic, weight })),
        sourceHash: profile.sourceHash,
      };
    }),
    snapshots: { mastery: masteryCount, readiness: readinessCount },
    monitoring: {
      queuedItems: itemStatusCounts.queued ?? 0,
      runningItems: itemStatusCounts.running ?? 0,
      latestStatusCounts,
    },
    audits: audits.map((audit) => ({
      id: audit.id,
      action: audit.action,
      fromState: audit.fromState,
      toState: audit.toState,
      reason: audit.reason,
      createdAt: audit.createdAt.toISOString(),
    })),
    jobs: jobs.map((job) => ({
      id: job.id,
      status: job.status,
      mode: job.mode,
      reason: job.reason,
      totalItems: job.totalItems,
      processedItems: job.processedItems,
      successItems: job.successItems,
      failedItems: job.failedItems,
      createdAt: job.createdAt.toISOString(),
    })),
  };
}

export async function enableReadinessV4ShadowAction(): Promise<void> {
  await requireReadinessPermission("readiness.recompute.operate");
  await setReadinessV4Flags({ computeEnabled: true, shadowEnabled: true, readEnabled: false, persistLegacyEnabled: true });
  revalidatePath("/admin");
}

export async function disableReadinessV4ReadAction(): Promise<void> {
  await requireReadinessPermission("readiness.policy.activate");
  await setReadinessV4Flags({ readEnabled: false });
  revalidatePath("/admin");
  revalidatePath("/home");
}

export async function activateReadinessV4GlobalAction(reason: string): Promise<void> {
  const actor = await requireReadinessPermission("readiness.policy.activate");
  if (reason.trim().length < 10) throw new Error("Activation reason must contain at least 10 characters");
  const [policy, latestJob, admins] = await Promise.all([
    prisma.readinessPolicyVersion.findFirstOrThrow({ where: { subject: "math", status: "shadow" }, orderBy: { createdAt: "desc" } }),
    prisma.readinessRecomputeJob.findFirst({ where: { subject: "math", mode: "shadow" }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ where: { role: "admin", disabled: false }, select: { id: true } }),
  ]);
  if (!latestJob || latestJob.status !== "completed" || latestJob.failedItems > 0) throw new Error("Latest shadow job must complete without failures");
  if (latestJob.policyVersionId !== policy.id) throw new Error("Latest shadow job does not belong to the candidate policy");
  const profileVersionIds = JSON.parse(latestJob.profileVersionIdsJson) as string[];
  if (!profileVersionIds.length) throw new Error("Latest shadow job has no profile versions");
  const profiles = await prisma.schoolProfileVersion.findMany({
    where: { id: { in: profileVersionIds }, subject: "math", status: "shadow" },
    orderBy: { school: "asc" },
  });
  if (profiles.length !== profileVersionIds.length) throw new Error("Latest shadow job profile set is incomplete or no longer shadow");
  if (new Set(profiles.map((profile) => profile.school)).size !== profiles.length) {
    throw new Error("Latest shadow job contains more than one profile version for a school");
  }
  if (latestJob.processedItems !== latestJob.totalItems || latestJob.successItems !== latestJob.totalItems) {
    throw new Error("Latest shadow job progress is incomplete");
  }
  if (policy.createdByUserId === actor.id) throw new Error("Four-eyes rule: policy creator cannot activate the candidate");
  const comparison = await buildShadowComparison(policy.id, profileVersionIds);
  if (Number(comparison.summary.invariantViolations) !== 0) throw new Error("Cannot activate with invariant violations");
  const approver = admins.find((admin) => admin.id !== actor.id);
  if (!approver) throw new Error("Four-eyes activation requires another active admin");
  for (const profile of profiles) {
    await activateGlobalProfile({
      profileVersionId: profile.id,
      approverUserId: approver.id,
      activatorUserId: actor.id,
      reason,
    });
  }
  await activateGlobalPolicy({ policyVersionId: policy.id, activatorUserId: actor.id, reason });
  revalidatePath("/admin");
}

export async function enableReadinessV4ReadAction(): Promise<void> {
  await requireReadinessPermission("readiness.policy.activate");
  const assignments = await resolveGlobalAssignments();
  const activeSchoolCount = await prisma.schoolProfileVersion.count({ where: { id: { in: Object.values(assignments.profileVersionIds) }, status: "active" } });
  if (!assignments.policyVersionId || activeSchoolCount === 0) throw new Error("Active global policy/profile assignments are required");
  const [userCount, snapshotPairs] = await Promise.all([
    prisma.user.count(),
    prisma.readinessSnapshot.groupBy({
      by: ["userId", "school"],
      where: {
        policyVersionId: assignments.policyVersionId,
        profileVersionId: { in: Object.values(assignments.profileVersionIds) },
      },
    }),
  ]);
  const requiredSnapshots = userCount * activeSchoolCount;
  if (snapshotPairs.length < requiredSnapshots) throw new Error(`Active snapshot backfill incomplete: ${snapshotPairs.length}/${requiredSnapshots}`);
  await setReadinessV4Flags({ readEnabled: true });
  revalidatePath("/admin");
  revalidatePath("/home");
  revalidatePath("/overview");
  revalidatePath("/library");
}

export async function rollbackReadinessV4GlobalAction(reason: string): Promise<void> {
  const actor = await requireReadinessPermission("readiness.policy.activate");
  if (reason.trim().length < 10) throw new Error("Rollback reason must contain at least 10 characters");
  const approver = await prisma.user.findFirst({
    where: { role: "admin", disabled: false, id: { not: actor.id } },
    select: { id: true },
  });
  if (!approver) throw new Error("Four-eyes rollback requires another active admin");
  await setReadinessV4Flags({ readEnabled: false });
  await rollbackGlobalReadinessV4({ actorUserId: actor.id, approverUserId: approver.id, reason });
  revalidatePath("/admin");
  revalidatePath("/home");
  revalidatePath("/overview");
  revalidatePath("/library");
}

export async function createReadinessV4ShadowJobAction(): Promise<{ id: string; created: boolean; totalItems: number }> {
  const actor = await requireReadinessPermission("readiness.recompute.operate");
  const policy = await prisma.readinessPolicyVersion.findFirstOrThrow({
    where: { subject: "math", status: "shadow" },
    orderBy: { createdAt: "desc" },
  });
  const result = await createShadowBackfillJob({ policyVersionId: policy.id, requestedByUserId: actor.id });
  revalidatePath("/admin");
  return result;
}

export async function pauseReadinessV4JobAction(jobId: string): Promise<void> {
  await requireReadinessPermission("readiness.recompute.operate");
  await pauseRecomputeJob(jobId);
  revalidatePath("/admin");
}

export async function resumeReadinessV4JobAction(jobId: string): Promise<void> {
  await requireReadinessPermission("readiness.recompute.operate");
  await resumeRecomputeJob(jobId);
  revalidatePath("/admin");
}

export async function cancelReadinessV4JobAction(jobId: string): Promise<void> {
  await requireReadinessPermission("readiness.recompute.operate");
  await cancelRecomputeJob(jobId);
  revalidatePath("/admin");
}

export async function retryReadinessV4JobAction(jobId: string): Promise<number> {
  await requireReadinessPermission("readiness.recompute.operate");
  const count = await retryFailedRecomputeItems(jobId);
  revalidatePath("/admin");
  revalidatePath(`/admin/readiness/jobs/${jobId}`);
  return count;
}

export async function retryReadinessV4JobItemAction(jobId: string, itemId: string): Promise<boolean> {
  await requireReadinessPermission("readiness.recompute.operate");
  const retried = await retryFailedRecomputeItem(jobId, itemId);
  revalidatePath("/admin");
  revalidatePath(`/admin/readiness/jobs/${jobId}`);
  return retried;
}

export async function enqueueSchoolProfileBuildAction(input: { assessmentRunId: string; schools: string[] }): Promise<{ jobId: string; created: boolean; totalItems: number }> {
  const actor = await requireReadinessPermission("readiness.recompute.operate");
  const schools = [...new Set(input.schools)].filter((school) => /^[a-z][a-z0-9]{0,15}$/.test(school)).slice(0, 20);
  const activeSchools = new Set((await getActiveSchools()).map((school) => school.id));
  if (!schools.length || schools.some((school) => !activeSchools.has(school))) throw new Error("Profile build scope contains no valid active schools");
  const result = await enqueueSchoolProfileBuild({ assessmentRunId: input.assessmentRunId, schools, requestedByUserId: actor.id });
  revalidatePath("/admin");
  revalidatePath("/admin/readiness/profiles");
  return result;
}

export async function reviewReadinessProfileAction(input: { profileVersionId: string; reason: string }): Promise<void> {
  const reviewer = await requireReadinessPermission("readiness.policy.review");
  await reviewSchoolProfile({ ...input, reviewerUserId: reviewer.id });
  revalidatePath("/admin/readiness/profiles");
}

export async function approveReadinessProfileAction(input: { profileVersionId: string; reason: string }): Promise<void> {
  const approver = await requireReadinessPermission("readiness.policy.review");
  await approveSchoolProfile({ ...input, approverUserId: approver.id });
  revalidatePath("/admin/readiness/profiles");
}

export async function activateReadinessProfileAction(input: { profileVersionId: string; approverUserId: string; reason: string }): Promise<{ assignmentId: string; recomputeJobId: string }> {
  const activator = await requireReadinessPermission("readiness.policy.activate");
  const result = await activateApprovedSchoolProfile({ ...input, activatorUserId: activator.id });
  revalidatePath("/admin");
  revalidatePath("/admin/readiness/profiles");
  revalidatePath(`/admin/readiness/jobs/${result.recomputeJobId}`);
  return result;
}

export async function retireReadinessProfileAction(input: { profileVersionId: string; reason: string }): Promise<void> {
  const actor = await requireReadinessPermission("readiness.policy.activate");
  await retireShadowSchoolProfile({ ...input, actorUserId: actor.id });
  revalidatePath("/admin");
  revalidatePath("/admin/readiness/profiles");
}

export async function cloneReadinessPolicyDraftAction(input: {
  sourcePolicyVersionId: string;
  version: string;
  changeSummary: string;
}): Promise<{ id: string }> {
  const actor = await requireReadinessPermission("readiness.policy.edit");
  if (!/^[a-z0-9][a-z0-9._-]{2,79}$/i.test(input.version)) throw new Error("Invalid policy version");
  if (input.changeSummary.trim().length < 10) throw new Error("Change summary must contain at least 10 characters");
  const row = await clonePolicyToDraft({ ...input, actorUserId: actor.id });
  revalidatePath("/admin");
  return { id: row.id };
}

export async function updateReadinessPolicyDraftAction(input: {
  policyVersionId: string;
  policy: ReadinessPolicy;
  reason: string;
}): Promise<void> {
  const actor = await requireReadinessPermission("readiness.policy.edit");
  if (input.reason.trim().length < 10) throw new Error("Edit reason must contain at least 10 characters");
  await updatePolicyDraft({ ...input, actorUserId: actor.id });
  revalidatePath("/admin");
}

export async function moveReadinessPolicyToShadowAction(input: {
  policyVersionId: string;
  reason: string;
}): Promise<void> {
  const reviewer = await requireReadinessPermission("readiness.policy.review");
  if (input.reason.trim().length < 10) throw new Error("Review reason must contain at least 10 characters");
  await movePolicyDraftToShadow({ ...input, reviewerUserId: reviewer.id });
  revalidatePath("/admin");
}
