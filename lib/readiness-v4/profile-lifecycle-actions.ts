import { prisma } from "@/lib/prisma";
import { activateGlobalProfile, resolveGlobalAssignments } from "./assignment-service";
import { stableHash } from "./hashing";

const MIN_REASON_LENGTH = 10;

function requireReason(reason: string, label: string): string {
  const normalized = reason.trim();
  if (normalized.length < MIN_REASON_LENGTH) throw new Error(`${label} must contain at least ${MIN_REASON_LENGTH} characters`);
  return normalized;
}

async function getShadowProfile(profileVersionId: string) {
  const profile = await prisma.schoolProfileVersion.findFirst({ where: { id: profileVersionId, subject: "math" } });
  if (!profile) throw new Error("School Profile version not found");
  if (profile.status !== "shadow") throw new Error(`Only shadow profile can be reviewed or activated; got ${profile.status}`);
  return profile;
}

async function getCreateActor(profileVersionId: string): Promise<string | null> {
  const audit = await prisma.readinessPolicyAuditLog.findFirst({
    where: { profileVersionId, action: "create-profile" },
    orderBy: { createdAt: "asc" },
    select: { actorUserId: true },
  });
  return audit?.actorUserId ?? null;
}

async function getLatestApproval(profileVersionId: string) {
  return prisma.readinessPolicyAuditLog.findFirst({
    where: { profileVersionId, action: "approve-profile", toState: "approved" },
    orderBy: { createdAt: "desc" },
    select: { actorUserId: true },
  });
}

export async function reviewSchoolProfile(input: { profileVersionId: string; reviewerUserId: string; reason: string }): Promise<void> {
  const reason = requireReason(input.reason, "Review reason");
  const profile = await getShadowProfile(input.profileVersionId);
  const creator = await getCreateActor(profile.id);
  if (creator && creator === input.reviewerUserId) throw new Error("Four-eyes rule: reviewer must differ from profile builder");
  const existing = await prisma.readinessPolicyAuditLog.findFirst({ where: { profileVersionId: profile.id, action: "review-profile", toState: "reviewed" } });
  if (existing) return;
  await prisma.readinessPolicyAuditLog.create({
    data: {
      profileVersionId: profile.id,
      action: "review-profile",
      actorUserId: input.reviewerUserId,
      fromState: "shadow",
      toState: "reviewed",
      diffJson: JSON.stringify({ school: profile.school, sourceHash: profile.sourceHash }),
      reason,
    },
  });
}

export async function approveSchoolProfile(input: { profileVersionId: string; approverUserId: string; reason: string }): Promise<void> {
  const reason = requireReason(input.reason, "Approval reason");
  const profile = await getShadowProfile(input.profileVersionId);
  const review = await prisma.readinessPolicyAuditLog.findFirst({
    where: { profileVersionId: profile.id, action: "review-profile", toState: "reviewed" },
    orderBy: { createdAt: "desc" },
    select: { actorUserId: true },
  });
  if (!review) throw new Error("Profile requires a review before approval");
  if (review.actorUserId === input.approverUserId) throw new Error("Four-eyes rule: approver must differ from reviewer");
  await prisma.readinessPolicyAuditLog.create({
    data: {
      profileVersionId: profile.id,
      action: "approve-profile",
      actorUserId: input.approverUserId,
      fromState: "reviewed",
      toState: "approved",
      diffJson: JSON.stringify({ school: profile.school, sourceHash: profile.sourceHash }),
      reason,
    },
  });
}

export async function activateApprovedSchoolProfile(input: { profileVersionId: string; activatorUserId: string; approverUserId: string; reason: string }): Promise<{ assignmentId: string; recomputeJobId: string }> {
  const reason = requireReason(input.reason, "Activation reason");
  const profile = await getShadowProfile(input.profileVersionId);
  if (input.activatorUserId === input.approverUserId) throw new Error("Four-eyes rule: approver and activator must differ");
  const approval = await getLatestApproval(profile.id);
  if (!approval) throw new Error("Profile requires approval before activation");
  if (approval.actorUserId !== input.approverUserId) throw new Error("Activation approver must match the recorded profile approval");
  const activation = await activateGlobalProfile({
    profileVersionId: profile.id,
    approverUserId: input.approverUserId,
    activatorUserId: input.activatorUserId,
    reason,
  });
  const recomputeJobId = await enqueueActiveProfileRecompute({ requestedByUserId: input.activatorUserId, reason: `profile-activation:${profile.school}` });
  return { ...activation, recomputeJobId };
}

export async function retireShadowSchoolProfile(input: { profileVersionId: string; actorUserId: string; reason: string }): Promise<void> {
  const reason = requireReason(input.reason, "Retire reason");
  const profile = await getShadowProfile(input.profileVersionId);
  await prisma.$transaction(async (tx) => {
    await tx.schoolProfileVersion.update({ where: { id: profile.id }, data: { status: "retired", retiredAt: new Date() } });
    await tx.readinessPolicyAuditLog.create({
      data: {
        profileVersionId: profile.id,
        action: "retire-profile",
        actorUserId: input.actorUserId,
        fromState: "shadow",
        toState: "retired",
        diffJson: JSON.stringify({ school: profile.school, sourceHash: profile.sourceHash }),
        reason,
      },
    });
  });
}

export async function enqueueActiveProfileRecompute(input: { requestedByUserId: string; reason: string }): Promise<string> {
  const assignments = await resolveGlobalAssignments();
  if (!assignments.policyVersionId) throw new Error("An active policy is required before profile activation recompute");
  const profileVersionIds = Object.values(assignments.profileVersionIds).sort();
  if (!profileVersionIds.length) throw new Error("At least one active profile is required before recompute");
  const users = await prisma.user.findMany({ select: { id: true }, orderBy: { id: "asc" } });
  const targetVersion = { policyVersionId: assignments.policyVersionId, profileVersionIds, methodologyVersion: "readiness-v4" };
  const idempotencyKey = stableHash({ jobType: "mastery-readiness", mode: "active-backfill", targetVersion, userIds: users.map((user) => user.id) });
  const existing = await prisma.readinessRecomputeJob.findUnique({ where: { idempotencyKey }, select: { id: true } });
  if (existing) return existing.id;
  const job = await prisma.$transaction(async (tx) => {
    const created = await tx.readinessRecomputeJob.create({
      data: {
        idempotencyKey,
        subject: "math",
        jobType: "mastery-readiness",
        reason: input.reason,
        mode: "active-backfill",
        policyVersionId: assignments.policyVersionId,
        profileVersionIdsJson: JSON.stringify(profileVersionIds),
        taxonomyVersion: "math-topic-taxonomy-v1",
        scopeJson: JSON.stringify({ type: "all-users", trigger: "profile-activation" }),
        sourceVersionJson: "{}",
        targetVersionJson: JSON.stringify(targetVersion),
        status: "queued",
        requestedByUserId: input.requestedByUserId,
        totalItems: users.length,
      },
    });
    for (let index = 0; index < users.length; index += 100) {
      await tx.readinessRecomputeJobItem.createMany({ data: users.slice(index, index + 100).map((user) => ({ jobId: created.id, itemKey: `user:${user.id}`, payloadJson: JSON.stringify({ userId: user.id }) })) });
    }
    return created;
  });
  return job.id;
}
