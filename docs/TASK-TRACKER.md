# 📋 Task Tracker — Monkey5

> Last updated: 2026-06-14 16:30

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

### ✅ Agent Skill & Workflow Upgrade for Socratic Discovery & OAuth
- **Status:** Done
- **Completed:** 2026-06-14 10:55
- **Files:** [.agent/skills/infra-provisioner/SKILL.md](file:///Users/anhlh48/00.AIProjects/99.Monkey5/.agent/skills/infra-provisioner/SKILL.md), [.agent/workflows/gcp-provision.md](file:///Users/anhlh48/00.AIProjects/99.Monkey5/.agent/workflows/gcp-provision.md), [.agent/AGENT-CHANGELOG.md](file:///Users/anhlh48/00.AIProjects/99.Monkey5/.agent/AGENT-CHANGELOG.md), [scripts/deploy.sh](file:///Users/anhlh48/00.AIProjects/99.Monkey5/scripts/deploy.sh)
- **Result:** Rewrote the provisioning skill, workflow, and deployment files to enforce the Socratic Discovery Protocol (interactive upfront input questionnaire), include detailed Google OAuth instructions, and handle `AUTH_TRUST_HOST=true` automatically. Recorded the modification in the Agent Changelog.

---

## Readiness Redesign — snapshot/derived model (2026-06-14)

### ✅ Phase 0–5: Implement school-aware readiness scoring
- **Status:** Done
- **Completed:** 2026-06-14 14:59 (commit `1923200`)
- **Docs:** [docs/READINESS-REDESIGN.md](./READINESS-REDESIGN.md)
- **Files created:**
  - `lib/schools.ts` — DB-backed School fetch with 60s cache
  - `lib/mastery.ts` — `computeMastery()` aggregates TopicSession + Attempt
  - `lib/school-profiles.ts` — hash-based `ensureSchoolProfilesFresh()`, auto-discovers new schools
  - `lib/readiness.ts` — pure `computeReadiness()`, `computeAllReadiness()`, `computeGapTop3()`
  - `app/(app)/admin/SchoolsPanel.tsx` — CRUD bảng School
  - `app/(app)/admin/ReadinessPanel.tsx` — user distribution histogram + buttons
  - `scripts/seed-schools.ts`, `scripts/recompute-mastery-readiness.ts`, `scripts/preview-school-profiles.ts`
- **Schema changes:** + `School` + `SchoolProfile` models in `prisma/schema.prisma`
- **Result:**
  - Baseline đổi từ 0% → 50% (lazy default `?? 50`).
  - Mỗi `submitExam` → tự recompute mastery + readiness từ toàn bộ history.
  - Readiness tính cho cả 6 trường bất kể user chọn target nào (target chỉ là tracking + nguồn gap-advice).
  - Profile trường auto-detect thay đổi qua `sourceHash` — không phụ thuộc workflow upload nào.
  - Admin tabs `?tab=schools` + `?tab=readiness` thêm vào Sidebar.
  - Difficulty thực tế tính ra ~20-30 (HTML formula tham chiếu cho 50-65); diffPenalty âm → baseline ~56-59% cho user mới. Có thể calibrate `DIFF_K` sau khi có dữ liệu thực.
- **Verification:** TSC clean, build pass, dev + production deploy OK (`https://monkey5.ai4all.vn`).

### ✅ Landing page default theme → ocean (biển xanh)
- **Status:** Done
- **Completed:** 2026-06-14 15:55 (commit `521177b`)
- **Files:** [app/(landing)/Landing.tsx](file:///Users/anhlh48/00.AIProjects/99.Monkey5/app/%28landing%29/Landing.tsx)
- **Plan:** [/Users/anhlh48/.claude/plans/system-reminder-message-sent-at-sun-jiggly-crown.md](file:///Users/anhlh48/.claude/plans/system-reminder-message-sent-at-sun-jiggly-crown.md)
- **Result:** Đổi `window.TWEAKS.theme` từ `"forest"` → `"ocean"` (hue 248). CSS `[data-theme="ocean"]` block đã có sẵn ở `public/landing.css` — không cần thay đổi gì khác.

### ✅ User theme picker in Settings modal
- **Status:** Done
- **Completed:** 2026-06-14 16:18 (commit `c7c6608`)
- **Files:** `prisma/schema.prisma` (+`User.theme`), `app/globals.css` (+4 `[data-theme="X"]` blocks), `app/layout.tsx` (SSR `<html data-theme>`), `app/(app)/home/SettingsButton.tsx` (UI section "Giao diện"), `app/(app)/home/actions.ts` (theme field), `lib/user-data.ts`, `components/Sidebar.tsx`, `app/(app)/layout.tsx`
- **Result:** User logged-in có thể chọn 1 trong 5 palette (clay/ocean/forest/grape/coral) từ modal Cài đặt. Optimistic live preview khi click, revert khi cancel, persist khi save. SSR theme vào `<html>` để không bị flash màu cũ. Theme sync giữa các thiết bị qua `User.theme`. Landing giữ độc lập (ocean default).
