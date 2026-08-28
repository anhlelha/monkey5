import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { copyFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

const isolatedDir = mkdtempSync(join(tmpdir(), "monkey5-readiness-integration-"));
const isolatedDatabase = join(isolatedDir, "dev.db");
copyFileSync(join(process.cwd(), "prisma", "dev.db"), isolatedDatabase);
process.env.READINESS_TEST_DATABASE_URL = `file:${isolatedDatabase}`;

let prisma: typeof import("../../lib/prisma").prisma;
let clonePolicyToDraft: typeof import("../../lib/readiness-v4/policy-repository").clonePolicyToDraft;
let movePolicyDraftToShadow: typeof import("../../lib/readiness-v4/policy-repository").movePolicyDraftToShadow;
let policyFromRow: typeof import("../../lib/readiness-v4/policy-repository").policyFromRow;
let enqueueSchoolProfileBuild: typeof import("../../lib/readiness-v4/job-service").enqueueSchoolProfileBuild;
let createShadowBackfillJob: typeof import("../../lib/readiness-v4/job-service").createShadowBackfillJob;
let resolveGlobalAssignments: typeof import("../../lib/readiness-v4/assignment-service").resolveGlobalAssignments;
let pauseRecomputeJob: typeof import("../../lib/readiness-v4/job-service").pauseRecomputeJob;
let resumeRecomputeJob: typeof import("../../lib/readiness-v4/job-service").resumeRecomputeJob;
let cancelRecomputeJob: typeof import("../../lib/readiness-v4/job-service").cancelRecomputeJob;
let getEffectiveReadinessV4: typeof import("../../lib/readiness-v4/read-service").getEffectiveReadinessV4;
let getReadinessV4Flags: typeof import("../../lib/readiness-v4/feature-flags").getReadinessV4Flags;
let setReadinessV4Flags: typeof import("../../lib/readiness-v4/feature-flags").setReadinessV4Flags;

before(async () => {
  ({ prisma } = await import("../../lib/prisma"));
  ({ clonePolicyToDraft, movePolicyDraftToShadow, policyFromRow } = await import("../../lib/readiness-v4/policy-repository"));
  ({ enqueueSchoolProfileBuild, createShadowBackfillJob, pauseRecomputeJob, resumeRecomputeJob, cancelRecomputeJob } = await import("../../lib/readiness-v4/job-service"));
  ({ resolveGlobalAssignments } = await import("../../lib/readiness-v4/assignment-service"));
  ({ getEffectiveReadinessV4 } = await import("../../lib/readiness-v4/read-service"));
  ({ getReadinessV4Flags, setReadinessV4Flags } = await import("../../lib/readiness-v4/feature-flags"));
});

const suffix = Date.now().toString(36);

function requireAdminIds(admins: Array<{ id: string }>): [string, string] {
  assert.ok(admins.length >= 2, "integration fixture requires two admin users for four-eyes validation");
  return [admins[0].id, admins[1].id];
}

test("policy draft -> shadow preserves typed values, audit and four-eyes", async () => {
  const admins = await prisma.user.findMany({ where: { role: "admin", disabled: false }, select: { id: true }, orderBy: { id: "asc" } });
  const [creator, reviewer] = requireAdminIds(admins);
  const source = await prisma.readinessPolicyVersion.findFirstOrThrow({ where: { subject: "math", status: "active" }, orderBy: { createdAt: "desc" } });
  const draft = await clonePolicyToDraft({
    sourcePolicyVersionId: source.id,
    version: `integration-${suffix}`,
    actorUserId: creator,
    changeSummary: "Integration policy lifecycle test",
  });
  assert.equal(draft.status, "draft");
  assert.deepEqual(policyFromRow(draft), policyFromRow(source));
  await movePolicyDraftToShadow({ policyVersionId: draft.id, reviewerUserId: reviewer, reason: "Integration review moves draft to shadow" });
  const shadow = await prisma.readinessPolicyVersion.findUniqueOrThrow({ where: { id: draft.id } });
  assert.equal(shadow.status, "shadow");
  assert.equal(shadow.reviewedByUserId, reviewer);
  const audit = await prisma.readinessPolicyAuditLog.findMany({ where: { policyVersionId: draft.id }, orderBy: { createdAt: "asc" } });
  assert.deepEqual(audit.map((row) => row.action), ["create", "shadow"]);
  const secondDraft = await clonePolicyToDraft({
    sourcePolicyVersionId: source.id,
    version: `integration-creator-review-${suffix}`,
    actorUserId: creator,
    changeSummary: "Integration creator review rejection test",
  });
  await assert.rejects(
    movePolicyDraftToShadow({ policyVersionId: secondDraft.id, reviewerUserId: creator, reason: "Creator cannot review this policy" }),
    /Four-eyes/,
  );
});

test("active global pointer resolution is unique per school and exact policy", async () => {
  const assignments = await resolveGlobalAssignments();
  assert.ok(assignments.policyVersionId);
  const activePolicies = await prisma.readinessPolicyAssignment.count({ where: { subject: "math", scopeType: "global", scopeKey: "global", status: "active", endedAt: null } });
  assert.equal(activePolicies, 1);
  const activeProfiles = await prisma.schoolProfileAssignment.findMany({ where: { subject: "math", scopeType: "global", scopeKey: "global", status: "active", endedAt: null }, select: { school: true, profileVersionId: true } });
  assert.equal(new Set(activeProfiles.map((row) => row.school)).size, activeProfiles.length);
  const profileRows = await prisma.schoolProfileVersion.findMany({ where: { id: { in: activeProfiles.map((row) => row.profileVersionId) } }, select: { id: true, status: true } });
  assert.equal(profileRows.length, activeProfiles.length);
  assert.ok(profileRows.every((row) => row.status === "active"));
});

test("school profile build enqueue is scoped and idempotent", async () => {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: "admin", disabled: false }, select: { id: true } });
  const run = await prisma.assessmentRun.findFirstOrThrow({ where: { subject: "math", status: "approved" }, orderBy: { createdAt: "desc" } });
  const school = await prisma.school.findFirstOrThrow({ where: { active: true }, orderBy: { position: "asc" }, select: { id: true } });
  const first = await enqueueSchoolProfileBuild({ assessmentRunId: run.id, schools: [school.id], requestedByUserId: admin.id });
  const second = await enqueueSchoolProfileBuild({ assessmentRunId: run.id, schools: [school.id], requestedByUserId: admin.id });
  assert.equal(first.jobId, second.jobId);
  assert.equal(second.created, false);
  const job = await prisma.readinessRecomputeJob.findUniqueOrThrow({ where: { id: first.jobId } });
  assert.equal(job.jobType, "school-profile-build");
  assert.equal(job.mode, "shadow");
  assert.equal(job.totalItems, 1);
  const item = await prisma.readinessRecomputeJobItem.findUniqueOrThrow({ where: { jobId_itemKey: { jobId: job.id, itemKey: `school:${school.id}` } } });
  assert.deepEqual(JSON.parse(item.payloadJson), { school: school.id, assessmentRunId: run.id });
});

test("read adapter resolves exact active profile pointer and never uses another version", async () => {
  const beforeFlags = await getReadinessV4Flags();
  const assignments = await resolveGlobalAssignments();
  const user = await prisma.user.findFirstOrThrow({ select: { id: true, readiness: true }, orderBy: { id: "asc" } });
  const school = Object.keys(assignments.profileVersionIds)[0];
  assert.ok(school && assignments.policyVersionId);
  const activeProfileId = assignments.profileVersionIds[school];
  const otherProfile = await prisma.schoolProfileVersion.findFirst({ where: { id: { not: activeProfileId }, subject: "math" }, select: { id: true } });
  const mastery = await prisma.masterySnapshot.findFirst({ where: { userId: user.id, subject: "math" }, select: { id: true } });
  assert.ok(otherProfile && mastery);
  await prisma.readinessSnapshot.create({
    data: {
      id: randomUUID(), userId: user.id, school, subject: "math", methodologyVersion: "readiness-v4",
      profileVersionId: otherProfile.id, masterySnapshotId: mastery.id, policyVersionId: assignments.policyVersionId,
      schoolMastery: 0.2, schoolEvidence: 0.2, readiness: 20, status: "preparing", gatesJson: "{}", criticalTopicsJson: "[]", reasonCodesJson: "[]",
    },
  });
  try {
    await setReadinessV4Flags({ computeEnabled: true, shadowEnabled: true, readEnabled: true });
    const view = (await getEffectiveReadinessV4(user.id, [school], JSON.parse(user.readiness) as Record<string, number>))[school];
    assert.notEqual(view.profileVersion, otherProfile.id);
    assert.equal(view.profileVersion, activeProfileId);
  } finally {
    await setReadinessV4Flags(beforeFlags);
  }
});

test("job pause/resume/cancel preserve created snapshots and cancel only queued items", async () => {
  const jobId = randomUUID();
  await prisma.readinessRecomputeJob.create({
    data: {
      id: jobId, idempotencyKey: `integration-job-${suffix}`, subject: "math", jobType: "mastery-readiness", reason: "integration",
      mode: "shadow", policyVersionId: (await resolveGlobalAssignments()).policyVersionId, profileVersionIdsJson: "[]", taxonomyVersion: "math-topic-taxonomy-v1",
      scopeJson: "{}", sourceVersionJson: "{}", targetVersionJson: "{}", status: "queued", totalItems: 1,
    },
  });
  await prisma.readinessRecomputeJobItem.create({ data: { id: randomUUID(), jobId, itemKey: `integration:${suffix}`, payloadJson: "{}" } });
  await pauseRecomputeJob(jobId);
  assert.equal((await prisma.readinessRecomputeJob.findUniqueOrThrow({ where: { id: jobId } })).status, "paused");
  await resumeRecomputeJob(jobId);
  assert.equal((await prisma.readinessRecomputeJob.findUniqueOrThrow({ where: { id: jobId } })).status, "running");
  await cancelRecomputeJob(jobId);
  const cancelled = await prisma.readinessRecomputeJob.findUniqueOrThrow({ where: { id: jobId } });
  const item = await prisma.readinessRecomputeJobItem.findFirstOrThrow({ where: { jobId } });
  assert.equal(cancelled.status, "cancelled");
  assert.equal(item.status, "cancelled");
  assert.equal(cancelled.processedItems, 1);
});

test("shadow backfill job is idempotent and does not mutate active pointers", async () => {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: "admin", disabled: false }, select: { id: true } });
  const policy = await prisma.readinessPolicyVersion.findFirstOrThrow({ where: { subject: "math", status: "shadow" }, orderBy: { createdAt: "desc" } });
  const before = await resolveGlobalAssignments();
  const first = await createShadowBackfillJob({ policyVersionId: policy.id, requestedByUserId: admin.id });
  const second = await createShadowBackfillJob({ policyVersionId: policy.id, requestedByUserId: admin.id });
  assert.equal(first.id, second.id);
  assert.equal(second.created, false);
  const after = await resolveGlobalAssignments();
  assert.deepEqual(after, before);
});

after(async () => {
  await prisma.$disconnect();
});
