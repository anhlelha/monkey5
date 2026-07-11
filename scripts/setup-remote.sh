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
    # LevelConfig (số câu/thời gian theo mức, per-subject). prisma/seed.ts is not
    # run during deploy, and `prisma db push` recreates LevelConfig when its PK
    # changes → repopulate here. Idempotent + preserves admin-edited
    # qcount/minutes/active. Cheap, no deps — run first.
    echo "Seeding LevelConfig (per-subject practice levels)..."
    npx tsx scripts/seed-level-config.ts
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
    # English "Bài thầy giao" for mika (subject="english", ownerUserId set).
    # Same idempotent pattern; source is Test_1_Answer_Key.pdf. Question.topic is
    # a plain string (no FK), so it's fine to run before the english topics below.
    npx tsx scripts/seed-remedial-mika-en.ts
    # English subject: 10 topics + sample exams (subject="english"). Idempotent
    # (deletes its own en-* exams/questions/passages then re-inserts) and builds
    # the english SchoolProfile (6-factor difficulty). Independent of the math
    # seed above. See docs/ENGLISH-SUBJECT-DESIGN.md.
    echo "Seeding English subject..."
    npx tsx scripts/seed-english.ts
    # Real English exams from scripts/.en-import/en-*.json (subject="english").
    # Idempotent per-exam; rebuilds english SchoolProfile and drops superseded
    # sample exams. See .claude/commands/exam-import-en.md.
    echo "Seeding English exams (real)..."
    npx tsx scripts/seed-english-exams.ts
    # Vietnamese subject: 10 chuyên đề + real transcribed exams from
    # scripts/vn-exams/*.json (subject="vietnamese"; CG/NTT/LTV). Idempotent
    # (deletes its own vn-* exams/questions/passages then re-inserts) and builds
    # the vietnamese SchoolProfile (6-factor difficulty). Independent of the math
    # and english seeds above. See .claude/commands/exam-import-vn.md.
    echo "Seeding Vietnamese subject (real exams)..."
    npx tsx scripts/seed-vietnamese.ts
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
