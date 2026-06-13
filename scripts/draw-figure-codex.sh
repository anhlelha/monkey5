#!/usr/bin/env bash
# draw-figure-codex.sh
#
# Delegate figure SVG generation to OpenAI Codex CLI.
#
# Pipeline mirrors draw-figure-gemini.sh:
#   1. Render the requested PDF page to PNG (pdftoppm preferred).
#   2. Optionally crop to the figure region.
#   3. Call `codex exec` headless with the PNG (-i) + the same SVG prompt.
#   4. Extract <svg>…</svg> from the last-message file and save.
#
# Auth: uses ~/.codex/auth.json (codex login chatgpt). No env key needed.
#
# Usage:
#   scripts/draw-figure-codex.sh \
#     --pdf "public/ref_exam/<TenPdf>.pdf" \
#     --page 22 \
#     --figure-id ltv-2020-c20 \
#     --description "Tam giác ABC với cevian, M là trung điểm BC, …"
#
# Optional:
#   --crop WxH+X+Y      ImageMagick crop spec (px @ density 200).
#   --model NAME        Override Codex model (uses config default if omitted).
#   --keep-png          Giữ PNG sau khi xong.
#   --out-dir DIR       Default: scripts/.codex-figure-out

set -euo pipefail

SCRIPT_DIR_ABS="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

PDF=""
PAGE=""
FIGURE_ID=""
DESCRIPTION=""
CROP=""
# Default to gpt-5.5 (supports vision; gpt-5.5-codex doesn't exist on API).
# Override with --model if needed (e.g. gpt-5, gpt-5.1).
MODEL="gpt-5.5"
KEEP_PNG=0
OUT_DIR="scripts/.codex-figure-out"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pdf) PDF="$2"; shift 2;;
    --page) PAGE="$2"; shift 2;;
    --figure-id) FIGURE_ID="$2"; shift 2;;
    --description) DESCRIPTION="$2"; shift 2;;
    --crop) CROP="$2"; shift 2;;
    --model) MODEL="$2"; shift 2;;
    --keep-png) KEEP_PNG=1; shift;;
    --out-dir) OUT_DIR="$2"; shift 2;;
    -h|--help) sed -n '1,30p' "$0"; exit 0;;
    *) echo "Unknown arg: $1" >&2; exit 2;;
  esac
done

for var in PDF PAGE FIGURE_ID DESCRIPTION; do
  if [[ -z "${!var}" ]]; then
    echo "ERROR: missing --${var,,}" >&2
    exit 2
  fi
done

if ! command -v codex >/dev/null 2>&1; then
  echo "ERROR: 'codex' not in PATH. Install via brew (brew install codex) or npm." >&2
  exit 3
fi

# Same pdftoppm/magick selection logic as the Gemini helper.
PDFTOPPM=""
MAGICK=""
if command -v pdftoppm >/dev/null 2>&1; then
  PDFTOPPM="$(command -v pdftoppm)"
elif [[ -x "/opt/homebrew/bin/pdftoppm" ]]; then
  PDFTOPPM="/opt/homebrew/bin/pdftoppm"
fi
if [[ -z "$PDFTOPPM" ]]; then
  if [[ -x "/opt/homebrew/bin/magick" ]]; then
    MAGICK="/opt/homebrew/bin/magick"
  elif command -v magick >/dev/null 2>&1; then
    MAGICK="$(command -v magick)"
  else
    echo "ERROR: cần 'pdftoppm' (brew install poppler) HOẶC 'magick' (brew install imagemagick ghostscript)." >&2
    exit 3
  fi
fi

mkdir -p "$OUT_DIR"
PNG_TMP="$OUT_DIR/$FIGURE_ID.src.png"
SVG_OUT="$OUT_DIR/$FIGURE_ID.svg"

echo "→ Render PDF p.$PAGE -> $PNG_TMP"
if [[ -n "$PDFTOPPM" ]]; then
  TMP_PREFIX="$OUT_DIR/$FIGURE_ID.src"
  "$PDFTOPPM" -png -r 200 -f "$PAGE" -l "$PAGE" "$PDF" "$TMP_PREFIX"
  GENERATED="$(ls -t "${TMP_PREFIX}"-*.png 2>/dev/null | head -n1 || true)"
  if [[ -z "$GENERATED" || ! -f "$GENERATED" ]]; then
    echo "ERROR: pdftoppm không sinh file PNG." >&2
    exit 3
  fi
  mv "$GENERATED" "$PNG_TMP"
else
  "$MAGICK" -density 200 "${PDF}[$((PAGE - 1))]" -background white -alpha remove "$PNG_TMP"
fi

if [[ -n "$CROP" ]]; then
  echo "→ Crop $CROP"
  if [[ -x "/opt/homebrew/bin/magick" ]] || command -v magick >/dev/null 2>&1; then
    MAGICK_BIN="${MAGICK:-$(command -v magick)}"
    "$MAGICK_BIN" "$PNG_TMP" -crop "$CROP" +repage "$PNG_TMP"
  else
    echo "⚠ Bỏ qua crop: cần 'magick' để cắt ảnh." >&2
  fi
fi

PROMPT_FILE="$OUT_DIR/$FIGURE_ID.prompt.txt"
cat > "$PROMPT_FILE" <<EOF
ROLE: You are a professional mathematical illustrator and SVG engineer.
Your task is to RECONSTRUCT the geometry diagram from the attached PNG as
clean SVG vector graphics for an exam-prep web app (Monkey5).

YOU ARE NOT DRAWING A PICTURE — you are constructing a mathematical diagram.
Every object must be represented by geometric primitives: point, segment,
circle, arc, polygon. Avoid artistic rendering. Prefer exact coordinates.

CONTEXT (problem description):
$DESCRIPTION

OUTPUT FORMAT:
- Output ONLY one valid <svg>…</svg> block. No markdown fence, no prose,
  no explanation, no comments outside the svg tag.
- SVG 1.1, with explicit \`viewBox="0 0 W H"\`. NO width/height attributes
  on the root element (the React wrapper sets sizing).
- All objects must be editable vectors. No raster, no base64, no <canvas>.
- All text must remain editable.
- No decorative effects, shadows, gradients, raster elements.

GEOMETRY RULES (strict — get them right):
- Preserve relative proportions of the source figure.
- Preserve topology EXACTLY (which vertex touches which, which face opens
  to which face, where a cavity meets the boundary of the solid).
- Do not estimate randomly — compute coordinates from the dimensions given.
- If dimensions are given in CONTEXT, render dimension labels.
- Visible edges → solid lines.
- Hidden edges (behind a face) → dashed lines (\`stroke-dasharray="6 4"\`).
- Dimension lines → thin strokes.

3D FIGURES (cubes, boxes, prisms):
- Use isometric projection (typical 30° offsets) unless source figure
  clearly uses a different projection.
- Front-facing edges solid; hidden edges dashed.
- For internal cavities / holes carved INTO a solid: read the source
  CAREFULLY to determine WHERE the cavity opens. A cavity along an edge
  opens onto TWO faces; a cavity in the middle of a face opens onto ONE.
  Topology MUST match — wrong cavity placement is the most common error.
- Show interior edges of cavities with dashed construction lines.
- Dimensions placed outside the object when possible.

MONKEY5 STYLE OVERRIDES (apply ON TOP of the rules above):
- Strokes: \`stroke="var(--ink)"\`, \`stroke-width="1.5"\`. NO \`stroke="black"\`,
  NO hex colors — only \`var(--ink)\`, \`orange\`, \`white\`.
- Faces: \`fill="none"\` by default; use \`fill="white"\` only when a face must
  occlude a hidden edge behind it.
- Vertex dots (when labels need anchoring): \`<circle r="4" fill="orange" stroke="orange"/>\`.
- Labels: \`<text fill="var(--ink)" font-size="16" font-style="italic" font-family="Times,serif">…</text>\`.
- Equal-segment ticks: short \`<line>\` perpendicular to the segment.
- Curved regions: \`<path d="M … A rx,ry 0 0 1 x,y …"/>\`.
- Do NOT draw watermarks, page numbers, or surrounding problem text.
- Do NOT add a title above the figure (the React wrapper handles layout).

OUTPUT EXAMPLE (structure only, content depends on the input figure):
<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
  <line x1="..." y1="..." x2="..." y2="..." stroke="var(--ink)" stroke-width="1.5"/>
  <line x1="..." y1="..." x2="..." y2="..." stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="6 4"/>
  <circle cx="..." cy="..." r="4" fill="orange" stroke="orange"/>
  <text x="..." y="..." fill="var(--ink)" font-size="16" font-style="italic" font-family="Times,serif">A</text>
</svg>

Begin — output ONLY the <svg>…</svg> block:
EOF

echo "→ Gọi Codex (model: ${MODEL:-default})"
RAW_OUT="$OUT_DIR/$FIGURE_ID.raw.txt"
LAST_MSG="$OUT_DIR/$FIGURE_ID.last.txt"

# Auto-source .env.local from project root if OPENAI_API_KEY not yet in env.
# This makes the helper self-bootstrapping — user doesn't need to remember to
# `set -a; source .env.local; set +a` before each call.
if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  PROJECT_ROOT="$(cd -- "$SCRIPT_DIR_ABS/.." &> /dev/null && pwd)"
  ENV_FILE="$PROJECT_ROOT/.env.local"
  if [[ -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
  fi
fi

# Guard: still no key after auto-source → fail fast with clear message.
if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "ERROR: OPENAI_API_KEY not found in env or .env.local." >&2
  echo "       Add 'OPENAI_API_KEY=sk-...' to .env.local at project root," >&2
  echo "       or run with '--engine gemini' to skip Codex." >&2
  exit 4
fi

# To FORCE API-key auth (bypass user's ~/.codex/auth.json ChatGPT login which
# may not have Codex tier), use an EPHEMERAL CODEX_HOME with only the API key.
# Created fresh per run + auto-deleted on exit so the key never persists.
ISOLATED_HOME="$(mktemp -d -t monkey5-codex-XXXXXX)"
chmod 700 "$ISOLATED_HOME"
# Trap covers normal exit, errors, and signals — guarantees cleanup.
# Codex creates plugin clones with restrictive perms inside CODEX_HOME/.tmp/;
# chmod -R u+w before rm so cleanup is reliable.
cleanup_isolated() {
  if [[ -n "${ISOLATED_HOME:-}" && -d "$ISOLATED_HOME" ]]; then
    chmod -R u+w "$ISOLATED_HOME" 2>/dev/null || true
    rm -rf "$ISOLATED_HOME"
  fi
}
trap cleanup_isolated EXIT INT TERM

# Register API key in isolated home (idempotent — overwrites if rotated).
# Stdin form is the only way to install an API key non-interactively.
if ! printf '%s' "$OPENAI_API_KEY" | CODEX_HOME="$ISOLATED_HOME" \
       codex login --with-api-key --skip-git-repo-check >/dev/null 2>&1; then
  # Older codex builds may not support --skip-git-repo-check on `login`; retry.
  printf '%s' "$OPENAI_API_KEY" | CODEX_HOME="$ISOLATED_HOME" \
       codex login --with-api-key >/dev/null 2>&1 || true
fi

# Codex flags rationale:
#   -i <png>                 attach image (Codex's own flag, not Gemini's @path)
#   -s read-only             sandbox blocks shell / write — no agent side-effects
#   --skip-git-repo-check    safe: we don't need codex's git integration here
#   --ephemeral              don't persist session rollouts to ~/.codex
#   --ignore-rules           don't load project .rules (we want a clean prompt)
#   -o <file>                write last assistant message to file (the SVG)
#   CODEX_HOME=…             isolated dir with API-key auth only (see above)
CODEX_ARGS=(
  exec
  -s read-only
  --skip-git-repo-check
  --ephemeral
  --ignore-rules
  -i "$PNG_TMP"
  -o "$LAST_MSG"
)
if [[ -n "$MODEL" ]]; then
  CODEX_ARGS+=(-m "$MODEL")
fi

if ! CODEX_HOME="$ISOLATED_HOME" codex "${CODEX_ARGS[@]}" "$(cat "$PROMPT_FILE")" > "$RAW_OUT" 2>&1; then
  echo "ERROR: codex call failed. See $RAW_OUT" >&2
  tail -40 "$RAW_OUT" >&2
  exit 4
fi

# Codex CLI exits 0 even when the model API rejects the request (e.g. "model
# not supported for ChatGPT account"). Catch that explicitly so dispatcher
# can fall back instead of marking success.
if grep -qE '"type":"error"|invalid_request_error|insufficient_quota|rate_limit' "$RAW_OUT"; then
  echo "ERROR: codex returned an API error (model rejected / quota / auth)." >&2
  grep -E '"type":"error"|invalid_request_error|insufficient_quota' "$RAW_OUT" | head -3 >&2
  exit 4
fi

# Extract <svg>…</svg> from the last-message file (preferred) or raw stdout.
python3 - <<PY
import re, sys, pathlib
candidates = ["$LAST_MSG", "$RAW_OUT"]
for path in candidates:
    p = pathlib.Path(path)
    if not p.exists(): continue
    raw = p.read_text(encoding="utf-8")
    m = re.search(r"<svg[\s\S]*?</svg>", raw, re.IGNORECASE)
    if m:
        pathlib.Path("$SVG_OUT").write_text(m.group(0), encoding="utf-8")
        print(f"OK: wrote $SVG_OUT ({len(m.group(0))} bytes) from {path}")
        sys.exit(0)
print("ERROR: no <svg> block found in Codex output.", file=sys.stderr)
print("--- last message ---", file=sys.stderr)
for path in candidates:
    p = pathlib.Path(path)
    if p.exists(): print(p.read_text(encoding="utf-8"), file=sys.stderr)
sys.exit(5)
PY

if [[ "$KEEP_PNG" -ne 1 ]]; then
  rm -f "$PNG_TMP"
fi

echo ""
echo "✓ Done. Next steps for Claude:"
echo "  1. Read $SVG_OUT and review visually."
echo "  2. Add case \"$FIGURE_ID\" to components/ExamFigure.tsx with the SVG."
echo "  3. Add \"$FIGURE_ID\" to IMPLEMENTED_FIGURES in:"
echo "       - app/(app)/admin/qa-constants.ts"
echo "       - scripts/audit-questions.ts"
echo "  4. Add figure: \"$FIGURE_ID\" to the question's override entry."
echo "  5. Run: npx tsc --noEmit"
