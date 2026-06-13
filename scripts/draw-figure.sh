#!/usr/bin/env bash
# draw-figure.sh
#
# Unified entry point for figure SVG generation. Tries Codex CLI first
# (default per 2026-06-12 skill update), falls back to Gemini CLI if
# Codex fails. Same args as the two specific helpers.
#
# Routing:
#   --engine codex      (default) only try Codex
#   --engine gemini     only try Gemini
#   --engine auto       try Codex, fall back to Gemini on failure
#
# Output goes to whichever engine succeeded:
#   Codex success  → scripts/.codex-figure-out/<figure-id>.svg
#   Gemini success → scripts/.gemini-figure-out/<figure-id>.svg
#
# Usage (same as draw-figure-{codex,gemini}.sh):
#   scripts/draw-figure.sh \
#     --pdf "public/ref_exam/<TenPdf>.pdf" \
#     --page 22 \
#     --figure-id ltv-2020-c20 \
#     --description "…"
#
# Optional: --crop, --model, --keep-png, --out-dir (passed through),
#           --engine codex|gemini|auto

set -euo pipefail

ENGINE="auto"
ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --engine) ENGINE="$2"; shift 2;;
    -h|--help) sed -n '1,30p' "$0"; exit 0;;
    *) ARGS+=("$1"); shift;;
  esac
done

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
CODEX_HELPER="$SCRIPT_DIR/draw-figure-codex.sh"
GEMINI_HELPER="$SCRIPT_DIR/draw-figure-gemini.sh"

try_codex() {
  if [[ ! -x "$CODEX_HELPER" ]]; then
    echo "ERROR: $CODEX_HELPER not executable" >&2
    return 3
  fi
  "$CODEX_HELPER" "${ARGS[@]}"
}

try_gemini() {
  if [[ ! -x "$GEMINI_HELPER" ]]; then
    echo "ERROR: $GEMINI_HELPER not executable" >&2
    return 3
  fi
  "$GEMINI_HELPER" "${ARGS[@]}"
}

case "$ENGINE" in
  codex)
    echo "→ Engine: Codex (only)"
    try_codex
    ;;
  gemini)
    echo "→ Engine: Gemini (only)"
    try_gemini
    ;;
  auto)
    echo "→ Engine: auto (Codex → Gemini fallback)"
    # Disable -e so we can capture the helper's actual exit code; `if cmd; then`
    # zeroes $? after the fi-close so we must call directly.
    set +e
    try_codex
    CODEX_RC=$?
    set -e
    if [[ $CODEX_RC -eq 0 ]]; then exit 0; fi
    echo "" >&2
    echo "⚠ Codex helper failed (exit $CODEX_RC). Falling back to Gemini…" >&2
    echo "" >&2
    try_gemini
    ;;
  *)
    echo "ERROR: --engine must be one of: codex, gemini, auto (got: $ENGINE)" >&2
    exit 2
    ;;
esac
