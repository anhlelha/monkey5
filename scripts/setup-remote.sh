#!/bin/bash
# Remote Setup Script (Runs on VM)
set -e

echo "=== System Package Updates ==="
sudo apt-get update -y

# 1. Install Node.js 20 if not installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js $(node -v) is already installed."
fi

# 2. Install SQLite, Build Essential, PM2
echo "Installing SQLite and build dependencies..."
sudo apt-get install -y sqlite3 build-essential git

if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 process manager..."
    sudo npm install -g pm2
fi

# 3. Setup Project
cd "${REMOTE_PROJECT_PATH:-$HOME/monkey5}"
echo "Installing project dependencies..."
npm install

echo "Preparing database..."
# Prisma db push is idempotent and cheap — always run so schema stays in sync.
# --accept-data-loss is required for lossless column-type changes (e.g.
# Attempt.earned Int→Float for AI essay grading); without it db push aborts when
# a column it would alter holds existing rows, breaking the deploy.
npx prisma db push --accept-data-loss
# Re-seed is DESTRUCTIVE (deleteMany + insert per exam). Only run when exam
# content sources actually changed. Caller sets RUN_SEED=0 to skip. Default on
# so a bare `bash scripts/setup-remote.sh` / `deploy.sh` keeps old behavior.
if [ "${RUN_SEED:-1}" = "1" ]; then
    echo "Re-seeding exam content (destructive)..."
    npx tsx scripts/build-exams-metadata.ts
    npx tsx scripts/seed-all-exams.ts
    # Standalone topic-practice bank (examId=null). NOT touched by seed-all-exams
    # (which only deletes by examId in metadata), so it must be seeded separately.
    # Each such script is idempotent (deletes its own source tag before insert).
    echo "Seeding standalone topic-practice bank..."
    npx tsx scripts/seed-tuoi-reference.ts
    # Bank from scripts/supplemental-questions.json (IDs prefixed "supp-"; deletes
    # only its own "supp-*" rows, so it never clobbers the cuid-keyed tuoi bank).
    npx tsx scripts/seed-supplemental.ts
    # Personalized remedial sets ("Bài thầy giao"): private per-student Exams
    # (ownerUserId set). Idempotent via deterministic exam ids — upserts the Exam
    # row (preserving Attempt history) and replaces its questions. Resolves owner
    # by email, creating a minimal User if they haven't signed in yet.
    # See docs/REMEDIAL-SETS-DESIGN.md.
    echo "Seeding personalized remedial sets..."
    npx tsx scripts/seed-remedial-mika.ts
else
    echo "Skipping exam re-seed (RUN_SEED=0) — no exam-content changes detected."
fi

echo "Building Next.js application..."
npm run build

echo "Starting application with PM2..."
APP_NAME="${VM_NAME:-monkey5}"
# Check if pm2 process exists, otherwise start it
if pm2 show "$APP_NAME" &>/dev/null; then
    pm2 restart "$APP_NAME"
else
    pm2 start npm --name "$APP_NAME" -- start
fi

# Save PM2 process list
pm2 save

echo "=== Remote Setup Complete! ==="
