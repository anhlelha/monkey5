---
name: infra-provisioner
description: Handles GCP Compute Engine VM creation, network firewall rule updates, Git SSH keys setup, Nginx reverse proxy, and Let's Encrypt SSL/HTTPS configurations.
version: 1.2.0
---

# GCP Infrastructure Provisioner & Deployment Skill

> Standardized principles and procedures for setting up VM instances, firewall rules, codebase synchronization via Git, reverse proxy via Nginx, and SSL certificates via Certbot on Google Cloud Platform.

---

## 1. Responsibilities

- **Interactive Discovery (Socratic Gate)**: Always prompt the user for project-specific configurations before executing any commands. Never reuse old parameters from previous sessions or assume default configurations.
- **Google OAuth Setup Guidance**: Proactively display the exact Google OAuth Authorized redirect URIs and JavaScript Origins to the user at the start of the session, instructing them to configure these in the GCP Console before proceeding.
- **Identity & Security**: Generate project-specific GCP SSH keys (named `gcp-[PROJECT_ID]-key`) and deploy repository Git SSH keys.
- **Compute & Networking**: Provision Ubuntu virtual machines and configure GCP firewalls for SSH (22), HTTP (80), HTTPS (443), and custom application ports (3000, 8000).
- **Codebase & Environment Deployment**: Sync codebase using Git clone/pull on the VM and deploy environment secrets (.env) with dynamic `NEXTAUTH_URL` domain mapping and `AUTH_TRUST_HOST=true` configuration.
- **Reverse Proxy & SSL**: Configure Nginx to forward port 80/443 traffic to Next.js (port 3000) and request Let's Encrypt certificates using Certbot.

---

## 2. Interactive Discovery Protocol (MANDATORY)

Every time the provisioning or deployment is triggered, the agent **MUST** halt and ask the user for the following parameters in a single Socratic request. **DO NOT** reuse values from past sessions:

1. **GCP Project ID**: The target GCP project identifier (e.g., `monkey5-499403`).
2. **GCP Active Account**: The Gmail account linked to the GCP project (e.g., `anhle.viettel@gmail.com`).
3. **VM Instance Name**: Name of the Compute Engine instance (default: `monkey5-server`).
4. **GCP Zone**: The target deployment zone (default: `asia-southeast1-a`).
5. **Custom Domain**: The target public domain name (e.g., `monkey5.ai4all.vn`).
6. **SSL Notification Email**: Email address used for Let's Encrypt certificate renewal alerts (e.g., `anhle.viettel@gmail.com`).
7. **Cloudflare Proxy Status**: Whether the domain is currently proxied through Cloudflare (Proxied vs DNS Only).

### Google OAuth Pre-configuration Prompts
Along with the questions above, the agent **MUST** output the following explicit instructions to the user:
> [!IMPORTANT]
> **Google OAuth Configuration Guide:**
> Open your Google Cloud Console for the active project and configure the OAuth Client ID under **Credentials** with the following values:
> - **Authorized JavaScript origins**: `https://[CUSTOM_DOMAIN]`
> - **Authorized redirect URIs**: `https://[CUSTOM_DOMAIN]/api/auth/callback/google`
> 
> *Please confirm if you have successfully updated these settings and verified that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local` match the active GCP project.*

Once the user provides the parameters, confirms the Google Console setup, and approves, configure `scripts/config.sh` and execute the entire workflow in one go.

---

## 3. Tool Pipeline & Workflow

The provisioning and deployment workflow consists of running:

### A. Infrastructure Setup (`scripts/provision.sh`)
Wraps GCP CLI commands to:
1. Generate a project-specific key: `ssh-keygen -t rsa -f ~/.ssh/gcp-[PROJECT_ID]-key -C "[USER]"`
2. Set target project: `gcloud config set project [PROJECT_ID]`
3. Create GCE instance (Ubuntu 22.04 LTS, `e2-medium`) with keys injected.
4. Create firewall rule `allow-monkey5-ports` for ports `3000, 8000, 80, 443`.
5. Run `scripts/update-ip.sh` to fetch VM external IP and write to `config.sh`.

### B. Application Setup (`scripts/deploy.sh`)
Performs codebase and environment synchronization:
1. Copies local Git Deploy Key (`~/.ssh/git_deploy_key_monkey5`) to the VM's `~/.ssh/id_rsa`.
2. Clones/pulls codebase directly from the Git remote on the VM.
3. SCPs `.env.local` to VM and updates `NEXTAUTH_URL` to the custom domain (with `https://`) or the raw IP.
4. **Trust Host configuration (Crucial)**: Appends `AUTH_TRUST_HOST=true` to the remote `.env` to prevent the `UntrustedHost` NextAuth error behind Nginx.
5. Triggers `scripts/setup-remote.sh` on the VM to install packages (Node, SQLite, PM2), run Prisma migrations/seeds, build Next.js, and start server under PM2.

### C. Nginx & SSL Setup (`scripts/setup-nginx.sh`)
Configures Nginx reverse proxy and SSL certificates:
1. Installs `nginx` and `certbot` on the VM.
2. Creates an Nginx site configuration forwarding port 80/443 traffic to `http://127.0.0.1:3000`.
3. Runs `certbot --nginx -d [DOMAIN]` to request and install Let's Encrypt certificates, automatically configuring HTTP-to-HTTPS redirects.

---

## 4. Verification Checklist

- [ ] Verify GCP project is set correctly: `gcloud config get-value project`.
- [ ] Verify VM instance status is `RUNNING` with valid External IP.
- [ ] Verify firewall rules allow ports `80` and `443`.
- [ ] Confirm VM SSH connectivity using `gcp-[PROJECT_ID]-key`.
- [ ] Verify `AUTH_TRUST_HOST=true` is set in remote `.env`.
- [ ] Verify PM2 status: `pm2 show monkey5`.
- [ ] Verify HTTPS endpoint returns HTTP `200 OK`: `curl -I https://[DOMAIN]`.
