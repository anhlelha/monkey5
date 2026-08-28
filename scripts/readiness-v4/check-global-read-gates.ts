import { prisma } from "@/lib/prisma";
import { getReadinessV4Flags } from "@/lib/readiness-v4/feature-flags";
import { resolveGlobalAssignments } from "@/lib/readiness-v4/assignment-service";

type Gate = { name: string; ok: boolean; detail: string };

async function main() {
  const [flags, assignments, users, latestShadowJob, activePolicy, activeProfiles] = await Promise.all([
    getReadinessV4Flags(),
    resolveGlobalAssignments(),
    prisma.user.count({ where: { disabled: false } }),
    prisma.readinessRecomputeJob.findFirst({ where: { subject: "math", mode: "shadow" }, orderBy: { createdAt: "desc" } }),
    prisma.readinessPolicyVersion.findFirst({ where: { subject: "math", status: "active" }, orderBy: { activatedAt: "desc" } }),
    prisma.schoolProfileVersion.findMany({ where: { subject: "math", status: "active" }, select: { id: true, school: true } }),
  ]);

  const profileIds = Object.values(assignments.profileVersionIds).filter(Boolean);
  const [activeAssignments, readinessSnapshots, latestActiveBackfill] = await Promise.all([
    prisma.schoolProfileAssignment.count({ where: { subject: "math", status: "active" } }),
    profileIds.length && assignments.policyVersionId
      ? prisma.readinessSnapshot.findMany({
          where: {
            subject: "math",
            policyVersionId: assignments.policyVersionId,
            profileVersionId: { in: profileIds },
          },
          select: { userId: true, readiness: true, schoolMastery: true, status: true, profileVersionId: true },
        })
      : Promise.resolve([]),
    prisma.readinessRecomputeJob.findFirst({ where: { subject: "math", mode: "active-backfill" }, orderBy: { createdAt: "desc" } }),
  ]);

  const snapshotKeys = new Set(readinessSnapshots.map((snapshot) => `${snapshot.userId}:${snapshot.profileVersionId}`));
  const violations = readinessSnapshots.filter((snapshot) =>
    !Number.isFinite(snapshot.readiness) ||
    !Number.isFinite(snapshot.schoolMastery) ||
    snapshot.readiness < 0 ||
    snapshot.readiness > 100 ||
    snapshot.readiness > snapshot.schoolMastery * 100 + 0.01,
  );
  const expectedPairs = users * profileIds.length;
  const gates: Gate[] = [
    { name: "readinessV4ComputeEnabled", ok: flags.computeEnabled, detail: String(flags.computeEnabled) },
    { name: "readinessV4ShadowEnabled", ok: flags.shadowEnabled, detail: String(flags.shadowEnabled) },
    { name: "readinessV4ReadEnabled", ok: flags.readEnabled, detail: String(flags.readEnabled) },
    { name: "active-policy-pointer", ok: Boolean(assignments.policyVersionId), detail: assignments.policyVersionId ?? "missing" },
    { name: "active-profile-pointers", ok: profileIds.length > 0 && activeAssignments === profileIds.length, detail: `${activeAssignments}/${profileIds.length}` },
    { name: "shadow-job", ok: Boolean(latestShadowJob && latestShadowJob.status === "completed" && latestShadowJob.failedItems === 0), detail: latestShadowJob ? `${latestShadowJob.status}, failed=${latestShadowJob.failedItems}, processed=${latestShadowJob.processedItems}/${latestShadowJob.totalItems}` : "missing" },
    { name: "active-policy-row", ok: Boolean(activePolicy && activePolicy.id === assignments.policyVersionId), detail: activePolicy?.id ?? "missing" },
    { name: "active-profile-row-count", ok: activeProfiles.length === profileIds.length, detail: `${activeProfiles.length}/${profileIds.length}` },
    { name: "active-backfill", ok: Boolean(latestActiveBackfill && latestActiveBackfill.status === "completed" && latestActiveBackfill.failedItems === 0), detail: latestActiveBackfill ? `${latestActiveBackfill.status}, failed=${latestActiveBackfill.failedItems}, processed=${latestActiveBackfill.processedItems}/${latestActiveBackfill.totalItems}` : "missing" },
    { name: "snapshot-coverage", ok: expectedPairs === 0 ? false : snapshotKeys.size >= expectedPairs, detail: `${snapshotKeys.size}/${expectedPairs} unique pairs; ${readinessSnapshots.length} versioned rows` },
    { name: "readiness-invariants", ok: violations.length === 0, detail: `${violations.length} violations / ${readinessSnapshots.length} snapshots` },
  ];

  console.log(JSON.stringify({
    subject: "math",
    users,
    profilePointers: profileIds.length,
    activePolicy: assignments.policyVersionId,
    flags,
    gates,
    go: gates.every((gate) => gate.ok),
  }, null, 2));

  await prisma.$disconnect();
  if (gates.some((gate) => !gate.ok)) process.exitCode = 2;
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
