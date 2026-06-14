import { ensureSchoolProfilesFresh, getAllSchoolProfiles } from "../lib/school-profiles";

async function main(): Promise<void> {
  console.log("Ensuring school profiles are fresh...");
  const result = await ensureSchoolProfilesFresh();
  console.log(`  Created: ${result.created.join(", ") || "(none)"}`);
  console.log(`  Rebuilt: ${result.rebuilt.join(", ") || "(none)"}`);
  console.log(`  Unchanged: ${result.unchanged.join(", ") || "(none)"}`);

  console.log("\nProfiles:");
  const profiles = await getAllSchoolProfiles();
  for (const [school, p] of Object.entries(profiles)) {
    console.log(`\n=== ${school.toUpperCase()} ===`);
    console.log(`  totalQuestions: ${p.totalQuestions}`);
    console.log(`  difficulty: ${p.difficulty.toFixed(1)}`);
    console.log(`  minutes: ${p.minutes.toFixed(1)}`);
    console.log(`  freeText%: ${p.freeTextPct.toFixed(1)}`);
    console.log(`  olympicGeo%: ${p.olympicGeoPct.toFixed(1)}`);
    console.log(`  diversity: ${p.diversity}`);
    console.log("  topicWeights:");
    for (const [t, w] of Object.entries(p.topicWeights).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${t.padEnd(8)} ${(w * 100).toFixed(1)}%`);
    }
    console.log("  levelWeights:");
    for (const [l, w] of Object.entries(p.levelWeights)) {
      console.log(`    ${l.padEnd(6)} ${(w * 100).toFixed(1)}%`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
