<!-- Generated: 2026-06-12 | Updated: 2026-06-14 (readiness redesign + theme) | Files scanned: 1 (schema.prisma) | Token estimate: ~850 -->

# Data Model

Source: `prisma/schema.prisma`. SQLite at `prisma/dev.db`. No migrations
folder checked in — local dev uses `npx prisma db push`.

## ER diagram (text)

```
User ──┬─< Account                  (auth.js)
       ├─< Session                  (auth.js)
       ├─< Attempt (examId, score, earned, durationSec, answers JSON)
       ├─< TopicSession (per-topic practice runs)
       └─< UserReferenceExam (links User → Exam for cloned ref runs)

Exam ──┬─< Question (examId, num, type, topic, stem, correct, …)
       ├─< Attempt
       └── basedOn → Exam (self ref, for reference clones)

Question ── sourceQuestionId → Question (self ref, for bank → set clones)

CustomSet ── creator (User) — admin practice sets, no FK to Question

Topic — 10 fixed rows (soh, hinh, phan, cd, log, do, xs, tuoi, ti, tg)

School        ── per-school metadata (name/color/tone/minutes); 6 default rows
                  (cg, ltv, tx, ntt, nn, ntl) + mix (inactive). Admin-editable.
SchoolProfile ── auto-computed statistics per school (topicWeights,
                  levelWeights, difficulty, sourceHash). Rebuilt by
                  lib/school-profiles.ts whenever DB hash changes.

UserWhitelist ── seeded admin emails
PlanConfig    ── free/pro/vip feature flags
LevelConfig   ── student levels (xếp hạng)
UserTopicSet  ── User × Topic × CustomSet pivot (progress per practice set)
```

## Question — the central row

```
Question {
  id           String  @id @default(cuid())     // or "TX-2024-25-C7" for official
  examId       String?                          // null for bank questions
  num          Int                              // 1..N within exam
  type         String                           // "fill" | "mcq" | "essay"
  topic        String                           // soh | hinh | phan | cd | log | do | xs | tuoi | ti | tg
  grade        String                           // "L4" | "L5" | "L4+5" | "NC"
  points       Int     @default(1)
  stem         String                           // LaTeX-formatted Vietnamese
  unit         String?                          // "cm²" | "km/giờ" | …
  placeholder  String?                          // input placeholder text
  correct      String?                          // MCQ: "A"|"B"|"C"|"D"; fill: value
  answerSchema String?                          // JSON, auto-attached at seed
  options      String  @default("[]")           // JSON: [{id:"A",text:"…"},…]
  modelAnswer  String?                          // Markdown + KaTeX lời giải
  figure       String?                          // ID into ExamFigure switch
  source       String?                          // provenance
  sourceQuestionId String?                      // FK to bank Q (for set clones)
  active       Boolean @default(true)
}
```

## Exam structure conventions

```
Exam.id          {school}-{year_start}     ex "tx-2024", "ntt-2025"
                 OR  set-* / ref-* / mix-* for CUID runtime clones
Exam.school      "cg" | "tx" | "ltv" | "ntt" | "mix"
Exam.kind        "official" | "reference" | "mixed"
Exam.year        display label   ex "2024-2025"
Exam.sections    JSON [{ num: number, header: string }, …]
                   delimiters between exam sections (Trắc nghiệm / Tự luận)
Exam.qcount      number of Question rows
Exam.minutes     time limit
Exam.generated   true once questions have been seeded/cloned

Question.id      {SCHOOL}-{YYYY}-{YY}-{C|B}{N}
                   C = trắc nghiệm/fill; B = bài tự luận
                   ex "NTT-2025-26-B3", "TX-2024-25-C12"
                 OR CUID for bank/cloned questions
```

## Attempt

```
Attempt {
  id            String   @id @default(cuid())
  userId        String
  examId        String
  answers       String   @default("{}")    // JSON { [qId]: rawAnswer }
  score         Int      @default(0)        // 0..100 pct
  earned        Int      @default(0)        // raw points earned
  total         Int      @default(0)        // raw max points
  durationSec   Int      @default(0)
  submitted     Boolean  @default(true)
  createdAt     DateTime @default(now())
}
```

Note: `Attempt.earned` is **frozen at submit time** by gradeAnswer(). Grading
fixes won't update it unless `scripts/regrade-attempts.ts` is run.

## User mastery / readiness JSON fields

```
User.targets       JSON string: ["cg", "ntt"]            (max 3 schools)
User.topicMastery  JSON string: { [topicId]: 0..1 }       baseline 0.5
User.readiness     JSON string: { [schoolId]: 0..100 }    baseline 50
User.activity      JSON string: number[] (last-14-day percent, null = no activity)
User.theme         "clay" | "ocean" | "forest" | "grape" | "coral"   default "clay"
```

All stored as strings (SQLite has no JSON type). Hydrated via `lib/user-data.ts`.

**`topicMastery` + `readiness` are auto-recomputed** after every `submitExam`
via `lib/mastery.ts:computeMastery()` + `lib/readiness.ts:computeAllReadiness()`.
Per-school readiness uses the matching `SchoolProfile` row (topic-weighted +
level-weighted + difficulty-adjusted, formula in [`docs/READINESS-REDESIGN.md`](../READINESS-REDESIGN.md) §5).

## School + SchoolProfile (readiness backbone)

```
School {
  id       String  @id              // "cg" | "ltv" | "tx" | "ntt" | "nn" | "ntl"
  short    String                   // "CG"
  name     String                   // "THCS Cầu Giấy"
  full     String
  color    String                   // "var(--cg)" | hex
  tone     String                   // CSS class hậu tố
  desc     String
  minutes  Int       @default(60)
  style    String
  position Int       @default(0)
  active   Boolean   @default(true)
}

SchoolProfile {
  school          String   @id      // FK soft → School.id
  topicWeights    String             // JSON { topicId: 0..1 }, sum = 1.0
  levelWeights    String             // JSON { "L4"|"L5"|"L4+5"|"NC": 0..1 }
  difficulty      Float              // 0-100 (6-factor formula)
  minutes         Float              // avg exam duration
  totalQuestions  Int
  freeTextPct     Float
  olympicGeoPct   Float
  diversity       Int                // # of topics with ≥1 question
  sourceHash      String             // "{qcount}-{maxCreatedAt.ISO}"
  updatedAt       DateTime @updatedAt
}
```

`sourceHash` is the auto-detection key. `ensureSchoolProfilesFresh()` queries
`GROUP BY Exam.school` on Question rows, compares hash → rebuilds only what
changed. New schools auto-create both School (default metadata) and
SchoolProfile rows on first detection.

## Topic table (10 fixed rows)

```
id   | name (vi)               | color
─────┼─────────────────────────┼───────
soh  | Số học                  | …
hinh | Hình học                |
phan | Phân số & %             |
cd   | Chuyển động             |
log  | Suy luận logic          |
do   | Đo lường                |
xs   | Biểu đồ, Thống kê, XS   |
tuoi | Toán tuổi               |
ti   | Tỉ lệ & Bản đồ          |
tg   | Thời gian               |
```

Seeded by `prisma/seed.ts` (idempotent upsert).

## Auth tables (Auth.js v5 standard)

- `User` — extended with app-specific fields (role, plan, grade, targets, …)
- `Account` — OAuth provider link (Google)
- `Session` — server-side session token
- `VerificationToken` — email verification (unused in this app)

## Common queries

- `prisma.question.findMany({ where: { examId } })` — exam questions
- `prisma.attempt.findMany({ where: { userId } })` — user history
- `prisma.question.findUnique({ where: { id } })` — bank Q detail
- Admin Q search: `prisma.question.findMany({ where: { topic, grade, examId? } })`
