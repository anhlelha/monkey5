---
name: app-deployer
description: Skill for Step 2 of the deployment pipeline. Handles remote environment setup, code synchronization via git/rsync, secret injection, and service startup.
version: 1.0.0
---

# App Deployer Skill

> This skill manages the life of the application on the provisioned infrastructure.

## 1. Responsibilities

- **System Setup**: Install Node.js, Python, Poetry, and Make on the remote VM.
- **Code Sync**: Synchronize the codebase while excluding local/temp files.
- **Secret Management**: Securely copy `.env` files and other sensitive data not stored in Git.
- **Build & Launch**: Run `make install` and `make migrate` on the remote host.

## 2. Master Tool: `scripts/deploy.sh`

Always use `scripts/deploy.sh` to execute the deployment flow. This script coordinates:
1. **Pre-flight**: Checks for IP and Key existence.
2. **Secrets**: Syncs `.env` files using `scp`.
3. **Delivery**: RSyncs code to `~/jobfair`.
4. **Bootstrapping**: Executes `scripts/setup-remote.sh` on the VM followed by `make install`.

## 3. Usage Pattern

Trigger this skill via the `/app-deploy` command or `/ship`.

## 4. Guidelines for Secret Injection

When the user specifies new secrets:
1. Update `scripts/deploy.sh` to include the specific `scp` command for that file.
2. Never log the content of the secret files.
