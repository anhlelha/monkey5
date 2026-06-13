---
name: deploy-config-manager
description: Skill for managing, creating, and updating deployment configuration files (config.sh, deploy.sh) for GCP/GCE environments.
version: 1.0.0
---

# Deploy Config Manager Skill

> Principles and procedures for maintaining infrastructure-aligned deployment scripts.

## 1. Core Principles

- **Single Source of Truth**: All operational scripts must source `scripts/config.sh`.
- **Dynamic Awareness**: Configurations should be updated immediately after infrastructure changes (e.g., new IP, new SSH key).
- **Environment Parity**: Scripts should handle different environments (dev, prod) via configuration switches.
- **Fail Fast**: Scripts should validate the existence of keys and reachability of IPs before starting data transfers.

## 2. Configuration Management (`config.sh`)

When updating `config.sh`:
1. **IP Address**: Always use the most recent External IP from `gcloud compute instances list`.
2. **SSH Keys**: Ensure the `GCP_KEY` path matches the key generated for the specific project (e.g., `~/.ssh/gcp-jobfair-key`).
3. **Paths**: Verify `REMOTE_PROJECT_PATH` exists or is created during first deployment.

## 3. Deployment Scripting (`deploy.sh`)

When creating/modifying `deploy.sh`:
1. **Rsync Exclusions**: Always exclude heavy/local folders (`node_modules`, `.venv`, `data`).
2. **Atomic Steps**: Group remote commands (migrate, restart) to ensure they run in order.
3. **Feedback**: Provide clear 1-line progress updates.

## 4. Automation Snippets

### Auto-Update IP
```bash
./scripts/update-ip.sh
```
This script fetches the IP from `gcloud` and replaces the `GCP_IP` value in `scripts/config.sh` automatically.

### Get Remote IP (Manual)
```bash
/Users/anhlh48/Downloads/google-cloud-sdk/bin/gcloud compute instances describe jobfair-main-server --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

### Update Config File (Python helper)
```python
def update_config(ip, key_path):
    # Logic to replace GCP_IP and GCP_KEY in scripts/config.sh
    pass
```

## 5. Checklist for Agent

- [ ] Check `gcloud` connectivity before updating `config.sh`.
- [ ] Verify SSH key permissions (`400`).
- [ ] Test `ssh` connectivity after updating config.
- [ ] Append logs to `AGENT-CHANGELOG.md` when updating deployment logic.
