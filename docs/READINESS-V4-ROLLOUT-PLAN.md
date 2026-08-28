# Readiness V4 — Kế hoạch Rollout toàn hệ thống

Tài liệu này mô tả lộ trình đưa Readiness V4 từ môi trường phát triển lên production một cách an toàn, có kiểm soát và có khả năng hoàn nguyên. Kế hoạch tuân thủ nghiêm ngặt các nguyên tắc **additive migration**, **shadow validation** và **four-eyes approval** đã chốt trong Decision Log.

## 1. Tổng quan lộ trình

Quá trình rollout được chia thành 5 giai đoạn chính:

1.  **Preflight & Data Readiness:** Chuẩn bị hạ tầng, schema và dữ liệu nền.
2.  **Shadow Validation:** Chạy song song dữ liệu thật ở chế độ ẩn để kiểm chứng.
3.  **Pilot & Canary:** Bật tính năng cho nhóm người dùng nhỏ/nội bộ.
4.  **Global Activation:** Chuyển đổi toàn bộ hệ thống sang V4.
5.  **Stabilization & Cleanup:** Theo dõi ổn định và dọn dẹp dữ liệu cũ.

---

## 2. Giai đoạn 1: Preflight & Data Readiness

Mục tiêu: Đảm bảo nền tảng dữ liệu và mã nguồn đã sẵn sàng mà không ảnh hưởng đến người dùng hiện tại.

### 2.1 Schema Migration (Additive)
- **Thao tác:** Chạy migration trên bản sao release-candidate bằng quy trình deploy được owner phê duyệt; migration runner hiện tại chỉ cho `--apply --target=local-dev`, nên không được dùng để apply production trực tiếp.
- **Preflight:** Chạy `npm run readiness:v4:migrate -- --rollback-check` trên bản sao và lưu backup/hash/rehearsal artifact.
- **Yêu cầu:** Chỉ thêm bảng/index mới và `ALTER TABLE ADD COLUMN`. Tuyệt đối không `DROP` hoặc `TRUNCATE`.
- **Gate:** `PRAGMA integrity_check` trả về `ok`, `foreign_key_check` rỗng, schema diff additive và migration history hợp lệ.

### 2.2 Assessment Import
- **Thao tác:** Import 1.487 câu assessment V4 (849 official + 638 supplement/private).
- **Yêu cầu:** Dùng model `gpt-5.6-sol`, taxonomy `math-topic-taxonomy-v1`.
- **Gate:** Coverage đạt 100% cho Question Bank Toán canonical; `stale=0`, `conflicts=0`.

### 2.3 Initial Seed
- **Thao tác:** Seed `DEFAULT_MATH_READINESS_POLICY_V1` ở trạng thái `shadow`.
- **Thao tác:** Cấp quyền Admin capability cho tối thiểu 2 nhân sự IT để thực hiện four-eyes.

---

## 3. Giai đoạn 2: Shadow Validation

Mục tiêu: Kiểm chứng tính đúng đắn của logic V4 trên quy mô toàn bộ dữ liệu người dùng thật.

### 3.1 Shadow Profile Build
- **Thao tác:** Build School Profile V2 cho toàn bộ 11 trường mục tiêu ở trạng thái `shadow`.
- **Gate:** Tổng trọng số blueprint mỗi trường = 1.0; Difficulty Index khớp với dashboard tham chiếu.

### 3.2 Shadow Recompute Job
- **Thao tác:** Tạo job `mastery-readiness` ở mode `shadow` cho toàn bộ người dùng.
- **Theo dõi:** Giám sát `failureRate`, `computeLatency`, checkpoint age và worker heartbeat qua Job Detail UI. Ngưỡng vận hành phải được owner chốt trước cutover; mặc định không tự cutover khi failure rate vượt 5%.
- **Gate:** Job hoàn thành 100% item; `failedItems = 0`; không có invariant violation (Readiness > Mastery); expected user × active school pairs khớp snapshot pairs.

### 3.3 Simulator Review
- **Thao tác:** Admin chạy Simulator so sánh Active (Legacy) vs Candidate (V4 Shadow).
- **Phân tích:** Review danh sách Ready gained/lost, status distribution và các acceptance fixtures (Mika, new user).
- **Gate:** Product Owner ký duyệt kết quả mô phỏng và chốt policy version.

---

## 4. Giai đoạn 3: Pilot & Canary

Mục tiêu: Giảm thiểu rủi ro bằng cách cho phép một nhóm nhỏ tiếp cận giao diện mới.

### 4.1 Dual Compute Enable
- **Thao tác:** Bật flag `readinessV4ComputeEnabled=true`.
- **Hành vi:** Khi user submit bài, hệ thống tính cả Legacy và V4. Lỗi V4 không được làm hỏng luồng submit.

### 4.2 Internal/Canary Read
- **Thao tác:** Chỉ bật read cho Admin/internal nếu đã có cơ chế scope/canary được triển khai và kiểm thử. Decision Log hiện chốt assignment global, chưa có cohort rollout; không được giả định cờ global có thể tạo canary theo user. Nếu chưa có cohort resolver, giữ `readinessV4ReadEnabled=false` và chỉ validate bằng Admin Simulator/route preview.
- **Kiểm tra:** Xác nhận Home, Overview, Results, Library hiển thị cùng một snapshot V4 nhất quán và không trộn policy/profile version.
- **Gate:** Không có phản hồi tiêu cực về mức độ hiểu Readiness/Evidence/Mastery từ nhóm test; có log rõ user/cohort nào đọc version nào.

---

## 5. Giai đoạn 4: Global Activation (Cutover)

Mục tiêu: Chuyển đổi chính thức toàn bộ hệ thống sang Readiness V4.

### 5.1 Profile & Policy Activation
- **Thao tác:** Chỉ thực hiện `Activate global` sau khi toàn bộ Go/No-Go checklist được ký duyệt.
- **Cơ chế:** Chuyển active pointer trong `ReadinessPolicyAssignment` và `SchoolProfileAssignment` bằng transaction; activation không có nghĩa toàn bộ snapshot đã backfill xong.
- **Four-eyes:** Người thực hiện activate phải khác người đã review/approve shadow version; owner phải ghi lại policy/profile version, scope, reason và thời điểm activation.

### 5.2 Full Read Cutover
- **Thao tác:** Chỉ sau khi pilot/internal gate đạt, bật `readinessV4ReadEnabled=true` toàn cục bằng một change được owner xác nhận.
- **Hành vi:** Toàn bộ UI user đọc dữ liệu từ V4 snapshots. Nếu thiếu snapshot đúng active version, adapter fallback legacy có nhãn theo policy đã duyệt; không im lặng lấy snapshot của version khác.
- **Gate ngay sau bật:** xác nhận flag, active pointers, snapshot coverage, queue depth và error/stale rate; nếu bất kỳ gate critical nào fail thì thực hiện L1 rollback.

---

## 6. Giai đoạn 5: Stabilization & Cleanup

### 6.1 Post-Release Monitoring
- **KPI:** Tỷ lệ snapshot stale, số lượng invariant violations, engagement với gate explanation.
- **SLA:** 100% user active có snapshot V4 current trong vòng 5 phút sau khi làm bài.

### 6.2 Legacy Cleanup (Deferred)
- **Thời gian:** Sau tối thiểu 30 ngày ổn định.
- **Thao tác:** Tắt `readinessV4PersistLegacyEnabled`, ngừng tính toán legacy.
- **Thao tác:** Migration riêng để dọn dẹp các field JSON cũ trên model `User`.

---

## 7. Kế hoạch Rollback

Luôn ưu tiên rollback logic trước khi rollback database.

| Cấp độ | Thao tác | Tác động |
|---|---|---|
| **L1: UI Rollback** | Đặt `readinessV4ReadEnabled=false` | UI quay lại hiển thị dữ liệu Legacy ngay lập tức. Snapshot V4 vẫn được giữ. |
| **L2: Pointer Rollback** | Dùng `Rollback global` trong Admin | Quay pointer về version policy/profile trước đó. Cần recompute lại snapshot cho version cũ. |
| **L3: DB Rollback** | Khôi phục từ bản backup SQLite gần nhất | Mất dữ liệu phát sinh từ thời điểm backup. Chỉ dùng khi schema migration lỗi nghiêm trọng. |

---

## 8. Checklist Go/No-Go trước Cutover

- [ ] 100% Question Bank Toán canonical có assessment V4 current.
- [ ] Shadow recompute hoàn tất cho toàn bộ user, `failedItems = 0`.
- [ ] Simulator report không có invariant violation nào chưa xử lý.
- [ ] Đã diễn tập rollback pointer và UI thành công ở môi trường staging/local.
- [ ] Có ít nhất 2 Admin sẵn sàng cho quy trình four-eyes activation.
- [ ] Tài liệu hướng dẫn (Glossary) cho người dùng về Mastery/Evidence/Readiness đã sẵn sàng.


## 9. Trạng thái hiện tại và các blocker trước production

| Hạng mục | Trạng thái hiện tại | Ý nghĩa đối với rollout |
|---|---|---|
| Assessment Question Bank | Đã có coverage local 1.487/1.487 current; stale/conflict/missing bằng 0 theo handoff | Cần tái xác minh trên database/release candidate, không mặc nhiên suy ra production đã giống local. |
| Schema/migration | Additive migration và migration runner đã có; local dry-run/rollback rehearsal đạt | Chưa apply production; phải chạy trên backup và release-candidate copy trước. |
| Policy/profile lifecycle | Có Draft/Shadow/Active/Retired, audit, pointer và four-eyes action | Cần Product Owner ký candidate policy/profile cụ thể trước activation. |
| Simulator/comparison | Có point/count preview và active-vs-shadow comparison | Cần lưu impact report và review các outlier, Ready gained/lost, evidence-limited. |
| Recompute worker | Có queue, item, lease, retry, pause/resume/cancel và job detail | Cần chứng minh worker production có process supervision, heartbeat và SLA freshness. |
| Integration tests | 6/6 integration tests pass; combined Readiness suite 39/39 pass | Coverage P0 database services còn thấp; phải có acceptance sign-off, không chỉ dựa trên pass count. |
| Authenticated E2E | Route smoke unauthenticated pass; authenticated E2E hỗ trợ cookie nhưng chưa chạy trong phiên hiện tại | Trước cutover phải chạy bằng admin session và test user representative. |
| Canary cohort | Decision Log hiện chốt global assignment, chưa có cohort resolver | Không bật global read flag để giả lập canary. Cần thêm cohort capability hoặc bỏ qua canary sau khi owner phê duyệt rủi ro. |
| User detail/history | Personalized School Readiness Detail đang BLOCKED; Progress/History là P2 | Không đưa hai deliverable này vào điều kiện bắt buộc của V4 global nếu Product Owner chưa chốt. |

## 10. RACI và nguyên tắc phê duyệt

| Vai trò | Trách nhiệm bắt buộc |
|---|---|
| Product Owner | Chốt policy semantics, threshold provisional/calibrated, vocabulary, scope rollout và Go/No-Go cuối. |
| Academic reviewer | Review profile official canonical, policy gates, Mika/fixture result, false positive/negative và giải thích học thuật. |
| Engineering owner | Review code/schema, migration diff, worker, snapshot lineage, observability và deploy procedure. |
| Release operator | Chạy backup, migration, worker, recompute, kiểm tra dashboard và lưu evidence; không tự phê duyệt business decision. |
| Admin reviewer | Thực hiện review/approve candidate, khác với creator và activator. |
| Incident owner | Có quyền tắt read flag, rollback pointer và điều phối incident; không xoá snapshot/audit. |

Không một cá nhân nào được tự tạo, tự review, tự approve và tự activate policy/profile production. Mọi ngoại lệ phải được Product Owner ghi rõ trong Decision Log trước thao tác.

## 11. Execution checklist chi tiết

### 11.1 T-7 đến T-3: chuẩn bị release candidate

| ID | Việc | Evidence bắt buộc | Go/No-Go |
|---|---|---|---|
| RC-01 | Freeze code và xác nhận commit/tag release | Commit SHA, clean diff hoặc danh sách thay đổi được duyệt | No-Go nếu build artifact không tái lập. |
| RC-02 | Chụp baseline legacy | User count, legacy readiness hash/count, Attempt count, current active policy/profile pointer | No-Go nếu không có baseline phục hồi. |
| RC-03 | Backup database và test restore | Backup path, SHA-256, restore copy, integrity/foreign-key output | No-Go nếu backup hash hoặc restore check fail. |
| RC-04 | Chạy migration dry-run trên release-candidate copy | Migration inventory, Prisma diff, schema fingerprint | No-Go nếu có destructive SQL ngoài change được duyệt. |
| RC-05 | Apply migration trên release-candidate copy | Migration status, integrity check, application startup | No-Go nếu app cũ không chạy khi V4 flags tắt. |
| RC-06 | Chạy full test/build | Typecheck, Prisma validate, unit, integration, build logs | No-Go nếu bất kỳ test critical hoặc build fail. |
| RC-07 | Xác nhận hai admin active | User IDs nội bộ và capability matrix | No-Go nếu thiếu reviewer/activator độc lập. |

### 11.2 T-2 đến T-1: chuẩn bị dữ liệu shadow

1. Resolve approved assessment run bằng `inputHash`, taxonomy version và artifact manifest; không import lại nếu hash không đổi. Nếu chạy importer, bắt buộc dry-run trước, sau đó mới dùng `--apply --approve --approved-by` với approver khác người chuẩn bị artifact.

2. Build hoặc refresh School Profile V2 chỉ từ official canonical questions. Lưu source hash, source exam IDs, profile version, reliability flags và blueprint count/point totals. Không đưa supplement/private/reference vào School Profile chỉ vì chúng có assessment V4.

3. Tạo candidate policy bằng `Clone Active → Edit Draft`. Validate threshold order, range, evidence exponent, weight mode và formula key. Review policy diff bằng business label, không chỉ diff JSON.

4. Move Draft sang Shadow bằng reviewer khác creator. Không chỉnh sửa trực tiếp profile/policy đã ở Shadow, Active hoặc Retired.

5. Bật `computeEnabled=true`, `shadowEnabled=true`, `readEnabled=false`, `persistLegacyEnabled=true`. Ghi lại flag snapshot trước và sau thay đổi.

### 11.3 T0: shadow backfill và impact review

1. Tạo job shadow với `scopeJson` rõ ràng, policy/profile version IDs và idempotency key. Scope mặc định phải được biểu diễn bằng user count/school set nội bộ, không chứa email hoặc PII thô.

2. Khởi động worker riêng và theo dõi queue depth, lease expiry, processed/success/failed, retry count, checkpoint age, oldest queued age và heartbeat. Khi failure rate vượt ngưỡng vận hành đã duyệt, pause job và điều tra; không tự cutover.

3. Kiểm tra expected pairs: `eligible users × active school profiles`. Mỗi snapshot phải truy ngược được `Attempt set → MasterySnapshot → SchoolProfileVersion → ReadinessPolicyVersion → Job → ReadinessSnapshot`.

4. Chạy Simulator với acceptance fixtures gồm new user, ít evidence, foundation-only, D4–D5, lệch topic, accuracy cao nhưng coverage thấp, coverage cao nhưng mastery thấp và Mika. Lưu JSON/CSV report cùng policy/profile hash.

5. Academic reviewer và Product Owner review: distribution, median/spread, Ready gained/lost, evidence-limited, gate failure frequency, unverified cells, point/count delta, outlier và thay đổi theo trường. Không coi delta là tiến bộ học tập vì cùng input evidence được tính qua hai version.

### 11.4 T+1: activation có kiểm soát

1. Xác nhận candidate policy/profile đã approved, active pointer hiện tại đã backup, shadow job completed và `failedItems=0`.

2. Chụp lại current active pointers và kiểm tra không có assignment duplicate. Activation phải chạy qua Admin action/transaction đã authorize, không sửa DB thủ công.

3. Activator khác reviewer/approver thực hiện activate policy/profile; ghi reason, scope, previous pointer, candidate pointer và timestamp. Snapshot cũ không bị update hoặc xoá.

4. Sau activation, tạo active-backfill job cho phạm vi đã phê duyệt. Activation pointer không đồng nghĩa snapshot toàn bộ user đã sẵn sàng; read cutover chưa được bật chỉ vì activation thành công.

5. Chỉ bật `readEnabled=true` sau khi active-backfill đạt expected pairs và các read route đã smoke test. Nếu chưa có cohort resolver, bước này là global cutover và cần explicit owner approval.

### 11.5 T+1 đến T+7: theo dõi ổn định

| Chu kỳ | Kiểm tra |
|---|---|
| 15 phút đầu | HTTP/error rate, submit flow, worker heartbeat, queue depth, snapshot creation, flag state và active pointers. |
| Mỗi giờ trong ngày đầu | Failure/stale rate, latency p50/p95, distribution status, legacy-v4 delta, invariant violations và support signals. |
| Mỗi ngày trong 7 ngày | Coverage theo school/version, unverified/computing/unavailable, recommendation deep-link lỗi, policy/profile lineage và audit completeness. |
| Cuối rollback window | Product/Academic/Engineering sign-off; quyết định giữ legacy compute/cache hay mở cleanup migration riêng. |

## 12. Impact matrix cho recompute

| Thay đổi | Build profile | Mastery recompute | Readiness recompute | Status-only projection |
|---|:---:|:---:|:---:|:---:|
| Chỉ đổi Ready/Strong Ready threshold | Không | Không | Không bắt buộc raw metrics | Có, nhưng tạo snapshot/projection version mới |
| Đổi overall/advanced/critical gate không đi vào score | Không | Không | Có thể không cần raw recompute | Có |
| Đổi evidence target hoặc evidence exponent | Không | Không | Có | Có |
| Đổi prior strength/mastery | Không | Có | Có | Có |
| Đổi count/point mode khi profile đã lưu cả hai | Không | Không | Có | Có |
| Đổi source exam/profile scope | Có | Không | Có | Có |
| Đổi taxonomy/difficulty/answer-to-cell mapping | Có | Có | Có | Có |
| Đổi grading/partial credit/attempt-source semantics | Có thể có | Có | Có | Có |

Mỗi job phải ghi `sourceVersionJson`, `targetVersionJson`, `policyVersionId`, `profileVersionIdsJson`, `scopeJson` và reason. Không sửa snapshot cũ để “cập nhật” version mới.

## 13. Go/No-Go gates cuối

### Bắt buộc đạt trước activation

- Migration release-candidate additive, backup restore và integrity check đạt.
- Approved assessment coverage đúng scope; `missing=0`, `stale=0`, `conflicts=0`, `invalid=0` hoặc exception đã ký duyệt.
- Mỗi active profile có source hash, taxonomy/methodology version, reliability và audit metadata.
- Policy candidate đã qua Draft → Review → Shadow → Impact Review → Approval.
- Shadow recompute đạt `failedItems=0`, expected pairs khớp và invariant violations bằng 0.
- Không có NaN, readiness ngoài `0..100` hoặc readiness vượt `SchoolMastery × 100`.
- New user/low evidence không bị diễn giải là mastery 50% đã xác minh.
- Readiness UI dùng cùng status/reason/freshness model trên Home, Overview, Results và Library.
- Hai admin khác nhau đã thực hiện review/approve và activation.

### Bắt buộc đạt trước global read cutover

- Active pointer policy/profile đã được xác nhận sau activation.
- Active-backfill completed, `failedItems=0`, expected user × active school snapshot pairs đầy đủ.
- Read adapter chỉ trả snapshot khớp active policy/profile; thiếu snapshot phải `computing/stale/unavailable` hoặc legacy fallback có nhãn theo policy đã duyệt.
- Submit exam không fail khi V4 compute/queue lỗi.
- Authenticated E2E Admin và user representative pass; student/parent/teacher không truy cập admin data.
- Accessibility/mobile/keyboard/manual UX sign-off đạt.
- Monitoring và incident owner đã sẵn sàng; rollback operator đã thực hành.

### No-Go tức thì

Không cutover nếu có invariant violation, policy/profile version không rõ, duplicate active pointer, missing snapshot ngoài exception, failure rate vượt ngưỡng chưa được xử lý, backup không restore được, authenticated E2E fail, hoặc copy user-facing gọi Readiness là xác suất đỗ khi chưa calibration.

## 14. Rollback decision tree

```text
Có lỗi sau activation/read cutover?
  ├─ Chỉ lỗi UI/copy hoặc read flag?
  │    └─ Tắt readinessV4ReadEnabled → kiểm tra legacy → giữ V4 snapshots để điều tra
  ├─ Policy/profile candidate gây delta bất thường?
  │    └─ Tắt read flag → rollback pointer về previous version → tạo recompute đúng scope
  ├─ Worker/backfill lỗi nhưng schema và pointer còn an toàn?
  │    └─ Pause job → sửa/retry hoặc tạo job mới; chưa bật read nếu coverage chưa đủ
  └─ Schema/database corruption?
       └─ Dừng deploy → giữ evidence → restore backup đã verify → restart app/worker → kiểm tra integrity
```

Rollback không xoá snapshot, audit, job hoặc profile/policy history. Sau rollback phải kiểm tra lại active pointer, read adapter, status distribution và tạo job tính lại theo version trước nếu cần. `prisma migrate resolve --rolled-back` không phải thao tác undo dữ liệu; database restore hoặc forward-fix có review là hai hướng riêng.

## 15. Lịch triển khai đề xuất

| Ngày | Hoạt động | Người chịu trách nhiệm |
|---|---|---|
| D-7 | Freeze scope, chốt R1–R30 còn mở, xác nhận owner và rollback window | Product + Engineering |
| D-5 | Backup/restore, migration rehearsal release candidate, schema diff | Release operator |
| D-3 | Assessment/profile/policy shadow preparation, review artifacts | Academic + Admin reviewer |
| D-2 | Shadow recompute toàn bộ, Simulator/impact review, sửa outlier | Engineering + Academic |
| D-1 | Go/No-Go meeting, authenticated E2E, accessibility/mobile smoke | Tất cả owner |
| D0 | Activate pointer, active backfill, quyết định global read cutover | Activator + Product Owner |
| D+1 | Theo dõi hourly, incident triage và rollback readiness | Operations |
| D+7 | Review stability report, quyết định tiếp tục observation | Product + Engineering |
| D+30 | Quyết định legacy retention/cleanup migration riêng | Product Owner |

Các mốc trên là thứ tự kiểm soát, không phải cam kết thời lượng cứng. Không rút ngắn bằng cách gộp migration, activation, recompute và read cutover vào một deploy command.

## 16. Các việc chưa được phép làm trong rollout này

Không tự áp dụng V4 cho Tiếng Anh/Tiếng Việt; không migrate toàn bộ Library/navigation sang 13 analytical topics; không tạo Personalized School Readiness Detail khi chưa có product decision; không bật time factor/recency/cognitive gate khi chưa calibration; không xoá legacy JSON/snapshot/audit; và không gọi Readiness là xác suất đỗ.


## 17. Addendum — UI user là điều kiện bắt buộc trước global read

### 17.1 Trạng thái UI user hiện tại

UI user **đã có một phần V4**, nhưng chưa được xác nhận hoàn tất cho global cutover:

| Màn hình | Trạng thái | Nhận định |
|---|---|---|
| Home | Partial V4 | Đã đọc `getEffectiveReadinessV4`, hiển thị `ReadinessSchoolCard` và analytical mastery V4; vẫn còn legacy fallback/gap advice cần audit và label đầy đủ. |
| Overview | Cần audit/hoàn thiện | Phải dùng shared V4 view model, không tự tạo status hoặc composite đa môn. |
| Results | Cần audit/hoàn thiện | Phải tách điểm bài làm khỏi Readiness snapshot và thể hiện computing/stale. |
| Library | Cần audit/hoàn thiện | Phải giữ crosswalk/reason/band và không deep-link mồ côi. |
| Topics | Partial V4 | Đã hiển thị analytical topics và crosswalk; không tự động migrate toàn bộ content navigation. |
| Admin Dashboard | Legacy + V4 song song | Bucket Mastery cũ phải được gắn nhãn Legacy baseline, không để cạnh V4 status mà không giải thích. |
| Admin Question Bank | Assessment V4 bổ sung trên UI cũ | Cần phân biệt content topic với analytical taxonomy V4. |

### 17.2 Gate trước khi bật `readinessV4ReadEnabled`

Không bật global read flag cho đến khi tất cả điều kiện sau đạt:

1. Home, Overview, Results và Library cùng đọc một `EffectiveReadinessView`/presentation model, không tự parse legacy JSON hoặc tự đặt threshold.
2. Mỗi UI hiển thị đúng bộ ba Mastery/Evidence/Readiness, status, gate/reason, freshness và source.
3. `unverified`, `computing`, `stale`, `unavailable`, `legacy-fallback` và `evidence_limited` có copy và hành vi nhất quán.
4. User không thấy assessment run, source hash, profile ID dài, audit hoặc dữ liệu user khác.
5. Admin Dashboard và Question Bank không còn gây nhầm bucket/content topic legacy với V4 status/taxonomy.
6. Authenticated E2E user workflow đạt: Home → Overview → Results → Library → Topics; Admin workflow đạt: Readiness → Compare → Profile → Simulator → Job Detail.
7. Active-backfill hoàn tất đúng expected `user × active school` pairs; không có failed item hoặc invariant violation chưa được duyệt.
8. Read adapter chỉ trả snapshot đúng active policy/profile version; snapshot thiếu phải có freshness/fallback state được gắn nhãn.
9. Product, Academic, Engineering và Release Operator ký Go/No-Go; rollback owner và flag change record đã sẵn sàng.

### 17.3 Trình tự bật global read

```text
Hoàn thiện UI user
→ chạy authenticated E2E + accessibility/mobile QA
→ chạy shadow comparison cuối
→ hoàn tất active backfill
→ xác nhận active pointers/flag snapshot/monitoring
→ Go/No-Go sign-off
→ bật readinessV4ReadEnabled=true
→ smoke test user/admin
→ theo dõi 15 phút đầu, 24 giờ đầu, 7 ngày
```

Bật `readinessV4ReadEnabled` là một thao tác production có ảnh hưởng toàn bộ user. Nó phải được thực hiện như một change có người phê duyệt và người thực hiện tách biệt; không gộp vào code deploy, migration hoặc policy activation. Nếu hệ thống chưa có cohort resolver, thao tác này phải được ghi nhận là **global cutover**, không gọi là canary.

### 17.4 Rollback ngay sau global read

Nếu có lỗi critical sau khi bật flag, thao tác đầu tiên là đặt `readinessV4ReadEnabled=false` để UI quay về legacy. Không xoá V4 snapshot/audit/job/profile/policy history. Sau đó kiểm tra nguyên nhân, rollback pointer nếu lỗi do version, và tạo recompute đúng scope nếu cần. Chỉ restore database khi có bằng chứng schema/data corruption và backup restore đã được kiểm tra.
