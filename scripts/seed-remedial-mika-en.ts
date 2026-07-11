/**
 * Seed an English "Bài thầy giao" (private remedial set) for student mika —
 * the English counterpart of scripts/seed-remedial-mika.ts.
 *
 * Source: public/ref_exam/English/Bài thêm/Test_1_Answer_Key.pdf ("TEST 1").
 *
 * The MCQs/fills + official answers + Vietnamese explanations come from the
 * answer-key PDF; the full reading passage (2.1) and cloze text (2.2) were
 * supplied separately from the original test paper and are stored verbatim in
 * PASSAGES below (the runner renders the passage block above its questions).
 *
 * Model (see docs/REMEDIAL-SETS-DESIGN.md + CLAUDE.md multi-subject section):
 *   - The whole test = ONE private Exam (subject "english", ownerUserId = mika),
 *     shown at /luyen-rieng ("Bài thầy giao"), gated owner-only in the runner.
 *   - Deterministic exam id `rmd-<userId>-en-test1` → upsert (NOT delete) keeps
 *     the Exam row + Attempt history across re-seeds.
 *   - Questions are updated IN PLACE (matched by deterministic id) so
 *     Attempt.answers (keyed by Question.id) survive re-seeds — see the grading
 *     pitfalls in CLAUDE.md. Trailing extras are dropped.
 *   - Each question keeps a real english `topic` (1 of the 10) + `skill` +
 *     `grade` (A1/A2/B1) so it still feeds mastery/readiness like a real exam.
 *
 * Idempotent. Resolves owner by email (creates a minimal User if mika has not
 * signed in yet). Owner overridable via CLI for local preview:
 *   npx tsx scripts/seed-remedial-mika-en.ts user-demo@local
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const OWNER_EMAIL = (process.argv[2] || "mikayeubo@gmail.com").toLowerCase();
const OWNER_NAME = OWNER_EMAIL === "mikayeubo@gmail.com" ? "Mika" : OWNER_EMAIL.split("@")[0];
const SOURCE_TAG = "en-remedial-mika";

const L = ["A", "B", "C", "D"] as const;

type QType = "mcq" | "fill" | "essay";
type Grade = "A1" | "A2" | "B1";
type Skill = "pron" | "useofenglish" | "comm" | "reading" | "writing";

interface RQ {
  type: QType;
  topic: string; // english topic id (en-phon | en-stress | ...)
  skill: Skill;
  grade: Grade;
  stem: string;
  options?: string[]; // mcq → in display order A..D
  correct: string | null; // mcq → letter; fill → canonical value; essay → null
  accept?: string[]; // fill → text_set accepted answers
  ignoreOrder?: boolean;
  passageRef?: string; // key into PASSAGES
  modelAnswer?: string; // Vietnamese explanation / đáp án chi tiết
}

interface Passage {
  ref: string;
  title: string;
  kind: string; // notice | message | article | cloze
  body: string;
}

// ─── Passages ────────────────────────────────────────────────────────────────
const PASSAGES: Passage[] = [
  {
    ref: "men",
    title: "Why do men die younger than women?",
    kind: "article",
    body:
      "Why are there so many grandmothers and so few grandfathers? In other words, why do men die " +
      "younger than women? Is this because men are afraid of getting old and helpless and so they prefer " +
      "to die before that happens? Perhaps they fear to be left alone by their women and so decide to do " +
      "the leaving first.\n\n" +
      "Many explanations are given for the fact that men die earlier than women. Men are stronger " +
      "physically, yet women can hang on longer to life. Both men and women are emotional creatures but " +
      "women are not afraid or ashamed to cry while men refuse to do so. They are afraid of being thought " +
      "\"soft\". Some men, when they are upset, play loud music or dig in the garden to relieve their " +
      "feelings. Many men like an orderly life so that they bury themselves in their work or want a wife " +
      "with some children or long to take part in wars where there is a definite chain of command. There " +
      "is a leader to give orders and a known enemy to fight against and defeat. All these make men feel " +
      "they live in a rational world.\n\n" +
      "So the majority of men like a rational world. Rationality is fine but it does not include everything " +
      "that makes life joyful and fun or even messy and frustrating. When a man refuses to cry, he is " +
      "refusing to accept that his emotions are part of him. Of course, some men do not follow this " +
      "pattern. Bob Hawke is capable of crying in public whereas Margaret Thatcher is probably incapable " +
      "of crying at any time.\n\n" +
      "We need to cry because that shows our ability to suffer. If we do not suffer, we are not really " +
      "alive at all. Suffering can be creative or destructive. If we can all learn to cry and laugh and " +
      "shout and dance openly, we are living creatively and adding something to the human race. We often " +
      "say men suffer more from stress and therefore they die earlier. Are we not saying in another way " +
      "that they do not know how to suffer in the right way with tears and laughter instead of silence and " +
      "so they are miserable and just give up? That is just my theory of course. Have you a better one?",
  },
  {
    ref: "earth",
    title: "Earth's natural resources",
    kind: "cloze",
    body:
      "Read the passage and choose the best option (A/B/C/D) for each numbered blank.\n\n" +
      "Earth is the only (1) ___ we know of in the universe that can support human life. (2) ___ human " +
      "activities are making the planet less fit to live on. As the western world (3) ___ on consuming " +
      "two-thirds of the world's resources while half of the world's population do so (4) ___ to stay " +
      "alive, we are rapidly destroying the very resource we have by which all people can survive and " +
      "prosper. Everywhere fertile soil is (5) ___ built on or washed into the sea. Renewable resources " +
      "are exploited so much that they will never be able to recover completely. We discharge pollutants " +
      "into the atmosphere without any thought of the consequences. As a (6) ___, the planet's ability to " +
      "support people is being reduced at the very time when rising human numbers and consumption are " +
      "(7) ___ increasingly heavy demands on it. The Earth's natural resources are there for us to use. We " +
      "need food, water, air, energy, medicines, warmth, shelter and minerals to (8) ___ us fed, " +
      "comfortable, healthy and active. If we are sensible in how we use the resources, they will (9) ___ " +
      "indefinitely. But if we use them wastefully and excessively, they will soon run (10) ___ and " +
      "everyone will suffer.",
  },
];

// ─── Questions (in exam order) ─────────────────────────────────────────────────
const QUESTIONS: RQ[] = [
  // I.1 PHONETICS — pronunciation (en-phon)
  { type: "mcq", topic: "en-phon", skill: "pron", grade: "A2",
    stem: "I.1. Chọn từ có phần gạch chân phát âm KHÁC:",
    options: ["skating", "status", "stadium", "statue"], correct: "D",
    modelAnswer: "D — statue có \"a\" phát âm /æ/; skating, status, stadium đều /eɪ/." },
  { type: "mcq", topic: "en-phon", skill: "pron", grade: "A2",
    stem: "I.1. Chọn từ có phần gạch chân (đuôi -s) phát âm KHÁC:",
    options: ["definitions", "documents", "combs", "doors"], correct: "B",
    modelAnswer: "B — documents có \"-s\" phát âm /s/ (sau âm /t/ vô thanh); definitions, combs, doors đều /z/." },
  { type: "mcq", topic: "en-phon", skill: "pron", grade: "A2",
    stem: "I.1. Chọn từ có phần gạch chân (đuôi -ed) phát âm KHÁC:",
    options: ["worked", "moved", "stopped", "brushed"], correct: "B",
    modelAnswer: "B — moved có \"-ed\" phát âm /d/; worked, stopped, brushed đều /t/ (sau âm vô thanh)." },

  // I.2 PHONETICS — stress (en-stress)
  { type: "mcq", topic: "en-stress", skill: "pron", grade: "A2",
    stem: "I.2. Chọn từ có trọng âm KHÁC:",
    options: ["relax", "wonder", "problem", "special"], correct: "A",
    modelAnswer: "A — relax trọng âm âm tiết 2 (re·LAX); ba từ còn lại trọng âm âm tiết 1." },
  { type: "mcq", topic: "en-stress", skill: "pron", grade: "B1",
    stem: "I.2. Chọn từ có trọng âm KHÁC:",
    options: ["popularity", "conscientious", "apprenticeship", "personality"], correct: "C",
    modelAnswer: "C — apprenticeship trọng âm âm tiết 2 (ap·PREN·tice·ship); ba từ còn lại trọng âm âm tiết 3." },
  { type: "mcq", topic: "en-stress", skill: "pron", grade: "B1",
    stem: "I.2. Chọn từ có trọng âm KHÁC:",
    options: ["celebrate", "fascinating", "survive", "elephant"], correct: "C",
    modelAnswer: "C — survive trọng âm âm tiết 2 (sur·VIVE); ba từ còn lại trọng âm âm tiết 1." },

  // II.1 READING — passage "Why do men die younger than women?" (en-read)
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "men",
    stem: "What does the word \"that\" in the passage refer to?",
    options: [
      "The fact that men get old and helpless.",
      "The fact that they fear to be left alone.",
      "The fact that men die younger than women.",
      "The fact that they decide to do the leaving first.",
    ], correct: "A",
    modelAnswer: "A — \"...afraid of getting old and helpless and so they prefer to die before that happens\" → that = việc già đi và bất lực." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "men",
    stem: "What's the main question the article is intended to discuss?",
    options: [
      "Why women are more emotional than men.",
      "Why suffering is different in men and women.",
      "Why men die earlier than women.",
      "Why men like a rational world.",
    ], correct: "C",
    modelAnswer: "C — câu hỏi chủ đạo mở đầu và xuyên suốt bài: vì sao đàn ông chết sớm hơn phụ nữ." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "men",
    stem: "What is found the same for both men and women?",
    options: [
      "They like to cry.",
      "They are physically strong.",
      "They are emotional creatures.",
      "They want to play loud music.",
    ], correct: "C",
    modelAnswer: "C — \"Both men and women are emotional creatures...\" (cả hai đều là sinh vật giàu cảm xúc)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "men",
    stem: "The phrase \"to do the leaving\" is closest in meaning to:",
    options: ["set off", "go down", "pass away", "depart"], correct: "C",
    modelAnswer: "C — ở đây \"leaving\" mang nghĩa rời bỏ cuộc sống = chết → pass away (qua đời)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "men",
    stem: "What's the writer's opinion toward crying?",
    options: [
      "It is a good thing for people to cry.",
      "It is all right for women to cry but shameful for men.",
      "Tears are not real signs of suffering.",
      "To be silent is better than to cry.",
    ], correct: "A",
    modelAnswer: "A — tác giả cho rằng khóc thể hiện khả năng chịu đựng và sống thật; khóc là điều tốt." },

  // II.2 READING — cloze "Earth's natural resources" (en-read)
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Chọn từ điền vào chỗ trống (1):",
    options: ["situation", "place", "position", "site"], correct: "B",
    modelAnswer: "B — \"the only place we know of in the universe\" (nơi duy nhất)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Chọn từ điền vào chỗ trống (2):",
    options: ["Although", "Still", "Yet", "Despite"], correct: "C",
    modelAnswer: "C — \"Yet human activities...\" (Tuy nhiên); đứng đầu mệnh đề, không cần danh từ như Despite." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Chọn từ điền vào chỗ trống (3):",
    options: ["continues", "repeats", "carries", "follows"], correct: "C",
    modelAnswer: "C — carry on = tiếp tục (carries on consuming)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Chọn từ điền vào chỗ trống (4):",
    options: ["already", "just", "for", "entirely"], correct: "B",
    modelAnswer: "B — \"do so just to stay alive\" (chỉ để tồn tại)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Chọn từ điền vào chỗ trống (5):",
    options: ["sooner", "neither", "either", "rather"], correct: "C",
    modelAnswer: "C — cấu trúc either... or (either built on or washed into the sea)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Chọn từ điền vào chỗ trống (6):",
    options: ["development", "result", "reaction", "product"], correct: "B",
    modelAnswer: "B — \"As a result\" (kết quả là)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Chọn từ điền vào chỗ trống (7):",
    options: ["doing", "having", "taking", "making"], correct: "D",
    modelAnswer: "D — make demands on (đặt ra yêu cầu)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Chọn từ điền vào chỗ trống (8):",
    options: ["hold", "maintain", "stay", "keep"], correct: "D",
    modelAnswer: "D — keep us fed/comfortable (giữ cho...)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Chọn từ điền vào chỗ trống (9):",
    options: ["last", "stand", "go", "remain"], correct: "A",
    modelAnswer: "A — last indefinitely (tồn tại lâu dài)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Chọn từ điền vào chỗ trống (10):",
    options: ["out", "off", "over", "down"], correct: "A",
    modelAnswer: "A — run out (cạn kiệt)." },

  // III.1 GRAMMAR — choose the best option (en-gram)
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "A2",
    stem: "A new study group has been set ___ by the government.",
    options: ["out", "up", "away", "down"], correct: "B",
    modelAnswer: "B (up) — set up = thành lập." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "B1",
    stem: "We would rather Helen ___ us all the information we needed.",
    options: ["sent", "send", "had sent", "have sent"], correct: "C",
    modelAnswer: "C (had sent) — would rather + S + quá khứ hoàn thành: điều trái với quá khứ." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "B1",
    stem: "Only because she had to support her family, ___ to leave school.",
    options: ["that Alice decides", "so Alice decided", "Alice decided", "did Alice decide"], correct: "D",
    modelAnswer: "D (did Alice decide) — đảo ngữ sau Only + mệnh đề trạng ngữ." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "A2",
    stem: "The majority of primary school teachers ___ women.",
    options: ["is", "are", "includes", "including"], correct: "B",
    modelAnswer: "B (are) — the majority of + danh từ số nhiều → động từ số nhiều." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "B1",
    stem: "___ today, there would be nowhere for them to stay.",
    options: ["Were they to arrive", "If they arrive", "Had they arrive", "Provided they arrived"], correct: "A",
    modelAnswer: "A (Were they to arrive) — đảo ngữ câu điều kiện loại 2 (were to)." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "A2",
    stem: "You can use my phone if yours ___.",
    options: ["won't be worked", "won't work", "isn't worked", "doesn't work"], correct: "D",
    modelAnswer: "D (doesn't work) — work (hoạt động) là nội động từ, chủ động, hiện tại đơn." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "A2",
    stem: "Generally ___, learning a foreign language is interesting, but not easy.",
    options: ["spoken", "speaking", "speak", "speaks"], correct: "B",
    modelAnswer: "B (speaking) — generally speaking = nói chung." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "B1",
    stem: "Ben would have studied medicine if he ___ to a medical school.",
    options: ["was admitted", "had been admitted", "had admitted", "would be able to enter"], correct: "B",
    modelAnswer: "B (had been admitted) — điều kiện loại 3, bị động." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "B1",
    stem: "___ having a well-paid job, she never has any money.",
    options: ["Let alone", "Despite", "For", "Even though"], correct: "B",
    modelAnswer: "B (Despite) — Despite + V-ing/danh từ (dù)." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "A2",
    stem: "___ does it take you to do the washing?",
    options: ["How fast", "What time", "How often", "How long"], correct: "D",
    modelAnswer: "D (How long) — hỏi khoảng thời gian với take." },

  // III.2 CONVERSATION — most suitable response (en-comm)
  { type: "mcq", topic: "en-comm", skill: "comm", grade: "A2",
    stem: "Linda: \"It's been a tough couple of months, but I think the worst is behind us now.\" Jill: \"___\"",
    options: ["Good morning", "Good luck!", "Good!", "Goodness me!"], correct: "C",
    modelAnswer: "C (Good!) — phản hồi tích cực khi nghe tin điều tệ nhất đã qua." },
  { type: "mcq", topic: "en-comm", skill: "comm", grade: "A2",
    stem: "Linda: \"What a nice new style of hair you have it cut!\" Jill: \"___\"",
    options: ["No, I think it's suitable for me", "It's from Italy", "Thank you", "Yes, please"], correct: "C",
    modelAnswer: "C (Thank you) — đáp lại lời khen lịch sự." },

  // III.3 SYNONYMS & ANTONYMS (en-synant)
  { type: "mcq", topic: "en-synant", skill: "useofenglish", grade: "B1",
    stem: "CLOSEST in meaning — In remote communities, it's important to REPLENISH stocks before the winter sets in.",
    options: ["empty", "remake", "repeat", "refill"], correct: "D",
    modelAnswer: "D (refill) — replenish = bổ sung/làm đầy lại = refill." },
  { type: "mcq", topic: "en-synant", skill: "useofenglish", grade: "B1",
    stem: "CLOSEST in meaning — NEARLY ALL weather occurs in the troposphere, the lowest layer of the earth's atmosphere.",
    options: ["Closely to", "Barely", "Almost", "After"], correct: "C",
    modelAnswer: "C (Almost) — nearly all = almost all (gần như tất cả)." },
  { type: "mcq", topic: "en-synant", skill: "useofenglish", grade: "B1",
    stem: "OPPOSITE in meaning — They have not made any effort to INTEGRATE with the local community.",
    options: ["cooperate", "put together", "separate", "connect"], correct: "C",
    modelAnswer: "C (separate) — integrate (hòa nhập) trái nghĩa với separate (tách biệt)." },
  { type: "mcq", topic: "en-synant", skill: "useofenglish", grade: "B1",
    stem: "OPPOSITE in meaning — There has been INSUFFICIENT rainfall over the past two years, and farmers are having trouble.",
    options: ["adequate", "unsatisfactory", "abundant", "dominant"], correct: "A",
    modelAnswer: "A (adequate) — insufficient (không đủ) trái nghĩa với adequate (đủ)." },

  // III.4 WORD FORMS — give the correct form (en-vocab, fill)
  { type: "fill", topic: "en-vocab", skill: "useofenglish", grade: "A2",
    stem: "Housework has ___ been regarded as women's work. (TRADITION)",
    correct: "traditionally", accept: ["traditionally"],
    modelAnswer: "traditionally — trạng từ bổ nghĩa động từ." },
  { type: "fill", topic: "en-vocab", skill: "useofenglish", grade: "A2",
    stem: "We will live a happier and ___ life if we keep our environment clean. (HEALTH)",
    correct: "healthier", accept: ["healthier"],
    modelAnswer: "healthier — tính từ so sánh hơn (healthy → healthier)." },
  { type: "fill", topic: "en-vocab", skill: "useofenglish", grade: "A2",
    stem: "It is ___ of you to cheat in the exam. (HONEST)",
    correct: "dishonest", accept: ["dishonest"],
    modelAnswer: "dishonest — nghĩa phủ định — gian lận là không trung thực." },
  { type: "fill", topic: "en-vocab", skill: "useofenglish", grade: "B1",
    stem: "___ is now a serious problem in many countries. (FOREST)",
    correct: "Deforestation", accept: ["Deforestation"],
    modelAnswer: "Deforestation — danh từ — nạn phá rừng." },

  // IV.1 WRITING — rewrite the sentences (en-cwrite, fill/text_set)
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "Rewrite (use SPENT): It took us three hours to find a room for the night.",
    correct: "We spent three hours finding a room for the night.",
    accept: [
      "We spent three hours finding a room for the night",
      "We spent 3 hours finding a room for the night",
    ],
    modelAnswer: "We spent three hours finding a room for the night." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "Rewrite (use PREFER): Would you rather I stayed with you during the holidays?",
    correct: "Would you prefer me to stay with you during the holidays?",
    accept: ["Would you prefer me to stay with you during the holidays"],
    modelAnswer: "Would you prefer me to stay with you during the holidays?" },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "Rewrite (use SO): The English test was not easy enough for me to do well.",
    correct: "The English test was so difficult that I could not do well.",
    accept: [
      "The English test was so difficult that I could not do well",
      "The English test was so difficult that I couldn't do well",
    ],
    modelAnswer: "The English test was so difficult that I could not do well." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "Rewrite (use ACCUSED): The police said Jim had stolen the money.",
    correct: "The police accused Jim of stealing the money.",
    accept: ["The police accused Jim of stealing the money"],
    modelAnswer: "The police accused Jim of stealing the money." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "Rewrite (use IMPOSSIBLE): Because of his illness, he could not work effectively.",
    correct: "His illness made it impossible for him to work effectively.",
    accept: ["His illness made it impossible for him to work effectively"],
    modelAnswer: "His illness made it impossible for him to work effectively." },

  // IV.2 WRITING — build meaningful sentences (en-cwrite, fill/text_set)
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "Build a sentence: when / hot / he / go / swim / river / front / his house.",
    correct: "When it is hot, he goes swimming in the river in front of his house.",
    accept: [
      "When it is hot, he goes swimming in the river in front of his house",
      "When it's hot, he goes swimming in the river in front of his house",
    ],
    modelAnswer: "When it is hot, he goes swimming in the river in front of his house." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "Build a sentence: she / usually / listen / music / night.",
    correct: "She usually listens to music at night.",
    accept: ["She usually listens to music at night"],
    modelAnswer: "She usually listens to music at night." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "Build a sentence: this coffee / hot / that / I / not / drink it.",
    correct: "This coffee is so hot that I cannot drink it.",
    accept: [
      "This coffee is so hot that I cannot drink it",
      "This coffee is so hot that I can't drink it",
    ],
    modelAnswer: "This coffee is so hot that I cannot drink it." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "Build a sentence: you / know / who / best / English / your grade?",
    correct: "Do you know who is the best at English in your grade?",
    accept: [
      "Do you know who is the best at English in your grade",
      "Do you know who is best at English in your grade",
    ],
    modelAnswer: "Do you know who is the best at English in your grade?" },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "Build a sentence: air pollution / serious problem / many / big city.",
    correct: "Air pollution is a serious problem in many big cities.",
    accept: ["Air pollution is a serious problem in many big cities"],
    modelAnswer: "Air pollution is a serious problem in many big cities." },
];

const EXAM_KEY = "en-test1";
const EXAM_TITLE = "TEST 1 — Tiếng Anh (thầy giao)";
const EXAM_MINUTES = 60;

async function main(): Promise<void> {
  // 1. Resolve owner (create minimal User if mika hasn't signed in yet).
  let owner = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!owner) {
    owner = await prisma.user.create({
      data: { email: OWNER_EMAIL, name: OWNER_NAME, role: "student", grade: "Lớp 5" },
    });
    console.log(`  created User for ${OWNER_EMAIL} (id=${owner.id})`);
  } else {
    console.log(`  owner ${OWNER_EMAIL} (id=${owner.id})`);
  }

  const examId = `rmd-${owner.id}-${EXAM_KEY}`;

  // 2. Upsert the private English Exam (NOT delete → keep Attempt history).
  await prisma.exam.upsert({
    where: { id: examId },
    update: {
      subject: "english",
      title: EXAM_TITLE,
      minutes: EXAM_MINUTES,
      qcount: QUESTIONS.length,
      active: true,
      archivedAt: null,
    },
    create: {
      id: examId,
      subject: "english",
      school: "mix",
      kind: "reference",
      year: "Bài thầy giao",
      title: EXAM_TITLE,
      intro:
        "Bài kiểm tra Tiếng Anh thầy giao riêng. Con làm và điền đáp án vào ô trả lời; " +
        "phần giải thích hiển thị sau khi nộp bài.",
      minutes: EXAM_MINUTES,
      qcount: QUESTIONS.length,
      generated: false,
      sections: "[]",
      ownerUserId: owner.id,
      position: 1,
      active: true,
    },
  });

  // 3. Passages: replace (not keyed by Attempt.answers), capture ids by ref.
  await prisma.passage.deleteMany({ where: { examId } });
  const passageId = new Map<string, string>();
  for (let i = 0; i < PASSAGES.length; i++) {
    const p = PASSAGES[i];
    const row = await prisma.passage.create({
      data: { examId, title: p.title, body: p.body, kind: p.kind, order: i },
    });
    passageId.set(p.ref, row.id);
  }

  // 4. Questions IN PLACE by deterministic id → Attempt.answers survive re-seed.
  let num = 0;
  for (const q of QUESTIONS) {
    num += 1;
    const qid = `${examId}-q${num}`;
    const answerSchema =
      q.type === "fill" && q.accept
        ? JSON.stringify({ kind: "text_set", accept: q.accept, ignoreOrder: q.ignoreOrder ?? false })
        : null;
    const data = {
      examId,
      subject: "english",
      num,
      type: q.type,
      topic: q.topic,
      skill: q.skill,
      grade: q.grade,
      tags: "[]",
      points: 1,
      stem: q.stem,
      options: q.options ? JSON.stringify(q.options.map((text, i) => ({ id: L[i], text }))) : "[]",
      correct: q.correct ?? null,
      answerSchema,
      unit: null,
      placeholder: q.type === "fill" ? "Your answer..." : null,
      modelAnswer: q.modelAnswer ?? null,
      figure: null,
      passageId: q.passageRef ? passageId.get(q.passageRef) ?? null : null,
      source: SOURCE_TAG,
      active: true,
    };
    await prisma.question.upsert({ where: { id: qid }, update: data, create: { id: qid, ...data } });
  }
  // Drop trailing questions from a previous longer version.
  await prisma.question.deleteMany({ where: { examId, num: { gt: QUESTIONS.length } } });

  console.log(`\n✓ Done. "${EXAM_TITLE}" — ${QUESTIONS.length} câu / ${PASSAGES.length} ngữ liệu cho ${OWNER_EMAIL} (${examId}).`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
