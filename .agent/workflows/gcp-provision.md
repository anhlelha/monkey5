# 🏁 GCP Infrastructure Provisioning

> Lifecycle: Step 1 - Provisioning

## 🛠️ Task Analysis
Provision a new Google Compute Engine instance and configure the network.

## 🏃 Workflow
// turbo
1. Execute master provisioning script:
   `bash scripts/provision.sh`

2. Verify instance is running:
   `[PATH_TO_GCLOUD]/gcloud compute instances list`

## 🏁 Completion Criteria
- [ ] Instance is `RUNNING` on GCP.
- [ ] SSH key `~/.ssh/gcp-jobfair-key` is generated and assigned.
- [ ] `scripts/config.sh` contains the correct External IP.
- [ ] Firewall rules for ports 22, 80, 443, 8000 are active.
