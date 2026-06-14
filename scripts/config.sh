#!/bin/bash
# GCP Deployment Configuration

GCP_PROJECT="monkey5-499403"
GCP_ZONE="asia-southeast1-a"
VM_NAME="monkey5-server"
GCP_USER="anhlh48"
GCP_KEY="$HOME/.ssh/gcp-monkey5-499403-key"
GCP_IP="35.247.148.192"
REMOTE_PROJECT_PATH="/home/anhlh48/monkey5"
CUSTOM_DOMAIN="monkey5.ai4all.vn"

# VM Hardware Configuration
VM_MACHINE_TYPE="e2-medium"
VM_DISK_SIZE="20GB"

# Git Repository Configuration
GIT_REPO_URL="git@github.com:anhlelha/monkey5.git"
GIT_KEY_NAME="git_deploy_key_monkey5"

# SSL & Notifications
SSL_EMAIL="anhle.viettel@gmail.com"
