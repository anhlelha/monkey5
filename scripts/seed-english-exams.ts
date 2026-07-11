// Seed REAL English exams from transcribed JSON files in scripts/.en-import/.
//
// Each scripts/.en-import/<id>.json is one exam (subject="english"), produced by
// the /exam-import-en workflow (pdftotext / image OCR → reviewed JSON). This
// script is the english counterpart of seed-all-exams.ts: idempotent and
// destructive PER EXAM (deletes that exam's questions + passages, re-inserts),
// then rebuilds the english SchoolProfile (6-factor difficulty).
//
// Run: npx tsx scripts/seed-english-exams.ts
// See docs/ENGLISH-SUBJECT-DESIGN.md + .claude/commands/exam-import-en.md

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../lib/prisma";
import { ensureSchoolProfilesFresh } from "../lib/school-profiles";

const IMPORT_DIR = join(__dirname, ".en-import");

// Sample/demo exams that real content supersedes (so they don't pollute the
// difficulty profile once real exams for that school exist).
const SUPERSEDED_ON_REAL: Record<string, string[]> = {
  ntt: ["en-ntt-sample"],
};

interface SeedOption { id: string; text: string }
interface SeedPassage { ref: string; title?: string | null; body: string; kind?: string }
interface SeedQuestion {
  num: number;
  topic: string;
  skill?: string;
  grade?: string;
  type: "mcq" | "fill" | "essay";
  points?: number;
  stem: string;
  options?: SeedOption[];
  correct?: string | null;
  accept?: string[];
  ignoreOrder?: boolean;
  tags?: string[];
  passageRef?: string;
}
interface SeedExam {
  id: string;
  subject?: string;
  school: string;
  kind?: string;
  year: string;
  title: string;
  intro?: string;
  minutes?: number;
  source?: string;
  // Optional section headers (câu dẫn đề / rubrics) printed above the question
  // whose `num` matches — reproduces I/II/III + 3.1/3.2 structure. Rendered by
  // getExamSectionHeader (lib/exam.ts) in ExamRunner + ResultsView.
  sections?: Array<{ num: number; header: string }>;
  passages?: SeedPassage[];
  questions: SeedQuestion[];
  skipped?: Array<{ num: number; reason: string }>;
}

function loadExams(): SeedExam[] {
  const files = readdirSync(IMPORT_DIR).filter((f) => f.startsWith("en-") && f.endsWith(".json"));
  return files
    .map((f) => JSON.parse(readFileSync(join(IMPORT_DIR, f), "utf8")) as SeedExam)
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function seedExam(ex: SeedExam): Promise<void> {
  await prisma.question.deleteMany({ where: { examId: ex.id } });
  await prisma.passage.deleteMany({ where: { examId: ex.id } });

  const data = {
    subject: "english",
    school: ex.school,
    kind: ex.kind ?? "official",
    year: ex.year,
    title: ex.title,
    intro: ex.intro ?? "Đề chính thức tuyển sinh lớp 6 — môn Tiếng Anh.",
    minutes: ex.minutes ?? 30,
    qcount: ex.questions.length,
    sections: JSON.stringify(ex.sections ?? []),
  };
  await prisma.exam.upsert({ where: { id: ex.id }, create: { id: ex.id, ...data }, update: data });

  const passageId = new Map<string, string>();
  const passages = ex.passages ?? [];
  for (let i = 0; i < passages.length; i++) {
    const p = passages[i];
    const row = await prisma.passage.create({
      data: { examId: ex.id, title: p.title ?? null, body: p.body, kind: p.kind ?? "article", order: i },
    });
    passageId.set(p.ref, row.id);
  }

  for (const q of ex.questions) {
    const answerSchema =
      q.type === "fill" && q.accept && q.accept.length > 0
        ? JSON.stringify({ kind: "text_set", accept: q.accept, ignoreOrder: q.ignoreOrder ?? false })
        : null;
    await prisma.question.create({
      data: {
        id: `${ex.id}-q${q.num}`,
        examId: ex.id,
        subject: "english",
        num: q.num,
        type: q.type,
        topic: q.topic,
        skill: q.skill ?? null,
        grade: q.grade ?? "A2",
        tags: JSON.stringify(q.tags ?? []),
        points: q.points ?? 1,
        stem: q.stem,
        unit: null,
        placeholder: q.type === "essay" ? "Write your paragraph here..." : q.type === "fill" ? "Your answer..." : null,
        correct: q.correct ?? null,
        options: q.options ? JSON.stringify(q.options) : "[]",
        modelAnswer: null,
        figure: null,
        answerSchema,
        passageId: q.passageRef ? passageId.get(q.passageRef) ?? null : null,
        source: ex.source ?? null,
      },
    });
  }

  const skipped = ex.skipped?.length ? ` (skipped ${ex.skipped.length}: ${ex.skipped.map((s) => s.num).join(",")})` : "";
  console.log(`  ✓ ${ex.id}: ${ex.questions.length} câu, ${passages.length} ngữ liệu${skipped}`);
}

async function main(): Promise<void> {
  const exams = loadExams();
  if (exams.length === 0) {
    console.log("No en-*.json files in scripts/.en-import/ — nothing to seed.");
    return;
  }
  console.log(`Seeding ${exams.length} English exam(s) from scripts/.en-import/…`);

  const schoolsWithReal = new Set(exams.map((e) => e.school));
  for (const ex of exams) await seedExam(ex);

  // Drop superseded sample exams for any school that now has real content.
  for (const school of schoolsWithReal) {
    for (const sampleId of SUPERSEDED_ON_REAL[school] ?? []) {
      const del = await prisma.question.deleteMany({ where: { examId: sampleId } });
      await prisma.passage.deleteMany({ where: { examId: sampleId } });
      await prisma.exam.deleteMany({ where: { id: sampleId } });
      if (del.count > 0) console.log(`  – removed superseded sample ${sampleId}`);
    }
  }

  const res = await ensureSchoolProfilesFresh("english");
  console.log(`  ✓ Profiles English — created: [${res.created.join(", ")}], rebuilt: [${res.rebuilt.join(", ")}], unchanged: [${res.unchanged.join(", ")}]`);
  console.log("✓ English exam seeding done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
