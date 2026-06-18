// Proposed readiness for one user (default mika), CG focus.
// Run via the DB-swap wrapper so prisma/dev.db = prod snapshot.
import { prisma } from "../lib/prisma";
import { gradeAnswer } from "../lib/grading";
import { computeMastery } from "../lib/mastery";
import { computeReadiness } from "../lib/readiness";
import { getAllSchoolProfiles } from "../lib/school-profiles";

const K = 4;
const smooth = (c: number, t: number) => (c + K / 2) / (t + K);
const W3 = { L4: 0.3, L5: 0.45, NC: 0.25 } as const;
const band3 = (g: string): "L4" | "L5" | "NC" => (g === "NC" ? "NC" : g === "L5" ? "L5" : "L4");
const pct = (n: number) => (n * 100).toFixed(1) + "%";

async function main() {
  const needle = process.argv[2] ?? "mikayeubo";
  const user = await prisma.user.findFirst({
    where: { OR: [{ name: { contains: needle } }, { email: { contains: needle } }] },
  });
  if (!user) return console.log("no user");

  // De-duplicated attempt cells (each question once): topic×band3 and grade.
  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id, submitted: true },
    include: { exam: { include: { questions: true } } },
  });
  const cell: Record<string, Record<"L4" | "L5" | "NC", { c: number; t: number }>> = {};
  const lvl: Record<string, { c: number; t: number }> = {}; // by raw grade tag
  for (const a of attempts) {
    let ans: Record<string, unknown> = {};
    try { ans = JSON.parse(a.answers); } catch { continue; }
    for (const q of a.exam.questions) {
      const v = ans[q.id];
      if (v === undefined || v === null || v === "") continue;
      const r = gradeAnswer({ type: q.type as "fill" | "mcq" | "essay", correct: q.correct, answerSchema: q.answerSchema }, v as never);
      const b = band3(q.grade);
      cell[q.topic] ??= { L4: { c: 0, t: 0 }, L5: { c: 0, t: 0 }, NC: { c: 0, t: 0 } };
      cell[q.topic][b].t++; if (r.correct) cell[q.topic][b].c++;
      lvl[q.grade] ??= { c: 0, t: 0 };
      lvl[q.grade].t++; if (r.correct) lvl[q.grade].c++;
    }
  }

  // Proposed mastery maps.
  const propTopic: Record<string, number> = {};
  for (const t of Object.keys(cell)) {
    const cs = cell[t];
    propTopic[t] = (["L4", "L5", "NC"] as const).reduce((s, b) => s + W3[b] * smooth(cs[b].c, cs[b].t), 0);
  }
  const propLevel: Record<string, number> = { L4: 0.5, L5: 0.5, "L4+5": 0.5, NC: 0.5 };
  for (const g of ["L4", "L5", "L4+5", "NC"]) {
    const x = lvl[g]; if (x) propLevel[g] = smooth(x.c, x.t);
  }

  const profiles = await getAllSchoolProfiles();
  const mean = Object.values(profiles).reduce((s, p) => s + p.difficulty, 0) / Object.values(profiles).length;
  const cg = profiles["cg"];

  // Current mastery → current readiness (apples-to-apples through same fn).
  const cur = await computeMastery(user.id);

  const curR = computeReadiness(cur.topicMastery, cur.levelMastery as never, cg, mean);
  const propR = computeReadiness(propTopic, propLevel as never, cg, mean);

  console.log(`User: ${user.name} <${user.email}>  · target=cg · CG difficulty=${cg.difficulty.toFixed(1)} (mean=${mean.toFixed(1)})\n`);
  console.log("Topic mastery feeding CG (weight>0):");
  for (const t of Object.keys(cg.topicWeights).filter((t) => cg.topicWeights[t] > 0).sort((a, b) => cg.topicWeights[b] - cg.topicWeights[a])) {
    console.log(`  ${t.padEnd(8)} w=${cg.topicWeights[t].toFixed(3)}  current=${pct(cur.topicMastery[t] ?? 0.5).padStart(7)}  proposed=${pct(propTopic[t] ?? 0.5).padStart(7)}`);
  }
  console.log("\nLevel mastery:");
  for (const l of ["L4", "L5", "L4+5", "NC"]) {
    console.log(`  ${l.padEnd(5)} w=${(cg.levelWeights as Record<string, number>)[l]?.toFixed(3) ?? "?"}  current=${pct((cur.levelMastery as Record<string, number>)[l]).padStart(7)}  proposed=${pct(propLevel[l]).padStart(7)}`);
  }
  console.log(`\n===> READINESS CG:   hiện nay = ${curR}%   |   đề xuất = ${propR}%`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
