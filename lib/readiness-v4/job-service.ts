import { randomUUID } from "node:crypto";
import { prisma } from "../prisma";
import { stableHash } from "./hashing";
import { computeAndPersistUserShadowV4 } from "./snapshot-service";
import { getReadinessV4Flags } from "./feature-flags";
import { resolveGlobalAssignments } from "./assignment-service";
import { buildApprovedSchoolProfiles, persistShadowSchoolProfile } from "./profile-service";
import { MATH_TAXONOMY_VERSION } from "./types";

const MAX_ATTEMPTS = 3;
const LEASE_MS = 5 * 60 * 1000;

export async function createShadowBackfillJob(input: {
  policyVersionId: string;
  requestedByUserId: string;
}): Promise<{ id: string; created: boolean; totalItems: number }> {
  const profileRows = await prisma.schoolProfileVersion.findMany({
    where: { subject: "math", status: "shadow" },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  const assessmentRuns = await prisma.assessmentRun.findMany({
    where: { subject: "math", status: "approved" },
    select: { id: true, inputHash: true },
    orderBy: { id: "asc" },
  });
  const users = await prisma.user.findMany({ select: { id: true }, orderBy: { id: "asc" } });
  const targetVersion = {
    policyVersionId: input.policyVersionId,
    profileVersionIds: profileRows.map((row) => row.id),
    assessmentRuns,
    methodologyVersion: "readiness-v4",
  };
  const idempotencyKey = stableHash({
    jobType: "mastery-readiness",
    mode: "shadow",
    scope: { type: "all-users", userIds: users.map((user) => user.id) },
    targetVersion,
  });
  const existing = await prisma.readinessRecomputeJob.findUnique({ where: { idempotencyKey } });
  if (existing) return { id: existing.id, created: false, totalItems: existing.totalItems };

  const created = await prisma.$transaction(async (tx) => {
    const job = await tx.readinessRecomputeJob.create({
      data: {
        idempotencyKey,
        subject: "math",
        jobType: "mastery-readiness",
        reason: "policy-preview",
        mode: "shadow",
        policyVersionId: input.policyVersionId,
        profileVersionIdsJson: JSON.stringify(targetVersion.profileVersionIds),
        taxonomyVersion: MATH_TAXONOMY_VERSION,
        scopeJson: JSON.stringify({ type: "all-users" }),
        sourceVersionJson: "{}",
        targetVersionJson: JSON.stringify(targetVersion),
        status: "queued",
        requestedByUserId: input.requestedByUserId,
        totalItems: users.length,
      },
    });
    for (let index = 0; index < users.length; index += 100) {
      await tx.readinessRecomputeJobItem.createMany({
        data: users.slice(index, index + 100).map((user) => ({
          jobId: job.id,
          itemKey: `user:${user.id}`,
          payloadJson: JSON.stringify({ userId: user.id }),
        })),
      });
    }
    return job;
  });
  return { id: created.id, created: true, totalItems: created.totalItems };
}

export async function enqueueSchoolProfileBuild(input: {
  assessmentRunId: string;
  schools: string[];
  requestedByUserId: string;
}): Promise<{ jobId: string; created: boolean; totalItems: number }> {
  const schools = [...new Set(input.schools)].sort();
  if (!schools.length) throw new Error("At least one school is required");
  const run = await prisma.assessmentRun.findUnique({ where: { id: input.assessmentRunId }, select: { id: true, status: true, inputHash: true, taxonomyVersion: true } });
  if (!run || run.status !== "approved") throw new Error("Assessment run must be approved");
  const idempotencyKey = stableHash({ jobType: "school-profile-build", assessmentRunId: run.id, schools, inputHash: run.inputHash });
  const existing = await prisma.readinessRecomputeJob.findUnique({ where: { idempotencyKey } });
  if (existing) return { jobId: existing.id, created: false, totalItems: existing.totalItems };
  const created = await prisma.$transaction(async (tx) => {
    const job = await tx.readinessRecomputeJob.create({
      data: {
        idempotencyKey,
        subject: "math",
        jobType: "school-profile-build",
        reason: "profile-refresh",
        mode: "shadow",
        profileVersionIdsJson: "[]",
        taxonomyVersion: run.taxonomyVersion,
        scopeJson: JSON.stringify({ type: "schools", schools }),
        sourceVersionJson: JSON.stringify({ assessmentRunId: run.id, inputHash: run.inputHash }),
        targetVersionJson: JSON.stringify({ assessmentRunId: run.id, schools }),
        status: "queued",
        requestedByUserId: input.requestedByUserId,
        totalItems: schools.length,
      },
    });
    await tx.readinessRecomputeJobItem.createMany({
      data: schools.map((school) => ({
        jobId: job.id,
        itemKey: `school:${school}`,
        payloadJson: JSON.stringify({ school, assessmentRunId: run.id }),
      })),
    });
    return job;
  });
  return { jobId: created.id, created: true, totalItems: created.totalItems };
}

export async function enqueueAttemptRecompute(input: {
  userId: string;
  attemptId: string;
}): Promise<{ jobId: string; created: boolean } | null> {
  const flags = await getReadinessV4Flags();
  if (!flags.computeEnabled && !flags.shadowEnabled) return null;
  const policy = await prisma.readinessPolicyVersion.findFirst({
    where: { subject: "math", status: { in: ["active", "shadow"] } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  if (!policy) return null;
  const profileVersionIds = policy.status === "active"
    ? Object.values((await resolveGlobalAssignments()).profileVersionIds).sort()
    : (await prisma.schoolProfileVersion.findMany({
        where: { subject: "math", status: "shadow" },
        select: { id: true },
        orderBy: { id: "asc" },
      })).map((profile) => profile.id);
  if (!profileVersionIds.length) return null;
  const assessmentRuns = await prisma.assessmentRun.findMany({
    where: { subject: "math", status: "approved" },
    select: { id: true, inputHash: true },
    orderBy: { id: "asc" },
  });
  const targetVersion = {
    policyVersionId: policy.id,
    profileVersionIds,
    assessmentRuns,
  };
  const idempotencyKey = stableHash({
    jobType: "mastery-readiness",
    reason: "attempt-submit",
    userId: input.userId,
    attemptId: input.attemptId,
    targetVersion,
  });
  const existing = await prisma.readinessRecomputeJob.findUnique({ where: { idempotencyKey } });
  if (existing) return { jobId: existing.id, created: false };
  const job = await prisma.$transaction(async (tx) => {
    const created = await tx.readinessRecomputeJob.create({
      data: {
        idempotencyKey,
        subject: "math",
        jobType: "mastery-readiness",
        reason: "attempt-submit",
        mode: policy.status === "active" ? "active-backfill" : "shadow",
        policyVersionId: policy.id,
        profileVersionIdsJson: JSON.stringify(targetVersion.profileVersionIds),
        taxonomyVersion: MATH_TAXONOMY_VERSION,
        scopeJson: JSON.stringify({ type: "user", userId: input.userId }),
        sourceVersionJson: JSON.stringify({ attemptId: input.attemptId }),
        targetVersionJson: JSON.stringify(targetVersion),
        status: "queued",
        totalItems: 1,
      },
    });
    await tx.readinessRecomputeJobItem.create({
      data: {
        jobId: created.id,
        itemKey: `user:${input.userId}`,
        payloadJson: JSON.stringify({ userId: input.userId }),
      },
    });
    return created;
  });
  return { jobId: job.id, created: true };
}

/**
 * Recompute only users whose submitted attempts contain one of the newly
 * assessed canonical questions (directly or through a generated clone).
 */
export async function enqueueAssessmentRecompute(input: {
  assessmentRunId: string;
  questionIds: string[];
  requestedByUserId: string;
}): Promise<{ jobId: string; created: boolean; totalItems: number } | null> {
  const questionIds = [...new Set(input.questionIds)].sort();
  if (questionIds.length === 0) return null;
  const affectedAttempts = await prisma.attempt.findMany({
    where: {
      submitted: true,
      exam: {
        questions: {
          some: {
            OR: [
              { id: { in: questionIds } },
              { sourceQuestionId: { in: questionIds } },
            ],
          },
        },
      },
    },
    select: { userId: true },
    distinct: ["userId"],
    orderBy: { userId: "asc" },
  });
  const userIds = affectedAttempts.map((row) => row.userId);
  if (userIds.length === 0) return null;

  const policy = await prisma.readinessPolicyVersion.findFirst({
    where: { subject: "math", status: { in: ["active", "shadow"] } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  if (!policy) return null;
  const profileVersionIds = policy.status === "active"
    ? Object.values((await resolveGlobalAssignments()).profileVersionIds).sort()
    : (await prisma.schoolProfileVersion.findMany({
        where: { subject: "math", status: "shadow" },
        select: { id: true },
        orderBy: { id: "asc" },
      })).map((profile) => profile.id);
  if (profileVersionIds.length === 0) return null;
  const assessmentRuns = await prisma.assessmentRun.findMany({
    where: { subject: "math", status: "approved" },
    select: { id: true, inputHash: true },
    orderBy: { id: "asc" },
  });
  const targetVersion = { policyVersionId: policy.id, profileVersionIds, assessmentRuns };
  const idempotencyKey = stableHash({
    jobType: "mastery-readiness",
    reason: "assessment-run-approved",
    assessmentRunId: input.assessmentRunId,
    affectedUserIds: userIds,
    targetVersion,
  });
  const existing = await prisma.readinessRecomputeJob.findUnique({ where: { idempotencyKey } });
  if (existing) return { jobId: existing.id, created: false, totalItems: existing.totalItems };
  const created = await prisma.$transaction(async (tx) => {
    const job = await tx.readinessRecomputeJob.create({
      data: {
        idempotencyKey,
        subject: "math",
        jobType: "mastery-readiness",
        reason: "assessment-run-approved",
        mode: policy.status === "active" ? "active-backfill" : "shadow",
        policyVersionId: policy.id,
        profileVersionIdsJson: JSON.stringify(profileVersionIds),
        taxonomyVersion: MATH_TAXONOMY_VERSION,
        scopeJson: JSON.stringify({ type: "users-affected-by-assessment", userCount: userIds.length }),
        sourceVersionJson: JSON.stringify({
          assessmentRunId: input.assessmentRunId,
          assessedQuestionCount: questionIds.length,
          assessedQuestionIdsHash: stableHash(questionIds),
        }),
        targetVersionJson: JSON.stringify(targetVersion),
        status: "queued",
        requestedByUserId: input.requestedByUserId,
        approvedByUserId: input.requestedByUserId,
        totalItems: userIds.length,
      },
    });
    for (let index = 0; index < userIds.length; index += 100) {
      await tx.readinessRecomputeJobItem.createMany({
        data: userIds.slice(index, index + 100).map((userId) => ({
          jobId: job.id,
          itemKey: `user:${userId}`,
          payloadJson: JSON.stringify({ userId }),
        })),
      });
    }
    return job;
  });
  return { jobId: created.id, created: true, totalItems: created.totalItems };
}

async function claimNextItem(workerId: string): Promise<{
  id: string;
  jobId: string;
  payloadJson: string;
  attemptCount: number;
} | null> {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const eligibleJobs = await tx.readinessRecomputeJob.findMany({
      where: { status: { in: ["queued", "running"] }, jobType: { in: ["mastery-readiness", "school-profile-build"] } },
      select: { id: true },
    });
    if (!eligibleJobs.length) return null;
    const candidate = await tx.readinessRecomputeJobItem.findFirst({
      where: {
        jobId: { in: eligibleJobs.map((job) => job.id) },
        OR: [
          { status: "queued" },
          { status: "running", leaseExpiresAt: { lt: now } },
        ],
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, jobId: true, payloadJson: true, attemptCount: true },
    });
    if (!candidate) return null;
    const job = await tx.readinessRecomputeJob.findUnique({ where: { id: candidate.jobId } });
    if (!job || (job.status !== "queued" && job.status !== "running")) return null;
    const updated = await tx.readinessRecomputeJobItem.updateMany({
      where: {
        id: candidate.id,
        OR: [{ status: "queued" }, { status: "running", leaseExpiresAt: { lt: now } }],
      },
      data: {
        status: "running",
        leaseOwner: workerId,
        leaseExpiresAt: new Date(now.getTime() + LEASE_MS),
        startedAt: now,
        attemptCount: { increment: 1 },
      },
    });
    if (updated.count !== 1) return null;
    if (job.status === "queued") {
      await tx.readinessRecomputeJob.update({
        where: { id: job.id },
        data: { status: "running", startedAt: job.startedAt ?? now },
      });
    }
    return { ...candidate, attemptCount: candidate.attemptCount + 1 };
  });
}

async function completeItem(jobId: string, itemId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.readinessRecomputeJobItem.update({
      where: { id: itemId },
      data: { status: "completed", leaseOwner: null, leaseExpiresAt: null, error: null, completedAt: new Date() },
    });
    const job = await tx.readinessRecomputeJob.update({
      where: { id: jobId },
      data: { processedItems: { increment: 1 }, successItems: { increment: 1 } },
    });
    if (job.status !== "cancelled" && job.processedItems >= job.totalItems) {
      await tx.readinessRecomputeJob.update({ where: { id: jobId }, data: { status: "completed", completedAt: new Date() } });
    }
  });
}

async function failItem(jobId: string, itemId: string, attemptCount: number, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  await prisma.$transaction(async (tx) => {
    if (attemptCount < MAX_ATTEMPTS) {
      await tx.readinessRecomputeJobItem.update({
        where: { id: itemId },
        data: { status: "queued", leaseOwner: null, leaseExpiresAt: null, error: message },
      });
      return;
    }
    await tx.readinessRecomputeJobItem.update({
      where: { id: itemId },
      data: { status: "failed", leaseOwner: null, leaseExpiresAt: null, error: message, completedAt: new Date() },
    });
    const job = await tx.readinessRecomputeJob.update({
      where: { id: jobId },
      data: {
        processedItems: { increment: 1 },
        failedItems: { increment: 1 },
        errorSummaryJson: JSON.stringify({ latest: message }),
      },
    });
    if (job.status === "cancelled") return;
    const failureRate = job.processedItems > 0 ? job.failedItems / job.processedItems : 0;
    if (failureRate > 0.05) {
      await tx.readinessRecomputeJob.update({ where: { id: jobId }, data: { status: "paused" } });
    } else if (job.processedItems >= job.totalItems) {
      await tx.readinessRecomputeJob.update({
        where: { id: jobId },
        data: { status: "failed", completedAt: new Date() },
      });
    }
  });
}

export async function runOneRecomputeItem(workerId = `worker:${randomUUID()}`): Promise<boolean> {
  const item = await claimNextItem(workerId);
  if (!item) return false;
  try {
    const payload = JSON.parse(item.payloadJson) as { userId: string };
    const job = await prisma.readinessRecomputeJob.findUniqueOrThrow({ where: { id: item.jobId } });
    if (job.jobType === "school-profile-build") {
      const profilePayload = payload as unknown as { school: string; assessmentRunId: string };
      const profiles = await buildApprovedSchoolProfiles(profilePayload.assessmentRunId);
      const profile = profiles.find((candidate) => candidate.school === profilePayload.school);
      if (!profile) throw new Error(`No profile produced for school ${profilePayload.school}`);
      await persistShadowSchoolProfile(profilePayload.assessmentRunId, profile, job.requestedByUserId ?? undefined);
    } else {
      if (!job.policyVersionId) throw new Error(`Job ${job.id} has no policyVersionId`);
      await computeAndPersistUserShadowV4({
        userId: payload.userId,
        policyVersionId: job.policyVersionId,
        profileVersionIds: JSON.parse(job.profileVersionIdsJson) as string[],
        recomputeJobId: job.id,
      });
    }
    await completeItem(job.id, item.id);
  } catch (error) {
    await failItem(item.jobId, item.id, item.attemptCount, error);
  }
  return true;
}

export async function runRecomputeUntilIdle(workerId = `worker:${randomUUID()}`): Promise<number> {
  let processed = 0;
  while (await runOneRecomputeItem(workerId)) processed += 1;
  return processed;
}

export async function pauseRecomputeJob(jobId: string): Promise<void> {
  const job = await prisma.readinessRecomputeJob.findUniqueOrThrow({ where: { id: jobId } });
  if (job.status !== "queued" && job.status !== "running") throw new Error(`Cannot pause job in ${job.status}`);
  await prisma.readinessRecomputeJob.update({ where: { id: jobId }, data: { status: "paused" } });
}

export async function resumeRecomputeJob(jobId: string): Promise<void> {
  const job = await prisma.readinessRecomputeJob.findUniqueOrThrow({ where: { id: jobId } });
  if (job.status !== "paused") throw new Error(`Cannot resume job in ${job.status}`);
  await prisma.readinessRecomputeJob.update({ where: { id: jobId }, data: { status: "running" } });
}

export async function cancelRecomputeJob(jobId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const job = await tx.readinessRecomputeJob.findUniqueOrThrow({ where: { id: jobId } });
    if (["completed", "cancelled"].includes(job.status)) return;
    const cancelled = await tx.readinessRecomputeJobItem.updateMany({
      where: { jobId, status: "queued" },
      data: { status: "cancelled", completedAt: new Date() },
    });
    await tx.readinessRecomputeJob.update({
      where: { id: jobId },
      data: {
        status: "cancelled",
        processedItems: { increment: cancelled.count },
        completedAt: new Date(),
      },
    });
  });
}

export async function retryFailedRecomputeItem(jobId: string, itemId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const item = await tx.readinessRecomputeJobItem.findFirst({ where: { id: itemId, jobId, status: "failed" } });
    if (!item) return false;
    const job = await tx.readinessRecomputeJob.findUniqueOrThrow({ where: { id: jobId } });
    if (!["paused", "failed", "completed"].includes(job.status)) {
      throw new Error(`Cannot retry failed item for job in ${job.status}`);
    }
    await tx.readinessRecomputeJobItem.update({
      where: { id: item.id },
      data: { status: "queued", attemptCount: 0, error: null, completedAt: null },
    });
    await tx.readinessRecomputeJob.update({
      where: { id: jobId },
      data: { status: "running", processedItems: { decrement: 1 }, failedItems: { decrement: 1 }, completedAt: null },
    });
    return true;
  });
}

export async function retryFailedRecomputeItems(jobId: string): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const job = await tx.readinessRecomputeJob.findUniqueOrThrow({ where: { id: jobId } });
    if (!["paused", "failed", "completed"].includes(job.status)) {
      throw new Error(`Cannot retry failed items for job in ${job.status}`);
    }
    const failed = await tx.readinessRecomputeJobItem.count({ where: { jobId, status: "failed" } });
    if (!failed) return 0;
    await tx.readinessRecomputeJobItem.updateMany({
      where: { jobId, status: "failed" },
      data: { status: "queued", attemptCount: 0, error: null, completedAt: null },
    });
    await tx.readinessRecomputeJob.update({
      where: { id: jobId },
      data: {
        status: "running",
        processedItems: { decrement: failed },
        failedItems: { decrement: failed },
        completedAt: null,
      },
    });
    return failed;
  });
}
