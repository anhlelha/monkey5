# 🛠️ Workflow: Project Operations Setup

This workflow ensures all operational scripts in the `scripts/` directory are correctly initialized and configured. It uses the `project-ops` skill infrastructure.

---

## Phase 1: Directory Check // turbo
1. **Initialize Folder**: Ensure the `scripts/` directory exists.
   ```bash
   mkdir -p scripts
   ```

## Phase 2: Script Generation // turbo
1. **Generate Scripts**: Create or update the following 6 core scripts using the patterns defined in `project-ops` skill:
   - `scripts/config.sh`
   - `scripts/restart.sh`
   - `scripts/deploy.sh`
   - `scripts/sync-pull.sh`
   - `scripts/sync-push.sh`
   - `scripts/git-push.sh`

## Phase 3: Permissions // turbo
1. **Make Executable**: Grant execution permissions.
   ```bash
   chmod +x scripts/*.sh
   ```

## Phase 4: Verification // turbo
1. **Audit**: List files to confirm setup.
   ```bash
   ls -la scripts/
   ```

---

## 🏁 Completion Criteria
- [ ] `scripts/` directory contains all 6 scripts.
- [ ] All scripts have `+x` permissions.
- [ ] `scripts/config.sh` contains the current infrastructure details.
- [ ] `docs/TASK-TRACKER.md` is updated.
