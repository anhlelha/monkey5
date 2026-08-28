# Readiness V4 — UI Migration Plan

## 1. Vấn đề cần xử lý

Rollout V4 không hoàn tất nếu chỉ thêm các route Admin mới như Policy, Simulator, Profile và Job Detail. Các màn hình đang tồn tại vẫn có thể hiển thị số liệu hoặc vocabulary legacy, khiến người dùng nhìn thấy hai hệ thống semantics khác nhau.

Ảnh chụp hiện tại cho thấy ít nhất hai vùng cần migrate:

| Khu vực | Route/component hiện tại | Dấu hiệu legacy | Việc cần làm |
|---|---|---|---|
| Admin Dashboard | `/admin?tab=overview`, `app/(app)/admin/MasteryOverviewCard.tsx` | KPI `Mastery TB`, bucket `Yếu <25% / Trung bình / Khá / Giỏi`, threshold hard-code 25/50/75; dữ liệu từ `getMasteryStats()` | Tách rõ Admin operational KPIs với V4 Mastery/Evidence/Readiness; không để bucket legacy trông như V4 status. |
| Admin Question Bank | `/admin?tab=bank`, `app/(app)/admin/BankPanel.tsx` | Bộ lọc/chuyên đề vẫn hiển thị content topic cũ; V4 assessment mới nằm ở badge/cột riêng | Giữ content topic nếu phục vụ kho câu hỏi, nhưng thêm filter/label V4 taxonomy riêng và giải thích rõ hai hệ thống không đồng nhất. |
| Admin Readiness | `/admin?tab=readiness`, `ReadinessV4Admin`, `ReadinessPanel` | V4 control và bảng legacy readiness cùng xuất hiện nhưng ranh giới có thể chưa đủ rõ | Đặt V4 làm control plane chính; legacy chỉ là baseline/comparison, luôn có label `Legacy`. |
| User Home | `/home`, `app/(app)/home/page.tsx` | Đã đọc V4 ở nhiều phần nhưng còn fallback gap advice legacy khi chưa có snapshot V4; activity chart vẫn dùng score bài làm | Tách rõ Readiness theo trường, Mastery, Evidence và điểm bài làm; fallback phải có freshness/source label. |
| User Overview | `/overview` | Có nguy cơ dùng score/threshold riêng hoặc composite nhiều môn | Chỉ render shared `EffectiveReadinessView`; không tự phân loại status và không tạo composite V4 nếu chưa có policy đa môn. |
| User Results | `/results` và exam result pages | Điểm bài vừa làm có thể bị hiểu là Readiness | Hiển thị hai card tách biệt: Exam result và Readiness snapshot; trạng thái `computing/stale` phải rõ. |
| User Library | `/library`, `LibraryView` | Recommendation/crosswalk có thể còn dùng content topic legacy mà thiếu lý do V4 | Giữ navigation content hiện tại theo Decision Log; bổ sung reason/topic/band mapping và trạng thái không có mapping. |
| User Topics | `/topics`, `/topics/[id]` | Đã có 13 analytical topics nhưng route luyện vẫn qua content topic | Giữ crosswalk versioned; hiển thị tên analytical topic và content target rõ ràng, không tự migrate toàn bộ navigation. |

## 2. Nguyên tắc triển khai

1. Mọi màn hình user phải đọc qua một shared V4 presentation model, không tự parse `User.readiness`, `User.topicMastery` hoặc tự đặt threshold.
2. Mọi giá trị phải phân biệt rõ `Mastery`, `Evidence`, `Readiness`, điểm bài làm và Difficulty Index. Không dùng một progress bar để đại diện cho nhiều semantics.
3. Readiness phải hiển thị thang `/100`, status, gate/reason, freshness và nguồn `Readiness V4` hoặc `Legacy fallback`.
4. `unverified` không được hiển thị như 50% năng lực đã xác minh. `evidence_limited` không được hiển thị là `Ready` dù score đạt ngưỡng.
5. Admin có thể xem profile/policy/source/audit; user không được nhìn thấy assessment run, source hash, profile ID dài hoặc audit metadata.
6. Chưa migrate toàn bộ Library/navigation/content bank sang 13 topic. Đây là migration riêng, vẫn deferred theo Decision Log.

## 3. Các workstream cần bổ sung vào rollout

### UI-00 — Inventory và legacy-to-V4 mapping

Tạo bảng mapping cho từng KPI, label, màu, threshold, data query và action. Mỗi dòng phải có owner, source hiện tại, source V4, trạng thái fallback và test case.

Các pattern cần tìm và loại bỏ khỏi UI production gồm `25/50/70/75` hard-code dùng để gán trạng thái, `Mastery TB` dùng như Readiness, `user.readiness` đọc trực tiếp, `user.topicMastery` dùng như V4, và copy gọi Readiness là tỷ lệ/xác suất đỗ.

**Acceptance:** không còn màn hình V4 nào tự gọi `statusOf()` hoặc tự phân loại Ready từ một số score không kèm gate/policy.

### UI-01 — Shared view model và vocabulary

Mở rộng `lib/readiness-v4/read-service.ts` và `lib/readiness-v4/presentation.ts` thành contract dùng chung cho:

```text
score, scoreScale, schoolMastery, evidence, advancedEvidence,
status, gates, reasonCodes, criticalGaps,
policyVersion, profileVersion, computedAt,
freshnessState, source, displayLabel, explanation
```

Bổ sung component dùng chung cho:

- Readiness card theo trường;
- Mastery/Evidence/Readiness trio;
- status badge và reason/gate list;
- freshness banner;
- legacy fallback notice;
- empty/unverified/computing/stale/unavailable states.

**Acceptance:** cùng một snapshot cho cùng user/school hiển thị cùng status, reason, freshness và score ở Home, Overview, Results và Library.

### UI-02 — Migrate Admin Dashboard

Refactor `getMasteryStats()`/`MasteryOverviewCard` để dashboard không làm người xem nhầm bucket legacy với V4.

Bố cục đề xuất:

| Card | Nội dung |
|---|---|
| V4 coverage | Số user có snapshot current, stale, computing, unavailable; tỷ lệ theo active policy/profile. |
| Readiness distribution | `unverified`, `preparing`, `near_ready`, `evidence_limited`, `ready`, `strong_ready`; status phải đến từ snapshot/gate. |
| Mastery/Evidence | Hai KPI riêng, có denominator và freshness; không gọi chung là `Mastery TB`. |
| Legacy comparison | Bucket 25/50/75 chỉ giữ trong panel `Legacy baseline`, có label và không dùng làm V4 decision. |
| School overview | Phân bố theo school/profile version, coverage, reliability và invariant count. |
| Operations | Queue depth, oldest job, failed item, stale snapshot, worker heartbeat. |

Không xoá ngay KPI cũ nếu còn cần đối chiếu rollback; chuyển chúng vào khu vực baseline rõ ràng và không để màu xanh/đỏ truyền đạt V4 status.

**Acceptance:** Admin nhìn thấy rõ đâu là V4, đâu là legacy; không có bucket legacy nào được gọi là `Ready`.

### UI-03 — Migrate Admin Question Bank

`BankPanel` cần tách hai khái niệm:

1. **Content topic:** topic dùng để tổ chức kho nội dung/luyện tập hiện tại.
2. **Assessment V4 taxonomy:** `taxonomyVersion`, analytical topic, D1–D5, cognitive/reasoning, confidence và content hash.

Bổ sung:

- KPI `current/stale/missing/conflict` theo assessment V4;
- filter `Assessment V4 status`, `taxonomy version`, `D1–D5`, `confidence`, `source`;
- cột content topic và analytical topic riêng;
- detail lineage: canonical question, source run, hash, inherited clone nếu có;
- cảnh báo khi content edit làm assessment stale;
- không đưa supplement/private/reference vào School Profile source set;
- label rõ generated clone không làm tăng canonical coverage.

**Acceptance:** Admin không thể hiểu content topic cũ là analytical topic V4 chỉ vì cả hai cùng xuất hiện trong bảng.

### UI-04 — Migrate Admin Readiness surfaces

Trên `/admin?tab=readiness` và các route mới:

- Header phải nêu rõ `Readiness V4 · Math · current policy/profile version`;
- Control shadow/read/activate/rollback phải có precondition hiển thị ngay tại UI;
- Disable reason phải cụ thể: shadow chưa completed, invariant violation, snapshot thiếu, thiếu four-eyes, worker lỗi;
- `ReadinessPanel` legacy chỉ nằm trong khu vực comparison/baseline;
- Policy, Profile, Simulator, Job Detail và Compare phải có navigation hai chiều;
- mọi action mutation phải giữ reason, actor, version và audit link.

### UI-05 — Migrate Home, Overview, Results và Library

#### Home

`ReadinessSchoolCard` phải hiển thị status/gate/freshness/source; không chỉ hiển thị một số `r`. Gap advice phải dùng V4 critical gap/topic impact khi có V4 snapshot; chỉ dùng legacy advice khi hiển thị explicit `Legacy fallback`.

#### Overview

Không tính composite ba môn bằng cách lấy trung bình readiness Toán/Anh/Việt nếu chưa có multi-subject policy. Hiển thị từng môn độc lập hoặc gắn nhãn `Chưa có policy V4 cho môn này`.

#### Results

Tách điểm bài thi vừa nộp khỏi readiness theo trường. Khi V4 snapshot đang queue, dùng `Đang cập nhật`; khi snapshot stale, hiển thị timestamp và nguồn; không biến điểm bài thành Readiness.

#### Library

Recommendation phải giữ reason, analytical topic, content topic crosswalk và band. Deep link không có mapping phải hiện `Chưa có nội dung phù hợp`, không link ngầm sang topic khác.

**Acceptance:** user không thể nhầm điểm bài vừa làm, Mastery theo trường, Evidence và Readiness là cùng một chỉ số.

### UI-06 — States, accessibility và responsive

Bắt buộc có snapshot/visual test cho `unverified`, `computing`, `stale`, `unavailable`, `legacy-fallback`, `preparing`, `near_ready`, `evidence_limited`, `ready` và `strong_ready`.

Kiểm tra keyboard focus, screen reader label, chart text alternative, contrast, mobile table overflow, long gate/reason copy và button disabled reason. Không để tooltip là nguồn thông tin duy nhất.

### UI-07 — Test và cutover gate

Bổ sung:

| Test | Mục tiêu |
|---|---|
| Shared presentation unit tests | Cùng input → cùng status/reason/freshness/copy. |
| Admin dashboard integration | Legacy baseline và V4 distribution không trộn semantics. |
| Question Bank integration | Content topic/V4 taxonomy/hash status hiển thị đúng. |
| User route integration | Home/Overview/Results/Library đọc cùng snapshot exact version. |
| Permission tests | Admin metadata không lộ cho user; user không truy cập Admin routes. |
| E2E | Admin Readiness → Compare → Profile → Simulator → Job Detail; user Home → Overview → Results → Library. |
| Accessibility | Keyboard, labels, focus, contrast và text alternative. |

## 4. Thứ tự triển khai thực tế

```text
UI-00 inventory
→ UI-01 shared view model/copy
→ UI-02 Admin Dashboard
→ UI-03 Question Bank
→ UI-04 Admin Readiness surfaces
→ UI-05 Home/Overview/Results/Library
→ UI-06 accessibility/responsive
→ UI-07 integration/E2E
→ shadow read review
→ canary hoặc explicit global-read decision
→ production cutover
```

Không bật `readinessV4ReadEnabled` toàn cục trước khi UI-05 và UI-07 hoàn tất. Nếu hệ thống chưa có cohort resolver, phải coi đây là global cutover và cần Product Owner xác nhận rủi ro; không gọi đó là canary.

## 5. Definition of Done cho UI rollout

- Admin Dashboard phân biệt V4 distribution với legacy baseline.
- Question Bank phân biệt content topic với assessment V4 taxonomy.
- Home, Overview, Results và Library dùng shared V4 presentation model.
- Không màn hình nào tự đặt threshold hoặc gọi điểm là xác suất đỗ.
- Readiness score luôn đi cùng Mastery, Evidence, status, gate/reason, freshness và source.
- Missing/stale/computing không âm thầm lấy snapshot version khác.
- Profile/policy/source/audit chỉ xuất hiện trong Admin có capability.
- Recommendation deep link có mapping hợp lệ hoặc hiển thị missing mapping.
- Authenticated E2E và accessibility/mobile QA đạt.
- UI migration được đưa vào Go/No-Go checklist trước global read cutover.


## 6.1 Implementation update

Các phần sau đã được triển khai trong local project:

| Khu vực | Thay đổi |
|---|---|
| Shared user summary | Thêm `components/readiness/ReadinessUserSummary.tsx`; dùng `EffectiveReadinessView` và shared presentation để hiển thị score, status, Mastery, Evidence, source và freshness. |
| Home/readiness card | `ReadinessSchoolCard` luôn hiển thị `Readiness V4` hoặc `Hệ cũ (fallback)` cùng freshness, thay vì chỉ hiển thị score. |
| Topics | `/topics` ưu tiên 13 analytical topics khi có V4 snapshot; không còn hiển thị prior 50% như mastery đã xác minh; nút luyện dùng content crosswalk. |
| Overview | Bổ sung Readiness V4 theo trường; bảng ba môn đổi thành `Chỉ số tham khảo`, không dùng composite để gán status. |
| Results | Bổ sung Readiness theo trường tách biệt khỏi điểm bài làm; sử dụng cùng school card/presentation model. |
| Admin Dashboard | Thêm V4 operational overview card: snapshot count, active/shadow/retired profiles, status distribution, queue và flags; legacy mastery card được gắn nhãn baseline. |
| Question Bank | Đổi nhãn để phân biệt `content topic` với `Assessment V4 · taxonomy phân tích`; cột Assessment V4 giữ topic/D1–D5/confidence. |
| Global read gate | Thêm `npm run readiness:v4:check-read-gates`; kiểm tra pointer, job, active-backfill, unique user×profile snapshot coverage và invariant. |

### Verification hiện tại

`npm run typecheck`, `npm run test:readiness-v4`, `npm test`, `npm run build`, `git diff --check` và `npm run readiness:v4:check-read-gates` đã chạy đạt. Global gate hiện ghi nhận `readEnabled=true`, `132/132 unique user×profile pairs` và `0 invariant violations`; đây là trạng thái local DB hiện tại, không phải bằng chứng production đã deploy.

Các route protected khi chưa có cookie trả `307 → /signin` đúng auth guard; authenticated E2E vẫn cần chạy trong môi trường có admin/user session trước khi coi UI rollout là hoàn tất.
