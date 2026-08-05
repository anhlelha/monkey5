/**
 * Seed an English "Bài thầy giao" (private remedial set) for student mika —
 * the English counterpart of scripts/seed-remedial-mika.ts.
 *
 * Sources (public/ref_exam/English/Bài thêm/):
 *   - Test_1_Answer_Key.pdf         → "TEST 1"
 *   - Test_4_K5_Answer_Key.docx     → "TEST 4 — K5"
 *   - Test_5_K5_Answer_Key.docx     → "TEST 5 — K5"
 * Multi-test: seeds every entry in the TESTS array (one private Exam each).
 *
 * Faithful to the paper:
 *   - Section rubrics (câu dẫn đề) are stored in Exam.sections ({num,header})
 *     so the runner + results view print a header block above the first question
 *     of each part (I/II/III/IV and sub-parts 1.1, 1.2, 2.1, ...). See
 *     lib/exam.ts getExamSectionHeader + ExamRunner/ResultsView rendering.
 *   - Underlined parts (phonetics options, synonym/antonym targets) and bold
 *     words (reading "that", word-form/writing keywords) are rendered via KaTeX
 *     inside MathText: u()=\underline{\text{…}}, b()=\textbf{…}. MathText only
 *     understands $…$ (KaTeX) + plain text — no markdown/HTML — so this is the
 *     only way to show underline/bold.
 *   - The reading passage (2.1) + cloze text (2.2) are the verbatim originals.
 *
 * Model (see docs/REMEDIAL-SETS-DESIGN.md + CLAUDE.md multi-subject section):
 *   - The whole test = ONE private Exam (subject "english", ownerUserId = mika),
 *     shown at /luyen-rieng ("Bài thầy giao"), gated owner-only in the runner.
 *   - Deterministic exam id `rmd-<userId>-en-test1` → upsert (NOT delete) keeps
 *     the Exam row + Attempt history across re-seeds. Questions are updated IN
 *     PLACE (deterministic id) so Attempt.answers (keyed by Question.id) survive.
 *   - Each question keeps a real english topic + skill + grade (A1/A2/B1) so it
 *     still feeds mastery/readiness like a real exam.
 *
 * Idempotent. Owner overridable via CLI:
 *   npx tsx scripts/seed-remedial-mika-en.ts user-demo@local
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const OWNER_EMAIL = (process.argv[2] || "mikayeubo@gmail.com").toLowerCase();
const OWNER_NAME = OWNER_EMAIL === "mikayeubo@gmail.com" ? "Mika" : OWNER_EMAIL.split("@")[0];
const SOURCE_TAG = "en-remedial-mika";

const L = ["A", "B", "C", "D"] as const;

// KaTeX helpers (MathText renders $…$ via KaTeX; plain text otherwise).
const u = (s: string) => `$\\underline{\\text{${s}}}$`; // underlined part
const b = (s: string) => `$\\textbf{${s}}$`; // bold word(s)

type QType = "mcq" | "fill" | "essay";
type Grade = "A1" | "A2" | "B1";
type Skill = "pron" | "useofenglish" | "comm" | "reading" | "writing";

interface RQ {
  type: QType;
  topic: string;
  skill: Skill;
  grade: Grade;
  stem: string;
  options?: string[];
  correct: string | null;
  accept?: string[];
  ignoreOrder?: boolean;
  passageRef?: string;
  modelAnswer?: string;
}

interface Passage {
  ref: string;
  title: string;
  kind: string;
  body: string;
}

interface SectionHeader {
  num: number; // header shown ABOVE the question with this num
  header: string;
}

// One private English test = one Exam. mika now has more than one ("thầy giao"),
// so this script seeds an array of them (deterministic id `rmd-<userId>-<key>`).
interface TestDef {
  key: string; // exam id suffix, e.g. "en-test1"
  title: string;
  minutes: number;
  position: number; // order on /luyen-rieng
  sections: SectionHeader[];
  passages: Passage[];
  questions: RQ[];
}

// ─── Section headers (verbatim rubrics from the paper) ─────────────────────────
const SECTIONS: SectionHeader[] = [
  { num: 1, header: "I. PHONETICS — 1.1. Choose the word whose underlined part is differently pronounced from the others." },
  { num: 4, header: "1.2. Choose the word whose main stress is different from the others." },
  { num: 7, header: "II. READING COMPREHENSION — 2.1. Read the following passage and mark the letter A, B, C, or D to indicate the correct answer to each of the questions." },
  { num: 12, header: "2.2. Read the text below and decide which answer A, B, C or D fits each space." },
  { num: 22, header: "III. GRAMMAR AND VOCABULARY — 3.1. Choose the best option to complete the sentences." },
  { num: 32, header: "3.2. Conversation — Mark A, B, C, or D to indicate the most suitable response to complete each of the following exchanges." },
  { num: 34, header: "3.3. Synonyms & Antonyms — (a) Indicate the word(s) CLOSEST in meaning to the underlined word(s) in each of the following questions." },
  { num: 36, header: "(b) Indicate the word(s) OPPOSITE in meaning to the underlined word(s) in each of the following questions." },
  { num: 38, header: "3.4. Give the correct form of the words in brackets." },
  { num: 42, header: "IV. WRITING — 4.1. Rewrite each of the following sentences so that it means the same as the sentence printed before it. Use the bold word(s) given in brackets. Do not alter the given words in any way." },
  { num: 47, header: "4.2. Write meaningful sentences using the given words." },
];

// ─── Passages (verbatim from the paper) ────────────────────────────────────────
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
  // 1.1 PHONETICS — pronunciation (en-phon); underlined letters via u()
  { type: "mcq", topic: "en-phon", skill: "pron", grade: "A2", stem: "",
    options: ["sk" + u("a") + "ting", "st" + u("a") + "tus", "st" + u("a") + "dium", "st" + u("a") + "tue"], correct: "D",
    modelAnswer: "D — statue có \"a\" phát âm /æ/; skating, status, stadium đều /eɪ/." },
  { type: "mcq", topic: "en-phon", skill: "pron", grade: "A2", stem: "",
    options: ["definition" + u("s"), "document" + u("s"), "comb" + u("s"), "door" + u("s")], correct: "B",
    modelAnswer: "B — documents có \"-s\" phát âm /s/ (sau âm /t/ vô thanh); definitions, combs, doors đều /z/." },
  { type: "mcq", topic: "en-phon", skill: "pron", grade: "A2", stem: "",
    options: ["work" + u("ed"), "mov" + u("ed"), "stopp" + u("ed"), "brush" + u("ed")], correct: "B",
    modelAnswer: "B — moved có \"-ed\" phát âm /d/; worked, stopped, brushed đều /t/ (sau âm vô thanh)." },

  // 1.2 PHONETICS — stress (en-stress)
  { type: "mcq", topic: "en-stress", skill: "pron", grade: "A2", stem: "",
    options: ["relax", "wonder", "problem", "special"], correct: "A",
    modelAnswer: "A — relax trọng âm âm tiết 2 (re·LAX); ba từ còn lại trọng âm âm tiết 1." },
  { type: "mcq", topic: "en-stress", skill: "pron", grade: "B1", stem: "",
    options: ["popularity", "conscientious", "apprenticeship", "personality"], correct: "C",
    modelAnswer: "C — apprenticeship trọng âm âm tiết 2 (ap·PREN·tice·ship); ba từ còn lại trọng âm âm tiết 3." },
  { type: "mcq", topic: "en-stress", skill: "pron", grade: "B1", stem: "",
    options: ["celebrate", "fascinating", "survive", "elephant"], correct: "C",
    modelAnswer: "C — survive trọng âm âm tiết 2 (sur·VIVE); ba từ còn lại trọng âm âm tiết 1." },

  // 2.1 READING — passage "men" (en-read)
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "men",
    stem: "What does the word \"" + b("that") + "\" in the passage refer to?",
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
    stem: "The phrase \"" + b("to do the leaving") + "\" is closest in meaning to:",
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

  // 2.2 READING — cloze "earth" (en-read)
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Điền vào chỗ trống (1):",
    options: ["situation", "place", "position", "site"], correct: "B",
    modelAnswer: "B — \"the only place we know of in the universe\" (nơi duy nhất)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Điền vào chỗ trống (2):",
    options: ["Although", "Still", "Yet", "Despite"], correct: "C",
    modelAnswer: "C — \"Yet human activities...\" (Tuy nhiên); đứng đầu mệnh đề, không cần danh từ như Despite." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Điền vào chỗ trống (3):",
    options: ["continues", "repeats", "carries", "follows"], correct: "C",
    modelAnswer: "C — carry on = tiếp tục (carries on consuming)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Điền vào chỗ trống (4):",
    options: ["already", "just", "for", "entirely"], correct: "B",
    modelAnswer: "B — \"do so just to stay alive\" (chỉ để tồn tại)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Điền vào chỗ trống (5):",
    options: ["sooner", "neither", "either", "rather"], correct: "C",
    modelAnswer: "C — cấu trúc either... or (either built on or washed into the sea)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Điền vào chỗ trống (6):",
    options: ["development", "result", "reaction", "product"], correct: "B",
    modelAnswer: "B — \"As a result\" (kết quả là)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Điền vào chỗ trống (7):",
    options: ["doing", "having", "taking", "making"], correct: "D",
    modelAnswer: "D — make demands on (đặt ra yêu cầu)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Điền vào chỗ trống (8):",
    options: ["hold", "maintain", "stay", "keep"], correct: "D",
    modelAnswer: "D — keep us fed/comfortable (giữ cho...)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Điền vào chỗ trống (9):",
    options: ["last", "stand", "go", "remain"], correct: "A",
    modelAnswer: "A — last indefinitely (tồn tại lâu dài)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "earth",
    stem: "Điền vào chỗ trống (10):",
    options: ["out", "off", "over", "down"], correct: "A",
    modelAnswer: "A — run out (cạn kiệt)." },

  // 3.1 GRAMMAR — choose the best option (en-gram)
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

  // 3.2 CONVERSATION (en-comm)
  { type: "mcq", topic: "en-comm", skill: "comm", grade: "A2",
    stem: "Linda: \"It's been a tough couple of months, but I think the worst is behind us now.\" Jill: \"___\"",
    options: ["Good morning", "Good luck!", "Good!", "Goodness me!"], correct: "C",
    modelAnswer: "C (Good!) — phản hồi tích cực khi nghe tin điều tệ nhất đã qua." },
  { type: "mcq", topic: "en-comm", skill: "comm", grade: "A2",
    stem: "Linda: \"What a nice new style of hair you have it cut!\" Jill: \"___\"",
    options: ["No, I think it's suitable for me", "It's from Italy", "Thank you", "Yes, please"], correct: "C",
    modelAnswer: "C (Thank you) — đáp lại lời khen lịch sự." },

  // 3.3 (a) SYNONYMS — closest in meaning (en-synant); underlined targets via u()
  { type: "mcq", topic: "en-synant", skill: "useofenglish", grade: "B1",
    stem: "In remote communities, it's important to " + u("replenish") + " stocks before the winter sets in.",
    options: ["empty", "remake", "repeat", "refill"], correct: "D",
    modelAnswer: "D (refill) — replenish = bổ sung/làm đầy lại = refill." },
  { type: "mcq", topic: "en-synant", skill: "useofenglish", grade: "B1",
    stem: u("Nearly all") + " weather occurs in the troposphere, the lowest layer of the earth's atmosphere.",
    options: ["Closely to", "Barely", "Almost", "After"], correct: "C",
    modelAnswer: "C (Almost) — nearly all = almost all (gần như tất cả)." },

  // 3.3 (b) ANTONYMS — opposite in meaning (en-synant)
  { type: "mcq", topic: "en-synant", skill: "useofenglish", grade: "B1",
    stem: "They have not made any effort to " + u("integrate") + " with the local community.",
    options: ["cooperate", "put together", "separate", "connect"], correct: "C",
    modelAnswer: "C (separate) — integrate (hòa nhập) trái nghĩa với separate (tách biệt)." },
  { type: "mcq", topic: "en-synant", skill: "useofenglish", grade: "B1",
    stem: "There has been " + u("insufficient") + " rainfall over the past two years, and farmers are having trouble.",
    options: ["adequate", "unsatisfactory", "abundant", "dominant"], correct: "A",
    modelAnswer: "A (adequate) — insufficient (không đủ) trái nghĩa với adequate (đủ)." },

  // 3.4 WORD FORMS — give the correct form (en-vocab, fill); keyword bold via b()
  { type: "fill", topic: "en-vocab", skill: "useofenglish", grade: "A2",
    stem: "Housework has ___ been regarded as women's work. " + b("(TRADITION)"),
    correct: "traditionally", accept: ["traditionally"],
    modelAnswer: "traditionally — trạng từ bổ nghĩa động từ." },
  { type: "fill", topic: "en-vocab", skill: "useofenglish", grade: "A2",
    stem: "We will live happier and ___ life if we keep our environment clean. " + b("(HEALTH)"),
    correct: "healthier", accept: ["healthier"],
    modelAnswer: "healthier — tính từ so sánh hơn (healthy → healthier)." },
  { type: "fill", topic: "en-vocab", skill: "useofenglish", grade: "A2",
    stem: "It is ___ of you to cheat in the exam. " + b("(HONEST)"),
    correct: "dishonest", accept: ["dishonest"],
    modelAnswer: "dishonest — nghĩa phủ định — gian lận là không trung thực." },
  { type: "fill", topic: "en-vocab", skill: "useofenglish", grade: "B1",
    stem: "___ is now a serious problem in many countries. " + b("(FOREST)"),
    correct: "Deforestation", accept: ["Deforestation"],
    modelAnswer: "Deforestation — danh từ — nạn phá rừng." },

  // 4.1 WRITING — rewrite (en-cwrite, fill/text_set). Stem shows original + the
  // paper's lead-in start + bold keyword. accept: full sentence AND the lead-in-
  // stripped continuation (student may type either) + obvious contraction forms.
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "It took us three hours to find a room for the night.\n→ We ______ " + b("(SPENT)"),
    correct: "We spent three hours finding a room for the night.",
    accept: [
      "We spent three hours finding a room for the night",
      "spent three hours finding a room for the night",
      "We spent 3 hours finding a room for the night",
    ],
    modelAnswer: "We spent three hours finding a room for the night." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "Would you rather I stayed with you during the holidays?\n→ Would you ______ " + b("(PREFER)"),
    correct: "Would you prefer me to stay with you during the holidays?",
    accept: [
      "Would you prefer me to stay with you during the holidays",
      "prefer me to stay with you during the holidays",
    ],
    modelAnswer: "Would you prefer me to stay with you during the holidays?" },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "The English test was not easy enough for me to do well.\n→ The English test ______ " + b("(SO)"),
    correct: "The English test was so difficult that I could not do well.",
    accept: [
      "The English test was so difficult that I could not do well",
      "The English test was so difficult that I couldn't do well",
      "was so difficult that I could not do well",
      "was so difficult that I couldn't do well",
    ],
    modelAnswer: "The English test was so difficult that I could not do well." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "The police said Jim had stolen the money.\n→ The police ______ " + b("(ACCUSED)"),
    correct: "The police accused Jim of stealing the money.",
    accept: [
      "The police accused Jim of stealing the money",
      "accused Jim of stealing the money",
    ],
    modelAnswer: "The police accused Jim of stealing the money." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "Because of his illness, he could not work effectively.\n→ His illness ______ " + b("(IMPOSSIBLE)"),
    correct: "His illness made it impossible for him to work effectively.",
    accept: [
      "His illness made it impossible for him to work effectively",
      "made it impossible for him to work effectively",
    ],
    modelAnswer: "His illness made it impossible for him to work effectively." },

  // 4.2 WRITING — build meaningful sentences (en-cwrite, fill/text_set)
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "when / hot / he / go / swim / river / front / his house.",
    correct: "When it is hot, he goes swimming in the river in front of his house.",
    accept: [
      "When it is hot, he goes swimming in the river in front of his house",
      "When it's hot, he goes swimming in the river in front of his house",
    ],
    modelAnswer: "When it is hot, he goes swimming in the river in front of his house." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "she / usually / listen / music / night.",
    correct: "She usually listens to music at night.",
    accept: ["She usually listens to music at night"],
    modelAnswer: "She usually listens to music at night." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "this coffee / hot / that / I / not / drink it.",
    correct: "This coffee is so hot that I cannot drink it.",
    accept: [
      "This coffee is so hot that I cannot drink it",
      "This coffee is so hot that I can't drink it",
    ],
    modelAnswer: "This coffee is so hot that I cannot drink it." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "you / know / who / best / English / your grade?",
    correct: "Do you know who is the best at English in your grade?",
    accept: [
      "Do you know who is the best at English in your grade",
      "Do you know who is best at English in your grade",
    ],
    modelAnswer: "Do you know who is the best at English in your grade?" },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "air pollution / serious problem / many / big city.",
    correct: "Air pollution is a serious problem in many big cities.",
    accept: ["Air pollution is a serious problem in many big cities"],
    modelAnswer: "Air pollution is a serious problem in many big cities." },
];

// ─── TEST 4 (K5) ───────────────────────────────────────────────────────────
// Source: public/ref_exam/English/Bài thêm/Test_4_K5_Answer_Key.docx
const T4_SECTIONS: SectionHeader[] = [
  { num: 1, header: "I. PHONETICS — 1.1. Choose the word whose main stress is different from the others." },
  { num: 4, header: "1.2. Choose the word whose underlined part is differently pronounced from the others." },
  { num: 6, header: "II. READING COMPREHENSION — 2.1. Choose the word or phrase which best completes each blank in the following passage." },
  { num: 16, header: "2.2. Read the following passage and mark the letter A, B, C, or D to indicate the correct answer to each of the questions." },
  { num: 21, header: "III. GRAMMAR AND VOCABULARY — 3.1. Choose the correct answer to each of the following questions." },
  { num: 31, header: "3.2. Synonyms & Antonyms — (a) Choose the word(s) CLOSEST in meaning to the underlined word(s) in each of the following questions." },
  { num: 33, header: "(b) Choose the word(s) OPPOSITE in meaning to the underlined word(s) in each of the following questions." },
  { num: 35, header: "3.3. Conversation — Choose the most suitable response to complete each of the following exchanges." },
  { num: 37, header: "3.4. Give the correct form of the given words." },
  { num: 41, header: "IV. WRITING — 4.1. Rewrite the sentences without changing their meaning, beginning as shown." },
  { num: 46, header: "4.2. Build complete sentences with the given words." },
];

const T4_PASSAGES: Passage[] = [
  {
    ref: "myhome",
    title: "My home is in the air",
    kind: "cloze",
    body:
      "My home is in the air. I do an enormous amount of travelling. It is a fast life and (1) ___ of " +
      "work, but I like it and that is the only way (2) ___ me. Everything is tiring — music, travelling — " +
      "but what can I do? I am not (3) ___ to complaining. It is hard to imagine now (4) ___ I will ever be " +
      "very long in one place. My home town is on the Caspian Sea. There is sea, wind, sun, and (5) ___ " +
      "many tourists and hotels. I have my own flat with four or five rooms, but I am seldom there. If I am " +
      "there for a day or two, I prefer to (6) ___ with my mother and grandmother. They live in a small " +
      "house, (7) ___ it is very comfortable and my mother cooks for me. I like good, simple food. I have " +
      "no wife, no brothers or sisters and my father (8) ___ when I was seven. He was an engineer and I " +
      "don't (9) ___ him very well. He liked music very much and wanted me to (10) ___ a musician.",
  },
  {
    ref: "thanksgiving",
    title: "Thanksgiving",
    kind: "article",
    body:
      "Thanksgiving is celebrated in the US on the fourth Thursday in November. For many Americans, it is " +
      "the most important holiday apart from Christmas. Schools, offices and most businesses close for " +
      "Thanksgiving, and many people make the whole weekend a vacation. Thanksgiving is associated with " +
      "the time when Europeans first came to North America. In 1620, the ship the Mayflower arrived, " +
      "bringing about 150 people who today are usually called Pilgrims. They arrived at the beginning of a " +
      "very hard winter and could not find enough to eat, so many of them died. But in the following " +
      "summer, Native Americans showed them what foods were safe to eat, so that they could save food for " +
      "the next winter. They held a big celebration to thank God and the Native Americans for the fact " +
      "that they had survived.\n\n" +
      "Today people celebrate Thanksgiving to remember these early days. The most important part of the " +
      "celebration is a traditional dinner with foods that come from North America. The meal includes " +
      "turkey, sweet potatoes (also called yams) and cranberries, which are made into a kind of sauce or " +
      "jelly. The turkey is filled with stuffing or dressing, and many families have their own special " +
      "recipe. Dessert is pumpkin made into a pie. On Thanksgiving, there are special television programs " +
      "and sports events. In New York there is the Macy's Thanksgiving Day Parade, when a long line of " +
      "people wearing fancy costumes march through the streets with large balloons in the shape of " +
      "imaginary characters. Thanksgiving is considered the beginning of the Christmas period, and the " +
      "next day many people go out to shop for Christmas presents.",
  },
];

const T4_QUESTIONS: RQ[] = [
  // 1.1 STRESS (en-stress)
  { type: "mcq", topic: "en-stress", skill: "pron", grade: "A2", stem: "",
    options: ["solar", "image", "danger", "oasis"], correct: "D",
    modelAnswer: "D — oasis trọng âm âm tiết 2 (o·A·sis); solar, image, danger trọng âm âm tiết 1." },
  { type: "mcq", topic: "en-stress", skill: "pron", grade: "A2", stem: "",
    options: ["reference", "interview", "government", "understand"], correct: "D",
    modelAnswer: "D — understand trọng âm âm tiết 3 (un·der·STAND); ba từ còn lại trọng âm âm tiết 1." },
  { type: "mcq", topic: "en-stress", skill: "pron", grade: "B1", stem: "",
    options: ["scholarship", "develop", "equipment", "discourage"], correct: "A",
    modelAnswer: "A — scholarship trọng âm âm tiết 1; develop, equipment, discourage trọng âm âm tiết 2." },

  // 1.2 PRONUNCIATION — underlined part via u()
  { type: "mcq", topic: "en-phon", skill: "pron", grade: "A2", stem: "",
    options: ["tou" + u("gh"), "rou" + u("gh"), "throu" + u("gh"), "enou" + u("gh")], correct: "C",
    modelAnswer: "C — through có \"gh\" câm (không phát âm); tough, rough, enough có \"gh\" = /f/." },
  { type: "mcq", topic: "en-phon", skill: "pron", grade: "B1", stem: "",
    options: ["ex" + u("h") + "ibition", u("h") + "oliday", "child" + u("h") + "ood", u("h") + "ilarious"], correct: "A",
    modelAnswer: "A — exhibition có \"h\" câm; holiday, childhood, hilarious có \"h\" = /h/." },

  // 2.1 CLOZE — passage "myhome" (en-read)
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "myhome",
    stem: "Điền vào chỗ trống (1):", options: ["most", "full", "complete", "more"], correct: "B",
    modelAnswer: "B (full) — a fast life and full of work (đầy ắp công việc)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "myhome",
    stem: "Điền vào chỗ trống (2):", options: ["for", "to", "in", "by"], correct: "A",
    modelAnswer: "A (for) — the only way for me (cách duy nhất đối với tôi)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "myhome",
    stem: "Điền vào chỗ trống (3):", options: ["wanted", "taken", "used", "known"], correct: "C",
    modelAnswer: "C (used) — be used to + V-ing (quen với)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "myhome",
    stem: "Điền vào chỗ trống (4):", options: ["and", "so", "while", "that"], correct: "D",
    modelAnswer: "D (that) — imagine that... (hình dung rằng)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "myhome",
    stem: "Điền vào chỗ trống (5):", options: ["far", "too", "much", "more"], correct: "B",
    modelAnswer: "B (too) — too many tourists (quá nhiều)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "myhome",
    stem: "Điền vào chỗ trống (6):", options: ["stay", "go", "do", "spend"], correct: "A",
    modelAnswer: "A (stay) — stay with somebody (ở cùng ai)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "myhome",
    stem: "Điền vào chỗ trống (7):", options: ["but", "since", "even", "which"], correct: "A",
    modelAnswer: "A (but) — a small house, but it is very comfortable (tương phản)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "myhome",
    stem: "Điền vào chỗ trống (8):", options: ["killed", "gone", "passed", "died"], correct: "D",
    modelAnswer: "D (died) — my father died (nội động từ; 'passed' cần 'away')." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "myhome",
    stem: "Điền vào chỗ trống (9):", options: ["know", "remember", "remind", "see"], correct: "B",
    modelAnswer: "B (remember) — I don't remember him very well (nhớ)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "myhome",
    stem: "Điền vào chỗ trống (10):", options: ["become", "turn", "develop", "grow"], correct: "A",
    modelAnswer: "A (become) — wanted me to become a musician (trở thành)." },

  // 2.2 READING COMPREHENSION — passage "thanksgiving" (en-read)
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "thanksgiving",
    stem: "According to the passage, Pilgrims are",
    options: [
      "native Americans who live in North America",
      "people who left their home and went to live in North America in the 1620s",
      "people who traveled to America by ships",
      "trips that religious people make to a holy place",
    ], correct: "B",
    modelAnswer: "B — Pilgrims là những người rời quê hương đến sống ở Bắc Mỹ vào những năm 1620." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "thanksgiving",
    stem: "Which of the following is NOT true?",
    options: [
      "In the US, Thanksgiving is not a national holiday; it's a religious holiday",
      "Christmas comes less than a month after Thanksgiving",
      "The Macy's Thanksgiving Day Parade is colourful and exciting",
      "Thanksgiving was originally celebrated by the first Europeans in North America to thank God for their survival",
    ], correct: "A",
    modelAnswer: "A — SAI: trường học, công sở đều đóng cửa nên nó là ngày nghỉ toàn quốc, không phải chỉ là lễ tôn giáo." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "thanksgiving",
    stem: "In the United States, Thanksgiving is",
    options: [
      "celebrated as a public holiday",
      "a religious celebration held by Christians only",
      "apart from Christmas",
      "more important than Christmas",
    ], correct: "A",
    modelAnswer: "A — được tổ chức như một ngày lễ công cộng (trường học/công sở đóng cửa)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "thanksgiving",
    stem: "All of the following statements are mentioned EXCEPT",
    options: [
      "People usually have traditional dinners on Thanksgiving",
      "There are lots of entertainments on Thanksgiving",
      "People celebrate Thanksgiving to thank God",
      "People go to churches for religious services on Thanksgiving",
    ], correct: "D",
    modelAnswer: "D — bài không nhắc đến việc đi nhà thờ làm lễ." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "thanksgiving",
    stem: "Which of the following statements is NOT true about Thanksgiving?",
    options: [
      "People go out to shop for Christmas presents",
      "People wear coloured costumes marching through the streets",
      "Turkey, yams and pumpkin pies are served",
      "People join in the Macy's Thanksgiving Day Parade",
    ], correct: "A",
    modelAnswer: "A — việc đi mua quà Giáng sinh diễn ra vào NGÀY HÔM SAU, không phải trong ngày Lễ Tạ ơn." },

  // 3.1 GRAMMAR (en-gram)
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "A2",
    stem: "They have just found the couple and their car ___ were swept away during the heavy storm last week.",
    options: ["that", "which", "whose", "when"], correct: "A",
    modelAnswer: "A (that) — 'that' thay được cho cả người và vật (the couple and their car)." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "B1",
    stem: "I was brought ___ in the countryside by my aunt after my parents had passed ___.",
    options: ["on / over", "for / on", "on / off", "up / away"], correct: "D",
    modelAnswer: "D (up / away) — bring up (nuôi dạy); pass away (qua đời)." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "B1",
    stem: "Since I ___ a child, I have liked to solve maths puzzles.",
    options: ["am", "was", "have been", "had been"], correct: "B",
    modelAnswer: "B (was) — since + mốc quá khứ (when I was a child)." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "A2",
    stem: "The zookeeper wanted us ___ near the bars.",
    options: ["that we didn't put our hands", "don't put our hands", "not putting our hands", "not to put our hands"], correct: "D",
    modelAnswer: "D (not to put our hands) — want somebody (not) to do something." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "B1",
    stem: "___ we had planned everything carefully, a lot of things went wrong.",
    options: ["Because", "Because of", "Despite", "Although"], correct: "D",
    modelAnswer: "D (Although) — Although + mệnh đề (mặc dù)." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "A2",
    stem: "No one can predict the future exactly. Things may happen ___.",
    options: ["expected", "unexpected", "expectedly", "unexpectedly"], correct: "D",
    modelAnswer: "D (unexpectedly) — trạng từ bổ nghĩa cho happen." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "B1",
    stem: "It's our responsibility to contribute to ___ our own lives.",
    options: ["growing", "heightening", "bettering", "increasing"], correct: "C",
    modelAnswer: "C (bettering) — better = cải thiện (làm cho tốt hơn)." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "A2",
    stem: "Oliver used to go fishing and ___.",
    options: ["so did I", "I did not", "so I did", "so did me"], correct: "A",
    modelAnswer: "A (so did I) — đồng tình khẳng định: So + trợ động từ + S." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "A2",
    stem: "It would be hard to name areas ___ computers are not being used.",
    options: ["how", "which", "what", "where"], correct: "D",
    modelAnswer: "D (where) — trạng từ quan hệ chỉ nơi chốn (areas)." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "B1",
    stem: "___ he felt so unhappy and lonely.",
    options: ["Rich as was he", "Rich as he was", "In spite of his being wealth", "Despite his wealthy"], correct: "B",
    modelAnswer: "B (Rich as he was) — đảo ngữ nhượng bộ: Adj + as + S + be (dù giàu có)." },

  // 3.2 (a) SYNONYMS — closest in meaning (en-synant); underlined target via u()
  { type: "mcq", topic: "en-synant", skill: "useofenglish", grade: "B1",
    stem: "Lucy will be " + u("like a dog with two tails") + " if she gets into the team.",
    options: ["very exhausted", "extremely pleased", "very proud", "extremely dazed"], correct: "B",
    modelAnswer: "B (extremely pleased) — 'like a dog with two tails' = cực kỳ vui sướng." },
  { type: "mcq", topic: "en-synant", skill: "useofenglish", grade: "B1",
    stem: "I'll take the new job whose salary is " + u("fantastic") + ".",
    options: ["reasonable", "wonderful", "pretty high", "acceptable"], correct: "B",
    modelAnswer: "B (wonderful) — fantastic = tuyệt vời." },

  // 3.2 (b) ANTONYMS — opposite in meaning (en-synant)
  { type: "mcq", topic: "en-synant", skill: "useofenglish", grade: "B1",
    stem: "Our traditions are very " + u("ancient") + " and our people are very proud of them.",
    options: ["modern", "real", "old", "young"], correct: "A",
    modelAnswer: "A (modern) — ancient (cổ xưa) trái nghĩa với modern (hiện đại)." },
  { type: "mcq", topic: "en-synant", skill: "useofenglish", grade: "B1",
    stem: "It is quite " + u("incredible") + " that he is unaware of such basic facts.",
    options: ["difficult", "unbelievable", "imaginable", "disappointed"], correct: "C",
    modelAnswer: "C (imaginable) — incredible (không thể tin) trái nghĩa với imaginable (có thể tưởng tượng/tin được); 'unbelievable' là đồng nghĩa nên loại." },

  // 3.3 CONVERSATION (en-comm)
  { type: "mcq", topic: "en-comm", skill: "comm", grade: "A2",
    stem: "Theo: \"Do you mind if I switch the light off?\" Nuttel: \"___\"",
    options: [
      "Yes, I mind it, sorry.",
      "What if I don't mind it?",
      "I'd rather you didn't, if you don't mind.",
      "Yes, please do it.",
    ], correct: "C",
    modelAnswer: "C — cách từ chối lịch sự lời đề nghị (Tôi mong bạn đừng, nếu không phiền)." },
  { type: "mcq", topic: "en-comm", skill: "comm", grade: "A2",
    stem: "Hana: \"The book is really interesting and educational.\" Jenifer: \"___\"",
    options: [
      "I'd love it.",
      "Don't mention it.",
      "That's nice of you to say so.",
      "I couldn't agree more.",
    ], correct: "D",
    modelAnswer: "D (I couldn't agree more) — hoàn toàn đồng ý với nhận xét." },

  // 3.4 WORD FORMS — give the correct form (en-vocab, fill); keyword bold via b()
  { type: "fill", topic: "en-vocab", skill: "useofenglish", grade: "A2",
    stem: "David has been a bit ___ today. " + b("(TROUBLE)"),
    correct: "troubled", accept: ["troubled"],
    modelAnswer: "troubled — tính từ — hơi bất ổn/lo lắng." },
  { type: "fill", topic: "en-vocab", skill: "useofenglish", grade: "A2",
    stem: "My boss was so angry that he was absolutely ___. " + b("(SPEECH)"),
    correct: "speechless", accept: ["speechless"],
    modelAnswer: "speechless — tính từ — không nói nên lời." },
  { type: "fill", topic: "en-vocab", skill: "useofenglish", grade: "B1",
    stem: "These clothes are attractive but entirely ___. " + b("(PRACTICE)"),
    correct: "impractical", accept: ["impractical"],
    modelAnswer: "impractical — tính từ phủ định — không thực dụng." },
  { type: "fill", topic: "en-vocab", skill: "useofenglish", grade: "A2",
    stem: "Thank you for your ___. " + b("(GENEROUS)"),
    correct: "generosity", accept: ["generosity"],
    modelAnswer: "generosity — danh từ — sự hào phóng." },

  // 4.1 WRITING — rewrite (en-cwrite, fill/text_set). Stem shows original + lead-in.
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "It took us three hours to open the door.\n→ We ______",
    correct: "We spent three hours opening the door.",
    accept: [
      "We spent three hours opening the door",
      "spent three hours opening the door",
      "We spent 3 hours opening the door",
    ],
    modelAnswer: "We spent three hours opening the door." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "I don't really like her, even though I admire her achievement.\n→ In spite ______",
    correct: "In spite of admiring her achievement, I don't really like her.",
    accept: [
      "In spite of admiring her achievement, I don't really like her",
      "In spite of admiring her achievement, I do not really like her",
      "of admiring her achievement, I don't really like her",
      "of admiring her achievement, I do not really like her",
    ],
    modelAnswer: "In spite of admiring her achievement, I don't really like her." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "My English friend finds using chopsticks difficult.\n→ My English friend isn't ______",
    correct: "My English friend isn't good at using chopsticks.",
    accept: [
      "My English friend isn't good at using chopsticks",
      "My English friend is not good at using chopsticks",
      "good at using chopsticks",
    ],
    modelAnswer: "My English friend isn't good at using chopsticks." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "\"I've seen the film three times, Mary\", said George.\n→ George told ______",
    correct: "George told Mary that he had seen the film three times.",
    accept: [
      "George told Mary that he had seen the film three times",
      "George told Mary he had seen the film three times",
      "Mary that he had seen the film three times",
      "Mary he had seen the film three times",
    ],
    modelAnswer: "George told Mary (that) he had seen the film three times." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "My brother studies now harder than he used to.\n→ My brother ______",
    correct: "My brother didn't use to study as hard as he does now.",
    accept: [
      "My brother didn't use to study as hard as he does now",
      "My brother did not use to study as hard as he does now",
      "didn't use to study as hard as he does now",
      "did not use to study as hard as he does now",
    ],
    modelAnswer: "My brother didn't use to study as hard as he does now." },

  // 4.2 WRITING — build meaningful sentences (en-cwrite, fill/text_set)
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "You / not pass / coming exam / unless / work / hard.",
    correct: "You will not pass the coming exam unless you work hard.",
    accept: [
      "You will not pass the coming exam unless you work hard",
      "You won't pass the coming exam unless you work hard",
    ],
    modelAnswer: "You will not pass the coming exam unless you work hard." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "James Watt / Scottish scientist / invent / steam engine.",
    correct: "James Watt was a Scottish scientist who invented the steam engine.",
    accept: ["James Watt was a Scottish scientist who invented the steam engine"],
    modelAnswer: "James Watt was a Scottish scientist who invented the steam engine." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "Sometimes / a country / refuse / take part / the Olympics.",
    correct: "Sometimes a country refuses to take part in the Olympics.",
    accept: ["Sometimes a country refuses to take part in the Olympics"],
    modelAnswer: "Sometimes a country refuses to take part in the Olympics." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "I / apologise / him / not able / arrive / on time.",
    correct: "I apologised to him for not being able to arrive on time.",
    accept: [
      "I apologised to him for not being able to arrive on time",
      "I apologized to him for not being able to arrive on time",
    ],
    modelAnswer: "I apologised to him for not being able to arrive on time." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "Mars / be / 140 million miles / know / red planet.",
    correct: "Mars, which is 140 million miles away, is known as the red planet.",
    accept: ["Mars, which is 140 million miles away, is known as the red planet"],
    modelAnswer: "Mars, which is 140 million miles away, is known as the red planet." },
];

// ─── TEST 5 (K5) ───────────────────────────────────────────────────────────
// Source: public/ref_exam/English/Bài thêm/Test_5_K5_Answer_Key.docx
const T5_SECTIONS: SectionHeader[] = [
  { num: 1, header: "I. PHONETICS — 1.1. Choose the word whose main stress is different from the others." },
  { num: 3, header: "1.2. Choose the word whose underlined part is differently pronounced from the others." },
  { num: 6, header: "II. READING COMPREHENSION — 2.1. Read the following passage and mark the letter A, B, C, or D to indicate the correct answer to each of the questions." },
  { num: 11, header: "2.2. Read the following passage and mark the letter A, B, C, or D to indicate the correct word(s) for each of the blanks." },
  { num: 21, header: "III. GRAMMAR AND VOCABULARY — 3.1. Choose the correct answer to each of the following questions." },
  { num: 31, header: "3.2. Give the correct form of the words in brackets." },
  { num: 35, header: "3.3. Synonyms & Antonyms — (a) Choose the word(s) CLOSEST in meaning to the underlined word(s) in each of the following questions." },
  { num: 37, header: "(b) Choose the word(s) OPPOSITE in meaning to the underlined word(s) in each of the following questions." },
  { num: 39, header: "3.4. Conversation — Choose the most suitable response to complete each of the following exchanges." },
  { num: 41, header: "IV. WRITING — 4.1. Use each set of words and phrases, with all necessary changes and additions, to make a complete sentence (together they form a paragraph)." },
  { num: 51, header: "4.2. Rewrite each sentence so that it is nearest in meaning to the sentence printed before it." },
];

const T5_PASSAGES: Passage[] = [
  {
    ref: "whales",
    title: "Whales",
    kind: "article",
    body:
      "Whales are the largest animals in the world, and the gentlest creatures we know. Although the " +
      "whale is very huge, it is not hindered at all by its size when it is in the water. Whales have " +
      "tails that end like flippers. With just a gentle flick, it can propel itself forward. The skin of a " +
      "whale is so smooth that it does not create any friction that can slow the whale down. A whale's " +
      "breathing hole is located on the top of its head, so it can breathe without having to completely " +
      "push its head out of the water. Whales are protected from the cold seawater by body fat that is " +
      "called blubber.\n\n" +
      "Whales live in the ocean but, in terms of behaviours, they are more similar to humans than fish. " +
      "They live in family groups and they even travel in groups when they have to migrate from cooler to " +
      "warmer waters. The young stay with their parents for as long as fifteen years. Whales are known not " +
      "to desert the ill or injured members; instead, they cradle them.\n\n" +
      "When whales are in danger, there are people who go to great lengths to help them. One such case " +
      "occurred in 1988, when three young whales were trapped in the sea. It was close to winter and the " +
      "sea had begun to freeze over. Whales are mammals that require oxygen from the air, so the frozen " +
      "ice was a great danger to them. All they had then was a tiny hole in the ice for them to breathe " +
      "through. Volunteers from all over soon turned up to help these creatures. They cut holes in the ice " +
      "to provide more breathing holes for the whales. These holes would also serve as guides for the " +
      "whales so that they could swim to warmer waters.",
  },
  {
    ref: "cycling",
    title: "Cycling",
    kind: "cloze",
    body:
      "Along (1) ___ jogging and swimming, cycling is one of the best all-round forms of exercise. It can " +
      "help to increase your strength and energy, giving you more (2) ___ muscles and a stronger heart. " +
      "But increasing your strength is not the only advantage of cycling. Because you are not (3) ___ the " +
      "weight of your body on your feet, it is a good form of exercise for people with painful feet or " +
      "backs. However, as with all forms of exercise, it is important to (4) ___ slowly and build up " +
      "gently. Doing too much too quickly can damage muscles that are not (5) ___ to working. If you have " +
      "any doubts about taking (6) ___ cycling for health reasons, talk to your doctor and ask his or her " +
      "advice. Ideally you should be cycling at (7) ___ two or three times a week. For the exercise to be " +
      "doing you (8) ___, you should get a little out of breath. Don't worry that if you begin to lose " +
      "your breath, it could be dangerous and there must be something wrong with your heart. This is " +
      "simply not true; shortness of breath (9) ___ that the exercise is having the right effect. However, " +
      "if you find you are in pain, (10) ___ you should stop and take a rest.",
  },
];

const T5_QUESTIONS: RQ[] = [
  // 1.1 STRESS (en-stress)
  { type: "mcq", topic: "en-stress", skill: "pron", grade: "A2", stem: "",
    options: ["mosquito", "document", "literature", "business"], correct: "A",
    modelAnswer: "A — mosquito trọng âm âm tiết 2 (mos·QUI·to); document, literature, business trọng âm âm tiết 1." },
  { type: "mcq", topic: "en-stress", skill: "pron", grade: "B1", stem: "",
    options: ["magazine", "preference", "cigarette", "engineer"], correct: "B",
    modelAnswer: "B — preference trọng âm âm tiết 1 (PREF·er·ence); magazine, cigarette, engineer trọng âm ở âm tiết cuối." },

  // 1.2 PRONUNCIATION — underlined part via u()
  { type: "mcq", topic: "en-phon", skill: "pron", grade: "A2", stem: "",
    options: [u("h") + "ealthy", "w" + u("h") + "om", u("h") + "onest", u("h") + "eal"], correct: "C",
    modelAnswer: "C — honest có \"h\" câm (không phát âm); healthy, whom, heal có \"h\" = /h/." },
  { type: "mcq", topic: "en-phon", skill: "pron", grade: "B1", stem: "",
    options: ["amuse" + u("s"), "repeat" + u("s"), "attack" + u("s"), "cough" + u("s")], correct: "A",
    modelAnswer: "A — amuses có \"-s\" = /ɪz/ (sau âm /z/); repeats, attacks, coughs có \"-s\" = /s/." },
  { type: "mcq", topic: "en-phon", skill: "pron", grade: "B1", stem: "",
    options: ["stoma" + u("ch"), u("ch") + "ange", "wat" + u("ch"), u("ch") + "urch"], correct: "A",
    modelAnswer: "A — stomach có \"ch\" = /k/; change, watch, church có \"ch\" = /tʃ/." },

  // 2.1 READING — passage "whales" (en-read)
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "whales",
    stem: "Which of the following best describes the main idea of this passage?",
    options: [
      "Whales as the only animals to live in warm water.",
      "Successful attempts to rescue whales all over the world.",
      "Some remarkable similarities of whales to humans.",
      "Whales as the largest, gentlest but vulnerable creatures.",
    ], correct: "D",
    modelAnswer: "D — cả bài mô tả cá voi là loài lớn nhất, hiền lành nhưng dễ bị tổn thương." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "whales",
    stem: "Whales can move easily in water thanks to their",
    options: ["tail and blubber", "skin and head", "size and head", "tail and skin"], correct: "D",
    modelAnswer: "D (tail and skin) — đuôi đẩy tới, da trơn không tạo ma sát." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "whales",
    stem: "According to the passage, why was the frozen ice on the sea surface a danger to whales?",
    options: [
      "Because they couldn't eat when the weather was too cold.",
      "Because whales couldn't breathe without sufficient oxygen.",
      "Because they couldn't swim in icy cold water.",
      "Because the water was too cold for them as they were warm-blooded.",
    ], correct: "B",
    modelAnswer: "B — cá voi là động vật có vú cần oxy từ không khí; băng bịt lỗ thở." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "whales",
    stem: "According to paragraph 2, the author mentions all of the following to show that whales \"are more similar to humans\" EXCEPT",
    options: [
      "the young stay with their parents for almost fifteen years",
      "they do not migrate from cooler to warmer waters",
      "they do not desert the ill or injured members",
      "they live in family groups and travel in groups",
    ], correct: "B",
    modelAnswer: "B — thực tế cá voi CÓ di cư từ vùng nước lạnh sang ấm, nên đây không phải điểm giống người được nêu." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "A2", passageRef: "whales",
    stem: "The word \"" + b("tiny") + "\" in paragraph 3 probably means",
    options: ["very deep", "very ugly", "very small", "very fat"], correct: "C",
    modelAnswer: "C (very small) — tiny = rất nhỏ." },

  // 2.2 CLOZE — passage "cycling" (en-read)
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "cycling",
    stem: "Điền vào chỗ trống (1):", options: ["on", "at", "by", "with"], correct: "D",
    modelAnswer: "D (with) — along with = cùng với." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "cycling",
    stem: "Điền vào chỗ trống (2):", options: ["confident", "efficient", "better", "reliable"], correct: "B",
    modelAnswer: "B (efficient) — cơ bắp hoạt động hiệu quả hơn." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "cycling",
    stem: "Điền vào chỗ trống (3):", options: ["bringing", "carrying", "lifting", "arising"], correct: "B",
    modelAnswer: "B (carrying) — not carrying the weight of your body (không dồn trọng lượng)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "cycling",
    stem: "Điền vào chỗ trống (4):", options: ["make", "take", "start", "do"], correct: "C",
    modelAnswer: "C (start) — start slowly and build up gently (bắt đầu chậm)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "cycling",
    stem: "Điền vào chỗ trống (5):", options: ["have", "ought", "used", "made"], correct: "C",
    modelAnswer: "C (used) — be used to + V-ing (quen với)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "cycling",
    stem: "Điền vào chỗ trống (6):", options: ["in", "up", "out", "on"], correct: "B",
    modelAnswer: "B (up) — take up cycling (bắt đầu chơi/tập)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "cycling",
    stem: "Điền vào chỗ trống (7):", options: ["best", "all", "least", "times"], correct: "C",
    modelAnswer: "C (least) — at least (ít nhất)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "cycling",
    stem: "Điền vào chỗ trống (8):", options: ["good", "well", "nice", "fine"], correct: "A",
    modelAnswer: "A (good) — do somebody good (có ích cho ai)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "cycling",
    stem: "Điền vào chỗ trống (9):", options: ["tells", "shows", "points", "appears"], correct: "B",
    modelAnswer: "B (shows) — shortness of breath shows that... (cho thấy)." },
  { type: "mcq", topic: "en-read", skill: "reading", grade: "B1", passageRef: "cycling",
    stem: "Điền vào chỗ trống (10):", options: ["then", "though", "even", "yet"], correct: "A",
    modelAnswer: "A (then) — if..., then you should stop (thì)." },

  // 3.1 GRAMMAR (en-gram)
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "B1",
    stem: "This room ___ since I was born.",
    options: ["has been painted", "was painted", "painted", "has painted"], correct: "A",
    modelAnswer: "A (has been painted) — hiện tại hoàn thành bị động với 'since'." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "A2",
    stem: "\"Have you seen the Titanic yet?\" \"No, I haven't. I ___ it next Saturday.\"",
    options: ["would see", "will see", "am going to see", "see"], correct: "C",
    modelAnswer: "C (am going to see) — kế hoạch đã định (next Saturday)." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "A2",
    stem: "After ___ dinner, I often watch TV.",
    options: ["ate", "eat", "eaten", "eating"], correct: "D",
    modelAnswer: "D (eating) — after + V-ing." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "B1",
    stem: "Tom said that he ___ his motorbike the day before.",
    options: ["had lost", "lost", "has lost", "lose"], correct: "A",
    modelAnswer: "A (had lost) — quá khứ hoàn thành trong câu tường thuật ('the day before')." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "B1",
    stem: "Overwork is ___ to cause increased stress.",
    options: ["likely", "possible", "possibly", "obviously"], correct: "A",
    modelAnswer: "A (likely) — be likely to do something." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "B1",
    stem: "The husband is ill in ___ hospital, so she has to stay at ___ home to look after ___ children instead of going to work.",
    options: ["0 / 0 / 0", "the / the / the", "0 / 0 / the", "0 / the / the"], correct: "C",
    modelAnswer: "C (0 / 0 / the) — in hospital, at home (không mạo từ); the children (xác định)." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "A2",
    stem: "The beautiful woman has a busy ___ life.",
    options: ["society", "socialize", "social", "socializing"], correct: "C",
    modelAnswer: "C (social) — social life (đời sống xã hội)." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "A2",
    stem: "English has become the main language of ___.",
    options: ["communication", "communicate", "communicant", "communicative"], correct: "A",
    modelAnswer: "A (communication) — danh từ sau 'of'." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "A2",
    stem: "I spoke very slowly ___ he didn't understand English very well.",
    options: ["to", "so that", "because", "so"], correct: "C",
    modelAnswer: "C (because) — chỉ nguyên nhân." },
  { type: "mcq", topic: "en-gram", skill: "useofenglish", grade: "B1",
    stem: "Can we find ___ at the hotel for the night?",
    options: ["house", "room", "accommodation", "stay"], correct: "C",
    modelAnswer: "C (accommodation) — chỗ ở (danh từ không đếm được)." },

  // 3.2 WORD FORMS — give the correct form (en-vocab, fill); keyword bold via b()
  { type: "fill", topic: "en-vocab", skill: "useofenglish", grade: "B1",
    stem: "It is ___ for our students to make mistakes in English. " + b("(AVOID)"),
    correct: "unavoidable", accept: ["unavoidable"],
    modelAnswer: "unavoidable — tính từ — không thể tránh khỏi." },
  { type: "fill", topic: "en-vocab", skill: "useofenglish", grade: "A2",
    stem: "Teenagers are now ___ dressed. " + b("(FASHION)"),
    correct: "fashionably", accept: ["fashionably"],
    modelAnswer: "fashionably — trạng từ — ăn mặc thời trang." },
  { type: "fill", topic: "en-vocab", skill: "useofenglish", grade: "B1",
    stem: "Novelists are among the most ___ people in the world. " + b("(IMAGINE)"),
    correct: "imaginative", accept: ["imaginative"],
    modelAnswer: "imaginative — tính từ — giàu trí tưởng tượng." },
  { type: "fill", topic: "en-vocab", skill: "useofenglish", grade: "A2",
    stem: "___ is sometimes a very bad habit. " + b("(CURIOUS)"),
    correct: "Curiosity", accept: ["Curiosity"],
    modelAnswer: "Curiosity — danh từ — sự tò mò." },

  // 3.3 (a) SYNONYMS — closest in meaning (en-synant); underlined target via u()
  { type: "mcq", topic: "en-synant", skill: "useofenglish", grade: "B1",
    stem: "If people's interference with the environment decreases, more species will survive and produce " + u("offspring") + ".",
    options: ["result", "descent", "children", "ancestor"], correct: "C",
    modelAnswer: "C (children) — offspring = con cái/hậu duệ." },
  { type: "mcq", topic: "en-synant", skill: "useofenglish", grade: "B1",
    stem: "Hunting for meat and burning forests for soil cause " + u("destruction") + " to wildlife.",
    options: ["protection", "damage", "organization", "contamination"], correct: "B",
    modelAnswer: "B (damage) — destruction = sự phá hủy/tàn phá." },

  // 3.3 (b) ANTONYMS — opposite in meaning (en-synant)
  { type: "mcq", topic: "en-synant", skill: "useofenglish", grade: "B1",
    stem: "Love is supposed to follow marriage, not " + u("precede") + " it.",
    options: ["take out", "find out", "happen", "come after"], correct: "D",
    modelAnswer: "D (come after) — precede (đi trước) trái nghĩa với come after (đến sau)." },
  { type: "mcq", topic: "en-synant", skill: "useofenglish", grade: "B1",
    stem: "The city of Hue is very " + u("famous") + " for its Royal Tombs.",
    options: ["infamous", "popular", "little known", "notorious"], correct: "C",
    modelAnswer: "C (little known) — famous (nổi tiếng) trái nghĩa với little known (ít người biết); infamous/notorious = tai tiếng nên loại." },

  // 3.4 CONVERSATION (en-comm)
  { type: "mcq", topic: "en-comm", skill: "comm", grade: "A2",
    stem: "Tim: \"Make yourself at home.\" Mai: \"___\"",
    options: [
      "Yes. Can I help you?",
      "Thanks! Same to you.",
      "Not at all. Don't mention it.",
      "That's very kind. Thank you.",
    ], correct: "D",
    modelAnswer: "D — đáp lại lời mời tự nhiên như ở nhà một cách lịch sự." },
  { type: "mcq", topic: "en-comm", skill: "comm", grade: "A2",
    stem: "Alusa: \"I got 8.0/9.0 for the IELTS test!\" Liu: \"___\"",
    options: [
      "It's OK. I'm proud of you.",
      "Good for you. Thank you.",
      "Well done, son! I'm very proud of you.",
      "You can do it.",
    ], correct: "C",
    modelAnswer: "C — lời chúc mừng phù hợp nhất trước thành tích ('You can do it' dùng để động viên trước, không hợp)." },

  // 4.1 WRITING — build a paragraph from cue words (en-cwrite, fill/text_set)
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "Bill Gates / born / 1955 / Washington State. He / grow up / rich family.",
    correct: "Bill Gates was born in 1955 in Washington State. He grew up in a rich family.",
    accept: ["Bill Gates was born in 1955 in Washington State. He grew up in a rich family"],
    modelAnswer: "Bill Gates was born in 1955 in Washington State. He grew up in a rich family." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "His parents / send / he / private school. There / he / meet / business partner / Paul Allen.",
    correct: "His parents sent him to a private school. There he met his business partner, Paul Allen.",
    accept: [
      "His parents sent him to a private school. There he met his business partner, Paul Allen",
      "His parents sent him to a private school. There he met his business partner Paul Allen",
    ],
    modelAnswer: "His parents sent him to a private school. There he met his business partner, Paul Allen." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "When / they / be / 8th grade, they / write / programs / business / computers.",
    correct: "When they were in the 8th grade, they wrote programs for business computers.",
    accept: ["When they were in the 8th grade, they wrote programs for business computers"],
    modelAnswer: "When they were in the 8th grade, they wrote programs for business computers." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "1973 / Gates / be accepted / Harvard University. Parents / happy.",
    correct: "In 1973, Gates was accepted into Harvard University. His parents were happy.",
    accept: [
      "In 1973, Gates was accepted into Harvard University. His parents were happy",
      "In 1973, Gates was accepted to Harvard University. His parents were happy",
    ],
    modelAnswer: "In 1973, Gates was accepted into Harvard University. His parents were happy." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "Two years later / Gates / drop out / of Harvard / work / computer program / his friend Allen.",
    correct: "Two years later, Gates dropped out of Harvard to work on a computer program with his friend Allen.",
    accept: ["Two years later, Gates dropped out of Harvard to work on a computer program with his friend Allen"],
    modelAnswer: "Two years later, Gates dropped out of Harvard to work on a computer program with his friend Allen." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "1975 / they / create / company / Microsoft / sell / their product.",
    correct: "In 1975, they created a company called Microsoft to sell their product.",
    accept: ["In 1975, they created a company called Microsoft to sell their product"],
    modelAnswer: "In 1975, they created a company called Microsoft to sell their product." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "A few years later / Microsoft / become / giant company.",
    correct: "A few years later, Microsoft became a giant company.",
    accept: ["A few years later, Microsoft became a giant company"],
    modelAnswer: "A few years later, Microsoft became a giant company." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "By 1990 / Gates / the youngest / billionaire / the United States / age of 34.",
    correct: "By 1990, Gates was the youngest billionaire in the United States at the age of 34.",
    accept: ["By 1990, Gates was the youngest billionaire in the United States at the age of 34"],
    modelAnswer: "By 1990, Gates was the youngest billionaire in the United States at the age of 34." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "He / achieve / success / a lot of hard work. He / be / \"King of Software\".",
    correct: "He achieved success with a lot of hard work. He is the \"King of Software\".",
    accept: [
      "He achieved success with a lot of hard work. He is the King of Software",
      "He achieved success with a lot of hard work. He is the \"King of Software\"",
    ],
    modelAnswer: "He achieved success with a lot of hard work. He is the \"King of Software\"." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "A2",
    stem: "By 1997, he / the richest / man / United States.",
    correct: "By 1997, he was the richest man in the United States.",
    accept: ["By 1997, he was the richest man in the United States"],
    modelAnswer: "By 1997, he was the richest man in the United States." },

  // 4.2 WRITING — rewrite (en-cwrite, fill/text_set). Stem shows original + lead-in.
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "He can't lift the table because he is not strong enough.\n→ If ______",
    correct: "If he were strong enough, he could lift the table.",
    accept: [
      "If he were strong enough, he could lift the table",
      "If he was strong enough, he could lift the table",
      "he were strong enough, he could lift the table",
    ],
    modelAnswer: "If he were strong enough, he could lift the table." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "It is a pity her brother can't speak English as fluently as a native speaker.\n→ Her brother wishes ______",
    correct: "Her brother wishes he could speak English as fluently as a native speaker.",
    accept: [
      "Her brother wishes he could speak English as fluently as a native speaker",
      "he could speak English as fluently as a native speaker",
    ],
    modelAnswer: "Her brother wishes he could speak English as fluently as a native speaker." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "She doesn't usually drive a car very fast.\n→ She isn't used ______",
    correct: "She isn't used to driving a car very fast.",
    accept: [
      "She isn't used to driving a car very fast",
      "She is not used to driving a car very fast",
      "to driving a car very fast",
    ],
    modelAnswer: "She isn't used to driving a car very fast." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "It is reported that the city has increasingly developed in the past few years.\n→ The city ______",
    correct: "The city is reported to have increasingly developed in the past few years.",
    accept: [
      "The city is reported to have increasingly developed in the past few years",
      "is reported to have increasingly developed in the past few years",
    ],
    modelAnswer: "The city is reported to have increasingly developed in the past few years." },
  { type: "fill", topic: "en-cwrite", skill: "writing", grade: "B1",
    stem: "My sister prefers staying at home and watching TV to going to the cinema.\n→ My sister would ______",
    correct: "My sister would rather stay at home and watch TV than go to the cinema.",
    accept: [
      "My sister would rather stay at home and watch TV than go to the cinema",
      "would rather stay at home and watch TV than go to the cinema",
    ],
    modelAnswer: "My sister would rather stay at home and watch TV than go to the cinema." },
];

// ─── All private English tests for mika ──────────────────────────────────────
const TESTS: TestDef[] = [
  { key: "en-test1", title: "TEST 1 — Tiếng Anh (thầy giao)", minutes: 60, position: 1,
    sections: SECTIONS, passages: PASSAGES, questions: QUESTIONS },
  { key: "en-test4", title: "TEST 4 — K5 · Tiếng Anh (thầy giao)", minutes: 60, position: 2,
    sections: T4_SECTIONS, passages: T4_PASSAGES, questions: T4_QUESTIONS },
  { key: "en-test5", title: "TEST 5 — K5 · Tiếng Anh (thầy giao)", minutes: 60, position: 3,
    sections: T5_SECTIONS, passages: T5_PASSAGES, questions: T5_QUESTIONS },
];

async function seedTest(ownerId: string, test: TestDef): Promise<void> {
  const examId = `rmd-${ownerId}-${test.key}`;
  const sectionsJson = JSON.stringify(test.sections);

  // Upsert the private English Exam (NOT delete → keep Attempt history).
  await prisma.exam.upsert({
    where: { id: examId },
    update: {
      subject: "english",
      title: test.title,
      minutes: test.minutes,
      qcount: test.questions.length,
      sections: sectionsJson,
      position: test.position,
      active: true,
      archivedAt: null,
    },
    create: {
      id: examId,
      subject: "english",
      school: "mix",
      kind: "reference",
      year: "Bài thầy giao",
      title: test.title,
      intro:
        "Bài kiểm tra Tiếng Anh thầy giao riêng. Con làm và điền đáp án vào ô trả lời; " +
        "phần giải thích hiển thị sau khi nộp bài.",
      minutes: test.minutes,
      qcount: test.questions.length,
      generated: false,
      sections: sectionsJson,
      ownerUserId: ownerId,
      position: test.position,
      active: true,
    },
  });

  // Passages: replace (not keyed by Attempt.answers), capture ids by ref.
  await prisma.passage.deleteMany({ where: { examId } });
  const passageId = new Map<string, string>();
  for (let i = 0; i < test.passages.length; i++) {
    const p = test.passages[i];
    const row = await prisma.passage.create({
      data: { examId, title: p.title, body: p.body, kind: p.kind, order: i },
    });
    passageId.set(p.ref, row.id);
  }

  // Questions IN PLACE by deterministic id → Attempt.answers survive re-seed.
  let num = 0;
  for (const q of test.questions) {
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
  await prisma.question.deleteMany({ where: { examId, num: { gt: test.questions.length } } });

  console.log(`  ✓ "${test.title}" — ${test.questions.length} câu / ${test.passages.length} ngữ liệu / ${test.sections.length} mục (${examId}).`);
}

async function main(): Promise<void> {
  // Resolve owner (create minimal User if mika hasn't signed in yet).
  let owner = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!owner) {
    owner = await prisma.user.create({
      data: { email: OWNER_EMAIL, name: OWNER_NAME, role: "student", grade: "Lớp 5" },
    });
    console.log(`  created User for ${OWNER_EMAIL} (id=${owner.id})`);
  } else {
    console.log(`  owner ${OWNER_EMAIL} (id=${owner.id})`);
  }

  for (const test of TESTS) {
    await seedTest(owner.id, test);
  }

  console.log(`\n✓ Done. ${TESTS.length} bài Tiếng Anh cho ${OWNER_EMAIL}.`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
