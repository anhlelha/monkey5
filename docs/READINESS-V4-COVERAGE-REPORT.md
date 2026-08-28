# Readiness V4 — Unit và Integration Coverage Report

## Phạm vi và phương pháp

Coverage được chạy bằng `c8` với `--all --include='lib/readiness-v4/**/*.ts'`. Báo cáo sử dụng source map từ TypeScript và bao gồm cả các module chưa được import trong test, vì vậy tổng line coverage phản ánh toàn bộ backend Readiness V4 chứ không chỉ các file đã được test.

Ba lát cắt được kiểm tra:

| Lát cắt | Command | Tests | Statements/Lines | Branches | Functions |
|---|---|---:|---:|---:|---:|
| Unit-only | `npx c8 ... npx tsx --test tests/readiness-v4/*.test.ts` loại integration | 33 | 26.04% (1,303/5,002) | 78.23% | 70.18% |
| Integration-only | `npm run test:readiness-v4:integration` dưới c8 | 6 | 15.81% (791/5,002) | 67.30% | 48.00% |
| Combined Readiness suite | `npm run test:readiness-v4` | 39 | 34.72% (1,737/5,002) | 77.77% | 68.58% |

Tất cả test trong ba lần chạy đều pass. Combined suite gồm **39/39 tests pass**; integration suite riêng gồm **6/6 tests pass**.

## Module coverage combined

| Module | Lines | Đánh giá |
|---|---:|---|
| `readiness-engine.ts` | 100.00% | Đã được bao phủ rất tốt ở các gate/status/invariant chính. |
| `mastery-engine.ts` | 100.00% | Đã bao phủ đầy đủ các phép tính chính. |
| `assessment-resolution.ts` | 100.00% | Đã bao phủ các nhánh resolve, stale và conflict. |
| `feature-flags.ts` | 100.00% | Đã bao phủ đầy đủ các flag path. |
| `profile-builder.ts` | 98.95% | Gần đầy đủ; còn một line edge case. |
| `recommendation-engine.ts` | 98.00% | Gần đầy đủ. |
| `presentation.ts` | 96.77% | Gần đầy đủ; còn các nhánh copy phụ. |
| `hashing.ts` | 96.29% | Gần đầy đủ. |
| `assessment-artifact-contract.ts` | 90.47% | Tốt; còn một số invalid artifact branch. |
| `migration-safety.ts` | 90.56% | Tốt; validator và backup hash đã được test. |
| `policy.ts` | 87.32% | Các threshold/validator chính đã có coverage. |
| `read-service.ts` | 77.67% | Đã có integration coverage cho active pointer/read adapter; còn các fallback/stale branch. |
| `assessment-coverage-service.ts` | 60.33% | Còn service-level query paths. |
| `policy-repository.ts` | 58.38% | Đã test Draft → Shadow và four-eyes; còn update/activate/rollback paths. |
| `school-profile-comparison-service.ts` | 39.14% | Unit comparison có, nhưng service query path còn thiếu. |
| `job-service.ts` | 32.38% | Đã test enqueue/idempotency và pause/resume/cancel; worker/retry/failure paths còn thiếu. |
| `content-mastery-service.ts` | 18.00% | Chưa có đủ integration fixture cho content/attempt aggregation. |
| `snapshot-service.ts` | 7.78% | Chưa test đầy đủ persist/read snapshot và stale semantics. |

## Module chưa được thực thi trong coverage run

Các module sau hiện có 0% line coverage và là gap chính của acceptance workflow:

| Module | Lines | Ưu tiên | Coverage cần bổ sung |
|---|---:|---:|---|
| `profile-lifecycle-actions.ts` | 0% | P0 | Review, approve, activate, retire, four-eyes, audit và enqueue recompute. |
| `profile-lifecycle-service.ts` | 0% | P0 | Active/shadow/retired view model, version history và candidate delta. |
| `simulator-service.ts` | 0% | P0 | Point/count preview, active-vs-shadow comparison, policy/profile delta và invariant. |
| `job-view-service.ts` | 0% | P0 | Job detail, sanitized error, reconciliation và metrics. |
| `policy-view-service.ts` | 0% | P1 | Policy list/detail, lineage, audit và capability view model. |
| `school-profile-view-service.ts` | 0% | P1 | Profile list/detail và source lineage. |
| `permissions.ts` | 0% | P1 | Unauthorized, missing capability và admin permission checks. |
| `recommendation-service.ts` | 0% | P1 | Snapshot recommendation query path. |
| `question-bank-assessment-export.ts` | 0% | P2 | Export contract và filesystem/report generation. |
| `assessment-prompts.ts` | 0% | P2 | Prompt construction/contract validation. |

## Đánh giá theo handoff

Các engine thuần dữ liệu đã có độ tin cậy tốt: readiness engine, mastery engine, assessment resolution và profile builder đều trên 98% line coverage. Các integration workflow cơ bản cũng đã được kiểm chứng trên database clone: policy Draft → Shadow, active pointer uniqueness, profile build enqueue idempotency, exact read adapter và job pause/resume/cancel.

Tuy nhiên, tổng line coverage vẫn chỉ **34.72%** vì các service database-backed và các route read model chưa được gọi trong test. Hai khoảng trống quan trọng nhất là lifecycle mutation services và simulator/comparison service. Chúng không nên được coi là đã đạt full acceptance chỉ dựa trên unit test hiện tại.

## Backlog coverage đề xuất

Trước release candidate, nên bổ sung integration fixtures cho `profile-lifecycle-actions.ts`, `profile-lifecycle-service.ts`, `simulator-service.ts` và `job-view-service.ts`. Sau đó thêm permission-negative tests cho từng capability và route-level authenticated E2E sử dụng admin session. Mục tiêu thực tế cho backend Readiness V4 là tối thiểu 80% line coverage ở các module P0, 90% branch coverage cho engine/validator, và có ít nhất một happy path cùng một negative path cho mỗi mutation.

Artifacts JSON được lưu tại `.reports/readiness-v4-coverage-unit/`, `.reports/readiness-v4-coverage-unit-only/` và `.reports/readiness-v4-coverage-integration/`.
