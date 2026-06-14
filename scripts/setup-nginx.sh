#!/bin/bash
# Nginx & Certbot SSL Setup Script (Runs on VM)
set -e

# Load config to get variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Guess home folder and check remote project path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_PATH="${REMOTE_PROJECT_PATH:-$HOME/monkey5}"
if [ -f "$REMOTE_PATH/scripts/config.sh" ]; then
    source "$REMOTE_PATH/scripts/config.sh"
elif [ -f "$SCRIPT_DIR/config.sh" ]; then
    source "$SCRIPT_DIR/config.sh"
fi

DOMAIN="${CUSTOM_DOMAIN}"
EMAIL="${SSL_EMAIL:-anhle.viettel@gmail.com}"
CONFIG_NAME="${VM_NAME:-monkey5-server}"

if [ -z "$DOMAIN" ]; then
    echo "Error: CUSTOM_DOMAIN is not set in config.sh. SSL cannot be configured without a domain."
    exit 1
fi

echo "=== Installing Nginx & Certbot ==="
sudo apt-get update -y
sudo apt-get install -y nginx certbot python3-certbot-nginx

echo "=== Creating Nginx Configuration ==="
sudo tee "/etc/nginx/sites-available/$CONFIG_NAME" > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

echo "=== Enabling Nginx Configuration ==="
sudo ln -sf "/etc/nginx/sites-available/$CONFIG_NAME" /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "=== Requesting SSL Certificate from Let's Encrypt ==="
# Certbot will run the challenge, retrieve the cert, and automatically configure Nginx for HTTPS.
# If this fails because of Cloudflare proxying, temporarily set DNS to "DNS Only" (gray cloud) in Cloudflare.
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect

echo "=== Nginx & SSL Setup Complete! ==="
