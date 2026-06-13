#!/bin/bash
# GCP Infrastructure Provisioning Script (Step 1)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

echo "=== GCP Infrastructure Provisioning ==="

# 1. Generate SSH Key if not exists
if [ ! -f "$GCP_KEY" ]; then
    echo "Generating SSH Key pair at $GCP_KEY..."
    ssh-keygen -t rsa -f "$GCP_KEY" -C "$GCP_USER" -N ""
    chmod 400 "$GCP_KEY"
else
    echo "SSH Key already exists at $GCP_KEY"
fi

# 2. Create GCE VM instance
echo "Creating GCE VM instance '$VM_NAME'..."
gcloud compute instances create "$VM_NAME" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" \
    --machine-type="e2-medium" \
    --image-family="ubuntu-2204-lts" \
    --image-project="ubuntu-os-cloud" \
    --boot-disk-size="20GB" \
    --tags="monkey5-server,http-server,https-server" \
    --metadata-from-file ssh-keys=<(echo "$GCP_USER:$(cat "${GCP_KEY}.pub")")

# 3. Configure Firewall rules
echo "Configuring firewall rules..."
# Allow API port 8000 & 3000
gcloud compute firewall-rules create allow-monkey5-ports \
    --project="$GCP_PROJECT" \
    --description="Allow port 8000 and 3000 for Monkey5" \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:3000,tcp:8000 \
    --source-ranges=0.0.0.0/0 \
    --target-tags="monkey5-server" || echo "Firewall rule allow-monkey5-ports already exists"

# 4. Fetch and update IP in config.sh
bash "$SCRIPT_DIR/update-ip.sh"

echo "=== Provisioning Complete! ==="
