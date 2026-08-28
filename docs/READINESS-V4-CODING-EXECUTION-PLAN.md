# Readiness V4 — Kế hoạch thực hiện coding còn lại

**Ngày lập:** 2026-08-27
**Phạm vi:** local/dev, chưa deploy production
**Mục tiêu:** hoàn tất các workstream Readiness V4 còn thiếu sau P0, theo thứ tự `Policy UI → Simulator/Impact Preview → Profile lifecycle → Job detail/monitoring/reconciliation`, đồng thời harden test, security, accessibility và release readiness.

## 1. Cơ sở và nguyên tắc triển khai

Tài liệu này chuyển backlog trong handoff thành một lộ trình thực thi có thể giao theo từng coding slice. Workstream 1–3 đã được handoff xác nhận là `DONE`; không giao lại comparison, không chạy lại assessment 1.487 câu nếu content hash không đổi. Phần còn lại cần triển khai theo thứ tự Workstream 4 đến 7, trong khi Workstream 10 chạy xuyên suốt và là điều kiện bắt buộc trước release. Personalized School Readiness Detail vẫn `BLOCKED` cho đến khi Product Owner chốt có tạo route user riêng hay không.[1]

Các quyết định học thuật và lifecycle phải được giữ nguyên: School Profile chỉ dùng official canonical; Readiness là index chứ không phải xác suất đỗ; policy/profile/snapshot active là immutable theo version; activation và rollback dùng four-eyes; read adapter chỉ lấy đúng active pointer; report không chứa email, answer hoặc PII không cần thiết.[2]

> **Nguyên tắc vận hành:** mỗi workstream phải đọc Decision Log và Migration Plan trước khi sửa code, kiểm tra `git status --short`, bảo toàn thay đổi hiện có, viết service/view model server trước UI, thêm unit test cho derivation và permission, sau đó mới làm UI và manual QA. Không sử dụng `prisma db push --accept-data-loss`, không reset worktree và không tự deploy production.[1]

## 2. Trạng thái hiện tại và phạm vi không làm lại

Worktree hiện có nhiều thay đổi Readiness V4 chưa gom thành commit riêng. Vì vậy, coding phải bắt đầu bằng việc phân loại thay đổi hiện hữu và không được reset hoặc xoá các file không liên quan. Backend nền cho policy lifecycle, simulator, assignment/pointer và recompute job đã tồn tại; phần thiếu chủ yếu là read model, server action có guard đầy đủ, route UI, report và test end-to-end.[3]

| Hạng mục | Trạng thái handoff | Quyết định thực hiện |
|---|---:|---|
| Admin School Profile Comparison | DONE | Chỉ regression/integration QA trong Workstream 10. |
| Question Bank Assessment V4 | DONE | Không chạy lại model/import nếu hash không đổi. |
| Presentation V4 trên Home/Overview/Results/Library | DONE | Chỉ kiểm tra regression khi thay đổi downstream. |
| Admin Policy Management UI | TODO, P1 | Là coding slice đầu tiên. |
| Simulator và Impact Preview | TODO, P1 | Là slice thứ hai, dùng simulator service hiện có. |
| Profile lifecycle và candidate comparison | PARTIAL, P1 | Là slice thứ ba; ưu tiên lifecycle/service trước UI batch. |
| Recompute Job Detail/monitoring/reconciliation | PARTIAL, P1 | Là slice thứ tư; bổ sung observability và error-safe rendering. |
| Personalized user detail | BLOCKED | Không coding route trước khi có quyết định product bằng văn bản. |
| Progress/History/telemetry/i18n | TODO, P2 | Chỉ đưa vào sau P1, trừ telemetry tối thiểu cần cho release. |
| Test hardening/security/release readiness | PARTIAL, P0 trước release | Chạy xuyên suốt, không dồn toàn bộ vào cuối. |
| Migration Library/navigation sang 13 topic | DEFERRED | Không nằm trong execution plan này. |

## 3. Definition of Done cho từng coding slice

Mỗi slice chỉ được coi là hoàn tất khi có đủ năm lớp bằng chứng: code/service đúng contract; permission và lifecycle guard ở server; unit/integration test; UI có loading, empty, error và accessibility state; và lệnh kiểm thử local đạt. Nếu có thay đổi schema, phải có migration additive hoặc baseline phù hợp, `npx prisma validate` và `prisma migrate diff` trên release candidate. Không đánh dấu Done chỉ vì route render được.

Bộ lệnh tối thiểu cho mọi slice là:

```bash
npm run typecheck
npm run test:readiness-v4
npm test
npm run build
```

Các lệnh bổ sung theo phạm vi:

```bash
npx prisma validate
npx prisma migrate diff ...
git diff --check
```

## 4. Lộ trình tổng thể

| Phase | Workstream | Kết quả chính | Phụ thuộc | Ước lượng tương đối |
|---:|---|---|---|---:|
| 0 | Baseline và safety gate | Baseline test, inventory file, xác nhận thay đổi local | Không | 0,5 ngày |
| 1 | Admin Policy Management UI | `/admin/readiness/policies`, list/detail, typed draft form, diff, audit, review-to-shadow | Backend policy action/repository hiện có | 2–3 ngày |
| 2 | Simulator và Impact Preview | `/admin/readiness/simulator`, deterministic comparison, fixtures, JSON/CSV report | Policy UI để chọn candidate; `simulator-service.ts` | 2–3 ngày |
| 3 | Profile lifecycle/candidate comparison | Version list, candidate-vs-active diff, refresh enqueue, scoped activation/rollback | Assignment/profile services, policy/simulator semantics | 3–4 ngày |
| 4 | Job detail/monitoring/reconciliation | `/admin/readiness/jobs/[jobId]`, item error/retry, metrics, reconciliation | Job service và lifecycle scope từ Phase 1–3 | 2–3 ngày |
| 5 | Cross-cutting hardening | Integration, permission, four-eyes, E2E, accessibility, security | Tất cả UI/service P1 | 3–5 ngày |
| 6 | Release rehearsal | Migration, backup/restore, shadow report, manual QA, runbook | Phase 1–5 hoàn tất | 1–2 ngày |

Các con số trên là effort tương đối để lập lịch, không phải cam kết thời gian tuyệt đối. Không gộp nhiều phase vào một thay đổi lớn; mỗi phase nên kết thúc bằng một checkpoint review và bằng chứng test riêng.

## 5. Phase 0 — Baseline và safety gate

Trước khi coding, ghi lại `git status --short`, branch/commit hiện tại, các script đang có và kết quả của `typecheck`, `test:readiness-v4`, `npm test`, `build`, `prisma validate`. Kiểm tra rằng không có migration destructive hoặc file build cũ bị khôi phục. Đọc lại `READINESS-V4-DECISION-LOG.md`, phần tương ứng trong `READINESS-V4-MIGRATION-PLAN.md` và `READINESS-V4-RUNBOOK.md`.

Tạo một checklist baseline trong task/PR, gồm: route hiện có; capability hiện có; policy rows/status; active assignment; job states; snapshot lineage; và các test đang bao phủ. Nếu baseline fail vì thay đổi có sẵn trong worktree, ghi nhận nguyên nhân trước khi sửa, không âm thầm quy lỗi cho slice mới.

**Gate để sang Phase 1:** baseline được lưu; không có file nào bị reset; phạm vi schema được xác nhận là không cần mở rộng cho Policy UI trừ khi inspect thực tế phát hiện thiếu field; và Product Owner chưa yêu cầu activation/production trong task này.

## 6. Phase 1 — Admin Policy Management UI

### 6.1 Mục tiêu

Xây dựng workflow quản lý policy có version và four-eyes đầy đủ, nhưng không biến một thao tác thành create–review–activate một bước. Admin có thể xem version/status/audit, clone active hoặc policy nguồn thành Draft, sửa Draft bằng form typed, xem diff, gửi Draft sang Shadow với reason và capability phù hợp. Active, Shadow và Retired không được sửa tại chỗ.

### 6.2 Trình tự coding

1. Tạo read model server cho policy list và policy detail. Read model phải trả policy fields typed, status, creator/reviewer/activator, timestamps, change summary, effective time, assignment hiện tại/previous và audit entries. Không để client parse `configJson` hoặc tự đọc DB.
2. Bổ sung server action/query cho policy detail nếu action hiện tại chỉ hỗ trợ clone, update và move-to-shadow. Mọi query/action phải gọi `requireReadinessPermission` ở server; client disable/ẩn control chỉ là UX, không phải security boundary.
3. Tạo route `/admin/readiness/policies` và route detail theo policy ID. Có empty state khi chưa có policy, error state khi policy không tồn tại hoặc không đủ capability, và loading state trong navigation.
4. Tạo form typed dựa trên `ReadinessPolicy` và validator dùng chung với server. Form phải bao phủ các field formula, prior, evidence, weight mode, status thresholds, evidence gates và critical/advanced gates; hiển thị đơn vị rõ ràng giữa fraction `0..1` và percentage `0..100`.
5. Thêm validation realtime cho UX nhưng luôn gửi lại validator server. Chặn threshold order sai, scale sai, số âm, giá trị ngoài range, enum không hợp lệ và reason/change summary quá ngắn.
6. Tạo diff Draft–Active bằng tên nghiệp vụ, giá trị before/after, đơn vị và ý nghĩa tăng/giảm. Diff phải ổn định, không chỉ hiển thị raw JSON.
7. Thêm flow `Clone Active to Draft` với version và change summary; `Save Draft` với edit reason; `Submit/Move to Shadow` với review reason. Không tạo nút activate trong Policy UI nếu activation vẫn thuộc global rollout workflow hiện có.
8. Hiển thị assignment active/previous, audit append-only và capability matrix. Creator không được review/activate candidate; reviewer/activator khác creator theo server rule.

### 6.3 File dự kiến

| Nhóm | File dự kiến |
|---|---|
| Route/UI | `app/(app)/admin/readiness/policies/page.tsx`, `app/(app)/admin/readiness/policies/[policyId]/page.tsx`, `components/readiness/PolicyList.tsx`, `components/readiness/PolicyDetail.tsx`, CSS/module tương ứng |
| Server read model | `lib/readiness-v4/policy-view-service.ts` hoặc module tương đương |
| Actions | `app/(app)/admin/readiness-v4-actions.ts` và/hoặc file action riêng, tái sử dụng repository hiện có |
| Test | `tests/readiness-v4/policy-management.test.ts`, integration test lifecycle ở Workstream 10 |
| Navigation | `ReadinessV4Admin.tsx`, sidebar/toolbar nếu cần, không phá active-route `/admin/readiness/**` |

### 6.4 Acceptance gate

Policy list/detail phải phân biệt rõ Draft, Shadow, Active và Retired. Active/Shadow/Retired không edit được tại chỗ; Draft mới được edit. Invalid threshold order/scale bị chặn ở cả client và server. Mọi thay đổi có actor, reason và diff trong audit. Creator không tự review/activate được. Typecheck, unit test, full test và build đều đạt.

## 7. Phase 2 — Simulator và Impact Preview

### 7.1 Mục tiêu

Cung cấp màn hình `/admin/readiness/simulator` để review tác động của candidate policy/profile trước activation. Đây là preview read-only, deterministic, không đổi assignment/read flag, không ghi đè snapshot active và không chứa PII.

### 7.2 Trình tự coding

1. Chuẩn hóa input contract cho candidate policy, candidate profile set, weight mode và preview scope. Scope phải hỗ trợ tối thiểu toàn bộ user hoặc fixture/sampled scope được owner cho phép; không suy diễn scope ngầm.
2. Mở rộng `buildShadowComparison` hoặc tách report service để trả typed report thay vì `Record<string, unknown>` ở các phần cần UI. Giữ `userKey` đã hash; không trả user ID, email, answer hoặc attempt content.
3. Tạo fixtures deterministic cho new user, ít evidence, foundation-only, D4–D5 và lệch topic. Fixtures phải có tên nghiệp vụ, input version và expected invariant để test.
4. Tính và hiển thị Active vs Candidate: status distribution, Ready mới/mất Ready/evidence-limited, delta readiness/percentile/outlier, gate failure theo trường/topic và invariant violations. UI phải phân biệt thay đổi do policy/profile với tiến bộ học sinh.
5. Thêm drill-down giải thích delta đến từ field policy, gate hoặc profile nào; không chỉ hiển thị một con số tổng hợp.
6. Thêm export JSON/CSV reconciliation report. Whitelist field xuất; kiểm tra lại bằng test rằng report không có PII.
7. Bổ sung guard: candidate có invariant violation không thể đi tiếp trong activation workflow; simulator bản thân không activate.

### 7.3 File dự kiến

| Nhóm | File dự kiến |
|---|---|
| Route/UI | `app/(app)/admin/readiness/simulator/page.tsx`, `components/readiness/ReadinessSimulator.tsx` |
| Service/report | `lib/readiness-v4/simulator-service.ts`, có thể thêm `simulator-report-service.ts` và export helper |
| Actions | action read-only để chạy preview và tạo download response, có capability `readiness.view` hoặc capability được owner chốt |
| Test | `tests/readiness-v4/simulator.test.ts`, invariant/export/privacy tests |

### 7.4 Acceptance gate

Cùng input phải cho cùng output. Preview không thay đổi pointer, read flag hoặc active snapshot. Invariant violation được hiển thị rõ và activation guard từ chối. Report có thể tải được, không có email/answer/PII. Có empty/loading/error state, bảng alternative cho biểu đồ nếu có chart, keyboard focus và status text không phụ thuộc màu.

## 8. Phase 3 — Profile lifecycle và candidate comparison

### 8.1 Mục tiêu

Hoàn thiện workflow cho School Profile candidate: enqueue build/refresh shadow, xem version theo trường và status, so sánh candidate với active, review/approve/activate/retire theo scope, tạo recompute scope đúng khi activation và giữ immutable lineage.

### 8.2 Trình tự coding

1. Tạo profile version read model theo trường, trả status, source hash, assessment run, taxonomy/methodology, lineage, timestamps, coverage, confidence và reliability.
2. Xác định rõ active pointer từ `SchoolProfileAssignment`; không chọn row chỉ dựa trên `status`. Tách active/candidate/previous pointer và kiểm tra uniqueness theo school/scope.
3. Thêm action build/refresh shadow chỉ enqueue job; không chạy builder dài trong web request. Job phải ghi source/target version và scope để detail/reconciliation sử dụng.
4. Tạo candidate comparison service trả delta exam/source set, topic/band, Difficulty Index, coverage/confidence/reliability. Aggregate phải tính ở server và có test scale/tolerance.
5. Tạo route/detail cho profile lifecycle hoặc mở rộng profile detail hiện có với tab `Versions`, `Compare`, `Lifecycle`. Không đưa metadata admin như assessment run/source hash sang user UI.
6. Thêm review/approve/activate/retire từng trường hoặc batch. Batch bắt buộc có danh sách trường rõ ràng, confirmation và audit reason; activation phải dùng four-eyes và không tạo hai active pointer.
7. Chặn candidate thiếu assessment/coverage theo policy đã chốt; nếu có explicit override thì phải lưu actor, reason, scope và policy/audit reference.
8. Khi source/assessment hash đổi, tạo version mới; không update active row. Khi rollback, phục hồi previous pointer và giữ snapshot lịch sử.

### 8.3 File dự kiến

| Nhóm | File dự kiến |
|---|---|
| Service | `lib/readiness-v4/profile-lifecycle-service.ts`, mở rộng `profile-service.ts`/`assignment-service.ts` nếu cần |
| UI/route | `app/(app)/admin/readiness/[school]/page.tsx`, các component lifecycle/candidate comparison |
| Actions | `app/(app)/admin/readiness-v4-actions.ts` hoặc action module riêng |
| Test | `tests/readiness-v4/profile-lifecycle.test.ts`, pointer uniqueness, candidate comparison và rollback tests |

### 8.4 Acceptance gate

Không tồn tại hai active pointer cho cùng school/scope. Candidate thiếu assessment/coverage bị chặn hoặc explicit override được audit. Candidate comparison hiển thị đúng delta và reliability. Activation tạo recompute scope phù hợp. Rollback không xóa snapshot lịch sử và khôi phục đúng previous pointer.

## 9. Phase 4 — Recompute Job Detail, monitoring và reconciliation

### 9.1 Mục tiêu

Bổ sung khả năng giải thích đầy đủ một recompute job, vận hành item lỗi an toàn và biết chính xác điều kiện khiến Read V4 read bị disabled. Giữ nguyên semantics pause/resume/retry/cancel hiện có và không xóa snapshot đã tạo khi cancel.

### 9.2 Trình tự coding

1. Tạo route `/admin/readiness/jobs/[jobId]` và server read model trả source/target version, policy/profile IDs ở dạng admin-appropriate, scope, checkpoint, progress, timestamps, lease, worker heartbeat và error summary đã sanitize.
2. Tạo item table có status, attempt count, started/completed time, sanitized error và retry item/all failed. Không render raw exception hoặc stack trace không qua sanitize.
3. Thêm polling có backoff và stop condition khi terminal state; không refresh toàn trang vô hạn. Hiển thị stale data indicator nếu polling lỗi.
4. Xây reconciliation service so sánh expected logical pairs với snapshot thực tế, phát hiện duplicate logical result, missing/stale pair và status distribution. Report phải gắn source/target lineage.
5. Xây monitoring aggregate: queue depth, oldest queued age, compute latency p50/p95, failure rate, stale rate và worker heartbeat. Định nghĩa rõ denominator/time window để metric deterministic.
6. Cảnh báo failure >5%, worker không chạy hoặc active backfill thiếu. Cảnh báo phải giải thích nguyên nhân và action hợp lệ, không chỉ dùng màu.
7. Liên kết job detail từ bảng job trong `ReadinessV4Admin`; hiển thị trạng thái nút read disabled dựa trên invariant/backfill evidence chứ không hard-code.

### 9.3 File dự kiến

| Nhóm | File dự kiến |
|---|---|
| Route/UI | `app/(app)/admin/readiness/jobs/[jobId]/page.tsx`, `components/readiness/RecomputeJobDetail.tsx` |
| Service | `lib/readiness-v4/job-view-service.ts`, `lib/readiness-v4/reconciliation-service.ts`, `lib/readiness-v4/monitoring-service.ts` |
| Actions | mở rộng action pause/resume/retry/cancel với item retry nếu cần |
| Test | `tests/readiness-v4/job-detail.test.ts`, reconciliation/metrics/sanitize tests |

### 9.4 Acceptance gate

Pause không claim item mới; resume tiếp tục checkpoint; cancel không xóa snapshot; retry không tạo duplicate logical result. Item error được sanitize. Reconciliation giải thích missing/stale/failure. Admin biết vì sao read disabled. Polling không gây tải vô hạn và terminal job dừng polling.

## 10. Workstream 10 — Test, security và accessibility chạy xuyên suốt

Mỗi phase phải thêm test ngay khi thêm service/UI. Bộ test bắt buộc trước release gồm policy draft → shadow → activate → rollback; permission cho view/edit/review/activate/recompute; creator khác reviewer/activator; active pointer uniqueness và transaction rollback; lease expiry/retry/auto-pause >5%/cancel/idempotency; submit exam không fail khi enqueue lỗi; exact active version của read adapter; UI states `unverified`, `stale`, `computing`, `legacy-fallback`; subject isolation; comparison accessibility; và E2E Admin → comparison → profile detail → quay lại.[1]

| Lớp kiểm thử | Nội dung | Thời điểm |
|---|---|---|
| Unit | Pure derivation, validation, diff, metrics, reconciliation, privacy sanitizer | Trong từng phase |
| Integration | Server action + Prisma transaction + permission + audit + pointer lifecycle | Sau Phase 1 và 3 |
| Contract | View model không có user/PII; status/enum/scale đúng contract | Trong từng phase |
| E2E | Admin navigation, policy workflow, simulator preview, profile lifecycle, job detail | Sau Phase 4 |
| Accessibility | Keyboard, focus, labels, table alternative, chart alternative, contrast, mobile disclosure | Mỗi route hoàn chỉnh |
| Manual QA | Desktop/mobile, empty/error/loading, polling, back navigation, permission variations | Trước release rehearsal |

Security review phải xác nhận mọi `/admin/readiness/**` yêu cầu admin và capability ở server, query params được whitelist/normalize, policy input validate ở server, job error escape/sanitize, export không có PII, và UI không làm lộ assessment run/source hash/profile lineage sang học sinh.

## 11. Những việc bị chặn hoặc để sau

Không triển khai `/readiness/[school]` cho user cho đến khi Product Owner xác nhận đây là personalized readiness breakdown riêng, không phải School Profile Admin. Nếu owner từ chối, ghi quyết định và đóng workstream. Không migrate Library/navigation/content bank sang 13 analytical topics trong execution này; chỉ bắt đầu khi đủ content mapping, acceptance test và product approval về URL/history/dashboard/rollback.[1][2]

Progress/History, freshness audit nâng cao, telemetry và i18n nên làm sau P1, trừ các telemetry tối thiểu cần để validate UX release. Các sự kiện telemetry không được gửi answer content, email hoặc PII không cần thiết; copy V4 nên chuyển sang i18n keys thay vì hard-code trong logic.

## 12. Release rehearsal và điều kiện bàn giao

Sau khi Phase 1–4 và hardening hoàn tất, chạy migration trên bản sao DB, kiểm tra additive diff, backup/restore rehearsal và `PRAGMA integrity_check`. Chạy shadow report cuối, xác nhận không có invariant violation, worker backfill đủ expected `user × active school`, manual QA desktop/mobile/keyboard và cập nhật Runbook.

Chỉ bàn giao release candidate khi toàn bộ điều kiện sau đạt: Policy lifecycle có permission/audit/four-eyes; simulator deterministic và privacy-safe; profile candidate lifecycle không phá pointer/lineage; job detail giải thích được failure/missing/stale; integration/security/E2E/accessibility đạt; migration và backup/restore rehearsal đạt; và chưa có production deployment nếu chưa có lệnh riêng của owner.[1]

## 13. Task order đề xuất cho coding session tiếp theo

| Task | Nội dung | Kết quả cần commit/ghi nhận |
|---:|---|---|
| T0 | Baseline + inspect policy schema/actions + test hiện có | Baseline evidence, không reset worktree |
| T1 | Policy read model + list/detail route skeleton | Route render, typed server model |
| T2 | Typed draft form + validation + diff | Draft-only editing, diff test |
| T3 | Review-to-shadow + audit/permission UI | Four-eyes integration test |
| T4 | Simulator input/report service + fixtures | Deterministic simulator tests |
| T5 | Simulator UI + JSON/CSV export | Privacy and invariant acceptance |
| T6 | Profile lifecycle read model + candidate comparison | Pointer/version/delta tests |
| T7 | Profile lifecycle actions + UI | Activation/rollback integration test |
| T8 | Job detail + item retry + polling | Job state/idempotency tests |
| T9 | Monitoring + reconciliation + read-disabled reason | Metrics/reconciliation tests |
| T10 | E2E/accessibility/security/manual QA | Release checklist evidence |
| T11 | Migration/backup/restore/shadow rehearsal + Runbook | Release candidate sign-off |

**Việc bắt đầu ngay:** T0, sau đó T1 của Workstream 4. Không chạy lại Workstream 1–3 và không chạy lại assessment bank 1.487 câu nếu content hash vẫn giữ nguyên.

## References

[1]: `docs/READINESS-V4-REMAINING-CODING-HANDOFF.md` — backlog hợp nhất, trạng thái workstream, acceptance và quy trình thực hiện.

[2]: `docs/READINESS-V4-DECISION-LOG.md` — các quyết định học thuật, lifecycle, permission, rollout và điều kiện migration.

[3]: `app/(app)/admin/readiness-v4-actions.ts`, `lib/readiness-v4/policy-repository.ts`, `lib/readiness-v4/simulator-service.ts`, `lib/readiness-v4/job-service.ts` — server action và service nền hiện có để tái sử dụng.
