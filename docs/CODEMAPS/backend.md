<!-- Generated: 2026-06-12 | Updated: 2026-06-14 (readiness redesign + theme) | Files scanned: ~40 | Token estimate: ~1050 -->

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
app/(app)/home/actions.ts       updateProfile (incl. theme), updateTargets,
                                  signOutAction
app/(app)/create/actions.ts     admin: createReferenceExam(payload)
                                  → exam.create row (no Question gen yet)
app/(app)/create-ex/actions.ts  admin: createCustomSet(payload)
                                  → CustomSet.create
app/(app)/admin/actions.ts      ~35 admin actions: question CRUD, exam edit,
                                  topic editor, user list, regrade trigger,
                                  audit report load (reads audit-results.json),
                                  + School CRUD (createSchool/updateSchool/
                                  deactivateSchool), refreshSchoolProfilesAction,
                                  recomputeAllReadinessAction,
                                  getReadinessDistribution (histogram)
app/exam/[examId]/actions.ts    submitExam(answers, durationSec)
                                  → for q in exam.questions: gradeAnswer(...)
                                  → attempt.create({ earned, score, … })
                                  → ensureSchoolProfilesFresh()
                                  → computeMastery + computeAllReadiness
                                  → user.update({ topicMastery, readiness })
```

## Readiness pipeline (lib/)

Added 2026-06-14. See [`docs/READINESS-REDESIGN.md`](../READINESS-REDESIGN.md) for full design.

```
lib/schools.ts             getActiveSchools, getAllSchools, getSchoolById,
                             MIX_SCHOOL constant, invalidateSchoolsCache.
                             60s in-memory cache, DB-backed.
lib/mastery.ts             computeMastery(userId): aggregates TopicSession
                             + Attempt rows → topicMastery, levelMastery.
                             MIN_SAMPLE = 5; BASELINE_MASTERY = 0.5.
lib/school-profiles.ts     ensureSchoolProfilesFresh: hash-based detection
                             (sourceHash = "{qcount}-{maxCreatedAt.ISO}"),
                             auto-rebuilds only changed schools, discovers
                             new schools via GROUP BY Exam.school.
                             ensureSchoolMetadata: auto-creates default
                             School row for newly-detected schools.
                             buildSchoolProfile: 6-factor difficulty
                             formula (NC% × 0.30 + L4+5% × 0.15 +
                             timePressure × 0.20 + freeText% × 0.15 +
                             olympicGeo% × 0.10 + diversity × 1.0).
lib/readiness.ts           Pure functions, no DB:
                             - computeReadiness(topicMastery, levelMastery,
                               profile) → 0..100 (clamped)
                               raw = 50 + topicTerm·α + levelTerm·β
                                     − (difficulty−50)·DIFF_K
                               α=80, β=60, DIFF_K=0.3
                             - computeAllReadiness(...) for all schools
                             - computeGapTop3(topicMastery, profile,
                               targetMastery=0.7, limit=3) → GapItem[]
                               for "cải thiện gì để đạt target" advice
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
