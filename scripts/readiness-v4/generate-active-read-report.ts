import { prisma } from "@/lib/prisma";
import { getReadinessV4Flags } from "@/lib/readiness-v4/feature-flags";
import { resolveGlobalAssignments } from "@/lib/readiness-v4/assignment-service";

async function main() {
  const [flags, assignments, snapshots] = await Promise.all([
    getReadinessV4Flags(),
    resolveGlobalAssignments(),
    prisma.readinessSnapshot.findMany({
      where: { subject: "math" },
      orderBy: { computedAt: "desc" },
      select: {
        userId: true,
        school: true,
        policyVersionId: true,
        profileVersionId: true,
        readiness: true,
        schoolMastery: true,
        schoolEvidence: true,
        status: true,
        computedAt: true,
      },
    }),
  ]);

  const current = snapshots.filter((snapshot) =>
    snapshot.policyVersionId === assignments.policyVersionId &&
    assignments.profileVersionIds[snapshot.school] === snapshot.profileVersionId,
  );
  const latestByPair = new Map<string, (typeof current)[number]>();
  for (const snapshot of current) {
    const key = `${snapshot.userId}:${snapshot.school}`;
    if (!latestByPair.has(key)) latestByPair.set(key, snapshot);
  }

  const statusCounts: Record<string, number> = {};
  const schoolCounts: Record<string, { total: number; ready: number; evidenceLimited: number }> = {};
  let invariantViolations = 0;
  for (const snapshot of latestByPair.values()) {
    statusCounts[snapshot.status] = (statusCounts[snapshot.status] ?? 0) + 1;
    const school = schoolCounts[snapshot.school] ?? { total: 0, ready: 0, evidenceLimited: 0 };
    school.total += 1;
    if (snapshot.status === "ready" || snapshot.status === "strong_ready") school.ready += 1;
    if (snapshot.status === "evidence_limited") school.evidenceLimited += 1;
    schoolCounts[snapshot.school] = school;
    if (
      !Number.isFinite(snapshot.readiness) ||
      !Number.isFinite(snapshot.schoolMastery) ||
      snapshot.readiness < 0 ||
      snapshot.readiness > 100 ||
      snapshot.readiness > snapshot.schoolMastery * 100 + 0.01
    ) invariantViolations += 1;
  }

  console.log(JSON.stringify({
    subject: "math",
    generatedAt: new Date().toISOString(),
    flags,
    activePolicyVersionId: assignments.policyVersionId,
    activeProfileVersionIds: assignments.profileVersionIds,
    currentSnapshotPairs: latestByPair.size,
    versionedSnapshotRows: current.length,
    statusCounts,
    schoolCounts,
    invariantViolations,
    privacy: { includesUserIds: false, includesEmail: false, includesAnswers: false },
  }, null, 2));
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
