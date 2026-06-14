---
name: infra-provisioner
description: Handles GCP Compute Engine VM creation, network firewall rule updates, Git SSH keys setup, Nginx reverse proxy, and Let's Encrypt SSL/HTTPS configurations.
version: 1.3.0
---

# GCP Infrastructure Provisioner & Deployment Skill

> Standardized principles and procedures for setting up VM instances, firewall rules, codebase synchronization via Git, reverse proxy via Nginx, and SSL certificates via Certbot on Google Cloud Platform.

---

## 1. Responsibilities

- **Interactive Discovery (Socratic Gate)**: Always prompt the user for project-specific configurations before executing any commands. Never reuse old parameters from previous sessions or assume default configurations.
- **VM Hardware Sizing**: Explicitly query the user to select the appropriate VM machine type (small, medium, large) and disk size. Never hardcode VM specifications.
- **Google OAuth Setup Guidance**: Proactively display the exact Google OAuth Authorized redirect URIs and JavaScript Origins to the user at the start of the session based on the configured custom domain.
- **Identity & Security**: Generate project-specific GCP SSH keys (named `gcp-[PROJECT_ID]-key`) and deploy repository Git SSH keys.
- **Compute & Networking**: Provision Ubuntu virtual machines and configure GCP firewalls for SSH (22), HTTP (80), HTTPS (443), and custom application ports (e.g., 3000, 8000).
- **Codebase & Environment Deployment**: Sync codebase using Git clone/pull on the VM and deploy environment secrets (.env) with dynamic site URL mapping (e.g., `NEXTAUTH_URL` or `BETTER_AUTH_URL`) and trusted host configuration if required.
- **Reverse Proxy & SSL**: Configure Nginx to forward port 80/443 traffic to the application port (e.g., 3000) and request Let's Encrypt certificates using Certbot.

---

## 2. Interactive Discovery Protocol (MANDATORY)

Every time the provisioning or deployment is triggered, the agent **MUST** halt and ask the user for the following parameters in a single Socratic request. **DO NOT** reuse values from past sessions or hardcode defaults:

1. **GCP Project ID**: The target GCP project identifier (e.g., `my-project-12345`).
2. **GCP Active Account**: The Gmail account linked to the GCP project (e.g., `user@gmail.com`).
3. **VM Hardware Specifications**:
   - **Machine Type**: Ask the user to choose or input (e.g., `e2-micro` for Small, `e2-medium` for Medium [Default], `e2-standard-2` for Large).
   - **Boot Disk Size**: Ask the user to choose or input (e.g., `10GB`, `20GB` [Default], `50GB`).
4. **VM Instance Name**: Name of the Compute Engine instance (e.g., `my-app-server`).
5. **GCP Zone**: The target deployment zone (e.g., `asia-southeast1-a`).
6. **GCP VM Username**: Username to log into the VM (usually local username or customized).
7. **Custom Domain**: The target public domain name (e.g., `app.mydomain.com`).
8. **SSL Notification Email**: Email address used for Let's Encrypt certificate renewal alerts (e.g., `admin@mydomain.com`).
9. **Cloudflare Proxy Status**: Whether the domain is currently proxied through Cloudflare (Proxied vs DNS Only).
10. **Git Repository SSH URL**: URL of the project repository (e.g., `git@github.com:username/repository.git`).
11. **Git Deploy Key Name**: The file name of the Deploy Key located under `~/.ssh/` (e.g., `git_deploy_key_my_app`).
12. **Application Internal Port**: The internal port the application listens to (e.g., `3000` for Next.js, `8000` for Django).
13. **PM2 App Name**: The process name for PM2 process manager (e.g., `my-app`).

### Google OAuth Pre-configuration Prompts
Along with the questions above, the agent **MUST** output the following explicit instructions to the user:
> [!IMPORTANT]
> **Google OAuth Configuration Guide:**
> Open your Google Cloud Console for the active project and configure the OAuth Client ID under **Credentials** with the following values:
> - **Authorized JavaScript origins**: `https://[CUSTOM_DOMAIN]`
> - **Authorized redirect URIs**: `https://[CUSTOM_DOMAIN]/api/auth/callback/google` (or the specific OAuth callback path of your framework)
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
3. Create GCE instance (Ubuntu 22.04 LTS, machine type `[VM_MACHINE_TYPE]` with `[VM_DISK_SIZE]` boot disk) with keys injected.
4. Create firewall rule `allow-[VM_NAME]-ports` for ports `[APPLICATION_PORT], 80, 443` (and custom ports if required).
5. Run `scripts/update-ip.sh` to fetch VM external IP and write to `config.sh`.

### B. Application Setup (`scripts/deploy.sh`)
Performs codebase and environment synchronization:
1. Copies local Git Deploy Key (`~/.ssh/[GIT_KEY_NAME]`) to the VM's `~/.ssh/id_rsa`.
2. Clones/pulls codebase directly from the Git remote on the VM.
3. SCPs `.env.local` to VM and updates target domain URL to the custom domain (with `https://`) or the raw IP.
4. **Trust Host configuration (Crucial for Node/Next.js)**: Appends `AUTH_TRUST_HOST=true` to the remote `.env` to prevent the `UntrustedHost` Auth error behind Nginx.
5. Triggers `scripts/setup-remote.sh` on the VM to install packages (Node, SQLite, PM2), run DB migrations/seeds, build the application, and start the server under PM2 using `[PM2_APP_NAME]`.

### C. Nginx & SSL Setup (`scripts/setup-nginx.sh`)
Configures Nginx reverse proxy and SSL certificates:
1. Installs `nginx` and `certbot` on the VM.
2. Creates an Nginx site configuration forwarding port 80/443 traffic to `http://127.0.0.1:[APPLICATION_PORT]`.
3. Runs `certbot --nginx -d [CUSTOM_DOMAIN]` to request and install Let's Encrypt certificates, automatically configuring HTTP-to-HTTPS redirects.

---

## 4. Verification Checklist

- [ ] Verify GCP project is set correctly: `gcloud config get-value project`.
- [ ] Verify VM instance status is `RUNNING` with valid External IP.
- [ ] Verify firewall rules allow ports `80` and `443`.
- [ ] Confirm VM SSH connectivity using `gcp-[PROJECT_ID]-key`.
- [ ] Verify `AUTH_TRUST_HOST=true` is set in remote `.env` (if NextAuth/Auth.js is used).
- [ ] Verify PM2 status: `pm2 show [PM2_APP_NAME]`.
- [ ] Verify HTTPS endpoint returns HTTP `200 OK`: `curl -I https://[CUSTOM_DOMAIN]`.
