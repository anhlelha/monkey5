# 📋 Task Tracker — Monkey5

> Last updated: 2026-06-14 10:46

## Status Legend
- ✅ Done — Task completed successfully
- 🔄 In Progress — Currently being worked on
- ⏳ Pending — Not yet started
- ❌ Failed — Attempted but failed (see notes)
- ⏸️ Blocked — Waiting on external input

---

## GCP VM Infrastructure and Deployment

### ✅ Configure GCP Project ID & SSH Keys
- **Status:** Done
- **Completed:** 2026-06-14 10:18
- **Files:** [scripts/config.sh](file:///Users/anhlh48/00.AIProjects/99.Monkey5/scripts/config.sh)
- **Result:** Updated project ID config to `monkey5-499403` and set project-specific SSH key to `~/.ssh/gcp-monkey5-499403-key`.

### ✅ Provision GCE VM & Firewall Rules
- **Status:** Done
- **Completed:** 2026-06-14 10:21
- **Files:** [scripts/config.sh](file:///Users/anhlh48/00.AIProjects/99.Monkey5/scripts/config.sh)
- **Result:** Provisioned `monkey5-server` (e2-medium, Ubuntu 22.04 LTS, IP: `35.247.148.192`) and created VPC firewall rule `allow-monkey5-ports` for port 3000 & 8000. Verified SSH connectivity using the new custom key.

### ✅ Codebase Synchronization & Environment Deployment
- **Status:** Done
- **Completed:** 2026-06-14 10:29
- **Files:** [scripts/deploy.sh](file:///Users/anhlh48/00.AIProjects/99.Monkey5/scripts/deploy.sh), [ref_exam/smart_parsed_exams.json](file:///Users/anhlh48/00.AIProjects/99.Monkey5/ref_exam/smart_parsed_exams.json)
- **Result:** Copied the private Git Deploy Key `git_deploy_key_monkey5` to VM and cloned/pulled repository codebase directly from GitHub on the VM. Copied `.env.local` to VM and auto-configured `NEXTAUTH_URL` to match VM's external IP address (`http://35.247.148.192:3000`).

### ✅ Database Migrations, Seeding & Server Start
- **Status:** Done
- **Completed:** 2026-06-14 10:30
- **Files:** [scripts/seed-all-exams.ts](file:///Users/anhlh48/00.AIProjects/99.Monkey5/scripts/seed-all-exams.ts)
- **Result:** Configured SQLite database via Prisma db push. Successfully parsed and seeded 48 exams to DB. Built Next.js application in production mode and ran server under PM2 daemon.
- **Verification:** Verified HTTP `200 OK` response from `http://35.247.148.192:3000`.

### ✅ Custom Domain NEXTAUTH_URL Configuration
- **Status:** Done
- **Completed:** 2026-06-14 10:41
- **Files:** [scripts/config.sh](file:///Users/anhlh48/00.AIProjects/99.Monkey5/scripts/config.sh), [scripts/deploy.sh](file:///Users/anhlh48/00.AIProjects/99.Monkey5/scripts/deploy.sh)
- **Result:** Introduced `CUSTOM_DOMAIN` parameter to configuration. Updated deployment script to dynamically rewrite `NEXTAUTH_URL` in the remote `.env` to `https://monkey5.ai4all.vn` when a custom domain is defined.

### ✅ SSL/HTTPS & Nginx Reverse Proxy Setup
- **Status:** Done
- **Completed:** 2026-06-14 10:46
- **Files:** [scripts/setup-nginx.sh](file:///Users/anhlh48/00.AIProjects/99.Monkey5/scripts/setup-nginx.sh)
- **Result:** Opened ports 80 and 443 in the GCP firewall rule. Configured Nginx on the VM as a reverse proxy from `monkey5.ai4all.vn` to port 3000. Obtained and configured Let's Encrypt SSL certificate automatically using Certbot with HTTP-to-HTTPS redirect.
- **Verification:** Verified successful HTTPS connection to `https://monkey5.ai4all.vn` returning HTTP 200 OK.
