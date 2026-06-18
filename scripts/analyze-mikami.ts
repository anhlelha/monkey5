// One-off diagnostic: trace mastery + readiness for the "mikami" account.
// Run against a COPY of prod: DATABASE_URL="file:/tmp/monkey5-prod/prod.db" npx tsx scripts/analyze-mikami.ts
import { prisma } from "../lib/prisma";
import { computeMastery, MIN_SAMPLE, BASELINE_MASTERY } from "../lib/mastery";
import { computeAllReadiness } from "../lib/readiness";
import { getAllSchoolProfiles } from "../lib/school-profiles";

const pct = (n: number) => (n * 100).toFixed(1) + "%";

async function main() {
  const needle = process.argv[2] ?? "finos";
  const user = await prisma.user.findFirst({
    where: { OR: [{ name: { contains: needle } }, { email: { contains: needle } }] },
  });
  if (!user) {
    console.log("Không tìm thấy tài khoản mikami.");
    return;
  }
  console.log(`User: ${user.name} <${user.email}> id=${user.id}`);
  console.log(`Targets: ${user.targets}`);

  const topics = await prisma.topic.findMany({ orderBy: { position: "asc" } });
  const topicName = (id: string) => topics.find((t) => t.id === id)?.name ?? id;

  // ── Raw inputs ──
  const sessions = await prisma.topicSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  console.log(`\n── TopicSession (${sessions.length}) ──`);
  for (const s of sessions) {
    console.log(
      `  ${s.createdAt.toISOString().slice(0, 16)} · ${topicName(s.topic)} (${s.topic}) · ${s.level} · ${s.score}/${s.qcount} · set=${s.setId}`,
    );
  }

  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id, submitted: true },
    include: { exam: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`\n── Attempt (${attempts.length}) ──`);
  for (const a of attempts) {
    console.log(
      `  ${a.createdAt.toISOString().slice(0, 16)} · ${a.exam.title ?? a.examId} · earned=${a.earned}/${a.total} (${a.score}%)`,
    );
  }

  // ── Mastery (current formula) ──
  const m = await computeMastery(user.id);
  console.log(`\n── Mastery hiện tại (MIN_SAMPLE=${MIN_SAMPLE}, BASELINE=${BASELINE_MASTERY}) ──`);
  console.log("  Theo CHUYÊN ĐỀ (topic):");
  for (const t of Object.keys(m.topicMastery).sort()) {
    const n = m.topicSampleSize[t];
    const flag = n < MIN_SAMPLE ? " [baseline: n<5]" : "";
    console.log(`    ${topicName(t).padEnd(22)} ${pct(m.topicMastery[t]).padStart(7)}  (n=${n})${flag}`);
  }
  console.log("  Theo MỨC ĐỘ (level):");
  for (const l of ["L4", "L5", "L4+5", "NC"] as const) {
    const n = m.levelSampleSize[l];
    const flag = n < MIN_SAMPLE ? " [baseline: n<5]" : "";
    console.log(`    ${l.padEnd(6)} ${pct(m.levelMastery[l]).padStart(7)}  (n=${n})${flag}`);
  }

  // ── Readiness (current formula) ──
  const profiles = await getAllSchoolProfiles();
  const readiness = computeAllReadiness(m.topicMastery, m.levelMastery, profiles);
  console.log(`\n── Readiness hiện tại ──`);
  for (const s of Object.keys(readiness).sort()) {
    console.log(`    ${s.padEnd(10)} ${String(readiness[s]).padStart(3)}%`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
