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

# 1. Ensure Git is installed and setup SSH Key on VM
echo "Ensuring Git is installed on VM..."
ssh -i "$GCP_KEY" -o StrictHostKeyChecking=no "$GCP_USER@$GCP_IP" "sudo apt-get update -y && sudo apt-get install -y git"

echo "Deploying Git Deploy Key to VM..."
GIT_KEY_PATH="$HOME/.ssh/git_deploy_key_monkey5"
if [ -f "$GIT_KEY_PATH" ]; then
    # Ensure remote .ssh directory exists
    ssh -i "$GCP_KEY" -o StrictHostKeyChecking=no "$GCP_USER@$GCP_IP" "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
    # Copy key
    scp -i "$GCP_KEY" -o StrictHostKeyChecking=no "$GIT_KEY_PATH" "$GCP_USER@$GCP_IP:~/.ssh/id_rsa"
    # Set permissions and scan github.com host key
    ssh -i "$GCP_KEY" -o StrictHostKeyChecking=no "$GCP_USER@$GCP_IP" "chmod 600 ~/.ssh/id_rsa && ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts 2>/dev/null"
else
    echo "Error: Local Git Deploy Key not found at $GIT_KEY_PATH"
    exit 1
fi

# 2. Clone or Pull codebase via Git on VM
echo "Setting up/Updating codebase on VM via Git..."
ssh -i "$GCP_KEY" -o StrictHostKeyChecking=no "$GCP_USER@$GCP_IP" "
    if [ ! -d \"$REMOTE_PROJECT_PATH/.git\" ]; then
        echo 'Cloning repository from GitHub...'
        git clone git@github.com:anhlelha/monkey5.git \"$REMOTE_PROJECT_PATH\"
    else
        echo 'Pulling latest changes from GitHub...'
        cd \"$REMOTE_PROJECT_PATH\"
        git fetch --all
        git reset --hard origin/main
    fi
"

# 3. Sync environment files (Secrets)
echo "Deploying environment configuration..."
if [ -f "$SCRIPT_DIR/../.env.local" ]; then
    scp -i "$GCP_KEY" -o StrictHostKeyChecking=no "$SCRIPT_DIR/../.env.local" "$GCP_USER@$GCP_IP:$REMOTE_PROJECT_PATH/.env"
elif [ -f "$SCRIPT_DIR/../.env" ]; then
    scp -i "$GCP_KEY" -o StrictHostKeyChecking=no "$SCRIPT_DIR/../.env" "$GCP_USER@$GCP_IP:$REMOTE_PROJECT_PATH/.env"
else
    echo "Warning: No .env or .env.local found locally to copy."
fi

# Update NEXTAUTH_URL in the remote .env file (supports custom domain or fallback to IP)
if [ ! -z "$CUSTOM_DOMAIN" ]; then
    echo "Updating NEXTAUTH_URL to https://$CUSTOM_DOMAIN in remote .env..."
    ssh -i "$GCP_KEY" -o StrictHostKeyChecking=no "$GCP_USER@$GCP_IP" "sed -i 's|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://$CUSTOM_DOMAIN|g' $REMOTE_PROJECT_PATH/.env"
elif [ ! -z "$GCP_IP" ]; then
    echo "Updating NEXTAUTH_URL to http://$GCP_IP:3000 in remote .env..."
    ssh -i "$GCP_KEY" -o StrictHostKeyChecking=no "$GCP_USER@$GCP_IP" "sed -i 's|NEXTAUTH_URL=.*|NEXTAUTH_URL=http://$GCP_IP:3000|g' $REMOTE_PROJECT_PATH/.env"
fi

# 4. Run Remote Setup
echo "Running remote setup on VM..."
scp -i "$GCP_KEY" -o StrictHostKeyChecking=no "$SCRIPT_DIR/setup-remote.sh" "$GCP_USER@$GCP_IP:~/setup-remote.sh"
ssh -i "$GCP_KEY" -o StrictHostKeyChecking=no "$GCP_USER@$GCP_IP" "bash ~/setup-remote.sh"

echo "=== Deployment Complete! ==="
