// Compare CURRENT vs PROPOSED mastery on real data (attempts only, de-duplicated).
// DATABASE_URL="file:/tmp/monkey5-prod/prod.db" npx tsx scripts/proposed-mastery.ts finos
import { prisma } from "../lib/prisma";
import { gradeAnswer } from "../lib/grading";

const LEVELS = ["L4", "L5", "NC"] as const;
type Lvl = (typeof LEVELS)[number];
// Map raw grade tags onto the 3 canonical difficulty bands.
const bandOf = (grade: string): Lvl => {
  if (grade === "NC") return "NC";
  if (grade === "L5") return "L5";
  return "L4"; // L4, L4+5(→treated as L4-leaning), default
};

// Bayesian (Beta) smoothing toward 0.5 with prior strength K pseudo-obs.
const K = 4;
const smooth = (correct: number, total: number) => (correct + K / 2) / (total + K);

// Canonical difficulty weights for "thuần thục" — must show across bands.
const W: Record<Lvl, number> = { L4: 0.3, L5: 0.45, NC: 0.25 };
const pct = (n: number) => (n * 100).toFixed(1) + "%";

async function main() {
  const needle = process.argv[2] ?? "finos";
  const user = await prisma.user.findFirst({
    where: { OR: [{ name: { contains: needle } }, { email: { contains: needle } }] },
  });
  if (!user) return console.log("no user");
  const topics = await prisma.topic.findMany();
  const tname = (id: string) => topics.find((t) => t.id === id)?.name ?? id;

  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id, submitted: true },
    include: { exam: { include: { questions: true } } },
  });

  // cell[topic][band] = {c,t} — attempts only, each question counted ONCE.
  const cell: Record<string, Record<Lvl, { c: number; t: number }>> = {};
  for (const a of attempts) {
    let ans: Record<string, unknown> = {};
    try { ans = JSON.parse(a.answers); } catch { continue; }
    for (const q of a.exam.questions) {
      const v = ans[q.id];
      if (v === undefined || v === null || v === "") continue;
      const band = bandOf(q.grade);
      cell[q.topic] ??= { L4: { c: 0, t: 0 }, L5: { c: 0, t: 0 }, NC: { c: 0, t: 0 } };
      cell[q.topic][band].t += 1;
      const r = gradeAnswer({ type: q.type as "fill" | "mcq" | "essay", correct: q.correct, answerSchema: q.answerSchema }, v as never);
      if (r.correct) cell[q.topic][band].c += 1;
    }
  }

  console.log(`User: ${user.name} <${user.email}>\n`);
  console.log("CHUYÊN ĐỀ            | L4 (c/t→m)      L5 (c/t→m)      NC (c/t→m)      | RAW%   ĐỀ XUẤT%");
  console.log("─".repeat(104));
  for (const topic of Object.keys(cell).sort()) {
    const cells = cell[topic];
    const totC = LEVELS.reduce((s, l) => s + cells[l].c, 0);
    const totT = LEVELS.reduce((s, l) => s + cells[l].t, 0);
    const raw = totT > 0 ? totC / totT : 0.5; // current style (no smoothing)
    // proposed: per-cell smoothed (unattempted band → prior 0.5), level-weighted
    const proposed = LEVELS.reduce((s, l) => s + W[l] * smooth(cells[l].c, cells[l].t), 0);
    const cellStr = (l: Lvl) => {
      const x = cells[l];
      return `${x.c}/${x.t}→${(smooth(x.c, x.t) * 100).toFixed(0)}%`.padEnd(15);
    };
    console.log(
      `${tname(topic).slice(0, 20).padEnd(20)} | ${cellStr("L4")} ${cellStr("L5")} ${cellStr("NC")} | ${pct(raw).padStart(6)} ${pct(proposed).padStart(7)}`,
    );
  }
  console.log(`\nGhi chú: smoothing K=${K} (prior 50%); trọng số band L4=${W.L4} L5=${W.L5} NC=${W.NC}; band chưa làm → prior 50%.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
