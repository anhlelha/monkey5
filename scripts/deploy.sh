#!/bin/bash
# Application Deployment Script (Step 2)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

echo "=== Application Deployment ==="

# Check IP & Key
if [ "$GCP_IP" = "REPLACEME_IP" ] || [ -z "$GCP_IP" ]; then
    echo "Error: GCP_IP is not set. Please run scripts/provision.sh first."
    exit 1
fi

if [ ! -f "$GCP_KEY" ]; then
    echo "Error: SSH private key not found at $GCP_KEY"
    exit 1
fi

# 1. Sync environment files (Secrets)
echo "Deploying environment configuration..."
if [ -f "$SCRIPT_DIR/../.env.local" ]; then
    scp -i "$GCP_KEY" -o StrictHostKeyChecking=no "$SCRIPT_DIR/../.env.local" "$GCP_USER@$GCP_IP:$REMOTE_PROJECT_PATH/.env"
elif [ -f "$SCRIPT_DIR/../.env" ]; then
    scp -i "$GCP_KEY" -o StrictHostKeyChecking=no "$SCRIPT_DIR/../.env" "$GCP_USER@$GCP_IP:$REMOTE_PROJECT_PATH/.env"
else
    echo "Warning: No .env or .env.local found locally to copy."
fi

# 2. Sync codebase using rsync
echo "Synchronizing codebase..."
# Create remote dir if not exists
ssh -i "$GCP_KEY" -o StrictHostKeyChecking=no "$GCP_USER@$GCP_IP" "mkdir -p $REMOTE_PROJECT_PATH"

rsync -avz -e "ssh -i $GCP_KEY -o StrictHostKeyChecking=no" \
    --exclude="node_modules" \
    --exclude=".next" \
    --exclude="prisma/dev.db*" \
    --exclude=".git" \
    --exclude=".env*" \
    --exclude="*.tsbuildinfo" \
    "$SCRIPT_DIR/../" "$GCP_USER@$GCP_IP:$REMOTE_PROJECT_PATH/"

# 3. Run Remote Setup
echo "Running remote setup on VM..."
scp -i "$GCP_KEY" -o StrictHostKeyChecking=no "$SCRIPT_DIR/setup-remote.sh" "$GCP_USER@$GCP_IP:~/setup-remote.sh"
ssh -i "$GCP_KEY" -o StrictHostKeyChecking=no "$GCP_USER@$GCP_IP" "bash ~/setup-remote.sh"

echo "=== Deployment Complete! ==="
