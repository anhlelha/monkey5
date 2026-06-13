# 🐙 Workflow: Git Initialize & Push

This workflow manages the first-time setup and push of a project to a private Git repository using a Deploy Key.

## ⚠️ Requirements
- Git URL (SSH)
- Private Deploy Key (with Write Access)
- Repository must be Private

---

## Phase 1: Preparation // turbo
1.  **Socratic Gate**: Ask for the **Git Remote URL** (SSH).
2.  **Validation**: Verify that a `.gitignore` exists. If not, create one including `.env`, `node_modules`, `DEBUG.LOG`, and `.agent/` specific local files.

## Phase 2: Deploy Key Generation // turbo
1.  **Generate**: `ssh-keygen -t rsa -b 4096 -f ~/.ssh/git_deploy_key_[PROJECT_ID] -C "github-deploy-key-[PROJECT_ID]" -N ""`.
2.  **Permissions**: `chmod 600` the private key.
3.  **Halt**: Display the **Public Key** (`.pub`) and wait for the user to add it to the Git provider (GitHub/GitLab/Bitbucket) with **Write Access**.

## Phase 3: Local Init // turbo
1.  **Initialize**: `git init`.
2.  **Stage**: `git add .`.
3.  **Commit**: `git commit -m "feat: initial repository setup"`.

## Phase 4: Identity Setup // turbo
1.  **Configure Git**: Set local SSH command for this repo.
    ```bash
    git config core.sshCommand "ssh -i ~/.ssh/git_deploy_key_[PROJECT_ID] -o IdentitiesOnly=yes"
    ```

## Phase 5: Remote & Push // turbo
1.  **Add Remote**: `git remote add origin [GIT_URL]`.
2.  **Branch**: `git branch -M main`.
3.  **Push**: `git push -u origin main`.

## Phase 6: Verification // turbo
1.  **Check Status**: Verify the push was successful.
2.  **Log**: Update `AGENT-CHANGELOG.md` if any system configuration changed.
3.  **Tracker**: Update `docs/TASK-TRACKER.md`.

---

## 🏁 Completion Criteria
- [ ] Local Git repository initialized.
- [ ] Remote `origin` added.
- [ ] SSH Deploy Key configured locally.
- [ ] Code pushed to `main` branch on private remote.
