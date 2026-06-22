# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read first

`README.md` covers stack, env vars, sign-in modes, project structure, common
`npm` commands, and the "what's implemented / what's stubbed" status. Read it
before editing app code.

This file documents the non-obvious architecture — the exam content pipeline
and grading semantics that span many files.

## Exam content pipeline (CRITICAL)

The app reads questions from `prisma/dev.db` at runtime via Prisma — **never**
from JSON. JSON/PDF files are upstream sources that feed the DB through a
multi-layer pipeline. Editing the wrong layer is a silent no-op.

```
SOURCE OF TRUTH                                       │ Edit this layer for…
──────────────────────────────────────────────────────┼──────────────────────────
scripts/exam-overrides.ts                             │ correct / unit / figure
  ├── MANUAL_OVERRIDES   (per-question, all schools)  │ + small stem tweaks
  └── CG_ENRICHMENT_MAP  (CG-only, higher priority)   │ + modelAnswer touchups

ref_exam/CG_parsed_questions.json                     │ Bulk CG stem / options /
                                                       │ explanation rewrites

~/.gemini/antigravity-ide/brain/97d27547-…/scratch/   │ Bulk LTV/TX/NTT stem /
  smart_parsed_exams.json   (file lives OUTSIDE repo) │ options / explanation

                  │ build-exams-metadata.ts (regen)
                  ▼
official_exams_metadata.json   (GENERATED — never hand-edit)
   correct, unit, figure, sections, qcount come from override map

                  │ seed-all-exams.ts (destructive: deleteMany + insert)
                  ▼
prisma/dev.db   (runtime source of truth)
   stem         ← parsed_json.stem        OR override.stem
   modelAnswer  ← parsed_json.explanation OR override.modelAnswer
   correct      ← metadata.correct        (always from metadata)
   unit         ← metadata.unit
   figure       ← metadata.figure
```

### Pitfalls that have bitten us

1. **`correct` and `unit` in `CG_parsed_questions.json` are IGNORED at seed
   time.** The seed pulls these from `official_exams_metadata.json` (built from
   `CG_ENRICHMENT_MAP`). Edit the override map, not the parsed JSON.
2. **MCQ `correct` must be the letter `"A" | "B" | "C" | "D"`**, never the
   value. `lib/grading/index.ts` does exact string match on the option ID;
   storing `"0,5"` for an MCQ whose B option is `1/2` silently fails all
   submissions. See line 75 of grading/index.ts.
3. **Override `stem` and `modelAnswer` must be pre-formatted LaTeX
   (`$…$` delimiters).** The seed's `formatMathText()` is idempotent and
   bypasses any text already containing `$`; raw values get auto-wrapped which
   can corrupt LaTeX (e.g. `\frac{a}{a+b}` getting a stray `$` inserted).
4. **Watermark + page-header strip** runs only at seed time
   (`stripWatermarks()`). Patterns live in `WATERMARK_PATTERNS_SEED` of
   `scripts/seed-all-exams.ts` and cover "MathExpress Education", "Toán Tuổi
   Thơ", "violympic", next-page header bleeds (`ĐỀ KIỂM TRA TUYỂN SINH VÀO LỚP N…`,
   `ĐỀ THI TUYỂN SINH (VÀO) LỚP N…`), and the per-question point prefix
   `(0,5 điểm)` / `(0,75 điểm)` / `(2 điểm)` used in 2024-onward NTT exams.
   If a new pattern leaks in, add it there and re-seed.
5. **`spawn-exam.ts` clones questions** into runtime exams with CUID examIds
   (`set-*`, `ref-*`). These rows are NOT touched by `seed-all-exams.ts`
   (which `deleteMany`s only by examIds in metadata), so when you correct a
   bank question's `correct` / `modelAnswer` / `answerSchema`, every clone
   spawned *before* the fix keeps the stale values and silently mis-grades.
   Clones carry `sourceQuestionId` → run **`scripts/sync-clone-answers.ts`**
   (then `regrade-attempts.ts`) to re-propagate answers from the source. This
   runs automatically as Step 3b of `deploy-full.sh` whenever SEED fires.
6. **Seed is destructive**: for every exam in metadata, it
   `deleteMany({ examId })` then re-inserts. Always
   `cp prisma/dev.db prisma/dev.db.bak-$(date +%Y%m%d-%H%M%S)` before
   running.

### Standard workflow after editing any source file

```bash
cp prisma/dev.db prisma/dev.db.bak-$(date +%Y%m%d-%H%M%S)
npx tsx scripts/build-exams-metadata.ts   # regen official_exams_metadata.json
npx tsx scripts/seed-all-exams.ts         # re-seed DB (destructive)
npx tsx scripts/audit-questions.ts        # flag remaining issues
```

`audit-questions.ts` reports: `FIGURE_MISSING`, `FIGURE_LIKELY`, `NO_ANSWER`,
`SHORT_STEM`, `WATERMARK`, `MATH_RAW`. JSON output via `--json` →
`scripts/audit-results.json`, consumed by the `/admin?tab=qa` panel.

## Grading semantics

Three layers — all in `lib/grading/`:

```
classifyAnswer(correct)  →  AnswerSchema        ← lib/grading/classify.ts
                                  ↓
gradeAnswer(q, raw)      →  pick matcher        ← lib/grading/index.ts
                                  ↓
matchExact / matchNumeric / matchNumericSet / matchLabeled / matchRegex
                                                ← lib/grading/matchers/*.ts
```

`gradeAnswer` is the single source of truth at runtime; **both submit-time
(`app/exam/[examId]/actions.ts`) and render-time (`ResultsView.tsx`) call it**.
That means a grading code fix updates the per-question UI of OLD attempts on
refresh, but the `Attempt.earned`/`score` columns stay frozen at submit-time
values until the user retakes (or a backfill script updates them).

**Per-type rules:**

- **MCQ**: exact string match on option ID. No normalization, no schema.
- **fill**: tries `parseSchema(q.answerSchema)` first; falls back to lenient
  string equality (`matchExact`) — strips spaces, normalizes diacritics.
- **essay**: not graded automatically; `correct` is typically `null`.

**Auto-classification at seed time** (added 2026-06-12): `seed-all-exams.ts`
calls `classifyAnswer(q.correct)` for every `fill` question and writes the
resulting schema into `Question.answerSchema`. So you no longer need to run
`scripts/apply-classifications.ts` separately — schemas survive any re-seed.
Skip rules: low-confidence results stay null, and `kind: "exact"` schemas
aren't written (text answers like `"Siêu thị"` fall through to `matchExact`).

The classifier rules (`lib/grading/classify.ts`) handle:
- `"6"` / `"−2,5"` → `{kind: "numeric", value: …}`
- `"a=6"` / `"x = 5/3"` / `"AN/AD = 1/3"` → numeric (variable prefix ignored)
- `"24; 26; 28; 30"` / `"a = 13; b = 17; c = 20"` → `numeric_set` (unordered)
- `"mẹ 50, con 25"` → `labeled` (accepts both labeled and bare-multiset forms)

→ User can type just the value (`"6"`), the value with variable (`"a=6"`),
multi-value in any order (`"32,5"` vs `"5;32"`), or labeled (`"mẹ 32, con 5"`)
— all grade correctly. Don't add normalization hacks in `normalize.ts`;
instead extend `classify.ts` or attach a manual `answerSchema` via override.

**When adding a new question:**
- Has 4 options A/B/C/D in the PDF? → `type: "mcq"`, `correct: "<letter>"`,
  populate `options` in parsed JSON.
- One numeric/text answer? → `type: "fill"`, `correct` is the value, `unit`
  separately. Auto-classifier handles the schema.
- "Trình bày lời giải"? → `type: "essay"`, `correct: null`. (Set `correct` to
  the đáp số when known — the AI essay grader uses it as the answer key.)

## AI essay grading

Essay (`type: "essay"`) questions are graded by an LLM, configured by admin in
the **Setup AI LLMs** tab (`/admin?tab=llm`). The pipeline spans:

```
LLMSetting (singleton, DB)          lib/llm-settings.ts  (get/save/resolve key db||env)
   provider | model | apiKey?       │
   gradingPrompt | weights          │ getResolvedLLMSettings() → null when off/keyless
                                     ▼
lib/llm/client.ts   callLLM() — fetch to Anthropic / OpenAI / Gemini REST (no SDK dep)
lib/llm/grade-essay.ts   gradeEssaySafe() — builds prompt, parses JSON verdict,
                         computes points from weights (scoreFraction). Never throws.
                                     ▼
lib/grading/essay-attempt.ts   recomputeAttemptScore(attemptId, {gradeEssays})
   — single source of truth: rule-grades mcq/fill + AI-grades essays, writes
     EssayGrade rows + updates Attempt.earned/score. Used by BOTH submit & regrade.
```

Key facts:
- **`Attempt.earned` is `Float`** (was Int) — essays award fractional points
  (0,25 granularity via `roundQuarter`). `total` stays Int (sum of `points`).
- **Scoring policy** (admin-editable %): `methodWeight` (cách làm đúng),
  `answerWeight` (đáp số đúng), `guessCredit` (đúng đáp số nhưng đoán mò → cách
  làm sai). Computed deterministically in code from the model's verdict
  (`answerCorrect`/`methodScore`/`guessed`), NOT trusted from the model directly.
- **API key**: stored in `LLMSetting.apiKey` (admin UI, masked) OR the provider's
  env var (`ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY`); DB wins.
- **Model catalog + default rubric**: `lib/llm/providers.ts` (latest models as of
  June 2026; admin can also type a custom model id). Editing the rubric can't break
  data injection — stem/answer/JSON-contract are always appended in code.
- **`submitExam`** grades essays inline on submit (parallel, 45s timeout each);
  on any failure it falls back to rule-based scoring so submission never breaks.
- **Results page** loads `EssayGrade` rows → `ResultsView` shows per-essay AI
  feedback (đáp số/cách làm/đoán mò badges). Admin view has a "Chấm lại bằng AI"
  button (`regradeEssays` action, admin-gated).
- **`scripts/regrade-attempts.ts`** (runs on deploy) was patched to ADD stored
  `EssayGrade.earned` back in — it scores essays as 0 via `gradeAnswer` otherwise,
  which would wipe AI essay scores on every deploy. It never re-calls the LLM.

## Figure rendering

Hand-written SVG cases in `components/ExamFigure.tsx`, keyed by
`figure` ID. Conventions: `viewBox="0 0 W H"`, `stroke="var(--ink)"`,
`fill="orange"` for vertices; no `fill="black"` or hex colors (breaks
dark mode). Wrap in `<div className="q-figure-wrapper" style={{maxWidth:…}}>`.

A figure ID is "live" only when registered in THREE places:
1. `components/ExamFigure.tsx` — the actual SVG case.
2. `IMPLEMENTED_FIGURES` in `app/(app)/admin/qa-constants.ts`.
3. `IMPLEMENTED_FIGURES` in `scripts/audit-questions.ts`.

Missing one entry produces `FIGURE_MISSING` in audit.

### Gemini-assisted SVG generation

`scripts/draw-figure-gemini.sh` delegates figure drawing to Gemini CLI
(`@google/gemini-cli` at `~/.npm-global/bin/gemini`). The slash command
`/exam-import` invokes it for figure tasks.

Hard-learned quirks baked into the helper:

- `GEMINI_CLI_TRUST_WORKSPACE=true` required for headless mode.
- Images attach via `@<path>` **inside the prompt**, NOT via flag `-i`
  (that flag means "interactive mode", not "image").
- `--approval-mode plan` is **mandatory** — without it the model autonomously
  invokes WebSearch/Shell tools, burning 5–10 API calls per figure and
  exhausting the free-tier quota immediately.
- Default model `gemini-2.5-flash-lite` (1500 RPD free tier). `gemini-3.5-flash`
  has only 20 RPD free — usable as `--model` override when accuracy matters.
- Renders PDF pages with `pdftoppm` (poppler), not ImageMagick — Magick
  needs Ghostscript which isn't installed on this machine.
- Output: `scripts/.gemini-figure-out/<id>.svg`. Gemini gets the math right
  (point coordinates, midpoints, ratios) but layout often needs Claude
  touch-up (push edge points into viewBox, add tick marks for equal
  segments).

## Slash command

`.claude/commands/exam-import.md` is the operational guide for all
exam-content tasks. Invoke as `/exam-import <school> <year> <action>`, e.g.
`/exam-import CG 2020-21 đối chiếu với PDF`. The command routes to one of
four workflows: import new PDF, audit existing exam vs PDF, fix specific
errors, or draw a figure (delegates to Gemini).

## Notable scripts beyond `seed`/`build`

| Script | What it does |
| --- | --- |
| `scripts/parse-smart.ts` | TXT → parsed JSON (heuristic stem extraction). Output goes to `smart_parsed_exams.json` outside the repo. |
| `scripts/classify-answers.ts`, `apply-classifications.ts`, `evaluate-all.ts`, `evaluate-json.ts` | Dry-run / apply / validation for answer schemas. Mostly historical — schemas are now auto-attached by `seed-all-exams.ts` (see grading section). `apply-classifications.ts` is still useful for one-off CUID bank questions that `seed-all-exams` doesn't touch. |
| `scripts/regrade-attempts.ts` | Backfill: re-grade every persisted `Attempt` row with the current `gradeAnswer` code and update `earned`/`score`/`correctCount`. Run after any grading or schema change if you want OLD attempts to reflect the new logic (per-question UI updates on refresh, but Attempt-level scores need this). |
| `scripts/check-*.ts`, `find-*.ts` | One-off diagnostic queries (count rows, find missing IDs, etc.). Many are throwaway — read the file header before reusing. |
| `scripts/seed-sample-exam.ts` | MD → DB for hand-written practice exams (skips the override pipeline). |

`prisma/seed.ts` only seeds topics + admin whitelist; the exam content
pipeline is the separate `scripts/seed-all-exams.ts` (not invoked by
`npm run db:seed`).

## Routing & auth

`middleware.ts` enforces:
- Any path under `app/(app)/` → must be signed-in.
- `/admin*`, `/create*`, `/create-ex*` → must have `role === "admin"`.
- `/exam/[examId]` lives outside the `(app)` shell on purpose (fullscreen
  exam runner).

Admin role is granted via `ADMIN_EMAILS` env var (auto-promoted on first
sign-in) or via the `userWhitelist` table seeded by `prisma/seed.ts`.

## When making schema changes

```bash
# Edit prisma/schema.prisma
npx prisma db push           # apply to local dev.db
npx prisma generate          # regenerate client
# If exam content semantics changed, also:
npx tsx scripts/seed-all-exams.ts
```

There's no migration history under `prisma/migrations/` checked in for these
schema iterations — local dev uses `db push`. If a real migration history is
needed later, switch to `prisma migrate dev`.

## Infrastructure & Deployment (GCP)

The project is deployed on Google Cloud Platform (GCP) Compute Engine using a set of bash scripts under the `scripts/` directory.

### Configuration
All deployment settings are defined in [scripts/config.sh](file:///Users/anhlh48/00.AIProjects/99.Monkey5/scripts/config.sh):
- `GCP_PROJECT`: Current active project ID (`monkey5-499403`).
- `GCP_ZONE`: Zone for the VM (`asia-southeast1-a`).
- `VM_NAME`: Instance name (`monkey5-server`).
- `GCP_KEY`: Dedicated SSH private key for VM login (`~/.ssh/gcp-monkey5-499403-key`).
- `GCP_IP`: Dynamically populated external IP of the GCE VM.
- `REMOTE_PROJECT_PATH`: Target absolute path on the VM (`/home/anhlh48/monkey5`).

### 1. Provisioning Infrastructure
To provision a brand new VM instance and configure networking:
```bash
bash scripts/provision.sh
```
This script performs the following actions:
1. Generates a dedicated project SSH key pair at `~/.ssh/gcp-monkey5-499403-key` (if it does not exist).
2. Enables the `compute.googleapis.com` service API on the GCP project.
3. Spins up a GCE virtual machine `monkey5-server` (machine-type `e2-medium`, Ubuntu 22.04 LTS) with public HTTP/HTTPS tags and the local SSH public key injected.
4. Configures a VPC ingress firewall rule `allow-monkey5-ports` to permit TCP traffic on ports `3000` (Next.js app) and `8000`.
5. Queries the external IP of the VM and auto-updates `GCP_IP` in `scripts/config.sh`.

### 2. Application Deployment
Since codebase synchronization is performed by **cloning/pulling from GitHub directly on the VM**, any local changes (e.g. scripts or config changes) must be committed and pushed to GitHub prior to running the deployment:
```bash
git add .
git commit -m "commit message"
git push origin main
bash scripts/deploy.sh
```
The deploy script:
1. Establishes the VM's SSH directory and copies the local private Git Deploy Key `~/.ssh/git_deploy_key_monkey5` to the VM's `~/.ssh/id_rsa` (scoped strictly to the private repository).
2. Runs `git clone` (first-time) or `git pull` (updates) on the VM to fetch the latest code directly from GitHub.
3. SCPs `.env.local` to the VM as `.env` and automatically rewrites `NEXTAUTH_URL` from `http://localhost:3000` to `http://<VM_IP>:3000` (so Google OAuth works).
4. Executes the remote setup script [scripts/setup-remote.sh](file:///Users/anhlh48/00.AIProjects/99.Monkey5/scripts/setup-remote.sh) on the VM:
   - Installs system prerequisites (Node.js 20, SQLite3, build-essential, git, and PM2 globally).
   - Installs NPM dependencies.
   - Runs Prisma schema synchronization (`npx prisma db push`) and seeds the SQLite database (`npx tsx scripts/seed-all-exams.ts`).
   - Compiles and builds the production Next.js application.
   - Launches or restarts the Next.js process using PM2 under the process name `monkey5` and persists it (`pm2 save`).

### Verification & Monitoring
- **App URL**: The application runs on `http://<VM_IP>:3000`.
- **View VM Logs**: SSH into the VM and run `pm2 logs monkey5`.
- **Process Status**: Run `pm2 status`.

