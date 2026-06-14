# 🏁 GCP VM Infrastructure & SSL Provisioning Workflow

> Lifecycle: Unified Infrastructure Provisioning, App Deployment, and Nginx SSL Reverse Proxy Setup

## 🛠️ Task Analysis
Configure GCP settings, spin up a GCE instance, update firewalls, deploy code via Git pull, configure Nginx reverse proxy, and obtain SSL certificates via Certbot.

## 🏃 Workflow

### Phase 1: Socratic Interactive Discovery
1. **Gate**: Halt execution. Do not read from old cached variables or previous sessions.
2. **Interact**: Ask the user all configuration questions up front:
   - Target GCP Project ID
   - Target GCP Gmail account
   - Target Custom Domain Name
   - Let's Encrypt notification email
   - Target VM instance name (default: `monkey5-server`)
   - Target GCP zone (default: `asia-southeast1-a`)
   - Cloudflare proxy status (Proxied vs DNS Only)
3. **Write**: Configure `scripts/config.sh` with the values provided.

### Phase 2: Infrastructure Provisioning
1. **Authorize**: Verify gcloud login:
   `gcloud auth list`
   `gcloud config set project [PROJECT_ID]`
2. **Execute Provisioning**:
   `bash scripts/provision.sh`
   *Creates SSH keys, provisions VM, updates GCP firewall to allow ports 3000, 8000, 80, 443, and updates configuration IP.*

### Phase 3: Application & Env Deployment
1. **Sync and Run Deploy**:
   `bash scripts/deploy.sh`
   *Syncs repository deploy keys to VM, runs git clone/pull on VM, SCPs environment variables, rewrites NEXTAUTH_URL, and runs setup-remote.sh to compile Next.js and start server under PM2.*

### Phase 4: Nginx & Certbot SSL setup
1. **Execute Nginx & SSL Script**:
   `bash scripts/setup-nginx.sh`
   *Installs Nginx and Certbot on VM, creates reverse proxy config block, and requests Let's Encrypt SSL certificate.*

### Phase 5: Verification & Handover
1. **Ping Endpoint**: Verify public HTTPS site response:
   `curl -I https://[CUSTOM_DOMAIN]`
2. **Document**: Update `docs/TASK-TRACKER.md` with timestamps and results.

## 🏁 Completion Criteria
- [ ] GCE instance is `RUNNING` on GCP.
- [ ] Firewall rules permit ports 22, 80, 443, 3000, 8000.
- [ ] Codebase pulled from GitHub remote on VM.
- [ ] Application starts successfully and runs under PM2.
- [ ] Nginx proxies port 80/443 traffic to port 3000.
- [ ] Valid Let's Encrypt SSL certificate installed and redirects active.
- [ ] HTTPS endpoint returns HTTP `200 OK`.
