#!/bin/bash
# Full prod deploy pipeline: backup → deploy → backfill → regrade.
#
# Vì sao tồn tại: scripts/deploy.sh chỉ làm git pull + re-seed + PM2 restart,
# NHƯNG (1) không backup prod DB trước khi seed (destructive), và (2) không
# động đến clone exams (set-*/ref-*) cũng như Attempt rows đã đóng băng. Script
# này gói toàn bộ rollout vào 1 lệnh, với backup hai tầng và dry-run gate trước
# khi mutate Attempt.
#
# Usage:
#   bash scripts/deploy-full.sh              # interactive, prompt y/N trước regrade
#   bash scripts/deploy-full.sh --yes        # auto-apply regrade (không hỏi)
#   bash scripts/deploy-full.sh --no-regrade # chỉ deploy + backfill, bỏ regrade
#
# Yêu cầu: GCP_KEY tồn tại; GCP_IP trong scripts/config.sh đúng IP hiện tại.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Load GCP_USER, GCP_IP, GCP_KEY, REMOTE_PROJECT_PATH
# shellcheck disable=SC1091
source scripts/config.sh

AUTO_YES=0
SKIP_REGRADE=0
for arg in "$@"; do
  case "$arg" in
    --yes|-y)        AUTO_YES=1 ;;
    --no-regrade)    SKIP_REGRADE=1 ;;
    -h|--help)
      sed -n '2,18p' "$0"; exit 0 ;;
    *)
      echo "Unknown flag: $arg" >&2; exit 1 ;;
  esac
done

REMOTE="$GCP_USER@$GCP_IP"
SSH_OPTS=(-i "$GCP_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10)
STAMP=$(date +%Y%m%d-%H%M%S)

ssh_vm() {
  ssh "${SSH_OPTS[@]}" "$REMOTE" "$@"
}

banner() {
  echo
  echo "════════════════════════════════════════════════════════════════════════"
  echo "  $*"
  echo "════════════════════════════════════════════════════════════════════════"
}

banner "Step 1/4 — Backup prod DB BEFORE deploy"
ssh_vm "cd $REMOTE_PROJECT_PATH && \
  cp prisma/dev.db prisma/dev.db.bak-pre-deploy-$STAMP && \
  ls -lh prisma/dev.db.bak-pre-deploy-$STAMP"

banner "Step 2/4 — Run scripts/deploy.sh (pull + re-seed bank + PM2 restart)"
bash scripts/deploy.sh

banner "Step 3/4 — Backup prod DB pre-regrade, then backfill clone schemas"
ssh_vm "cd $REMOTE_PROJECT_PATH && \
  cp prisma/dev.db prisma/dev.db.bak-pre-regrade-$STAMP && \
  npx tsx scripts/backfill-answer-schema.ts"

if [[ "$SKIP_REGRADE" -eq 1 ]]; then
  banner "Step 4/4 — SKIPPED regrade (--no-regrade)"
  echo "Để chạy regrade sau:"
  echo "  ssh -i $GCP_KEY $REMOTE 'cd $REMOTE_PROJECT_PATH && npx tsx scripts/regrade-attempts.ts'"
  exit 0
fi

banner "Step 4/4 — Re-grade Attempts (dry-run trước)"
ssh_vm "cd $REMOTE_PROJECT_PATH && npx tsx scripts/regrade-attempts.ts --dry-run"

if [[ "$AUTO_YES" -eq 0 ]]; then
  echo
  read -rp "Apply regrade thật? [y/N] " ans
  case "${ans,,}" in
    y|yes) ;;
    *) echo "✗ Bỏ qua regrade. Backup vẫn còn trên VM, chạy lại bằng:"
       echo "   ssh -i $GCP_KEY $REMOTE 'cd $REMOTE_PROJECT_PATH && npx tsx scripts/regrade-attempts.ts'"
       exit 0 ;;
  esac
fi

ssh_vm "cd $REMOTE_PROJECT_PATH && npx tsx scripts/regrade-attempts.ts"

banner "Done"
ssh_vm "cd $REMOTE_PROJECT_PATH && ls -lh prisma/dev.db.bak-*-$STAMP regrade-backup-*.json 2>/dev/null | tail -10 || true"
echo
echo "Rollback nếu cần:"
echo "  ssh -i $GCP_KEY $REMOTE 'cd $REMOTE_PROJECT_PATH && cp prisma/dev.db.bak-pre-deploy-$STAMP prisma/dev.db && pm2 restart monkey5'"
