---
name: infra-provisioner
description: Skill for Step 1 of the deployment pipeline. Handles GCE instance creation, firewall setup, and identity management on Google Cloud.
version: 1.0.0
---

# Infra Provisioner Skill

> This skill manages the birth of the infrastructure on Google Cloud.

## 1. Responsibilities

- **Identity**: Generate and manage project-specific SSH keys (`gcp-jobfair-key`).
- **Compute**: Provision `e2-medium` instances with Ubuntu 22.04 LTS.
- **Networking**: Configure firewall rules for SSH, HTTP/HTTPS, and Backend API (8000).
- **Handover**: Auto-update `scripts/config.sh` with the new VM's External IP.

## 2. Master Tool: `scripts/provision.sh`

Always use `scripts/provision.sh` to execute the full provisioning flow. This script wraps:
1. `ssh-keygen` for identity.
2. `gcloud compute instances create` for the VM.
3. `gcloud compute firewall-rules create` for networking.
4. `scripts/update-ip.sh` for configuration syncing.

## 3. Usage Pattern

Trigger this skill via the `/gcp-provision` command.

## 4. Verification

- [ ] Check instance status: `gcloud compute instances list`.
- [ ] Verify `scripts/config.sh` has a valid IP (not `REPLACEME_IP`).
