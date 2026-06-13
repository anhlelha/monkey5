# 🏁 Application Deployment & Remote Setup

> Lifecycle: Step 2 - Deployment

## 🛠️ Task Analysis
Remote environment preparation, code synchronization, and service startup.

## 🏃 Workflow
// turbo
1. Sync secrets and deploy application:
   `bash scripts/deploy.sh`

2. Verify backend health on remote:
   `curl http://[GCP_IP]:8000/api/health`

## 🏁 Completion Criteria
- [ ] Remote system dependencies (Node/Python/Make) are installed.
- [ ] `.env` and secrets are injected into the remote project.
- [ ] Source code is synchronized.
- [ ] `make install` and `make migrate` completed successfully on the server.
