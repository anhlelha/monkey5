#!/bin/bash
# Context-aware prod deploy pipeline: backup → deploy → backfill → regrade.
#
# Vì sao tồn tại: scripts/deploy.sh + setup-remote.sh trước đây LUÔN re-seed DB
# (destructive) mỗi lần deploy, và deploy-full.sh cũ LUÔN chạy backfill + regrade.
# Phần lớn deploy chỉ đụng UI/app code → re-seed/backfill/regrade là thừa và rủi
# ro. Script này tự PHÁT HIỆN file nào đổi giữa commit đang chạy trên VM và HEAD,
# rồi chỉ chạy step DB cần thiết:
#
#   File đổi                                              │ Step bật
#   ──────────────────────────────────────────────────────┼──────────────────────
#   scripts/exam-overrides.ts, seed-*.ts,                 │ SEED (kéo theo
#   build-exams-metadata.ts, official_exams_metadata.json,│   BACKFILL + REGRADE
#   ref_exam/**, prisma/schema.prisma                     │   vì đáp án có thể đổi)
#   lib/grading/**, scripts/regrade-attempts.ts           │ REGRADE
#   lib/grading/classify.ts, backfill-answer-schema.ts    │ BACKFILL
#   lib/mastery.ts, lib/readiness.ts,                     │ RECOMPUTE MASTERY
#   lib/school-profiles.ts, recompute-mastery-readiness.ts│   (+ readiness mọi user)
#   chỉ UI/app code khác                                  │ (không step DB)
#
# Build + PM2 restart + `prisma db push` luôn chạy (an toàn, idempotent).
# Backup prod DB luôn chạy trước deploy (rẻ, an toàn).
#
# Usage:
#   bash scripts/deploy-full.sh              # tự phát hiện, prompt y/N trước regrade
#   bash scripts/deploy-full.sh --yes        # tự phát hiện, auto-apply regrade
#   bash scripts/deploy-full.sh --full       # ép chạy SEED + BACKFILL + REGRADE
#   bash scripts/deploy-full.sh --app-only   # bỏ mọi step DB (chỉ build + restart)
#   bash scripts/deploy-full.sh --no-seed    # ép tắt SEED
#   bash scripts/deploy-full.sh --no-backfill# ép tắt BACKFILL
#   bash scripts/deploy-full.sh --no-regrade # ép tắt REGRADE
#   bash scripts/deploy-full.sh --recompute-mastery  # ép recompute mastery+readiness
#   bash scripts/deploy-full.sh -m "msg"     # đặt commit message cho auto-commit
#   bash scripts/deploy-full.sh --no-git     # bỏ qua git (code đã commit+push rồi)
# (các cờ có thể kết hợp, ví dụ: --full --yes -m "fix X")
#
# GIT TÍCH HỢP: trước khi deploy, script tự `git add -A` + commit (message từ -m,
# hoặc auto-gen từ danh sách file) + `git push` lên branch hiện tại. Vì VM
# `git reset --hard origin/main`, branch phải là main để thay đổi tới được prod.
# Chỉ cần gõ "deploy" là xong: commit → push → deploy theo ngữ cảnh.
#
# Yêu cầu: GCP_KEY tồn tại; GCP_IP trong scripts/config.sh đúng IP hiện tại.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Load GCP_USER, GCP_IP, GCP_KEY, REMOTE_PROJECT_PATH
# shellcheck disable=SC1091
source scripts/config.sh

AUTO_YES=0
FORCE_FULL=0
APP_ONLY=0
FORCE_NO_SEED=0
FORCE_NO_BACKFILL=0
FORCE_NO_REGRADE=0
FORCE_RECOMPUTE_MASTERY=0
NO_GIT=0
COMMIT_MSG=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes|-y)        AUTO_YES=1 ;;
    --full)          FORCE_FULL=1 ;;
    --app-only)      APP_ONLY=1 ;;
    --no-seed)       FORCE_NO_SEED=1 ;;
    --no-backfill)   FORCE_NO_BACKFILL=1 ;;
    --no-regrade)    FORCE_NO_REGRADE=1 ;;
    --recompute-mastery) FORCE_RECOMPUTE_MASTERY=1 ;;
    --no-git)        NO_GIT=1 ;;
    -m|--message)    COMMIT_MSG="${2:-}"; shift ;;
    -h|--help)
      sed -n '2,46p' "$0"; exit 0 ;;
    *)
      echo "Unknown flag: $1" >&2; exit 1 ;;
  esac
  shift
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

# ── Git: commit + push local changes (VM pulls from GitHub) ─────────────────
if [[ "$NO_GIT" -eq 1 ]]; then
  banner "Git — SKIPPED (--no-git)"
else
  banner "Git — commit + push thay đổi local"
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [[ "$BRANCH" != "main" ]]; then
    echo "⚠ Đang ở branch '$BRANCH' nhưng VM reset --hard về origin/main."
    echo "  Thay đổi trên branch này sẽ KHÔNG tới prod cho đến khi merge vào main."
  fi
  if [[ -n "$(git status --porcelain)" ]]; then
    git add -A
    if [[ -z "$COMMIT_MSG" ]]; then
      _files=$(git diff --cached --name-only | head -8 | tr '\n' ' ')
      _n=$(git diff --cached --name-only | wc -l | tr -d ' ')
      COMMIT_MSG="chore(deploy): $_n file(s) — $_files"
    fi
    git commit -m "$COMMIT_MSG"
    echo "✓ Committed: $COMMIT_MSG"
  else
    echo "Working tree sạch — không có gì để commit."
  fi
  # Always push current branch; git no-ops (\"Everything up-to-date\") if nothing new.
  git push origin "$BRANCH"
  echo "✓ Pushed → origin/$BRANCH"
fi

# ── Detect what changed vs the commit currently deployed on the VM ──────────
banner "Step 0/4 — Phân tích thay đổi để quyết định step"

NEW_SHA=$(git rev-parse HEAD)
PREV_SHA=$(ssh_vm "cd $REMOTE_PROJECT_PATH && git rev-parse HEAD 2>/dev/null" 2>/dev/null || echo "")

NEEDS_SEED=0
NEEDS_BACKFILL=0
NEEDS_REGRADE=0
NEEDS_MASTERY=0
DETECT_MODE="auto"

if [[ -z "$PREV_SHA" ]] || ! git cat-file -e "${PREV_SHA}^{commit}" 2>/dev/null; then
  # Không biết commit trên VM (lần đầu / force-push / không reachable) → an toàn:
  # chạy hết.
  DETECT_MODE="unknown→full"
  NEEDS_SEED=1; NEEDS_BACKFILL=1; NEEDS_REGRADE=1; NEEDS_MASTERY=1
  echo "⚠ Không xác định được commit đang chạy trên VM — bật hết step cho an toàn."
else
  CHANGED=$(git diff --name-only "$PREV_SHA" "$NEW_SHA")
  if [[ -z "$CHANGED" ]]; then
    echo "Không có file nào đổi giữa $PREV_SHA và $NEW_SHA (deploy lại cùng commit)."
  else
    echo "File đổi ($PREV_SHA → $NEW_SHA):"
    echo "$CHANGED" | sed 's/^/  /'
    while IFS= read -r f; do
      [[ -z "$f" ]] && continue
      case "$f" in
        scripts/exam-overrides.ts|scripts/seed-*.ts|scripts/build-exams-metadata.ts|official_exams_metadata.json|prisma/schema.prisma|ref_exam/*)
          NEEDS_SEED=1 ;;
      esac
      case "$f" in
        lib/grading/*|scripts/regrade-attempts.ts) NEEDS_REGRADE=1 ;;
      esac
      case "$f" in
        lib/grading/classify.ts|scripts/backfill-answer-schema.ts) NEEDS_BACKFILL=1 ;;
      esac
      case "$f" in
        lib/mastery.ts|lib/readiness.ts|lib/school-profiles.ts|scripts/recompute-mastery-readiness.ts) NEEDS_MASTERY=1 ;;
      esac
    done <<< "$CHANGED"
    # Re-seed có thể đổi đáp án/câu hỏi → kéo theo backfill schema + regrade +
    # recompute mastery (profile trường đổi → readiness đổi).
    if [[ "$NEEDS_SEED" -eq 1 ]]; then NEEDS_BACKFILL=1; NEEDS_REGRADE=1; NEEDS_MASTERY=1; fi
  fi
fi

# ── Apply overrides ─────────────────────────────────────────────────────────
if [[ "$FORCE_FULL" -eq 1 ]]; then
  DETECT_MODE="--full"
  NEEDS_SEED=1; NEEDS_BACKFILL=1; NEEDS_REGRADE=1; NEEDS_MASTERY=1
fi
if [[ "$APP_ONLY" -eq 1 ]]; then
  DETECT_MODE="--app-only"
  NEEDS_SEED=0; NEEDS_BACKFILL=0; NEEDS_REGRADE=0; NEEDS_MASTERY=0
fi
[[ "$FORCE_RECOMPUTE_MASTERY" -eq 1 ]] && NEEDS_MASTERY=1
[[ "$FORCE_NO_SEED" -eq 1 ]]     && NEEDS_SEED=0
[[ "$FORCE_NO_BACKFILL" -eq 1 ]] && NEEDS_BACKFILL=0
[[ "$FORCE_NO_REGRADE" -eq 1 ]]  && NEEDS_REGRADE=0

yn() { [[ "$1" -eq 1 ]] && echo "YES" || echo "no"; }
echo
echo "Kế hoạch deploy (mode: $DETECT_MODE):"
echo "  • build + PM2 restart  : YES (luôn)"
echo "  • prisma db push       : YES (luôn, idempotent)"
echo "  • re-seed exam content : $(yn $NEEDS_SEED)"
echo "  • backfill schema      : $(yn $NEEDS_BACKFILL)"
echo "  • regrade attempts     : $(yn $NEEDS_REGRADE)"
echo "  • recompute mastery    : $(yn $NEEDS_MASTERY)"

# ── Step 1: backup before deploy (always — cheap safety net) ────────────────
banner "Step 1/5 — Backup prod DB BEFORE deploy"
ssh_vm "cd $REMOTE_PROJECT_PATH && \
  cp prisma/dev.db prisma/dev.db.bak-pre-deploy-$STAMP && \
  ls -lh prisma/dev.db.bak-pre-deploy-$STAMP"

# ── Step 2: deploy (pull + build + restart; re-seed only if needed) ─────────
if [[ "$NEEDS_SEED" -eq 1 ]]; then
  banner "Step 2/5 — deploy.sh (pull + RE-SEED bank + PM2 restart)"
  RUN_SEED=1 bash scripts/deploy.sh
else
  banner "Step 2/5 — deploy.sh (pull + build + PM2 restart, KHÔNG re-seed)"
  bash scripts/deploy.sh --no-seed
fi

# ── Step 3: backfill answer schemas (only if needed) ────────────────────────
if [[ "$NEEDS_BACKFILL" -eq 1 ]]; then
  banner "Step 3/5 — Backup pre-regrade + backfill clone schemas"
  ssh_vm "cd $REMOTE_PROJECT_PATH && \
    cp prisma/dev.db prisma/dev.db.bak-pre-regrade-$STAMP && \
    npx tsx scripts/backfill-answer-schema.ts"
else
  banner "Step 3/5 — SKIPPED backfill (không có thay đổi grading/content)"
fi

# ── Step 3b: re-sync spawned clones from source bank questions ──────────────
# Re-seed chỉ cập nhật câu hỏi trong metadata; bản clone trong set luyện tập
# (set-*/ref-*) giữ correct/modelAnswer/answerSchema CŨ → chấm sai âm thầm
# (CLAUDE.md pitfall #5). Chạy sau SEED để clone bám theo đáp án đã sửa.
if [[ "$NEEDS_SEED" -eq 1 ]]; then
  banner "Step 3b/5 — Sync clone answers (set-*/ref-*) từ câu gốc"
  ssh_vm "cd $REMOTE_PROJECT_PATH && npx tsx scripts/sync-clone-answers.ts"
else
  banner "Step 3b/5 — SKIPPED sync clone (không re-seed nội dung)"
fi

# ── Step 4: regrade attempts (only if needed; dry-run gate) ─────────────────
if [[ "$NEEDS_REGRADE" -eq 1 ]]; then
  # Backfill chạy backup pre-regrade rồi; nếu backfill bị skip, tạo backup ở đây.
  if [[ "$NEEDS_BACKFILL" -ne 1 ]]; then
    ssh_vm "cd $REMOTE_PROJECT_PATH && cp prisma/dev.db prisma/dev.db.bak-pre-regrade-$STAMP"
  fi

  banner "Step 4/5 — Re-grade Attempts (dry-run trước)"
  ssh_vm "cd $REMOTE_PROJECT_PATH && npx tsx scripts/regrade-attempts.ts --dry-run"

  RUN_REGRADE=1
  if [[ "$AUTO_YES" -eq 0 ]]; then
    echo
    read -rp "Apply regrade thật? [y/N] " ans
    # POSIX-safe lowercase test (works on macOS bash 3.2; ${var,,} is bash 4+).
    if [[ ! "$ans" =~ ^[Yy] ]]; then
      RUN_REGRADE=0
      echo "✗ Bỏ qua regrade. Backup vẫn còn trên VM, chạy lại bằng:"
      echo "   ssh -i $GCP_KEY $REMOTE 'cd $REMOTE_PROJECT_PATH && npx tsx scripts/regrade-attempts.ts'"
    fi
  fi
  [[ "$RUN_REGRADE" -eq 1 ]] && ssh_vm "cd $REMOTE_PROJECT_PATH && npx tsx scripts/regrade-attempts.ts"
else
  banner "Step 4/5 — SKIPPED regrade (không có thay đổi grading/content)"
fi

# ── Step 5: recompute mastery + readiness for all users (only if needed) ────
# Bật khi đổi lib/mastery.ts / readiness.ts / school-profiles.ts hoặc re-seed
# (profile trường đổi). Backfill số liệu đã persist trên User để hiển thị ngay.
if [[ "$NEEDS_MASTERY" -eq 1 ]]; then
  banner "Step 5/5 — Recompute mastery + readiness cho mọi user"
  ssh_vm "cd $REMOTE_PROJECT_PATH && npx tsx scripts/recompute-mastery-readiness.ts 2>&1 | tail -20"
else
  banner "Step 5/5 — SKIPPED recompute mastery (không đổi công thức mastery/readiness)"
fi

banner "Done"
ssh_vm "cd $REMOTE_PROJECT_PATH && ls -lh prisma/dev.db.bak-*-$STAMP regrade-backup-*.json 2>/dev/null | tail -10 || true"
echo
echo "Rollback nếu cần:"
echo "  ssh -i $GCP_KEY $REMOTE 'cd $REMOTE_PROJECT_PATH && cp prisma/dev.db.bak-pre-deploy-$STAMP prisma/dev.db && pm2 restart monkey5'"
