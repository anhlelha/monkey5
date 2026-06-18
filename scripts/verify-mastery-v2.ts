// Verify new computeMastery + readiness for mika + a hypothetical new user.
import { prisma } from "../lib/prisma";
import { computeMastery } from "../lib/mastery";
import { computeReadiness, ALPHA, BETA, DIFF_K } from "../lib/readiness";
import { getAllSchoolProfiles } from "../lib/school-profiles";

const pct = (n: number) => (n * 100).toFixed(1) + "%";

async function main() {
  const u = await prisma.user.findFirst({ where: { email: { contains: "mikayeubo" } } });
  if (!u) return console.log("no mika");
  const profiles = await getAllSchoolProfiles();
  const mean = Object.values(profiles).reduce((s, p) => s + p.difficulty, 0) / Object.values(profiles).length;
  const cg = profiles["cg"];
  const m = await computeMastery(u.id);

  console.log(`mean difficulty = ${mean.toFixed(2)}, CG difficulty = ${cg.difficulty.toFixed(2)}`);
  console.log("\nMastery v2 (mika):");
  for (const t of ["tg", "phan", "soh", "hinh"]) console.log(`  topic ${t.padEnd(6)} = ${pct(m.topicMastery[t] ?? 0.5)}`);
  for (const l of ["L4", "L5", "L4+5", "NC"] as const) console.log(`  level ${l.padEnd(5)} = ${pct(m.levelMastery[l])}`);

  // term breakdown for CG
  let topicTerm = 0;
  for (const t of Object.keys(cg.topicWeights)) topicTerm += cg.topicWeights[t] * ((m.topicMastery[t] ?? 0.5) - 0.5);
  let levelTerm = 0;
  for (const l of ["L4", "L5", "L4+5", "NC"]) levelTerm += (cg.levelWeights as Record<string, number>)[l] * (m.levelMastery[l as never] - 0.5);
  const diffPenalty = (cg.difficulty - mean) * DIFF_K;
  const raw = 50 + topicTerm * ALPHA + levelTerm * BETA - diffPenalty;

  console.log(`\nCG term breakdown (ALPHA=${ALPHA}, BETA=${BETA}, DIFF_K=${DIFF_K}):`);
  console.log(`  topicTerm=${topicTerm.toFixed(4)} ·ALPHA = ${(topicTerm * ALPHA).toFixed(2)}`);
  console.log(`  levelTerm=${levelTerm.toFixed(4)} ·BETA  = ${(levelTerm * BETA).toFixed(2)}`);
  console.log(`  diffPenalty = (${cg.difficulty.toFixed(2)}-${mean.toFixed(2)})·${DIFF_K} = ${diffPenalty.toFixed(2)}  (trừ → +${(-diffPenalty).toFixed(2)})`);
  console.log(`  raw = 50 + ${(topicTerm * ALPHA).toFixed(2)} + ${(levelTerm * BETA).toFixed(2)} - (${diffPenalty.toFixed(2)}) = ${raw.toFixed(2)}`);
  console.log(`  => READINESS CG (v2) = ${computeReadiness(m.topicMastery, m.levelMastery, cg, mean)}%`);

  // new user: all mastery 0.5
  const empty = {} as Record<string, number>;
  const emptyLvl = { L4: 0.5, L5: 0.5, "L4+5": 0.5, NC: 0.5 } as never;
  console.log(`\nNew user (chưa làm gì) READINESS CG = ${computeReadiness(empty, emptyLvl, cg, mean)}%`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
