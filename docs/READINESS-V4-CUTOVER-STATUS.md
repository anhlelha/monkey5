# Readiness V4 — Cutover Status

**Environment:** local project / local SQLite database
**Scope:** Math, global assignment
**Status:** Global read flag hiện đang bật trên local DB; production deployment chưa được thực hiện.

## Current state

| Signal | Result |
|---|---:|
| `readinessV4ComputeEnabled` | `true` |
| `readinessV4ShadowEnabled` | `true` |
| `readinessV4ReadEnabled` | `true` |
| `readinessV4PersistLegacyEnabled` | `true` |
| Active policy pointer | `cmt9ju5st00014gbvj6l7zq6f` |
| Active profile pointers | 11/11 schools |
| Non-disabled users | 12 |
| Unique current snapshot pairs | 132/132 |
| Versioned snapshot rows | 154 |
| Invariant violations | 0 |
| Latest shadow job | completed, 12/12, failed 0 |
| Latest active-backfill job | completed, 2/2, failed 0 |

Global flag được phát hiện đã ở trạng thái `true` trước khi có thao tác bật mới trong lượt rollout này; không thực hiện toggle lặp lại.

## Active-read report

Active-read report xác nhận hiện tại có 132 current user × school pairs. Status distribution local:

| Status | Count |
|---|---:|
| `unverified` | 99 |
| `not_ready` | 25 |
| `preparing` | 8 |
| `near_ready` | 0 |
| `evidence_limited` | 0 |
| `ready`/`strong_ready` | 0 |

Không nên diễn giải phân bố này là kết quả production hoặc là calibration outcome. Đây là snapshot hiện có trên local DB và cần được đối chiếu với dữ liệu release candidate trước production.

## Code/UI changes included

- Shared `ReadinessUserSummary` cho Overview/Results.
- `ReadinessSchoolCard` luôn hiển thị source và freshness.
- `/topics` ưu tiên 13 analytical topics V4 khi có snapshot và dùng crosswalk để luyện.
- Overview có V4 Readiness summary và đổi bảng ba môn thành reference-only.
- Results tách Readiness theo trường khỏi điểm bài làm.
- Admin Dashboard có V4 operational overview; legacy Mastery card được gắn nhãn baseline.
- Question Bank phân biệt content topic với Assessment V4 taxonomy.
- `check-global-read-gates.ts` kiểm tra pointer, job, coverage theo unique pair và invariant.
- `generate-active-read-report.ts` tạo aggregate report privacy-safe sau khi policy active.

## Verification evidence

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run test:readiness-v4` | 39/39 pass |
| `npm run test:readiness-v4:integration` | 6/6 pass |
| `npm run build` | Pass |
| `npm run readiness:v4:migrate` | Dry-run, integrity/foreign keys pass |
| `npm run readiness:v4:migrate -- --rollback-check` | Pass, rollback schema diff none |
| `npm run readiness:v4:check-read-gates` | `go=true`, 0 invariant violations |
| `npm run readiness:v4:active-report` | Pass, 132/132 current pairs |
| `npm run readiness:v4:e2e` without cookie | Pass for auth guard; protected routes return 307 to signin |
| `git diff --check` | Pass |

## Remaining release-candidate gates

Authenticated E2E with admin and representative user sessions has not been run in this environment because no `READINESS_E2E_COOKIE` is available. Manual desktop/mobile/keyboard/screen-reader QA has also not been executed by an authenticated user. These are the remaining human/environment-dependent gates before production sign-off.

The shadow report helper cannot run after the candidate policy has become active because it requires a current `shadow` policy. The active-read report is the correct post-activation aggregate evidence; any new candidate must be cloned back to Draft, reviewed, moved to Shadow and simulated before another activation.

No production deployment, destructive migration, legacy cleanup or additional policy/profile activation was performed by this status check.


## 2026-08-28 — Legacy UI sweep

Đã tiếp tục rà soát các route còn dùng legacy semantics và cập nhật các điểm user/admin quan trọng:

| Surface | Update |
|---|---|
| Admin user detail | Nạp exact `EffectiveReadinessView` theo target school và `EffectiveAnalyticalMasteryView` theo 13 analytical topics; thay `Mastery TB`/`Sẵn sàng theo trường` trực tiếp bằng V4 labels, status, Evidence và freshness. |
| Topic detail | Dùng `getEffectiveContentMasteryV4`; không còn dùng prior 50% như mastery thật; topic chưa có evidence hiển thị `Chưa đủ evidence`. |
| Topics index | Dùng 13 analytical topics V4 khi active snapshot khả dụng; practice link đi qua content crosswalk. |
| Admin dashboard | V4 operational card hiển thị trước legacy baseline. |
| Question Bank | `content topic` và `Assessment V4 · taxonomy phân tích` được tách nhãn rõ. |

Validation sau sweep:

```text
npm run typecheck                         PASS
npm run test:readiness-v4                 39/39 PASS
npm run test:readiness-v4:integration    6/6 PASS
npm run build                             PASS
npm run readiness:v4:check-read-gates     go=true
npm run readiness:v4:active-report        PASS
git diff --check                          PASS
```

Global read flag vẫn là `true` trên local DB, với 132/132 unique pairs và 0 invariant violations. Legacy code còn tồn tại ở các vùng được giữ có chủ đích: fallback khi chưa có snapshot, baseline rollback, và các subject English/Vietnamese chưa nằm trong policy V4 Math. Những vùng này phải tiếp tục được gắn nhãn; không được dùng để hiển thị như Readiness V4.
