<!-- Generated: 2026-06-12 | Files scanned: ~35 | Token estimate: ~900 -->

# Backend

## Auth + middleware

```
auth.ts                ← NextAuth v5 config (Google + Credentials "demo")
                         exports: handlers, auth(), signIn, signOut
                         DEMO_ACCOUNTS = whitelist of email→role
                         PrismaAdapter wires to lib/prisma
middleware.ts          ← edge: gate /(app)/*, /admin*, /create*
                         PUBLIC = ["/signin", "/api/auth", "/_next", "/favicon.ico"]
                         redirects: unauth → /signin; non-admin on admin → /home
app/api/auth/[...nextauth]/route.ts   ← exports `handlers.GET/POST`
```

## HTTP API routes (only 1 custom)

```
POST /api/reference-exams/claim   ← User clones a reference exam into a run
   → app/api/reference-exams/claim/route.ts
   → spawn-exam.ts (clones Question rows with CUID examIds like ref-*)
```

## Server Actions (the main backend surface)

```
app/onboarding/actions.ts       saveOnboarding(targets, hours, examDate)
                                  → user.update({ targets, hours, … })
app/(app)/home/actions.ts       updateProfile, updateTargets, signOutAction
app/(app)/create/actions.ts     admin: createReferenceExam(payload)
                                  → exam.create row (no Question gen yet)
app/(app)/create-ex/actions.ts  admin: createCustomSet(payload)
                                  → CustomSet.create
app/(app)/admin/actions.ts      ~30 admin actions: question CRUD, exam edit,
                                  topic editor, user list, regrade trigger,
                                  audit report load (reads audit-results.json)
app/exam/[examId]/actions.ts    submitAttempt(answers, durationSec)
                                  → for q in exam.questions: gradeAnswer(...)
                                  → attempt.create({ earned, score, … })
```

## Grading library (lib/grading/)

```
index.ts            gradeAnswer(q, raw): GradeResult
                      ├ if MCQ: text === q.correct (exact)
                      ├ if schema (numeric/numeric_set/labeled/regex):
                      │    dispatch to matchers/<kind>.ts
                      └ else: matchExact (lenient string equality)
classify.ts         classifyAnswer(correct): AnswerSchema suggestion
                      rules: single int/decimal/fraction → numeric;
                             "a = 5" / "x=3/4" → numeric (VAR_EQ_NUM);
                             "a=1, b=2" → numeric_set (VAR_EQ_NUM_MULTI);
                             labeled extraction → labeled;
                             digits+separators → numeric_set;
                             fallback → exact
extractors.ts       extractNumbers, extractLabeledPairs,
                      DEFAULT_LABEL_ALIASES (me/con/anh/em/chiều dài/…)
normalize.ts        stripDiacritics, normalizeForExact (trim, lowercase,
                      strip trailing punctuation)
matchers/exact.ts   matchExact (uses normalizeForExact)
matchers/numeric.ts matchNumeric (extracts single number, tolerance)
matchers/numeric-set.ts matchNumericSet (multi, ordered or not)
matchers/labeled.ts matchLabeled (label-extraction with multiset fallback)
matchers/regex.ts   matchRegex (escape hatch)
types.ts            AnswerSchema discriminated union; GradeQuestion; RawAnswer
```

**Two call sites of `gradeAnswer`:**

```
app/exam/[examId]/actions.ts:35    ← submit (writes Attempt row)
app/exam/[examId]/results/[attemptId]/ResultsView.tsx:64
                                    ← render (per-Q UI, recomputed)
```

## Exam content scripts (build-time, not runtime)

```
scripts/build-exams-metadata.ts   read official_exams_metadata.json,
                                    apply MANUAL_OVERRIDES + CG_ENRICHMENT_MAP,
                                    write back enriched JSON
scripts/seed-all-exams.ts         destructive: for each exam → deleteMany +
                                    Question.create. Auto-calls:
                                    - stripWatermarks (header bleed strip)
                                    - formatMathText (idempotent LaTeX wrap)
                                    - classifyAnswer → answerSchema (for fill)
scripts/audit-questions.ts        scan all questions, emit Issue[] with codes
                                    WATERMARK, FIGURE_MISSING, FIGURE_LIKELY,
                                    MATH_RAW, NO_ANSWER, SHORT_STEM; --json
                                    writes scripts/audit-results.json
scripts/regrade-attempts.ts       backfill: re-grade all Attempt rows with
                                    current gradeAnswer code, update earned/score
scripts/spawn-exam.ts (lib/)      clone Q's into runtime exam (CUID examId)
```

## Override / metadata pipeline

See `architecture.md#data-flow-boundaries`. Override map at
`scripts/exam-overrides.ts` (`MANUAL_OVERRIDES` for all schools,
`CG_ENRICHMENT_MAP` for CG-only with higher priority).

## Common pitfalls

- MCQ `correct` must be `"A"|"B"|"C"|"D"` (letter), not the value text.
- Override stem/modelAnswer must be pre-formatted LaTeX (`$…$` delimiters).
- `correct/unit` in `CG_parsed_questions.json` are **ignored** at seed time —
  seed pulls from metadata generated from `CG_ENRICHMENT_MAP`.
- `seed-all-exams.ts` only touches exams in metadata; CUID-id practice sets
  (`set-*`, `ref-*`) need a one-off Prisma migration if you need to clean stale.
