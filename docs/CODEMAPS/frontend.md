<!-- Generated: 2026-06-14 | Files scanned: 48 (app/) + 12 (components/) | Token estimate: ~1000 -->

# Frontend

Next.js 16 App Router, RSC + Server Actions, no client-side state library
(no Redux/Zustand). Plain CSS in `app/globals.css` (no Tailwind), KaTeX
for math, custom Vietnamese font (Be Vietnam Pro + JetBrains Mono).

## Page tree

```
app/
├── layout.tsx                    SSR <html data-theme={user.theme}> wrapper
├── page.tsx                      root — redirects to /home or renders Landing
├── (landing)/Landing.tsx         marketing page (default theme: "ocean")
├── signin/page.tsx               Google + Demo (credentials)
├── onboarding/page.tsx           2-step (target schools, study hours)
│
├── (app)/                        ← shell layout (sidebar + topbar)
│   ├── layout.tsx                Sidebar + SettingsButton slide-in
│   ├── home/
│   │   ├── page.tsx              dashboard: readiness 6 schools (equal),
│   │   │                           "Top match" hint, 14d activity, recent
│   │   │                           + Gap Top 3 card (target-specific advice)
│   │   ├── SettingsButton.tsx    (client) modal: profile, targets, hours,
│   │   │                           examDate, readyTarget, **Giao diện** (theme)
│   │   └── actions.ts            updateProfile (incl. theme field)
│   ├── library/page.tsx          past + reference exams, school/kind filters
│   ├── library/LibraryView.tsx   (client) filterable exam grid
│   ├── results/page.tsx          unified activity feed (Attempt + TopicSession)
│   ├── topics/page.tsx           10 topic cards (soh, hinh, phan, …)
│   ├── topics/[id]/page.tsx      per-topic landing + practice sets
│   ├── create/page.tsx           admin wizard: create reference exam
│   ├── create-ex/page.tsx        admin wizard: create CustomSet (practice)
│   └── admin/
│       ├── page.tsx              hub: tabs via ?tab=… (10 tabs)
│       ├── ExamsPanel.tsx        (client) exam list + filters
│       ├── BankPanel.tsx         (client) bank question list with filters
│       ├── QAPanel.tsx           (client) audit-flagged Q editor
│       ├── QuestionDetailModal.tsx (client) edit single Q
│       ├── TopicsEditor.tsx      (client) CRUD topics (reorder, color, icon)
│       ├── WhitelistPanel.tsx    (client) email → role/plan preset
│       ├── PlansPanel.tsx        (client) free/pro/vip + LevelConfig
│       ├── SchoolsPanel.tsx      (client) CRUD School table (NEW 2026-06-14)
│       ├── ReadinessPanel.tsx    (client) histogram + refresh/recompute buttons
│       └── exam/[examId]/page.tsx  per-exam admin view
│
└── exam/[examId]/                ← fullscreen runner (outside app shell)
    ├── page.tsx                  runner — loads Exam + Questions
    ├── ExamRunner.tsx            (client) Question card carousel, timer
    ├── actions.ts                submitExam → grade + Attempt + recompute
    └── results/[attemptId]/
        ├── page.tsx              fetch attempt + questions + readiness
        └── ResultsView.tsx       (client) per-Q grading recompute,
                                   score donut, "Mức độ sẵn sàng hiện tại" card,
                                   AI tutor side panel
```

## Admin tabs (10 total, accessed via `?tab=…`)

| Tab | Panel | Notes |
|---|---|---|
| `overview` | inline KPIs + target distribution | DB-backed school list (was hardcoded SCHOOLS) |
| `exams` | `ExamsPanel` | list of all Exam rows |
| `bank` | `BankPanel` | paginated questions, topic/source filter |
| `users` | inline table | top 50 users |
| `whitelist` | `WhitelistPanel` | email → role/plan presets |
| `topics` | `TopicsEditor` | full CRUD with reorder |
| `qa` | `QAPanel` | audit-flagged Q + figures |
| `plans` | `PlansPanel` | free/pro/vip + level config |
| `schools` | `SchoolsPanel` (NEW 2026-06-14) | School table CRUD + color picker |
| `readiness` | `ReadinessPanel` (NEW 2026-06-14) | per-school distribution histogram + actions |
| `settings` / `llm` | inline stubs | placeholder forms |

## Components

```
components/
├── Sidebar.tsx        ← navigation; threads user.theme to SettingsButton
├── TopBar.tsx         ← user avatar, breadcrumbs, actions slot
├── BackButton.tsx     ← used on exam runner
├── Icon.tsx           ← SVG icon set (book, home, sparkle, …)
├── Question.tsx       ← exam Q card: stem (MathText), MathInput, DrawPad
├── MathText.tsx       ← KaTeX rendering for stems + modelAnswers
├── MathInput.tsx      ← input field for fill-type answers
├── DrawPad.tsx        ← canvas for essay answers (raw or strokes)
├── ExamFigure.tsx     ← hand-written SVG cases keyed by figure ID (~50 cases)
├── Modal.tsx          ← generic modal wrapper
├── Radar.tsx          ← topic mastery radar chart (no chart library)
└── ui.tsx             ← Card, Pill, Bar, Donut, KindBadge atoms
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
- **Form actions** use Server Actions with `useTransition` + manual FormData.
- **Optimistic UI** for theme picker only — `setAttribute("data-theme", …)`
  immediately, revert on cancel via `useEffect` cleanup.
- **No global store**. Cross-page data is fetched fresh per request.

## Theme system (2026-06-14)

```
User.theme (DB) ──→ app/layout.tsx (Server Component)
                       await auth() → fetch theme → <html data-theme={theme}>
                                                      ↓
                       app/globals.css :root        clay tokens (default)
                                       [data-theme="ocean"|"forest"|       ← override --accent
                                        "grape"|"coral"]                     family only

SettingsButton.tsx (Client) ──→ click swatch → setTheme(t)
                                useEffect: setAttribute on <html>
                                onCancel: cleanup reverts to initial
                                onSave: updateProfile({ theme }) → revalidate
```

5 themes available: clay (default), ocean, forest, grape, coral. Only `--accent`,
`--accent-hover`, `--accent-soft`, `--accent-ink` change between themes. School
colors (`--cg`, `--ltv`, `--tx`, `--ntt`, `--nn`, `--ntl`), surface, ink, status
colors remain stable.

Landing page uses its own theme via `window.TWEAKS.theme` (currently `"ocean"`,
hard-coded in `app/(landing)/Landing.tsx:59`). Not synced with user theme by design.

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

Missing any → audit emits `FIGURE_MISSING`. New figures via Codex/Gemini CLI
(`scripts/draw-figure.sh` dispatcher), see `.claude/commands/exam-import.md` §9.

## Theming notes

CSS variables in `app/globals.css`:
- Accent family (`--accent`, `--accent-soft`, `--accent-ink`, `--accent-hover`):
  varies by `data-theme`.
- School palette (`--cg`, `--ntt`, `--ltv`, `--tx`, `--nn`, `--ntl`):
  identity-bound, never changes.
- `--ink`, `--ink-muted`, `--surface`, `--border-soft`, `--border-strong`:
  light-mode neutral, theme-independent.
- Brand orange for accents in landing (`#f59e0b`) overridden by `data-theme`.
- **Light mode only** — no dark-mode toggle yet (would need separate token
  overrides; future work).
