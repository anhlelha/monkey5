---
name: project-ops
description: Operational scripts for project management (restart, deploy, sync, git).
version: 1.0.0
---

# Project Operations Skill

This skill provides and manages operational scripts located in the `scripts/` directory for fast iterations.

## Scripts Overview

| Script | Purpose | Usage |
|--------|---------|-------|
| `restart.sh` | Restarts backend/frontend locally | `./scripts/restart.sh [backend|frontend|both]` |
| `deploy.sh` | Deploys code to GCP VM | `./scripts/deploy.sh` |
| `sync-pull.sh` | Pulls data from GCP to local | `./scripts/sync-pull.sh` |
| `sync-push.sh` | Pushes local data to GCP | `./scripts/sync-push.sh` |
| `git-push.sh` | Quick git add, commit, push | `./scripts/git-push.sh "message"` |

## Configuration

All scripts use `scripts/config.sh` for environment variables (IP, User, Paths).

## Usage for Agent

When the user asks to "restart app", "deploy", or "sync data", you should use these scripts via `run_command` instead of manual commands for consistency.

## Rules
- Always verify `scripts/config.sh` before running GCP-related scripts.
- Ensure ports in `config.sh` match the current application ports.
