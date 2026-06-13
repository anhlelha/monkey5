---
name: git-initializer
description: Principles for initializing a Git repository and pushing it to a remote for the first time using Deploy Keys.
allowed-tools: run_command, view_file, write_to_file
---

# Git Initializer

> Principles and procedures for setting up a project on Git with dedicated Deploy Keys.

---

## 1. Principles

- **Security First**: Verify `.gitignore` exists and is correctly configured before the first commit to prevent leaking secrets.
- **Private by Design**: Ensure the repository is intended to be private.
- **Dedicated Identity**: Use SSH Deploy Keys for specific repositories to maintain isolation.
- **Atomic Init**: The first commit should be a clean representation of the project foundation.

---

## 2. Infrastructure Requirements

To initialize a project, the following MUST be provided by the user:
- **Remote Git URL**: The SSH link to the repository (e.g., `git@github.com:user/repo.git`).
- **Confirmation**: Key generation confirmed and public key added to remote.

---

## 3. SSH Configuration for Deploy Keys

When using a Deploy Key that is NOT the default user key (`~/.ssh/id_rsa`), we must configure Git to use the specific key.

### Temporary SSH Command
Use `GIT_SSH_COMMAND` for single operations:
```bash
GIT_SSH_COMMAND='ssh -i [PATH_TO_DEPLOY_KEY] -o IdentitiesOnly=yes' git push
```

### Local Git Config (Recommended)
```bash
git config core.sshCommand "ssh -i [PATH_TO_DEPLOY_KEY] -o IdentitiesOnly=yes"
```

---

## 4. Implementation Steps

### Phase 2: Deploy Key Generation
1. **Generate Local Key Pair**: Create a dedicated RSA key pair for the project.
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/git_deploy_key_[PROJECT_ID] -C "github-deploy-key-[PROJECT_ID]" -N ""
   ```
2. **Permissions**: Ensure private key is restricted (`chmod 600`).
3. **User Action**: Output the **Public Key** (`.pub`) and wait for the user to add it to the remote Git provider's Deploy Keys (with Write access).

### Phase 3: Identity & First Commit
1. **Initialize**: `git init`.
2. **First Commit**: `git add .` and `git commit -m "feat: initial repository setup"`.
3. **Configure Git Identity**: Use `core.sshCommand` to point to the new private key.
   ```bash
   git config core.sshCommand "ssh -i ~/.ssh/git_deploy_key_[PROJECT_ID] -o IdentitiesOnly=yes"
   ```

### Phase 4: Remote Setup & Push
1. **Add Remote**: `git remote add origin [URL]`.
2. **Branching**: Ensure the main branch is named `main` (`git branch -M main`).
3. **Push**: `git push -u origin main`.

---

## 5. Verification Checklist

- [ ] `.gitignore` contains critical exclusions.
- [ ] Remote URL is correct.
- [ ] Deploy key has `write` permissions on the remote.
- [ ] `git push` completes successfully.
