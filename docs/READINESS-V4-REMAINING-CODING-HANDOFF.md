# Readiness V4 — Kế hoạch coding còn lại và tài liệu handoff

**Ngày chốt handoff:** 2026-08-27
**Phạm vi:** Readiness V4 môn Toán, local/dev trước; chưa triển khai production
**Đối tượng nhận:** LLM/engineer tiếp tục triển khai
**Tài liệu nền:**

- `docs/READINESS-V4-MIGRATION-PLAN.md`
- `docs/READINESS-V4-DECISION-LOG.md`
- `docs/READINESS-V4-RUNBOOK.md`
- `.reports/readiness-v4-question-bank-assessment-gpt56sol-20260827.md`
- `.analysis/math-reassessment-fresh-gpt56sol-20260824T120947Z/dashboard-readiness-v2-school-profile.html`

Tài liệu này là backlog coding hợp nhất tại thời điểm handoff. Không thay đổi các
quyết định học thuật đã chốt trong Decision Log.

### Cập nhật triển khai P0 — 2026-08-27

Phần coding P0 đã được triển khai local/dev:

- Có trang Admin so sánh liên trường tại `/admin/readiness/compare`, typed batch
  service, bảng/chart/heatmap/D1–D5/reliability và link hai chiều profile detail.
- Admin Question Bank có KPI/filter/badge/detail Assessment V4 và nút xuất input;
  resolver nhiều approved run deterministic, phát hiện conflict và clone lineage.
- Có exporter deterministic, runner LLM hai pass/multimodal/retry/checkpoint,
  QA selection, importer immutable/idempotent/content-hash guard và recompute
  đúng user từng làm câu liên quan.
- Home, Overview, Results và Library dùng presentation copy chung; Overview
  không còn tự gán status V4 theo threshold hoặc gắn Ready cho composite ba môn.
- `typecheck`, 28 test, `prisma validate` và production build local đạt.

Assessment Question Bank P0 đã hoàn tất tại:

```text
.analysis/math-question-bank-v4-gpt56sol-20260827
```

Artifact có đúng 552 canonical missing, 552 ID unique, không có PII, nhãn
topic/grade legacy hay generated clone; visual missing batch hiện bằng 0. File
reconciliation chứa đúng 30 generated clone có direct assessment cũ.

Đánh giá dùng đúng ChatGPT/Codex `gpt-5.6-sol` và toàn bộ instruction
`INSTRUCTION-TAI-DANH-GIA-TOAN-DA-PHUONG-THUC-v2.0`, cùng runner đã dùng cho
849 câu official. Hai pass chính đạt 552/552. QA judge độc lập chọn 193 câu và
đạt 193/193 cho cả hai pass; kết quả QA thay thế first pass cho đúng tập đã
chọn. Importer dry-run sạch, sau đó import/approve 552/552 và lần chạy lại trả
`unchanged=552`. Coverage DB hiện là `1.487 current / 0 stale / 0 missing / 0
conflict`. Recompute có scope 2 user và đã hoàn tất 2/2, không lỗi.

---

## 1. Kết luận nhanh

### 1.1 Đã có trang so sánh tổng thể School Profile giữa các trường

Hiện tại có hai màn hình gần giống nhưng **không phải** màn hình cần bổ sung:

1. `/overview` là màn hình user, so sánh Readiness cá nhân theo trường và tổng
   hợp ba môn. Nó dùng dữ liệu học sinh, không phải so sánh đặc tính đề trường.
2. `Admin → Readiness V4` có bảng School Profile V2 tóm tắt và link tới trang
   chi tiết từng trường `/admin/readiness/[school]`. Bảng này chưa có heatmap,
   phân bố D1–D5, so sánh topic, bộ lọc hoặc chế độ chọn nhiều trường.

Màn hình Admin riêng đã được triển khai:

```text
/admin/readiness/compare
```

Màn hình này chỉ đọc School Profile V2 active, không đọc dữ liệu user và không
xếp hạng xác suất đỗ. Workstream 1 bên dưới được giữ lại làm specification và
acceptance reference.

### 1.2 Phần đã nghiệm thu

Có thể coi lõi Readiness V4 và School Profile V2 đã nghiệm thu ở local/dev:

- Taxonomy Toán 13 topic và assessment có version.
- Additive Prisma schema/migration cho assessment, profile, policy, assignment,
  mastery/readiness snapshot, recompute job/item, permission và audit.
- Import assessment, build profile, seed policy/permission/crosswalk, worker và
  shadow report.
- Mastery engine, evidence theo cell, readiness engine, gate/status/reason code.
- Active pointer global, activation/rollback four-eyes, feature flags và read
  adapter V4/legacy fallback.
- Readiness V4 đã được tích hợp vào Home, Overview, Results và Library ở mức cơ
  bản; Home hiển thị 13 analytical topics.
- Admin exam detail hiển thị assessment V4 của từng câu.
- Admin Readiness V4 có điều khiển shadow/read, job cơ bản, monitoring cơ bản,
  audit gần nhất và danh sách School Profile V2.
- Trang School Profile chi tiết đã được làm lại theo HTML tham chiếu và đặt đúng
  trong Admin tại `/admin/readiness/[school]`.
- Route School Profile ở user đã bị gỡ; card user quay về Library.
- Bộ kiểm thử hiện có: 28 test Readiness V4; typecheck và production build đạt.

### 1.3 Coverage V4 hiện tại của Question Bank

Đối chiếu read-only trên local DB ngày 2026-08-27, chỉ tính câu Toán active nằm
trong Admin Question Bank, không tính generated clone:

| Nguồn | Tổng câu | Assessment V4 current | Stale | Missing | Coverage |
|---|---:|---:|---:|---:|---:|
| Official | 849 | 849 | 0 | 0 | 100% |
| Private | 107 | 107 | 0 | 0 | 100% |
| Mock/reference | 10 | 10 | 0 | 0 | 100% |
| Supplement | 521 | 521 | 0 | 0 | 100% |
| **Tổng** | **1.487** | **1.487** | **0** | **0** | **100%** |

Kết luận: toàn bộ Question Bank Toán active canonical đã có assessment V4
current. Bộ 552 câu bổ sung dùng run
`math-question-bank-v4-gpt56sol-20260827`; 849 câu official vẫn giữ nguyên
lineage/run official và School Profile source set không thay đổi.

Ngoài phạm vi Question Bank có 30 generated clone đã được assessment trực tiếp;
cả 30 đều có `sourceQuestionId`. Các row này không làm tăng coverage canonical
ở bảng trên. Không xoá chúng vì audit/lineage, nhưng pipeline mới phải đánh giá
canonical source và không tiếp tục tạo assessment trực tiếp cho clone.

### 1.4 Nguyên tắc không được phá vỡ

- Không đưa School Profile admin, assessment run, source hash hoặc profile
  lineage chi tiết sang UI học sinh.
- School Profile chỉ dùng đề `official` canonical.
- Readiness là index, không phải xác suất đỗ.
- Difficulty Index mô tả độ khó profile trường, không cộng trực tiếp vào điểm
  Readiness học sinh.
- Không hiện prior 50% như năng lực thật khi chưa có evidence.
- Không cập nhật phá huỷ snapshot/profile/policy active; luôn tạo version mới.
- Không ghi đè `User.topicMastery`, `User.readiness` hoặc Attempt gốc trong V4.
- Không dùng `prisma db push --accept-data-loss` cho V4.
- Không tự deploy production khi hoàn thành các hạng mục dưới đây.
- Không khôi phục `scripts/generate-official-dashboard.ts`; file này đã được chủ
  dự án yêu cầu loại khỏi luồng build.

---

## 2. Thứ tự triển khai khuyến nghị

Quy ước trạng thái:

- `DONE`: coding, dữ liệu local và kiểm thử trong phạm vi workstream đã đạt.
- `PARTIAL`: đã có một phần backend/UI nhưng chưa đạt toàn bộ acceptance.
- `TODO`: chưa triển khai deliverable chính; code nền không được tính là xong.
- `BLOCKED`: cần quyết định product owner trước khi coding.
- `DEFERRED`: chủ động để sau theo Decision Log.

| Thứ tự | Workstream | Ưu tiên | Trạng thái | Việc còn lại / ghi chú |
|---:|---|---|---|---|
| 1 | Admin School Profile Comparison | P0 | **DONE** | Hoàn tất route, batch service, chart/table/heatmap, navigation và test local |
| 2 | Question Bank Assessment V4 | P0 | **DONE** | 1.487/1.487 current; Sol v2.0; QA/import/recompute hoàn tất |
| 3 | Chuẩn hoá presentation V4 trên các màn hình user | P0 | **DONE** | Home/Overview/Results/Library dùng presentation semantics chung |
| 4 | Admin Policy Management UI | P1 | **TODO** | Backend action có sẵn; cần toàn bộ route/form/diff/audit UI |
| 5 | Simulator và Impact Preview UI | P1 | **TODO** | Service cơ bản có sẵn; chưa có UI/report review tác động |
| 6 | Profile lifecycle và candidate comparison | P1 | **PARTIAL** | Có builder/assignment/activation; thiếu candidate workflow và comparison UI |
| 7 | Recompute Job Detail, monitoring và reconciliation | P1 | **PARTIAL** | Có job list/control cơ bản; thiếu detail, metrics và reconciliation |
| 8 | Personalized School Readiness Detail cho user | P1 | **BLOCKED** | Chờ owner duyệt có tạo route user riêng hay không |
| 9 | Progress/History, freshness và telemetry | P2 | **TODO** | Chưa triển khai history UI/telemetry/i18n keys |
| 10 | Test hardening, security và release readiness | P0 trước release | **PARTIAL** | Unit/typecheck/build và route capability đạt; còn integration/E2E/rehearsal/manual QA |
| 11 | Migration toàn bộ Library/navigation sang 13 topic | Deferred | **DEFERRED** | Chỉ bắt đầu khi đủ ba điều kiện trong Decision Log |

Thứ tự coding tiếp theo: Workstream 4 → 5 → 6 → 7. Workstream 10 chạy xuyên
suốt từng workstream và phải hoàn tất trước production. Workstream 8 không được
tự triển khai khi chưa có quyết định product.

---

## 3. Workstream 1 — Admin School Profile Comparison — DONE

**Trạng thái:** `DONE` ngày 2026-08-27, local/dev; chưa deploy production.
Phần specification bên dưới được giữ làm acceptance reference, không phải việc
cần giao lại. Các integration/accessibility test mở rộng được theo dõi ở
Workstream 10, không làm thay đổi trạng thái hoàn tất coding P0 của màn hình.

### 3.1 Mục tiêu

Cho Admin nhìn toàn bộ đặc tính đề giữa các trường trong một màn hình, trả lời
được:

- Trường nào có Difficulty Index và đuôi D4–D5 cao hơn?
- Áp lực thời gian, số đề, số năm, coverage và confidence khác nhau ra sao?
- Mỗi trường tập trung vào topic nào?
- Hai đến bốn trường được chọn khác nhau ở topic × difficulty band nào?
- Profile nào có reliability thấp và không nên kết luận mạnh?

Không dùng màn hình này để nói trường nào “tốt hơn” hoặc học sinh có khả năng đỗ
cao hơn.

### 3.2 Route và navigation

Tạo:

```text
app/(app)/admin/readiness/compare/page.tsx
components/readiness/SchoolProfileComparison.tsx
components/readiness/SchoolProfileComparison.module.css
lib/readiness-v4/school-profile-comparison-service.ts
```

Thêm entry point:

- Nút **So sánh các trường** trong card `School Profile V2` của
  `app/(app)/admin/ReadinessV4Admin.tsx`.
- Nút **So sánh tổng thể** trong toolbar của
  `components/readiness/SchoolProfileDashboard.tsx`.
- Sidebar vẫn active mục `Readiness V4` khi pathname bắt đầu bằng
  `/admin/readiness`.

### 3.3 Data service

`school-profile-comparison-service.ts` phải:

1. Resolve `SchoolProfileAssignment` active, global, subject `math`.
2. Chỉ lấy đúng `SchoolProfileVersion` mà assignment đang trỏ tới; không chọn
   profile chỉ dựa vào `status` nếu không có pointer.
3. Parse JSON tập trung ở server và trả view model typed; component không tự
   parse DB JSON.
4. Dùng danh mục trường từ `getActiveSchools()` để lấy tên, mã và màu.
5. Trả tối thiểu:

```ts
interface SchoolProfileComparisonRow {
  school: string;
  schoolShort: string;
  schoolName: string;
  color: string;
  profileVersionId: string;
  taxonomyVersion: string;
  methodologyVersion: string;
  examCount: number;
  questionCount: number;
  yearCount: number;
  yearRange: string[];
  difficultyIndex: number;
  averageDifficulty: number;
  advancedShare: number;
  questionsPerMinute: number;
  assessmentCoverage: number;
  assessmentConfidence: number;
  confidence: "high" | "medium" | "low";
  reliabilityFlags: string[];
  difficultyDistribution: Record<"D1" | "D2" | "D3" | "D4" | "D5", number>;
  topicWeights: Record<string, number>;
  topicBandWeights: Record<string, Record<"foundation" | "application" | "advanced", number>>;
}
```

6. Tính các aggregate so sánh ở server bằng hàm thuần, có test; không để JSX
   tự tính percentile/ranking.
7. Không query `User`, `Attempt`, MasterySnapshot hoặc ReadinessSnapshot.

Có thể tái sử dụng parsing/derivation từ
`lib/readiness-v4/school-profile-view-service.ts`, nhưng tránh N+1 query khi tải
11 trường. Ưu tiên tách helper dùng chung hoặc tạo batch loader thay vì gọi
`getActiveSchoolProfileView()` tuần tự 11 lần.

### 3.4 Bố cục UI bắt buộc

1. **Header/giải thích**
   - Tiêu đề “So sánh School Profile V2”.
   - Ghi rõ dữ liệu là đặc tính đề official, không chứa dữ liệu học sinh.
   - Ghi rõ Difficulty Index không phải xác suất đỗ.

2. **KPI toàn hệ thống**
   - Số trường có active profile.
   - Tổng đề, tổng câu, phạm vi năm.
   - Coverage trung bình và số profile có reliability warning.

3. **Bảng tổng hợp sortable**
   - Trường, số đề/năm/câu, Difficulty Index, độ khó TB, D4–D5, câu/phút,
     coverage, confidence, reliability.
   - Click tên trường mở `/admin/readiness/[school]`.
   - Sort mặc định theo Difficulty Index giảm dần; URL giữ sort/filter.

4. **Biểu đồ Difficulty Index**
   - Horizontal bar đã sort.
   - Có đường anchor 50 và text alternative dạng bảng.

5. **Scatter độ khó × áp lực thời gian**
   - Trục X Difficulty Index, trục Y questions/minute.
   - Kích thước điểm theo exam count; tooltip có reliability.
   - Không vẽ trendline mang hàm ý nhân quả.

6. **Heatmap 13 topic × trường**
   - Cell là count/point weight đúng mode đang hiển thị.
   - Có toggle `countWeight`/`pointWeight`; point thiếu phải ghi fallback rõ.
   - Topic dùng label từ `MATH_ANALYTICAL_TOPICS`, không hiện ID thô làm nhãn
     chính.

7. **Phân bố D1–D5 hoặc ba band**
   - Stacked bar theo trường.
   - Legend và table alternative.

8. **Chế độ so sánh chọn lọc**
   - Chọn 2–4 trường.
   - Hiện delta topic và band; luôn ghi chiều của delta.
   - Không tô xanh/đỏ theo “tốt/xấu”; chỉ dùng màu nhận diện trường.

9. **Reliability panel**
   - Nhóm profile theo high/medium/low.
   - Dịch `LOW_EXAM_COUNT`, `SINGLE_YEAR`, `POINT_WEIGHT_UNAVAILABLE` sang copy
     thống nhất.

### 3.5 Tương tác và URL state

Query params đề xuất:

```text
/admin/readiness/compare?schools=cg,ntt,ltv&metric=difficultyIndex&weight=count&sort=desc
```

- Filter/sort/chọn trường phải chia sẻ được bằng URL.
- Default chọn toàn bộ cho bảng, 3 trường đầu cho detailed comparison.
- Không ghi selection vào database.
- Responsive: bảng scroll ngang; heatmap có sticky first column; mobile dùng
  disclosure/card nhưng không mất số liệu.

### 3.6 Test và acceptance

Unit tests mới:

```text
tests/readiness-v4/school-profile-comparison.test.ts
```

Phải test:

- Chỉ active assignment được đưa vào so sánh.
- Không lấy profile retired/shadow khi không được chọn rõ trong Admin preview.
- Sort ổn định khi hai trường cùng metric.
- Aggregate/percent đúng scale 0..1 và 0..100.
- Missing point weight có fallback và reliability flag.
- Tổng D1–D5 và topic weights nằm trong tolerance.
- Không có field user trong view model.

Acceptance:

- Admin mở được comparison từ bảng profile và từ profile detail.
- Có đủ tất cả trường active; click trường quay về đúng profile detail.
- Người đọc phân biệt được độ khó đề, áp lực thời gian và reliability.
- Chart có bảng/text alternative, keyboard focus và tooltip không phải nguồn
  thông tin duy nhất.
- Typecheck, unit test và build đạt.

---

## 4. Workstream 2 — Question Bank Assessment V4 — DONE

**Trạng thái:** `DONE` ngày 2026-08-27. Coverage 1.487/1.487 current; run Sol
đã approve, import idempotent và targeted recompute hoàn tất.
Phần specification bên dưới là audit/reference; không chạy lại model hoặc import
nếu content hash không thay đổi.

### 4.1 Mục tiêu và phạm vi

Đưa toàn bộ câu Toán canonical đang active trong Question Bank về cùng contract
assessment V4:

```text
taxonomyVersion = math-topic-taxonomy-v1
topicPrimary + topicSecondary
difficultyBand = D1..D5
cognitiveLevel
reasoningType
confidence
questionContentHash
approved AssessmentRun
```

Batch P0 gồm 552 câu từng missing: 521 supplement, 21 private và 10
mock/reference. Batch này đã hoàn tất; không đánh giá lại 849 official và 86
private vốn current vì content hash không đổi.

Generated practice/remedial clone không phải canonical bank row và không nên
gọi LLM đánh giá lại từng clone. Nó chỉ được kế thừa assessment từ
`sourceQuestionId` khi content hash assessment-relevant còn tương thích. Clone
không có canonical source hoặc hash khác phải ở trạng thái missing/stale.

### 4.2 Ranh giới với School Profile

- Assessment bank mới dùng cho Student Mastery khi user làm official,
  reference, private hoặc supplement có assessment hợp lệ.
- School Profile V2 vẫn chỉ build từ đề `official` canonical theo R1.
- Tuyệt đối không đưa 521 supplement vào blueprint trường chỉ vì chúng đã được
  đánh giá V4.
- Không dùng `Question.topic`/`grade` legacy làm V4 assessment fallback.

### 4.3 Inventory và exporter

Tạo hoặc tách helper dùng chung:

```text
lib/readiness-v4/assessment-coverage-service.ts
scripts/readiness-v4/export-question-bank-assessment-input.ts
```

Exporter phải:

1. Chỉ lấy câu Toán active canonical trong Admin Question Bank:
   `examId IS NULL OR Exam.generated=false`.
2. Loại câu đã có approved/current assessment cùng taxonomy.
3. Phân loại `official`, `mock`, `private`, `supplement` và giữ source metadata
   chỉ để QA; source label không được dùng để tự gán topic/difficulty.
4. Xuất đầy đủ stem, type, options, answer schema/correct, points và figure
   reference cần thiết cho multimodal assessment.
5. Ghi `questionContentHash`, manifest count, input hash và danh sách ID đã sort
   ổn định.
6. Tách batch deterministic và có schema JSON cho output.
7. Không xuất email, user answer hoặc owner PII; private chỉ giữ internal source
   ID cần thiết.
8. Xuất reconciliation riêng cho 30 generated assessment hiện có: clone →
   canonical source → hash compatibility; không đưa clone vào model-input mới.

Artifact đề xuất:

```text
.analysis/math-question-bank-v4-<timestamp>/
  run-metadata.json
  model-input-manifest.json
  questions.json
  questions-with-figures.json
  schemas/
```

### 4.4 Assessment và QA

- Dùng cùng taxonomy definition, D1–D5 rubric, cognitive/reasoning enum và
  methodology đã dùng cho official set.
- Câu có figure phải được đánh giá với hình; không chỉ đọc alt text nếu hình là
  dữ kiện toán học.
- QA judge bắt buộc cho low confidence, visual question, outlier và sample phân
  tầng theo source/topic/difficulty.
- Kết quả QA thay thế first pass chỉ cho ID được chọn, giữ lineage cả hai pass.
- Chặn unknown topic, difficulty ngoài 1..5, enum không hợp lệ, duplicate ID,
  thiếu assessment hoặc manifest count lệch.
- Không approve run nếu còn `missing`, `invalid` hoặc `conflicts`.

### 4.5 Importer và lifecycle

Ưu tiên mở rộng importer hiện có thay vì tạo logic bất biến thứ hai:

```text
scripts/readiness-v4/import-assessments.ts
```

Nếu tách file mới, parsing/validation/idempotency phải dùng chung module với
importer official.

Yêu cầu:

- Dry-run mặc định; `--apply --approve --approved-by` mới ghi DB.
- Mỗi batch tạo `AssessmentRun` mới, immutable, có artifact path và input hash.
- Unique theo `questionId + taxonomyVersion + sourceRunId`.
- Nếu câu bị sửa sau export, content hash conflict và importer phải dừng; không
  ghi assessment stale.
- Chạy importer lần hai trả toàn bộ `unchanged`, không duplicate.
- Không retire official run hiện tại khi approve bank run; read path được phép
  resolve nhiều approved run cùng taxonomy và chọn assessment current theo hash.
- Giữ 30 generated assessment hiện có để audit, nhưng khi canonical source đã
  được assessment thì resolver/reconciliation phải chứng minh hai lineage không
  mâu thuẫn; không tạo thêm direct generated assessment.
- Cần quy tắc deterministic nếu một question có nhiều approved/current row;
  ưu tiên run được approve mới nhất, nhưng phải cảnh báo nếu nội dung assessment
  khác nhau cho cùng hash/taxonomy.

### 4.6 Admin Question Bank UI

Sửa:

```text
app/(app)/admin/actions.ts
app/(app)/admin/BankPanel.tsx
app/(app)/admin/QuestionDetailModal.tsx
```

Bổ sung:

- KPI coverage V4 tổng và theo source.
- Filter `Current / Stale / Missing / Inherited`.
- Badge trên từng row: taxonomy, topic V4, D1–D5, confidence và trạng thái hash.
- Detail modal hiển thị assessment lineage và lý do stale/missing.
- Nút export missing assessment input; không có nút tự approve một bước.
- Sau khi edit content assessment-relevant, UI phải hiện stale ngay theo hash;
  không update/xoá assessment cũ.

### 4.7 Mastery integration

Review và test `content-mastery-service.ts`/snapshot pipeline:

- Attempt chỉ đóng góp khi tìm được approved/current assessment.
- Kế thừa qua `sourceQuestionId` phải kiểm tra content hash tương thích.
- Essay chỉ đóng góp khi có partial credit hợp lệ theo R15.
- Missing/stale questions được đếm trong coverage diagnostics nhưng không được
  gán ngầm vào legacy topic/band.
- Khi approve bank run mới, tạo `mastery-readiness` recompute job cho user đã
  từng làm các câu vừa được assessment; không nhất thiết recompute user không
  liên quan.
- Job/source hash phải thay đổi và snapshot cũ vẫn được giữ.

### 4.8 Test và acceptance

Thêm tối thiểu:

```text
tests/readiness-v4/assessment-coverage.test.ts
tests/readiness-v4/assessment-resolution.test.ts
tests/readiness-v4/question-bank-import.test.ts
```

Test:

- Inventory đúng source và loại generated clones.
- Current/stale/missing xác định bằng content hash, không chỉ bằng ID.
- Multiple approved run resolve deterministic và phát hiện conflict.
- Clone chỉ inherit khi source/hash hợp lệ.
- Import idempotent, manifest mismatch bị chặn.
- Supplement assessment không đi vào School Profile builder.
- Mastery recompute scope chỉ gồm user bị ảnh hưởng.

Acceptance trước release:

- 100% câu Toán active canonical trong Question Bank là `current`, hoặc có danh
  sách excluded được owner duyệt và reason rõ; mục tiêu mặc định là 1.487/1.487.
- `stale=0`, `conflicts=0`, `invalid=0`.
- Admin nhìn thấy coverage 1.487/1.487 current; filter missing hiện trả 0 câu.
- Approved run mới không làm thay đổi 849 official School Profile source set.
- 30 generated assessment cũ có reconciliation report; số direct generated
  assessment mới bằng 0.
- Shadow recompute/report đạt invariant và không giảm coverage ngoài dự kiến.

---

## 5. Workstream 3 — Chuẩn hoá presentation V4 trên UI user — DONE

**Trạng thái:** `DONE` ngày 2026-08-27, đã qua typecheck/test/build local.
Phần công việc bên dưới đã được triển khai; giữ lại để regression review.

### 5.1 Vấn đề còn lại

`/overview` hiện rút `EffectiveReadinessView` thành số rồi tự phân loại bằng
`statusOf()`, đồng thời tính trung bình Toán/Tiếng Anh/Tiếng Việt thành một
composite. Cách này có thể làm mất gate/status/reason của V4 và tạo semantics
không thống nhất với Home.

Các màn hình Home, Overview, Results và Library cần cùng đọc một presentation
model, không tự đặt threshold hoặc suy diễn trạng thái.

### 5.2 Công việc

1. Giữ nguyên `EffectiveReadinessView` trong `/overview`; không chỉ lấy `score`.
2. Dùng `READINESS_STATUS_COPY`, reason copy và freshness copy chung.
3. Không gọi V4 score là phần trăm xác suất; dùng `/100` hoặc “chỉ số”.
4. Review lại composite ba môn. Nếu chưa có policy đa môn, đổi thành bảng ba
   chỉ số độc lập; không gắn trạng thái Ready cho trung bình tự tạo.
5. Results phải tách điểm bài vừa làm và readiness; khi job chưa xong hiển thị
   “Đang cập nhật”.
6. Library recommendation phải giữ reason/topic/band; deep link thiếu mapping
   phải báo rõ, không fallback sang topic không liên quan.
7. Mọi màn hình phải có trạng thái `unverified`, `computing`, `stale`,
   `unavailable`, `legacy-fallback` nhất quán.
8. Tạo component/copy chung, tránh logic status nằm trong page JSX.

### 5.3 Acceptance

- Cùng một snapshot cho cùng status/reason/score ở Home, Overview, Results và
  Library.
- Score ≥ 75 nhưng fail gate không hiện Ready ở bất kỳ màn hình nào.
- New user không thấy prior 50% hoặc readiness 0 như kết luận năng lực.
- Overview không tạo status V4 bằng threshold hard-code riêng.

---

## 6. Workstream 4 — Admin Policy Management UI — TODO

**Trạng thái:** `TODO`. Backend action/repository là prerequisite đã có, nhưng
deliverable Admin UI bên dưới chưa được triển khai.

Backend đã có `cloneReadinessPolicyDraftAction`,
`updateReadinessPolicyDraftAction` và `moveReadinessPolicyToShadowAction`, nhưng
`ReadinessV4Admin.tsx` chưa expose đầy đủ workflow này.

### Công việc

- Tạo route `/admin/readiness/policies` và trang detail theo policy ID.
- Danh sách version, status, creator, reviewer, activator, effective time.
- `Clone Active to Draft` với version/change summary.
- Form typed cho toàn bộ policy field; chỉ Draft được sửa.
- Validation realtime và validation server bắt buộc.
- Diff Draft vs Active bằng tên nghiệp vụ và thang phần trăm đúng.
- `Submit/Move to Shadow` với reason và four-eyes.
- Xem assignment active/previous, config đầy đủ và audit theo policy.
- Không cho một nút vừa tạo, review và activate.
- Permission UI phải ẩn/disable theo capability; server action vẫn là lớp bảo
  vệ cuối.

### Acceptance

- Active/shadow/retired không sửa được tại chỗ.
- Creator không tự review/activate candidate.
- Mọi thay đổi có diff/reason/actor trong audit.
- Invalid threshold order hoặc scale bị chặn cả client và server.

---

## 7. Workstream 5 — Simulator và Impact Preview — TODO

**Trạng thái:** `TODO`. Simulator service cơ bản đã có; route/UI/report chưa có.

`lib/readiness-v4/simulator-service.ts` đã có comparison cơ bản và activation
dùng nó để chặn invariant violation. Chưa có UI/report đủ để review tác động.

### Công việc

- Tạo `/admin/readiness/simulator`.
- Chọn candidate Draft/Shadow, profile set và scope preview.
- Fixtures bắt buộc: new user, ít evidence, foundation-only, D4–D5, lệch topic.
- So sánh Active vs Candidate:
  - status distribution;
  - Ready mới/mất Ready/evidence-limited;
  - delta percentile/outlier;
  - gate failure theo trường/topic;
  - invariant violations.
- Drill-down giải thích delta do policy field/gate/profile nào.
- Preview không đổi assignment/read flag và không ghi đè snapshot active.
- Cho tải JSON/CSV reconciliation report không chứa email/answer/PII.

### Acceptance

- Preview cùng input cho kết quả deterministic.
- Candidate có invariant violation không activate được.
- Report phân biệt thay đổi policy với tiến bộ học sinh.

---

## 8. Workstream 6 — Profile lifecycle và candidate comparison — PARTIAL

**Trạng thái:** `PARTIAL`. Builder, version/assignment và activation nền đã có;
candidate comparison và lifecycle UI hoàn chỉnh chưa có.

Hiện Admin xem được active profile và activation global được gắn với policy,
nhưng chưa có workflow quản lý profile candidate rõ ràng.

### Công việc

- Nút build/refresh shadow profile từ Admin chỉ enqueue job, không build dài
  trong web request.
- Danh sách version theo từng trường: shadow/active/retired, source hash và
  lineage.
- So sánh candidate vs active:
  - exam/source set thay đổi;
  - topic/band delta;
  - Difficulty Index delta;
  - coverage/confidence/reliability delta.
- Cho review/approve/activate/retire từng trường hoặc batch có scope rõ.
- Activation profile phải tạo readiness recompute scope phù hợp.
- Content/assessment hash thay đổi phải tạo version mới, không update active.

### Acceptance

- Hai active pointers cho cùng school/scope không thể tồn tại.
- Candidate thiếu assessment/coverage bị chặn hoặc cần explicit override đã
  audit theo policy được chốt.
- Rollback trở về previous profile pointer mà không xoá snapshot lịch sử.

---

## 9. Workstream 7 — Recompute Job Detail, monitoring và reconciliation — PARTIAL

**Trạng thái:** `PARTIAL`. Admin đã có danh sách job cùng pause/resume/retry/
cancel cơ bản; phần detail, monitoring và reconciliation vẫn là backlog.

Admin hiện có danh sách 10 job và các nút pause/resume/retry/cancel cơ bản.

### Công việc

- Route `/admin/readiness/jobs/[jobId]`.
- Hiển thị source/target version, scope, checkpoint, processed/success/failed,
  started/completed time và worker lease.
- Danh sách item lỗi đã sanitize; retry một item hoặc toàn bộ lỗi.
- Auto refresh/poll có backoff; không refresh toàn trang vô hạn.
- Reconciliation report: expected pairs vs snapshots sinh ra, duplicate logic,
  missing/stale pairs và status distribution.
- Monitoring: queue depth, oldest queued age, compute latency p50/p95, failure
  rate, stale rate, worker heartbeat.
- Cảnh báo khi failure >5%, worker không chạy hoặc active backfill thiếu.

### Acceptance

- Pause không claim item mới; resume tiếp tục checkpoint.
- Cancel không xoá snapshot đã tạo.
- Retry không tạo duplicate logical result.
- Admin biết chính xác vì sao nút bật read đang disabled.

---

## 10. Workstream 8 — Personalized School Readiness Detail cho user — BLOCKED

**Trạng thái:** `BLOCKED` bởi quyết định product. Không tạo route trước khi owner
xác nhận rõ deliverable user này.

Đây **không phải School Profile Admin**. Route user School Profile đã được gỡ
theo yêu cầu. Nếu tiếp tục deliverable “School readiness detail” trong Migration
Plan, phải tạo một view riêng chỉ giải thích kết quả của user.

### Ranh giới bắt buộc

- Không tái sử dụng `SchoolProfileDashboard`.
- Không hiện assessment run, source hash, profile version ID dài, audit hoặc
  bảng lịch sử đề canonical.
- Chỉ user hiện tại xem breakdown của chính mình.
- Có thể mô tả yêu cầu trường ở mức rút gọn để giải thích readiness, nhưng không
  biến thành màn hình quản trị.

### Nội dung đề xuất

- Trạng thái, Readiness `/100`, School Mastery, Evidence, freshness.
- Gate đạt/chưa đạt bằng copy dễ hiểu.
- 13 topic × band: phân biệt unverified, evidence thấp và weakness đã xác nhận.
- 1–3 recommendation có reason và deep link đúng crosswalk.
- “Cách tính” dễ hiểu; không gọi là tỷ lệ đỗ.

### Quyết định route

Chỉ tạo lại `/readiness/[school]` sau khi product owner xác nhận view này. Việc
tạo route không đồng nghĩa đưa School Profile Admin về user.

---

## 11. Workstream 9 — Progress/History, freshness và telemetry — TODO

**Trạng thái:** `TODO`.

### Công việc

- Lịch sử Readiness/Mastery/Evidence theo cùng methodology version.
- Marker khi policy/profile/methodology thay đổi; không nối delta khác semantics
  thành tiến bộ/hụt lùi.
- Audit freshness logic dựa trên attempt source hash, không chỉ timestamp gần
  nhất nếu cần độ chính xác cao hơn.
- Telemetry tối thiểu: card viewed, explanation opened, gate viewed,
  recommendation clicked, stale/error shown.
- Không gửi answer content, email hoặc PII không cần thiết.
- Chuẩn bị i18n keys cho copy V4 thay vì để logic chứa tiếng Việt.

---

## 12. Workstream 10 — Test hardening, security và release readiness — PARTIAL

**Trạng thái:** `PARTIAL`. Đã đạt typecheck, Prisma validate, 28/28 test,
production build local, import idempotency và capability guard cho Admin
Readiness. Chưa đạt toàn bộ integration/E2E, migration rehearsal, backup/restore
và manual accessibility/mobile QA.

### 12.1 Test cần bổ sung

Hiện test chủ yếu là engine/profile/recommendation unit test. Cần thêm:

- [ ] Integration test policy draft → shadow → activate → rollback.
- [ ] Permission test cho view/edit/review/activate/recompute.
- [ ] Four-eyes test: creator khác reviewer/activator.
- [ ] Active pointer uniqueness và transaction rollback.
- [ ] Worker lease expiry, retry, auto-pause >5%, cancel và idempotency.
- [ ] Submit exam không fail khi enqueue V4 lỗi.
- [ ] Read adapter exact active version; không lấy snapshot version khác.
- [ ] UI integration cho unverified/stale/computing/legacy fallback.
- [ ] Subject isolation: V4 Toán không ảnh hưởng Anh/Việt.
- [ ] Accessibility test cho bảng/chart comparison.
- [ ] E2E Admin: Readiness V4 → comparison → profile detail → quay lại.

Đã đạt ở vòng P0: 28/28 unit test hiện có, bao gồm engine, profile, importer,
assessment resolver/coverage, presentation và comparison derivation.

### 12.2 Security/data

- [x] Mọi route `/admin/readiness/**` hiện kiểm tra admin và capability phù hợp.
- [x] Server action readiness authorize độc lập với trạng thái disable ở client.
- [x] Assessment artifact/reconciliation P0 không chứa user PII.
- [x] Query params comparison được whitelist/normalize ở server.
- [ ] Policy form input validation hoàn chỉnh sau khi Workstream 4 có UI.
- [ ] Escape/sanitize toàn bộ error của job detail trước khi render Admin.

### 12.3 Release readiness, chưa deploy

- [x] `npx prisma validate` đạt ngày 2026-08-27.
- [ ] Chạy migration trên bản sao DB và kiểm tra additive diff ở release candidate.
- [ ] Backup/restore rehearsal và `PRAGMA integrity_check` ở release candidate.
- [x] Import idempotency: lần hai `unchanged=552`, candidates=0.
- [ ] Chạy lại shadow report cuối sau khi Workstream 4–7 hoàn tất; yêu cầu không
  có invariant violation.
- [ ] Xác nhận worker backfill đủ expected user × active school ở release candidate.
- [ ] Manual QA desktop/mobile và keyboard.
- [x] Runbook đã cập nhật cho Sol assessment/import hiện tại; tiếp tục cập nhật
  sau khi UI/job workflow ổn định.
- [x] Chưa deploy production; chỉ deploy khi owner ra lệnh riêng.

---

## 13. Migration Library/navigation sang 13 topic — DEFERRED

**Trạng thái:** `DEFERRED` theo Decision Log.

Student Mastery đã hiển thị 13 analytical topics; Library/content vẫn dùng
taxonomy nội dung hiện có qua crosswalk. Không tự chuyển navigation/bank sang 13
topic trong các workstream trên.

Chỉ bắt đầu migration riêng khi đủ ba điều kiện:

1. 100% analytical topic có content mapping được review, không có deep link mồ
   côi.
2. Content và reporting có acceptance test cho từng topic mới.
3. Product owner duyệt tác động URL, lịch sử user, dashboard và rollback.

Khi được duyệt, phải có tài liệu migration riêng cho URL compatibility, content
backfill, analytics dimension, historical mapping và rollback.

---

## 14. File map cho LLM tiếp theo

### Nguồn hiện có nên đọc trước

```text
docs/READINESS-V4-MIGRATION-PLAN.md
docs/READINESS-V4-DECISION-LOG.md
docs/READINESS-V4-RUNBOOK.md
prisma/schema.prisma
lib/readiness-v4/
scripts/readiness-v4/
tests/readiness-v4/
app/(app)/admin/readiness-v4-actions.ts
app/(app)/admin/ReadinessV4Admin.tsx
app/(app)/admin/readiness/[school]/page.tsx
components/readiness/SchoolProfileDashboard.tsx
lib/readiness-v4/school-profile-view-service.ts
```

### File Workstream 1 đã thêm — DONE

```text
app/(app)/admin/readiness/compare/page.tsx
components/readiness/SchoolProfileComparison.tsx
components/readiness/SchoolProfileComparison.module.css
lib/readiness-v4/school-profile-comparison-service.ts
tests/readiness-v4/school-profile-comparison.test.ts
```

### File Workstream 1 đã sửa — DONE

```text
app/(app)/admin/ReadinessV4Admin.tsx
components/readiness/SchoolProfileDashboard.tsx
components/Sidebar.tsx                         # chỉ nếu active-route chưa bao phủ
```

### File Workstream 2 đã thêm/sửa — DONE

```text
lib/readiness-v4/assessment-coverage-service.ts
scripts/readiness-v4/export-question-bank-assessment-input.ts
scripts/readiness-v4/import-assessments.ts
lib/readiness-v4/snapshot-service.ts
app/(app)/admin/actions.ts
app/(app)/admin/BankPanel.tsx
app/(app)/admin/QuestionDetailModal.tsx
tests/readiness-v4/assessment-coverage.test.ts
tests/readiness-v4/assessment-resolution.test.ts
tests/readiness-v4/question-bank-import.test.ts
```

Không reset worktree và không xoá thay đổi không liên quan; repository đang có
nhiều thay đổi V4 chưa gom thành commit riêng.

---

## 15. Quy trình thực hiện cho mỗi workstream

1. Đọc Decision Log và phần liên quan trong Migration Plan.
2. Kiểm tra `git status --short`; bảo toàn thay đổi hiện có.
3. Viết view model/service server trước, không query DB trực tiếp rải trong
   client component.
4. Viết unit test cho derivation/permission/edge case.
5. Làm UI với loading/empty/error/accessibility state.
6. Chạy kiểm thử:

   ```bash
   npm run typecheck
   npm run test:readiness-v4
   npm test
   npm run build
   ```

7. Với schema change, chạy thêm:

   ```bash
   npx prisma validate
   npx prisma migrate diff ...
   ```

8. Start local service và manual QA route liên quan.
9. Cập nhật tài liệu này: đánh dấu Done, ghi file đã sửa, test evidence và phần
   còn lại.
10. Không deploy production nếu không có yêu cầu riêng.

---

## 16. Definition of Done tổng thể

Phần coding còn lại được coi là hoàn tất khi:

- [x] Admin có comparison liên trường đầy đủ, không chứa dữ liệu user.
- [x] Question Bank Toán active có assessment V4 current; Admin theo dõi được
  current/stale/missing/inherited.
- [ ] Admin quản lý được policy lifecycle, simulator, profile candidate và job
  detail bằng UI có permission/audit.
- [x] Home, Overview, Results và Library dùng cùng semantics V4.
- [ ] Nếu được duyệt, personalized readiness detail được tách hoàn toàn khỏi
  School Profile Admin; nếu owner từ chối thì ghi quyết định và đóng hạng mục.
- [ ] Monitoring/reconciliation đủ để giải thích missing/stale/failure và trạng
  thái nút read.
- [ ] Integration/security/E2E tests đạt; accessibility được kiểm tra.
- [ ] Migration rehearsal, backup/restore và Runbook đạt điều kiện release.
- [x] Không có production deployment tự động hoặc destructive cleanup ngoài
  quyết định riêng.

---

## 17. Hai việc nên giao đầu tiên cho LLM tiếp theo

Workstream 1–3 đã `DONE`; không giao lại hoặc chạy lại assessment 1.487 câu nếu
content hash không đổi.

### 17.1 Admin Policy Management UI — TODO

Triển khai toàn bộ Workstream 4, bắt đầu từ route
`/admin/readiness/policies`. Tái sử dụng action/repository hiện có; bổ sung
permission, draft-only editing, diff, audit và four-eyes. Không activate hoặc
deploy production trong cùng task.

### 17.2 Simulator và Impact Preview — TODO

Triển khai Workstream 5 tại `/admin/readiness/simulator` trên simulator service
hiện có. Preview phải read-only, deterministic, không đổi pointer/read flag,
không ghi đè snapshot active và export không chứa PII.
