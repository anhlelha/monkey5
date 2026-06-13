#!/bin/bash
# Auto-update IP in config.sh

# Load config
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

echo "Fetching External IP for VM '$VM_NAME' in project '$GCP_PROJECT'..."
IP=$(gcloud compute instances describe "$VM_NAME" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)' 2>/dev/null)

if [ -z "$IP" ]; then
    echo "Error: Could not retrieve External IP. Is the instance running?"
    exit 1
fi

echo "Found IP: $IP"

# Replace in config.sh
# On macOS, sed -i needs an empty extension argument ''
sed -i '' "s/GCP_IP=.*/GCP_IP=\"$IP\"/g" "$SCRIPT_DIR/config.sh"
echo "Updated GCP_IP to \"$IP\" in config.sh"
