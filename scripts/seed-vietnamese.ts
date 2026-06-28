// Seed the Vietnamese ("Tiếng Việt") subject: 10 chuyên đề + the REAL transcribed
// exams under scripts/vn-exams/*.json (CG, NTT, LTV — đề thi thật vào lớp 6).
//
// Source of truth for content = the committed JSON files in scripts/vn-exams/.
// The upload skill (/exam-import-vn) writes a new JSON there; re-running this
// script imports it. Idempotent: re-running replaces the vietnamese topics + each
// exam (destructive per-exam: deleteMany by examId, then re-insert).
//
// Run: npx tsx scripts/seed-vietnamese.ts

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../lib/prisma";
import { VIETNAMESE_TOPICS } from "../lib/subjects";
import { ensureSchoolProfilesFresh } from "../lib/school-profiles";

type QType = "mcq" | "fill" | "essay";

interface VnQuestion {
  num: number;
  type: QType;
  topic: string;
  grade: "NB" | "TH" | "VD";
  points?: number;
  tags?: string[];
  stem: string;
  options?: { id: string; text: string }[];
  correct?: string | null;
  accept?: string[];
  ignoreOrder?: boolean;
  modelAnswer?: string | null;
  passageRef?: string;
}

interface VnPassage {
  ref: string;
  title?: string;
  body: string;
  kind?: string;
}

interface VnExam {
  id: string;
  subject: "vietnamese";
  school: string;
  year: string;
  minutes: number;
  title: string;
  intro?: string;
  passages?: VnPassage[];
  questions: VnQuestion[];
}

const EXAMS_DIR = join(__dirname, "vn-exams");

function loadExams(): VnExam[] {
  const files = readdirSync(EXAMS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
  return files.map((f) => JSON.parse(readFileSync(join(EXAMS_DIR, f), "utf8")) as VnExam);
}

async function seedExam(ex: VnExam): Promise<void> {
  // Destructive per-exam refresh.
  await prisma.question.deleteMany({ where: { examId: ex.id } });
  await prisma.passage.deleteMany({ where: { examId: ex.id } });

  await prisma.exam.upsert({
    where: { id: ex.id },
    create: {
      id: ex.id,
      subject: "vietnamese",
      school: ex.school,
      kind: "official",
      year: ex.year,
      title: ex.title,
      intro: ex.intro ?? null,
      minutes: ex.minutes,
      qcount: ex.questions.length,
      sections: "[]",
    },
    update: {
      subject: "vietnamese",
      school: ex.school,
      kind: "official",
      year: ex.year,
      title: ex.title,
      intro: ex.intro ?? null,
      minutes: ex.minutes,
      qcount: ex.questions.length,
    },
  });

  // Passages → capture generated ids by ref.
  const passageId = new Map<string, string>();
  const passages = ex.passages ?? [];
  for (let i = 0; i < passages.length; i++) {
    const p = passages[i];
    const row = await prisma.passage.create({
      data: { examId: ex.id, title: p.title ?? null, body: p.body, kind: p.kind ?? "article", order: i },
    });
    passageId.set(p.ref, row.id);
  }

  let num = 1;
  for (const q of ex.questions) {
    const answerSchema =
      q.type === "fill" && q.accept && q.accept.length > 0
        ? JSON.stringify({ kind: "text_set", accept: q.accept, ignoreOrder: q.ignoreOrder ?? false })
        : null;
    await prisma.question.create({
      data: {
        id: `${ex.id}-q${num}`,
        examId: ex.id,
        subject: "vietnamese",
        num,
        type: q.type,
        topic: q.topic,
        skill: null,
        grade: q.grade,
        tags: JSON.stringify(q.tags ?? []),
        points: q.points ?? 1,
        stem: q.stem,
        unit: null,
        placeholder:
          q.type === "essay"
            ? "Viết bài làm của em vào đây..."
            : q.type === "fill"
              ? "Câu trả lời..."
              : null,
        correct: q.correct ?? null,
        options: q.options ? JSON.stringify(q.options) : "[]",
        modelAnswer: q.modelAnswer ?? null,
        figure: null,
        answerSchema,
        passageId: q.passageRef ? passageId.get(q.passageRef) ?? null : null,
      },
    });
    num++;
  }
  const t = ex.questions.reduce(
    (a, q) => ((a[q.type] = (a[q.type] ?? 0) + 1), a),
    {} as Record<string, number>,
  );
  console.log(
    `  ✓ ${ex.id}: ${ex.questions.length} câu (mcq ${t.mcq ?? 0} · fill ${t.fill ?? 0} · essay ${t.essay ?? 0}), ${passages.length} ngữ liệu`,
  );
}

async function main(): Promise<void> {
  console.log("Seeding Vietnamese subject…");

  // 1) Topics (10 chuyên đề)
  for (const t of VIETNAMESE_TOPICS) {
    await prisma.topic.upsert({
      where: { id: t.id },
      create: { id: t.id, subject: "vietnamese", skill: t.skill, name: t.name, short: t.short, ico: t.ico, color: t.color, position: 200 + t.position },
      update: { subject: "vietnamese", skill: t.skill, name: t.name, short: t.short, ico: t.ico, color: t.color, position: 200 + t.position },
    });
  }
  console.log(`  ✓ ${VIETNAMESE_TOPICS.length} chuyên đề Tiếng Việt`);

  // 2) Real exams from scripts/vn-exams/*.json
  const exams = loadExams();
  for (const ex of exams) await seedExam(ex);
  console.log(`  ✓ ${exams.length} đề thi thật`);

  // 3) School profiles (vietnamese 6-factor difficulty)
  const res = await ensureSchoolProfilesFresh("vietnamese");
  console.log(`  ✓ Profiles Tiếng Việt — created: [${res.created.join(", ")}], rebuilt: [${res.rebuilt.join(", ")}], unchanged: [${res.unchanged.join(", ")}]`);

  console.log("✓ Vietnamese seeding done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
