# Cùng Khỉ con vào lớp 6 CLC

Next.js + TypeScript implementation of the Grade 5 exam prep app, ported from
the Claude Design handoff in `design-reference/`.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Prisma 5** + **SQLite** (`prisma/dev.db`) — schema in `prisma/schema.prisma`
- **Auth.js v5** (`next-auth@5.0.0-beta.31`) with Google provider + a Credentials
  "demo" provider for local development
- No CSS framework — uses the prototype's hand-tuned CSS (ported to `app/globals.css`)
  with Be Vietnam Pro + JetBrains Mono via `next/font/google`

## First-time setup

```bash
npm install
npx prisma db push     # create SQLite DB + tables
npm run db:seed        # seed schools, topics, sample exam, topic sets
cp .env.example .env.local   # edit with real secrets
npm run dev
```

Open <http://localhost:3000>.

### Environment variables (`.env.local`)

<!-- AUTO-GENERATED from .env.example — keep in sync; do not hand-edit this table -->

| Var | Required | Purpose |
| --- | --- | --- |
| `AUTH_SECRET` | yes | NextAuth session signing. Generate: `openssl rand -base64 32`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no (Demo fallback works) | Google OAuth. Create at <https://console.cloud.google.com/apis/credentials>; authorized redirect URI: `http://localhost:3000/api/auth/callback/google`. |
| `ADMIN_EMAILS` | recommended | Comma-separated emails auto-promoted to admin role on first sign-in. |
| `DATABASE_URL` | no | Override SQLite location. Defaults to `file:./dev.db`. |
| `GEMINI_API_KEY` | no | Used by `scripts/draw-figure-gemini.sh` (slash command `/exam-import` → figure workflow). Free key at <https://aistudio.google.com/app/apikey>. |

<!-- /AUTO-GENERATED -->

### Sign-in modes

1. **Google** — appears automatically when `GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_SECRET` are both set.
2. **Demo (email-only)** — always available. Enter any email + display name;
   no password. If the email is in `ADMIN_EMAILS`, the account gets admin role.

## Project structure

```
app/
  (app)/              ← protected app shell (sidebar layout)
    home/             ← dashboard with readiness, radar, recent activity
    library/          ← past exams + reference exams
    topics/           ← 10 topic landings
      [id]/           ← topic detail + practice sets
    results/          ← list of past attempts
    admin/            ← admin tabs: overview, exams, topics editor, users, settings
    create/           ← admin: create reference exam wizard
    create-ex/        ← admin: create topic set wizard
  exam/[examId]/      ← fullscreen exam runner (outside app shell)
    results/[attemptId]/   ← graded review + AI tutor side panel
  signin/             ← Google + Demo sign-in
  onboarding/         ← 2-step target schools + study hours
  api/auth/[...nextauth]/   ← Auth.js handler
components/           ← Icon, Sidebar, TopBar, Card, Pill, Bar, Donut, Radar,
                        Modal, MathInput, DrawPad, Question
lib/
  prisma.ts           ← singleton Prisma client
  static.ts           ← SCHOOLS, TOPICS, seed data
  user-data.ts        ← hydrate JSON-string user fields
  socratic.ts         ← canned Socratic dialogs
  exam.ts, fmt.ts     ← shared types + formatters
prisma/
  schema.prisma       ← User, Account, Session, Exam, Question, Attempt,
                        CustomSet, Topic
  seed.ts             ← upserts topics, past exams, sample-exam questions,
                        and topic sets
auth.ts               ← Auth.js config with Google + Credentials provider
middleware.ts         ← route gating: signed-in for /(app)/, admin-only for
                        /admin + /create + /create-ex
```

## What's implemented end-to-end

- Sign-in (Google + Demo) → Onboarding (school targets + hours) → Dashboard
- Browse past exams (with school / kind filters), take an exam, submit, view
  graded results, ask the AI tutor (canned Socratic dialog from the prototype)
- Topics landing → per-topic detail with practice sets pulled from the DB
- Settings panel (slide-in) — edit profile, targets, exam date, hours, ready
  target; sign out
- Admin tabs: overview KPIs, exams list, topics editor (full CRUD with reorder,
  rename, recolor, change icon, add, delete), users table, settings stub
- Admin "Tạo đề mới" wizard — creates a reference Exam row
- Admin "Tạo bài tập" wizard — creates a CustomSet row tied to a topic
- Middleware enforces: signed-in for any app page, admin role for `/admin*`,
  `/create*`, `/create-ex*`

## What's stubbed / not yet built

- **Generated exam content** — the wizards persist metadata (Exam, CustomSet rows)
  but don't yet generate real question records. New exams therefore fall back
  to the sample exam questions when taken.
- **Admin "Ngân hàng câu hỏi" (Question Bank)** tab — not yet ported. The
  existing admin tabs are: overview, exams, topics, users, settings.
- **Real readiness recalculation after attempts** — the score is stored, but
  per-school readiness percentages are not yet recomputed (the design's
  "+3" delta in Results is illustrative).
- **AI tutor LLM call** — uses the canned `SOCRATIC` dialogs from the prototype.
  Real LLM integration is not wired.
- **`/results` sidebar link** — lists past attempts (works), but the design
  also implied a richer recent-results dashboard.
- **PDF uploads from the handoff** — not copied into `public/` yet; the prototype
  didn't reference them at runtime.

## Common commands

<!-- AUTO-GENERATED from package.json scripts — keep in sync; do not hand-edit -->

```bash
npm run dev           # Next dev server (Turbopack)
npm run build         # production build (also runs prisma generate)
npm run start         # production server (after build)

npm run db:push       # apply schema.prisma changes
npm run db:seed       # re-run seed (idempotent — topics + whitelist only)
npm run db:reset      # nuke + re-create DB and reseed

npx prisma studio     # GUI for inspecting the DB
```

<!-- /AUTO-GENERATED -->

> Note: `npm run db:seed` only seeds topics + admin whitelist. The exam
> content pipeline (CG/LTV/TX/NTT past papers) is separate — see
> [`CLAUDE.md`](./CLAUDE.md) for the override-map → metadata → DB flow and
> the `/exam-import` slash command for tooling.

## Design reference

The original Claude Design handoff is in `design-reference/grade5exam/project/`.
This directory is `.gitignore`d but kept locally for pixel-level reference when
porting remaining details.
