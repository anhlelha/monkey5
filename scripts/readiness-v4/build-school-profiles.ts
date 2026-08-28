import { prisma } from "../../lib/prisma";
import { buildApprovedSchoolProfiles, persistShadowSchoolProfiles } from "../../lib/readiness-v4/profile-service";

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  const runId = option("--run") ?? "math-reassessment-fresh-gpt56sol-20260824T120947Z";
  const apply = process.argv.includes("--apply");
  const profiles = await buildApprovedSchoolProfiles(runId);
  const summary = profiles.map((profile) => ({
    school: profile.school,
    sourceHash: profile.sourceHash,
    exams: profile.reliability.examCount,
    questions: profile.reliability.questionCount,
    years: profile.reliability.yearCount,
    difficultyIndex: Math.round(profile.difficultyIndex * 10) / 10,
    countWeightTotal: Object.values(profile.blueprintCount).reduce((sum, value) => sum + value, 0),
    pointWeightTotal: Object.values(profile.blueprintPoint).reduce((sum, value) => sum + value, 0),
    flags: profile.reliability.flags,
  }));
  const persisted = apply
    ? await persistShadowSchoolProfiles(runId, profiles)
    : { created: [], unchanged: [] };
  console.log(JSON.stringify({ runId, apply, profileCount: profiles.length, persisted, profiles: summary }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
