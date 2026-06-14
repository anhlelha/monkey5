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
| `AUTH_TRUST_HOST` | yes in prod | Set to `true` when running behind a reverse proxy / custom domain. Prevents Auth.js `UntrustedHost` error. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no (Demo fallback works) | Google OAuth. Create at <https://console.cloud.google.com/apis/credentials>; authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (dev) or `https://<your-domain>/api/auth/callback/google` (prod). |
| `ADMIN_EMAILS` | recommended | Comma-separated emails auto-promoted to admin role on first sign-in. |
| `DATABASE_URL` | no | Override SQLite location. Defaults to `file:./dev.db`. |
| `GEMINI_API_KEY` | no | Used by `scripts/draw-figure-gemini.sh` (slash command `/exam-import` → figure workflow). Free key at <https://aistudio.google.com/app/apikey>. |
| `OPENAI_API_KEY` | no | Used by `scripts/draw-figure-codex.sh` (Codex CLI fallback for figure generation). Set at <https://platform.openai.com/api-keys>. |

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
                        Modal, MathInput, DrawPad, Question, ExamFigure
lib/
  prisma.ts           ← singleton Prisma client
  static.ts           ← DEFAULT_TOPICS (SCHOOLS moved to DB — see schools.ts)
  schools.ts          ← getActiveSchools(), getAllSchools(), MIX_SCHOOL,
                        60s in-memory cache, invalidateSchoolsCache()
  mastery.ts          ← computeMastery(userId) → topicMastery + levelMastery
                        from TopicSession + Attempt rows (MIN_SAMPLE=5)
  school-profiles.ts  ← ensureSchoolProfilesFresh() with hash detection,
                        buildSchoolProfile() (6-factor difficulty formula),
                        getAllSchoolProfiles(), auto-discovers new schools
  readiness.ts        ← computeReadiness(), computeAllReadiness(),
                        computeGapTop3() — pure functions, no DB
  user-data.ts        ← hydrate JSON-string user fields (incl. theme)
  socratic.ts         ← canned Socratic dialogs
  grading/            ← gradeAnswer(), classify, matchers (numeric, set, …)
  exam.ts, fmt.ts     ← shared types + formatters
prisma/
  schema.prisma       ← User (+theme), Account, Session, Exam, Question,
                        Attempt, CustomSet, Topic, TopicSession, School,
                        SchoolProfile, UserWhitelist, PlanConfig, LevelConfig
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
- **Snapshot-based readiness scoring** (2026-06-14): each submit recomputes
  `topicMastery` + per-school `readiness` from full Attempt + TopicSession
  history. Baseline 50% for new users (was 0%). Readiness computed for *all*
  schools regardless of target choice — student sees "best-match school" hint
  + top 3 gap-advice for their target. See [`docs/READINESS-REDESIGN.md`](docs/READINESS-REDESIGN.md).
- **Auto-detected school profiles** (`SchoolProfile` table): topic-weight +
  level-weight + difficulty index per school, rebuilt via hash detection
  whenever Question/Exam rows change. Discovers new schools automatically.
- **User theme picker** (2026-06-14): 5 palettes (clay default, ocean,
  forest, grape, coral) selectable from the Settings modal's "Giao diện"
  section. Persisted via `User.theme`, SSR-rendered into `<html data-theme>`
  for no-flash first paint, live preview while picking.
- Settings panel (slide-in) — edit profile, targets, exam date, hours, ready
  target, theme; sign out
- Admin tabs: overview KPIs, exams list, **question bank** (paginated +
  topic/source filters), topics editor (full CRUD), users table, **plans**
  (free/pro/vip config + level config), **whitelist** (email→role/plan
  presets), **schools** (CRUD on School table + color picker), **readiness**
  (user distribution histogram + buttons "Refresh profiles" / "Recompute all
  readiness"), QA panel (audit flagged questions + figures), settings stub
- Admin "Tạo đề mới" wizard — creates a reference Exam row
- Admin "Tạo bài tập" wizard — creates a CustomSet row tied to a topic
- Middleware enforces: signed-in for any app page, admin role for `/admin*`,
  `/create*`, `/create-ex*`
- Production deployment to GCP Compute Engine + Nginx reverse proxy + SSL.
  See [`CLAUDE.md`](./CLAUDE.md) § "Infrastructure & Deployment".

## What's stubbed / not yet built

- **Generated exam content** — the wizards persist metadata (Exam, CustomSet rows)
  but don't yet generate real question records. New exams therefore fall back
  to the sample exam questions when taken.
- **AI tutor LLM call** — uses the canned `SOCRATIC` dialogs from the prototype.
  Real LLM integration is not wired.
- **`/results` sidebar link** — lists past attempts (works), but the design
  also implied a richer recent-results dashboard.
- **Timeseries readiness snapshots** — admin sees current distribution per
  school; week-over-week trend chart not yet built (deferred from readiness
  redesign Phase 5 / Q5).

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
