// Seed the English subject: 10 topics, plus two clearly-labelled SAMPLE exams
// (CG = broad/discrete, NTT = deep/integrated) so the whole stack runs
// end-to-end. The questions here are ORIGINAL sample content for demonstration,
// NOT transcriptions of any real exam — real exam import is a separate step.
//
// Idempotent: re-running replaces the english topics + the two sample exams.
// Run: npx tsx scripts/seed-english.ts

import { prisma } from "../lib/prisma";
import { ENGLISH_TOPICS } from "../lib/subjects";
import { ensureSchoolProfilesFresh } from "../lib/school-profiles";

type QType = "mcq" | "fill" | "essay";

interface SeedQuestion {
  topic: string;
  skill: string;
  grade: "A1" | "A2" | "B1";
  type: QType;
  points?: number;
  stem: string;
  options?: { id: string; text: string }[];
  correct?: string | null;
  accept?: string[]; // fill → text_set
  ignoreOrder?: boolean;
  tags?: string[];
  passageRef?: string; // key into the exam's passages map
}

interface SeedPassage {
  ref: string;
  title: string;
  body: string;
  kind: string;
}

interface SeedExam {
  id: string;
  school: string;
  minutes: number;
  title: string;
  intro: string;
  passages: SeedPassage[];
  questions: SeedQuestion[];
}

const CG: SeedExam = {
  id: "en-cg-sample",
  school: "cg",
  minutes: 45,
  title: "Tiếng Anh CG — Đề mẫu (minh hoạ)",
  intro: "ĐỀ MẪU minh hoạ kỹ năng (không phải đề thi thật). Phong cách Cầu Giấy: rộng & rời rạc.",
  passages: [
    {
      ref: "lib",
      title: "SCHOOL LIBRARY — NOTICE",
      kind: "notice",
      body:
        "Open: Monday to Friday, 8 a.m. – 4 p.m.\nClosed at weekends.\nYou can borrow up to 3 books for 2 weeks.",
    },
  ],
  questions: [
    { topic: "en-phon", skill: "pron", grade: "A1", type: "mcq",
      stem: "Choose the word with a DIFFERENT vowel sound.",
      options: [{ id: "A", text: "book" }, { id: "B", text: "good" }, { id: "C", text: "food" }, { id: "D", text: "foot" }],
      correct: "C" },
    { topic: "en-stress", skill: "pron", grade: "A1", type: "mcq",
      stem: "Choose the word with a DIFFERENT stress pattern.",
      options: [{ id: "A", text: "banana" }, { id: "B", text: "computer" }, { id: "C", text: "holiday" }, { id: "D", text: "important" }],
      correct: "C" },
    { topic: "en-gram", skill: "useofenglish", grade: "A2", type: "mcq",
      stem: "She ___ to school every day.",
      options: [{ id: "A", text: "go" }, { id: "B", text: "goes" }, { id: "C", text: "going" }, { id: "D", text: "went" }],
      correct: "B" },
    { topic: "en-gram", skill: "useofenglish", grade: "A2", type: "mcq",
      stem: "There ___ some milk in the fridge.",
      options: [{ id: "A", text: "is" }, { id: "B", text: "are" }, { id: "C", text: "am" }, { id: "D", text: "be" }],
      correct: "A" },
    { topic: "en-vocab", skill: "useofenglish", grade: "A2", type: "mcq",
      stem: "My brother is very ___; he always helps other people.",
      options: [{ id: "A", text: "lazy" }, { id: "B", text: "kind" }, { id: "C", text: "angry" }, { id: "D", text: "tall" }],
      correct: "B" },
    { topic: "en-synant", skill: "useofenglish", grade: "A2", type: "mcq",
      stem: "Choose the word CLOSEST in meaning to \"big\".",
      options: [{ id: "A", text: "small" }, { id: "B", text: "large" }, { id: "C", text: "short" }, { id: "D", text: "thin" }],
      correct: "B" },
    { topic: "en-synant", skill: "useofenglish", grade: "A2", type: "mcq",
      stem: "Choose the OPPOSITE of \"happy\".",
      options: [{ id: "A", text: "glad" }, { id: "B", text: "sad" }, { id: "C", text: "nice" }, { id: "D", text: "fun" }],
      correct: "B" },
    { topic: "en-error", skill: "useofenglish", grade: "A2", type: "mcq",
      stem: "Find the part that contains a mistake: \"She (A) don't (B) like (C) coffee (D).\"",
      options: [{ id: "A", text: "She" }, { id: "B", text: "don't" }, { id: "C", text: "like" }, { id: "D", text: "coffee" }],
      correct: "B" },
    { topic: "en-comm", skill: "comm", grade: "A1", type: "mcq",
      stem: "\"Thank you very much!\" — \"___\"",
      options: [{ id: "A", text: "You're welcome." }, { id: "B", text: "No." }, { id: "C", text: "Sorry." }, { id: "D", text: "Goodbye." }],
      correct: "A" },
    { topic: "en-cwrite", skill: "writing", grade: "A2", type: "fill",
      stem: "Complete so the meaning stays the same: \"Lan is taller than Mai.\" → \"Mai is ___ than Lan.\"",
      accept: ["shorter"], correct: "shorter" },
    { topic: "en-cwrite", skill: "writing", grade: "A2", type: "fill",
      stem: "Arrange the words into a correct sentence: to / school / I / go / every day",
      accept: ["I go to school every day"], correct: "I go to school every day" },
    { topic: "en-read", skill: "reading", grade: "A2", type: "mcq", passageRef: "lib",
      stem: "How many books can you borrow at the same time?",
      options: [{ id: "A", text: "1" }, { id: "B", text: "2" }, { id: "C", text: "3" }, { id: "D", text: "4" }],
      correct: "C" },
    { topic: "en-read", skill: "reading", grade: "A2", type: "fill", passageRef: "lib",
      stem: "Can you borrow a book on Sunday? Answer Yes or No.",
      accept: ["no"], correct: "No", tags: ["inference"] },
  ],
};

const NTT: SeedExam = {
  id: "en-ntt-sample",
  school: "ntt",
  minutes: 30,
  title: "Tiếng Anh NTT — Đề mẫu (minh hoạ)",
  intro: "ĐỀ MẪU minh hoạ kỹ năng (không phải đề thi thật). Phong cách NTT: sâu & tích hợp, nặng đọc hiểu + viết đoạn.",
  passages: [
    {
      ref: "cyc",
      title: "Cycling in London",
      kind: "article",
      body:
        "Many people in London ride bicycles to work. Cycling is cheap, healthy and good for the environment because it does not produce pollution.\nThe city has built special lanes to keep cyclists safe. However, riders must wear a helmet and follow the traffic rules.",
    },
  ],
  questions: [
    { topic: "en-gram", skill: "useofenglish", grade: "A2", type: "mcq",
      stem: "If it ___ tomorrow, we will stay at home.",
      options: [{ id: "A", text: "rains" }, { id: "B", text: "rain" }, { id: "C", text: "rained" }, { id: "D", text: "raining" }],
      correct: "A" },
    { topic: "en-vocab", skill: "useofenglish", grade: "A2", type: "mcq",
      stem: "I need to ___ a decision soon.",
      options: [{ id: "A", text: "do" }, { id: "B", text: "make" }, { id: "C", text: "take" }, { id: "D", text: "get" }],
      correct: "B", tags: ["collocation"] },
    { topic: "en-comm", skill: "comm", grade: "A1", type: "mcq",
      stem: "\"Would you like some tea?\" — \"___\"",
      options: [{ id: "A", text: "Yes, please." }, { id: "B", text: "Here you are." }, { id: "C", text: "Not at all." }, { id: "D", text: "See you." }],
      correct: "A" },
    { topic: "en-comm", skill: "comm", grade: "A2", type: "mcq",
      stem: "The lift is \"out of order\". It means the lift is ___.",
      options: [{ id: "A", text: "new" }, { id: "B", text: "broken" }, { id: "C", text: "cheap" }, { id: "D", text: "busy" }],
      correct: "B", tags: ["idiom"] },
    { topic: "en-read", skill: "reading", grade: "B1", type: "mcq", passageRef: "cyc",
      stem: "What is the main idea of the passage?",
      options: [
        { id: "A", text: "London is a very big city." },
        { id: "B", text: "Cycling is popular and beneficial in London." },
        { id: "C", text: "Cars are faster than bicycles." },
        { id: "D", text: "Helmets are expensive." },
      ],
      correct: "B", tags: ["inference"] },
    { topic: "en-read", skill: "reading", grade: "A2", type: "mcq", passageRef: "cyc",
      stem: "Why is cycling good for the environment?",
      options: [
        { id: "A", text: "It is fast." },
        { id: "B", text: "It does not produce pollution." },
        { id: "C", text: "It is cheap." },
        { id: "D", text: "It is healthy." },
      ],
      correct: "B" },
    { topic: "en-read", skill: "reading", grade: "B1", type: "mcq", passageRef: "cyc",
      stem: "The word \"it\" in \"it does not produce pollution\" refers to ___.",
      options: [{ id: "A", text: "London" }, { id: "B", text: "cycling" }, { id: "C", text: "work" }, { id: "D", text: "the environment" }],
      correct: "B", tags: ["inference"] },
    { topic: "en-read", skill: "reading", grade: "A2", type: "fill", passageRef: "cyc",
      stem: "Complete from the passage: Cyclists must wear a ___.",
      accept: ["helmet", "a helmet"], correct: "helmet" },
    { topic: "en-error", skill: "useofenglish", grade: "A2", type: "fill",
      stem: "One word is the wrong homophone: \"I can sea the mountain.\" Write the correct word.",
      accept: ["see"], correct: "see" },
    { topic: "en-vocab", skill: "useofenglish", grade: "A2", type: "mcq",
      stem: "She is interested ___ music.",
      options: [{ id: "A", text: "on" }, { id: "B", text: "in" }, { id: "C", text: "at" }, { id: "D", text: "for" }],
      correct: "B" },
    { topic: "en-fwrite", skill: "writing", grade: "B1", type: "essay", points: 4,
      stem: "Write a short paragraph (50–70 words) about your favourite hobby. Say what it is, when you do it, and why you like it.",
      correct: null },
  ],
};

async function seedExam(ex: SeedExam): Promise<void> {
  // Destructive per-exam refresh.
  await prisma.question.deleteMany({ where: { examId: ex.id } });
  await prisma.passage.deleteMany({ where: { examId: ex.id } });

  await prisma.exam.upsert({
    where: { id: ex.id },
    create: {
      id: ex.id,
      subject: "english",
      school: ex.school,
      kind: "official",
      year: "Đề mẫu",
      title: ex.title,
      intro: ex.intro,
      minutes: ex.minutes,
      qcount: ex.questions.length,
      sections: "[]",
    },
    update: {
      subject: "english",
      school: ex.school,
      kind: "official",
      title: ex.title,
      intro: ex.intro,
      minutes: ex.minutes,
      qcount: ex.questions.length,
    },
  });

  // Passages → capture generated ids by ref.
  const passageId = new Map<string, string>();
  for (let i = 0; i < ex.passages.length; i++) {
    const p = ex.passages[i];
    const row = await prisma.passage.create({
      data: { examId: ex.id, title: p.title, body: p.body, kind: p.kind, order: i },
    });
    passageId.set(p.ref, row.id);
  }

  let num = 1;
  for (const q of ex.questions) {
    const answerSchema =
      q.type === "fill" && q.accept
        ? JSON.stringify({ kind: "text_set", accept: q.accept, ignoreOrder: q.ignoreOrder ?? false })
        : null;
    await prisma.question.create({
      data: {
        id: `${ex.id}-q${num}`,
        examId: ex.id,
        subject: "english",
        num,
        type: q.type,
        topic: q.topic,
        skill: q.skill,
        grade: q.grade,
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
      },
    });
    num++;
  }
  console.log(`  ✓ ${ex.id}: ${ex.questions.length} câu, ${ex.passages.length} ngữ liệu`);
}

async function main(): Promise<void> {
  console.log("Seeding English subject…");

  // 1) Topics
  for (const t of ENGLISH_TOPICS) {
    await prisma.topic.upsert({
      where: { id: t.id },
      create: { id: t.id, subject: "english", skill: t.skill, name: t.name, short: t.short, ico: t.ico, color: t.color, position: 100 + t.position },
      update: { subject: "english", skill: t.skill, name: t.name, short: t.short, ico: t.ico, color: t.color, position: 100 + t.position },
    });
  }
  console.log(`  ✓ ${ENGLISH_TOPICS.length} chuyên đề English`);

  // 2) Sample exams
  await seedExam(CG);
  await seedExam(NTT);

  // 3) School profiles (english 6-factor difficulty)
  const res = await ensureSchoolProfilesFresh("english");
  console.log(`  ✓ Profiles English — created: [${res.created.join(", ")}], rebuilt: [${res.rebuilt.join(", ")}], unchanged: [${res.unchanged.join(", ")}]`);

  console.log("✓ English seeding done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
