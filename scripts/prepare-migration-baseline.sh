#!/usr/bin/env bash
# Safely adopt the squashed Prisma baseline on an existing SQLite database.
#
# Fresh databases need no special handling: `prisma migrate deploy` applies the
# baseline followed by later migrations. Existing databases may have been
# managed by `prisma db push` or by the former partial migration. Before
# rewriting migration metadata, this script builds a reference database from
# the checked-in SQL and requires Prisma to report an exact schema match.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# READINESS_DATABASE_PATH lets the deploy pipeline rehearse the exact migration
# against a downloaded production backup without touching the working database.
DATABASE_PATH="${READINESS_DATABASE_PATH:-$PROJECT_ROOT/prisma/dev.db}"
export DATABASE_URL="${DATABASE_URL:-file:$DATABASE_PATH}"
BASELINE_NAME="20260825000000_schema_baseline"
V4_NAME="20260826000000_readiness_v4_additive"
LEGACY_NAME="20260608000000_plan_config_question_bank"
BASELINE_SQL="$PROJECT_ROOT/prisma/migrations/$BASELINE_NAME/migration.sql"
V4_SQL="$PROJECT_ROOT/prisma/migrations/$V4_NAME/migration.sql"

if [[ ! -s "$DATABASE_PATH" ]]; then
  echo "Migration baseline: fresh database; migrate deploy will initialize it."
  exit 0
fi

has_table() {
  local table_name="$1"
  sqlite3 "$DATABASE_PATH" \
    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='$table_name';"
}

if [[ "$(has_table User)" != "1" ]]; then
  echo "Migration baseline: no application schema found; migrate deploy will initialize it."
  exit 0
fi

if [[ "$(has_table _prisma_migrations)" == "1" ]] && \
   [[ "$(sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) FROM _prisma_migrations WHERE migration_name='$BASELINE_NAME' AND finished_at IS NOT NULL AND rolled_back_at IS NULL;")" == "1" ]]; then
  echo "Migration baseline: already adopted."
  exit 0
fi

REFERENCE_DATABASE="$(mktemp "${TMPDIR:-/tmp}/monkey5-migration-reference.XXXXXX.db")"
cleanup() {
  rm -f "$REFERENCE_DATABASE"
}
trap cleanup EXIT

sqlite3 "$REFERENCE_DATABASE" ".read $BASELINE_SQL"

HAS_V4=0
if [[ "$(has_table ReadinessSnapshot)" == "1" ]]; then
  HAS_V4=1
  sqlite3 "$REFERENCE_DATABASE" ".read $V4_SQL"
fi

DIFF_OUTPUT="$(
  cd "$PROJECT_ROOT"
  npx prisma migrate diff \
    --from-url "file:$DATABASE_PATH" \
    --to-url "file:$REFERENCE_DATABASE" \
    --script
)"

if [[ -n "${DIFF_OUTPUT//[[:space:]]/}" ]] && \
   [[ "$DIFF_OUTPUT" != *"This is an empty migration"* ]] && \
   [[ "$DIFF_OUTPUT" != *"No difference detected"* ]]; then
  echo "Migration baseline refused: the existing schema differs from the reviewed baseline." >&2
  echo "$DIFF_OUTPUT" >&2
  exit 1
fi

if [[ "$(has_table _prisma_migrations)" == "1" ]]; then
  sqlite3 "$DATABASE_PATH" \
    "DELETE FROM _prisma_migrations WHERE migration_name='$LEGACY_NAME';"
fi

(
  cd "$PROJECT_ROOT"
  npx prisma migrate resolve --applied "$BASELINE_NAME"
)

if [[ "$HAS_V4" == "1" ]] && \
   [[ "$(sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) FROM _prisma_migrations WHERE migration_name='$V4_NAME' AND finished_at IS NOT NULL AND rolled_back_at IS NULL;")" == "0" ]]; then
  (
    cd "$PROJECT_ROOT"
    npx prisma migrate resolve --applied "$V4_NAME"
  )
fi

echo "Migration baseline: existing schema verified and history adopted."
