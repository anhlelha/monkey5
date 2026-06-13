<!-- Generated: 2026-06-12 | Files scanned: ~45 | Token estimate: ~850 -->

# Frontend

Next.js 16 App Router, RSC + Server Actions, no client-side state library
(no Redux/Zustand). Plain CSS in `app/globals.css` (no Tailwind), KaTeX
for math, custom Vietnamese font (Be Vietnam Pro + JetBrains Mono).

## Page tree

```
app/
├── page.tsx                        landing — redirects to /home or /signin
├── signin/page.tsx                 Google + Demo (credentials)
├── onboarding/page.tsx             2-step (target schools, study hours)
│
├── (app)/                          ← shell layout (sidebar + topbar)
│   ├── layout.tsx                  Sidebar + TopBar + SettingsButton slide-in
│   ├── home/page.tsx               dashboard: readiness, radar, activity, recent
│   ├── library/page.tsx            past + reference exams, school/kind filters
│   ├── results/page.tsx            attempt history (list)
│   ├── topics/page.tsx             10 topic cards (soh, hinh, phan, …)
│   ├── topics/[id]/page.tsx        per-topic landing + practice sets
│   ├── create/page.tsx             admin wizard: create reference exam
│   ├── create-ex/page.tsx          admin wizard: create CustomSet (practice)
│   └── admin/
│       ├── page.tsx                tabs: overview / exams / topics / users / qa / settings
│       ├── QAPanel.tsx             (client) per-Q editor; reads audit-results.json
│       ├── BankPanel.tsx           (client) bank question list with filters
│       ├── QuestionDetailModal.tsx (client) edit single Q (stem, correct, …)
│       └── exam/[examId]/page.tsx  per-exam admin view
│
└── exam/[examId]/                  ← fullscreen runner (outside app shell)
    ├── page.tsx                    runner — loads Exam + Questions
    ├── ExamRunner.tsx              (client) Question card carousel, timer
    └── results/[attemptId]/
        ├── page.tsx                fetch attempt + questions
        └── ResultsView.tsx         (client) per-Q grading recompute,
                                     score donut, AI tutor side panel
```

## Components

```
components/
├── Sidebar.tsx        ← navigation (home/library/topics/results/admin)
├── TopBar.tsx         ← user avatar, settings button
├── BackButton.tsx     ← used on exam runner
├── Icon.tsx           ← SVG icon set (book, home, sparkle, …)
├── Question.tsx       ← exam Q card: stem (MathText), MathInput, DrawPad
├── MathText.tsx       ← KaTeX rendering for stems + modelAnswers
├── MathInput.tsx      ← input field for fill-type answers
├── DrawPad.tsx        ← canvas for essay answers (raw or strokes)
├── ExamFigure.tsx     ← hand-written SVG cases keyed by figure ID (~50 cases,
│                        1920 LOC); switch case "tx-2024-c11" → render SVG
├── Modal.tsx          ← generic modal wrapper
├── Radar.tsx          ← topic mastery radar chart (no chart library)
└── ui.tsx             ← Card, Pill, Bar, Donut, Button atoms
```

## Data fetching pattern

```
RSC page.tsx
   ↓ const session = await auth()
   ↓ const data = await prisma.exam.findUnique({ … })
   ↓ <ClientComponent data={data} />
```

Server Actions used for mutations (no API routes besides auth + claim).

## State management

- **Per-page state** lives in `useState` inside the client components.
- **Session** flows via Auth.js (`useSession()` not used — server-side `auth()`).
- **Form actions** use Server Actions with `useFormState` / `useFormStatus`.
- **No global store**. Cross-page data is fetched fresh per request.

## Math rendering

```
DB.modelAnswer (LaTeX with $...$ delimiters)
   ↓ render in <MathText markdown>
   ↓ KaTeX parses $...$ → MathML/HTML
   ↓ surrounding text → markdown-style (bold **, lists -, headings)
```

`MathText.tsx` is the only place KaTeX is loaded. Inline math `$…$`, display
math `$$…$$`. Markdown rendering is hand-rolled (no remark/rehype).

## Figure rendering

`ExamFigure` is a giant switch statement keyed by `Question.figure` string.
~50 cases across schools. Each case returns an inline SVG with conventions:

```tsx
case "tx-2025-b2":
  return (
    <div className="q-figure-wrapper" style={{ maxWidth: "Npx" }}>
      <svg viewBox="0 0 W H" width="100%" style={{ display: "block", height: "auto" }}>
        <line stroke="var(--ink)" strokeWidth="1.5" />
        <circle fill="orange" r="4.5" />
        <text fill="var(--ink)" fontSize="…" style={{ fontStyle: "italic" }}>A</text>
      </svg>
    </div>
  );
```

Figure ID must be registered in THREE places:
1. `components/ExamFigure.tsx` (the case)
2. `app/(app)/admin/qa-constants.ts` IMPLEMENTED_FIGURES
3. `scripts/audit-questions.ts` IMPLEMENTED_FIGURES

Missing any → audit emits `FIGURE_MISSING`. New figures via Gemini CLI
(`scripts/draw-figure-gemini.sh`), see `.claude/commands/exam-import.md` §9.

## Theming

CSS variables in `app/globals.css`:
- `var(--ink)`, `var(--ink-muted)` — text
- `var(--border-soft)`, `var(--border-strong)` — borders
- `var(--surface-1/2/3)` — backgrounds
- Brand orange for accents (`#f59e0b` or `"orange"`)
- Light mode only (no dark mode toggle wired yet)
