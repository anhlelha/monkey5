/**
 * Backfill: recompute topicMastery + readiness for every user.
 *
 * Run after deploying the readiness redesign or after re-seeding exams
 * if you want existing users to see fresh numbers immediately.
 *
 *   npx tsx scripts/recompute-mastery-readiness.ts
 */

import { PrismaClient } from "@prisma/client";
import { computeMastery } from "../lib/mastery";
import { ensureSchoolProfilesFresh, getAllSchoolProfiles } from "../lib/school-profiles";
import { computeAllReadiness } from "../lib/readiness";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("Step 1: Ensuring school profiles are fresh...");
  const fresh = await ensureSchoolProfilesFresh();
  console.log(`  Created: ${fresh.created.join(", ") || "(none)"}`);
  console.log(`  Rebuilt: ${fresh.rebuilt.join(", ") || "(none)"}`);
  console.log(`  Unchanged: ${fresh.unchanged.join(", ") || "(none)"}`);

  const profiles = await getAllSchoolProfiles();
  console.log(`  Loaded ${Object.keys(profiles).length} school profiles.`);

  console.log("\nStep 2: Recomputing readiness for every user...");
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  console.log(`  Found ${users.length} users.`);

  let processed = 0;
  const errors: Array<{ userId: string; email: string | null; error: string }> = [];
  for (const u of users) {
    try {
      const mastery = await computeMastery(u.id);
      const readiness = computeAllReadiness(mastery.topicMastery, mastery.levelMastery, profiles);
      await prisma.user.update({
        where: { id: u.id },
        data: {
          topicMastery: JSON.stringify(mastery.topicMastery),
          readiness: JSON.stringify(readiness),
        },
      });
      processed++;
      const readinessSummary = Object.entries(readiness)
        .map(([s, v]) => `${s}=${v}`)
        .join(", ");
      console.log(`  ✓ ${(u.email ?? u.id).padEnd(40)} → ${readinessSummary}`);
    } catch (err) {
      errors.push({ userId: u.id, email: u.email, error: String(err) });
      console.error(`  ✗ ${u.email ?? u.id}: ${err}`);
    }
  }

  console.log(`\n✓ Done. Processed ${processed}/${users.length} users.`);
  if (errors.length > 0) {
    console.log(`  ${errors.length} errors:`);
    for (const e of errors) console.log(`    ${e.email ?? e.userId}: ${e.error}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
