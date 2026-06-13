<!-- Generated: 2026-06-12 | Files scanned: package.json + helper scripts | Token estimate: ~600 -->

# Dependencies

## Runtime (`dependencies`)

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.2.6 | Next.js App Router framework |
| `react` / `react-dom` | 19.2.4 | React renderer (RSC + client) |
| `@prisma/client` | ^5.22.0 | Generated DB client |
| `next-auth` | 5.0.0-beta.31 | Auth.js v5 (Google + Credentials) |
| `@auth/prisma-adapter` | ^2.7.4 | Wires next-auth ↔ Prisma schema |
| `katex` | ^0.17.0 | Math typesetting (in `MathText.tsx`) |
| `zod` | ^3.23.8 | Schema validation (input, env, classify) |

**No** state library (Redux/Zustand/Jotai), **no** CSS framework, **no** chart
library, **no** request library (uses native `fetch` + Server Actions),
**no** test runner (no jest/vitest in package.json).

## Dev (`devDependencies`)

| Package | Purpose |
|---|---|
| `typescript` | ^5 |
| `prisma` | ^5.22.0 (CLI) |
| `tsx` | ^4.19.2 (run TS scripts: `npx tsx scripts/seed-all-exams.ts`) |
| `@types/{node,react,react-dom,katex}` | type declarations |

## External services (zero hard deps at runtime)

| Service | Used by | Required? | Notes |
|---|---|---|---|
| Google OAuth | `auth.ts` | Optional | Demo credentials provider works without it. Set `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`. |
| OpenAI Codex CLI (ChatGPT) | `scripts/draw-figure-codex.sh` (default) | Optional | Primary figure-gen engine. Auth via `codex login` (ChatGPT account) → `~/.codex/auth.json`. |
| Google Gemini API | `scripts/draw-figure-gemini.sh` (fallback) | Optional | Fallback when Codex fails. Free tier (`gemini-2.5-flash-lite`, 1500 RPD). `GEMINI_API_KEY`. |

No payment, no analytics, no email, no CDN, no error tracker wired.

## External system files (consumed but live outside repo)

```
~/.gemini/antigravity-ide/brain/97d27547-…/scratch/smart_parsed_exams.json
   ← parsed stems/options/explanation for LTV / TX / NTT exams
   ← edited only when bulk-rewriting stems; per-question fixes use override map
```

This path is hard-coded in `scripts/seed-all-exams.ts`. Moving it requires a
constant update. Path includes a CUID that's specific to one machine — if the
file moves (e.g. fresh Gemini install), seed will fail loudly.

## Environment variables

Source of truth: `.env.example`. Documented in `README.md` (auto-gen block).

```
AUTH_SECRET             yes  NextAuth session signing (32 bytes base64)
GOOGLE_CLIENT_ID        no   Google OAuth (Demo fallback works)
GOOGLE_CLIENT_SECRET    no   Google OAuth
ADMIN_EMAILS            rec  Comma-separated emails → role=admin on first sign-in
DATABASE_URL            no   Default "file:./dev.db"
GEMINI_API_KEY          no   Only for figure-drawing helper
```

## CLI tools (used by scripts, not bundled)

| Tool | Used by | Install |
|---|---|---|
| `codex` (OpenAI Codex CLI) | `scripts/draw-figure-codex.sh` (default) | `brew install codex` (or `npm i -g @openai/codex`) — then `codex login` |
| `gemini` (Google Gemini CLI) | `scripts/draw-figure-gemini.sh` (fallback) | `npm i -g @google/gemini-cli` |
| `pdftoppm` (poppler) | both | `brew install poppler` |
| `magick` (ImageMagick) | both (optional `--crop`) | `brew install imagemagick` |

## Database

- **SQLite** via `prisma/dev.db` (binary in repo, local-dev only).
- No managed Postgres / no connection pool — single-file DB.
- For migration to Postgres later: change `provider = "sqlite"` to
  `"postgresql"` in `prisma/schema.prisma`, set `DATABASE_URL`, then
  `npx prisma migrate dev`.

## Vendored / hand-written replacements

These would normally be deps but are hand-written here to stay token-lean:

- **Markdown renderer**: ad-hoc inside `MathText.tsx` (no `remark`/`rehype`).
- **Math layout**: Inline KaTeX call (not `react-katex` / `mathjax`).
- **Chart library**: `components/Radar.tsx`, `Bar`, `Donut` in `ui.tsx` —
  raw SVG, no `recharts`/`d3`.
- **Icon set**: `components/Icon.tsx` — inline SVG, no `lucide`/`heroicons`.
- **Fonts**: `next/font/google` (Be Vietnam Pro, JetBrains Mono).

## Adding a new dependency — checklist

1. Justify why hand-rolling won't work (most things here are hand-rolled).
2. `npm install <pkg>` (will regenerate `package-lock.json`).
3. Update this file (dependencies table).
4. If it's a service requiring auth, add to `.env.example` + README block.
