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
cd ~/monkey5
echo "Installing project dependencies..."
npm install

echo "Preparing database..."
# Run Prisma push and seed the exams database
npx prisma db push
npx tsx scripts/build-exams-metadata.ts
npx tsx scripts/seed-all-exams.ts

echo "Building Next.js application..."
npm run build

echo "Starting application with PM2..."
# Check if pm2 process exists, otherwise start it
if pm2 show monkey5 &>/dev/null; then
    pm2 restart monkey5
else
    pm2 start npm --name "monkey5" -- start
fi

# Save PM2 process list
pm2 save

echo "=== Remote Setup Complete! ==="
