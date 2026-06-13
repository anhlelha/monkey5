---
name: gcloud-provisioner
description: Google Cloud Platform (GCP) resource provisioning principles. Covers project management, Compute Engine, Firewall rules, and SSH key management.
allowed-tools: run_command, view_file, write_to_file
---

# Google Cloud Provisioner

> Principles and procedures for provisioning infrastructure on Google Cloud Platform using the gcloud CLI.

---

## 1. Principles

- **Project First**: Always verify and set the target Project ID before doing anything. 
- **Region/Zone Awareness**: Infrastructure is tied to zones. Have a fallback plan for `ZONE_RESOURCE_POOL_EXHAUSTED`.
- **Security by Default**: SSH keys should be managed precisely. Firewalls should follow the principle of least privilege.
- **Verification**: Never assume a resource is ready; always verify its status and connectivity.

---

## 2. Authentication & Project Management

### Commands
| Task | Command |
|------|---------|
| Login | `gcloud auth login` |
| List Accounts | `gcloud auth list` |
| Set Project | `gcloud config set project [PROJECT_ID]` |
| View Project | `gcloud config get-value project` |

### Auth Checks
- If commands fail with `access_denied`, request the user to re-run `gcloud auth login`.
- Verify the active account has the necessary permissions (Owner/Editor or specific IAM roles).

---

## 3. SSH Key Management

GCP allows managing SSH keys through VM metadata.

### Best Practice
1. **Naming**: Include the Project ID in the key name for easier identification (e.g., `~/.ssh/gcp-[PROJECT_ID]-key`).
2. **Generate locally**: `ssh-keygen -t rsa -f ~/.ssh/[KEY_NAME] -C "[USER]"`
3. **Permissions**: `chmod 400 ~/.ssh/[KEY_NAME]`
4. **Injection**: Pass the public key during instance creation using `--metadata-from-file ssh-keys=<(echo "[USER]:$(cat ~/.ssh/[KEY_NAME].pub)")`.

---

## 4. Compute Engine Provisioning

### Components
- **Machine Type**: Choose based on workload (e.g., `e2-micro` for low-tier, `e2-medium` for general purpose).
- **Image**: Use Image Family + Image Project for the latest stable version.
  - Ubuntu: `ubuntu-2204-lts` in `ubuntu-os-cloud`
  - Debian: `debian-11` in `debian-cloud`
- **Zone Fallback**: If a zone is full, try alternative zones in the same region (`a` -> `b` -> `c`).

### Creation Command Template
```bash
gcloud compute instances create [NAME] \
    --zone=[ZONE] \
    --machine-type=[MACHINE_TYPE] \
    --image-family=[FAMILY] \
    --image-project=[PROJECT] \
    --boot-disk-size=[SIZE] \
    --tags=[TAGS] \
    --metadata-from-file ssh-keys=...
```

---

## 5. Networking & Firewall

Rules are applied via **Target Tags**.

### Creating Rules
- **Name**: Use descriptive names (e.g., `[APP]-allow-ports`).
- **Direction**: `INGRESS` for incoming traffic.
- **Source Ranges**: `0.0.0.0/0` for public apps, or specific CIDRs for restricted access.
- **Rules**: Specify protocol and ports (e.g., `tcp:80,tcp:443`).

---

## 6. Common Pitfalls & Solutions

| Issue | Solution |
|-------|----------|
| `ZONE_RESOURCE_POOL_EXHAUSTED` | Switch to another zone in the same region. |
| `Billing Not Enabled` | Instruct user to link a billing account in GCP Console. |
| `API Not Enabled` | Run `gcloud services enable [API_NAME]`. |
| `Permission Denied` | Verify `gcloud auth login` and IAM roles. |

---

## 7. Verification Checklist

- [ ] Instance status is `RUNNING`
- [ ] External IP is assigned
- [ ] Firewall rule is applied to target tags
- [ ] SSH connection is successful (`ssh -i [PATH] [USER]@[IP]`)
- [ ] Health check (if applicable) returns 200
