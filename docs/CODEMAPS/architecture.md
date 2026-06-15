<!-- Generated: 2026-06-14 | Files scanned: 81 (.ts/.tsx in app+lib+components) | Token estimate: ~900 -->

# Architecture

**Type**: Single Next.js 16 App Router monolith + Prisma 5 + SQLite. Auth.js v5 (Google + Demo credentials). Production deployed on GCP Compute Engine + Nginx + Let's Encrypt SSL (`monkey5.ai4all.vn`). No microservices, no API gateway.

## High-level diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│ Browser                                                              │
│   ↓ HTTPS (Nginx reverse proxy → :3000 PM2 / next start)             │
├──────────────────────────────────────────────────────────────────────┤
│ middleware.ts  ← auth gate (signed-in for /(app), admin for /admin)  │
├──────────────────────────────────────────────────────────────────────┤
│ app/layout.tsx  ← SSR <html data-theme={user.theme}> (no-flash)      │
├──────────────────────────────────────────────────────────────────────┤
│ Next.js App Router (RSC + Server Actions)                            │
│ ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────┐     │
│ │ app/(app)/*      │ │ app/exam/[id]    │ │ app/api/*          │     │
│ │ shell + sidebar  │ │ fullscreen runner│ │ auth + ref-exams   │     │
│ │ + (landing)/     │ │ + submit hook    │ │                    │     │
│ └────────┬─────────┘ └────────┬─────────┘ └─────────┬──────────┘     │
│          ↓ Server Actions                            ↓               │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │ lib/ — prisma, exam, fmt, static, plan-config, grading/,       │   │
│ │   schools, mastery, school-profiles, readiness (NEW 2026-06-14)│   │
│ └────────────────────────────────────────┬───────────────────────┘   │
└──────────────────────────────────────────┼───────────────────────────┘
                                            ↓
                            ┌───────────────────────────┐
                            │ Prisma 5  →  SQLite       │
                            │ prisma/dev.db             │
                            └───────────────────────────┘
```

## Readiness subsystem (2026-06-14)

```
submitExam(answers) ─────┐
                          ↓
                ensureSchoolProfilesFresh()
                          ↓  (hash-based detection — sourceHash drift)
                buildSchoolProfile(school)   ← for changed/new schools only
                          ↓
                computeMastery(userId)       ← TopicSession + Attempt rows
                          ↓
                computeAllReadiness(mastery, profiles)
                          ↓
                User.update({ topicMastery, readiness })
                          ↓
                revalidatePath("/home") + "/library"
```

Decoupled from upload pipeline — auto-detects any DB change in Question/Exam
regardless of how seeded. New schools auto-discovered via `GROUP BY Exam.school`.

Detailed design: [`docs/READINESS-REDESIGN.md`](../READINESS-REDESIGN.md).

## Theme subsystem (2026-06-14)

```
RootLayout (Server Component)
  ↓ await auth() → user.theme   ("clay" | "ocean" | "forest" | "grape" | "coral")
  ↓ <html data-theme={theme}>   ← SSR before first paint (no FOUC)
       app/globals.css   :root → clay tokens
                         [data-theme="ocean"|…] → override --accent family only
       
SettingsButton (Client Component)
  ↓ click swatch  → document.documentElement.setAttribute("data-theme", t)
  ↓ cancel        → revert via useEffect cleanup
  ↓ save          → updateProfile({ theme }) → User.update → revalidate
```

Landing page (`app/(landing)/Landing.tsx`) has its own independent theme via
`window.TWEAKS.theme` (currently `"ocean"`). Switches via `public/landing.js`
setting `data-theme` client-side — not synced with app theme by design.

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
│ ensureSchoolProfilesFresh() ← hash detection on submit         │
│ computeMastery + computeReadiness ← derived per-user on submit │
└────────────────────────────────────────────────────────────────┘
```

## Trust boundaries

- `middleware.ts` gates routes by `session.user.role` (admin vs student).
- `/api/auth/*` is the only external-facing HTTP route besides auth.js handlers.
- Server Actions enforce auth inline (each action calls `await auth()`).
- Admin actions add explicit `requireAdmin()` check.
- No CSRF setup beyond Next.js Server Actions' built-in protection.

## Key invariants

1. **DB is runtime source of truth.** App never reads JSON at request time.
2. **Override map = SoT for `correct`/`unit`/`figure`**. Editing metadata JSON manually is allowed only for structural fields (type, topic).
3. **MCQ `correct` is the letter** (A/B/C/D), never the value.
4. **Grading runs at submit AND render** — UI updates on refresh; `Attempt.earned` is frozen until retake or `scripts/regrade-attempts.ts`.
5. **Auto-classification at seed**: every `fill` question gets `answerSchema` auto-attached by `classifyAnswer()` — schemas survive re-seed.
6. **Readiness is derived, not accumulated**: each submit recomputes from full history. Profile rebuilds via hash detection — never stale.
7. **Theme is server-resolved**: `<html data-theme>` ships from SSR to avoid flash. Optimistic preview only on client during edit.

## Deployment

```
local dev → git push origin main
                 ↓
   bash scripts/deploy.sh
                 ↓
   ssh + git pull on VM (35.247.148.192)
   scp .env.local → .env (rewrites NEXTAUTH_URL = https://monkey5.ai4all.vn)
   scripts/setup-remote.sh: npm i, prisma db push, seed, build, pm2 restart
                 ↓
   Nginx (port 443) ← Let's Encrypt SSL → :3000 (PM2 monkey5-server)
```

Full deployment runbook in [`CLAUDE.md`](../../CLAUDE.md) §"Infrastructure & Deployment".

## See also

- `backend.md` — routes / server actions / grading / readiness pipeline
- `frontend.md` — page tree / components / admin tabs
- `data.md` — Prisma models incl. School + SchoolProfile + Topic + User.theme
- `dependencies.md` — third-party libs + external services
- `CLAUDE.md` (repo root) — non-obvious architecture, pipeline pitfalls
- `READINESS-REDESIGN.md` — full snapshot-based readiness design
- `.claude/commands/exam-import.md` — exam content workflow
