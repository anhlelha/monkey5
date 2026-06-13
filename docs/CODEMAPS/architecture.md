<!-- Generated: 2026-06-12 | Files scanned: ~85 | Token estimate: ~750 -->

# Architecture

**Type**: Single Next.js 16 App Router monolith + Prisma 5 + SQLite. Auth.js v5 (Google + Demo credentials). No microservices, no API gateway.

## High-level diagram

```
┌────────────────────────────────────────────────────────────────────┐
│ Browser                                                            │
│   ↓ HTTPS                                                          │
├────────────────────────────────────────────────────────────────────┤
│ middleware.ts  ← auth gate (signed-in for /(app), admin for /admin)│
├────────────────────────────────────────────────────────────────────┤
│ Next.js App Router (RSC + Server Actions)                          │
│ ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────┐   │
│ │ app/(app)/*      │ │ app/exam/[id]    │ │ app/api/*          │   │
│ │ shell + sidebar  │ │ fullscreen runner│ │ auth + ref-exams   │   │
│ └────────┬─────────┘ └────────┬─────────┘ └─────────┬──────────┘   │
│          ↓ Server Actions                            ↓             │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ lib/ — prisma, exam, fmt, static, plan-config, grading/, …    │ │
│ └────────────────────────────────────────┬──────────────────────┘  │
└──────────────────────────────────────────┼─────────────────────────┘
                                            ↓
                            ┌───────────────────────────┐
                            │ Prisma 5  →  SQLite       │
                            │ prisma/dev.db             │
                            └───────────────────────────┘
```

## Data flow boundaries

```
┌─ STATIC SEED (build time) ──────────────────────────────────────┐
│ scripts/exam-overrides.ts   ← stem/correct/figure overrides    │
│ ref_exam/CG_parsed_questions.json    ← CG stems                │
│ ~/.gemini/…/smart_parsed_exams.json  ← LTV/TX/NTT stems (OUT)  │
│        ↓ build-exams-metadata.ts (enrich)                      │
│ official_exams_metadata.json   ← generated, not hand-edit      │
│        ↓ seed-all-exams.ts (destructive deleteMany+insert)     │
└────────────────────────────────────────┬───────────────────────┘
                                          ↓
┌─ RUNTIME (request time) ────────────────────────────────────────┐
│ Prisma client → DB queries                                     │
│ gradeAnswer() ← lib/grading/ (3-layer: classify, dispatch,     │
│                  matchers). Called at both submit + render.    │
│ spawn-exam.ts ← clones bank Q's into Exam runs (CUID examIds)  │
└────────────────────────────────────────────────────────────────┘
```

## Trust boundaries

- `middleware.ts` gates routes by `session.user.role` (admin vs student).
- `/api/auth/*` is the only external-facing HTTP route besides auth.js handlers.
- Server Actions enforce auth inline (each action calls `await auth()`).
- No CSRF setup beyond Next.js Server Actions' built-in protection.

## Key invariants

1. **DB is runtime source of truth.** App never reads JSON at request time.
2. **Override map = SoT for `correct`/`unit`/`figure`**. Editing metadata JSON manually is allowed only for structural fields (type, topic).
3. **MCQ `correct` is the letter** (A/B/C/D), never the value.
4. **Grading runs at submit AND render** — UI updates on refresh; `Attempt.earned` is frozen until retake.
5. **Auto-classification at seed**: every `fill` question gets `answerSchema` auto-attached by `classifyAnswer()` — schemas survive re-seed.

## See also

- `backend.md` — routes / server actions / grading
- `frontend.md` — page tree / components
- `data.md` — Prisma models + relationships
- `dependencies.md` — third-party libs + external services
- `CLAUDE.md` (repo root) — non-obvious architecture, pipeline pitfalls
- `.claude/commands/exam-import.md` — exam content workflow
