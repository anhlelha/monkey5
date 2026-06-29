// One-off recovery for attempts orphaned by the old seed-remedial-mika.ts bug
// (questions deleted + recreated with fresh CUIDs, so Attempt.answers keys no
// longer match any Question.id → regrade scored them 0). See CLAUDE.md grading
// pitfalls and memory feedback_attempt_answers_keyed_by_qid.
//
// Strategy: the answer keys are the OLD question CUIDs, whose trailing base36
// counter encodes creation order = `num`. We map each old key to the current
// question by reconstructing its 1-based position (gaps = skipped questions),
// rewrite Attempt.answers keyed by the CURRENT Question.id, then recompute the
// score via recomputeAttemptScore (the single grading source of truth).
//
// Only touches attempts that are FULLY orphaned (zero keys match current ids),
// so it is a no-op on healthy attempts and safe to re-run (idempotent: once
// re-keyed, the attempt is no longer orphaned and is skipped).
//
// Usage:
//   npx tsx scripts/recover-orphaned-attempts.ts            # dry-run (no writes)
//   npx tsx scripts/recover-orphaned-attempts.ts --apply    # apply

import { prisma } from "../lib/prisma";
import { recomputeAttemptScore } from "../lib/grading/essay-attempt";

const APPLY = process.argv.slice(2).includes("--apply");

function parseAnswers(raw: string | null): Record<string, unknown> {
  try {
    const v = JSON.parse(raw ?? "{}");
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

// Monotonic counter of a cuid v1 id. Format: c + timestamp(8) + counter(4) +
// fingerprint(4) + random(8) = 25 chars, so the counter is base36 chars [9,13).
// Returns NaN if the id isn't a recognizable cuid v1.
function cuidOrdinal(id: string): number {
  if (id.length !== 25 || id[0] !== "c") return NaN;
  const n = parseInt(id.slice(9, 13), 36);
  return Number.isFinite(n) ? n : NaN;
}

async function main() {
  console.log(`=== Recover orphaned attempts ===`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

  const attempts = await prisma.attempt.findMany({
    where: { submitted: true },
    select: { id: true, examId: true, userId: true, answers: true, earned: true, total: true, score: true },
  });

  let recovered = 0;
  let skipped = 0;

  for (const a of attempts) {
    const answers = parseAnswers(a.answers);
    const keys = Object.keys(answers);
    if (keys.length === 0) continue;

    const questions = await prisma.question.findMany({
      where: { examId: a.examId },
      select: { id: true, num: true },
      orderBy: { num: "asc" },
    });
    const currentIds = new Set(questions.map((q) => q.id));
    const matched = keys.filter((k) => currentIds.has(k)).length;
    if (matched > 0) continue; // healthy (or partially-keyed) — leave alone

    // Fully orphaned. Reconstruct num from the old CUID counter.
    const ords = keys.map((k) => ({ k, ord: cuidOrdinal(k) }));
    if (ords.some((o) => Number.isNaN(o.ord))) {
      console.log(`SKIP ${a.id} (${a.examId}) — unparseable answer keys`);
      skipped++;
      continue;
    }
    ords.sort((x, y) => x.ord - y.ord);
    const minOrd = ords[0].ord;
    // Step = smallest positive gap between consecutive ordinals (CUID counter
    // increments by a fixed amount per row within one create batch).
    let step = Infinity;
    for (let i = 1; i < ords.length; i++) {
      const d = ords[i].ord - ords[i - 1].ord;
      if (d > 0) step = Math.min(step, d);
    }
    if (!Number.isFinite(step) || step <= 0) step = 1;

    const numById = new Map(questions.map((q) => [q.num, q.id]));
    const newAnswers: Record<string, unknown> = {};
    const mapping: string[] = [];
    let bad = false;
    for (const { k, ord } of ords) {
      const posOffset = (ord - minOrd) / step;
      const num = Math.round(posOffset) + 1;
      if (Math.abs(posOffset - Math.round(posOffset)) > 1e-9) {
        console.log(`SKIP ${a.id} — non-integer position for key ${k} (ord ${ord})`);
        bad = true;
        break;
      }
      const targetId = numById.get(num);
      if (!targetId) {
        console.log(`SKIP ${a.id} — no current question at num ${num} for key ${k}`);
        bad = true;
        break;
      }
      newAnswers[targetId] = answers[k];
      mapping.push(`  num ${String(num).padStart(2)} ← ${k}  =  ${JSON.stringify(answers[k])}`);
    }
    if (bad) {
      skipped++;
      continue;
    }

    console.log(`RECOVER ${a.id}  exam=${a.examId}`);
    console.log(`  current score: ${a.earned}/${a.total} (${a.score}%) — fully orphaned`);
    console.log(mapping.join("\n"));

    if (APPLY) {
      await prisma.attempt.update({
        where: { id: a.id },
        data: { answers: JSON.stringify(newAnswers) },
      });
      const res = await recomputeAttemptScore(a.id, { gradeEssays: false });
      console.log(`  → re-keyed & regraded: ${res.earned}/${res.total} (${res.score}%)\n`);
    } else {
      console.log(`  (dry-run — pass --apply to write)\n`);
    }
    recovered++;
  }

  console.log(`Done. ${APPLY ? "recovered" : "would recover"}: ${recovered}, skipped: ${skipped}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
