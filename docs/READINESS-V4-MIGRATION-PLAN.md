# Readiness v4 — Thiết kế chuẩn và kế hoạch migration

**Trạng thái:** Draft for review — chưa triển khai production
**Phạm vi:** Môn Toán, readiness theo trường
**Ngày cập nhật:** 2026-08-25
**Tài liệu nền:** [READINESS-REDESIGN.md](./READINESS-REDESIGN.md)
**Artifact tham chiếu:** `.analysis/math-reassessment-fresh-gpt56sol-20260824T120947Z/`
**Bổ sung trong lần review này:** quản trị policy có phiên bản, simulator, recompute jobs, phân quyền, audit, rollback và tác động đầy đủ tới dữ liệu/UX của user.

---

## 1. Mục tiêu và nguyên tắc

Tài liệu này thay thế vai trò “thiết kế đích” của phần readiness Toán, nhưng **không xoá lịch sử quyết định** trong `READINESS-REDESIGN.md`.

Mục tiêu của Readiness v4:

1. Profile trường phản ánh đúng trường hỏi **chuyên đề gì, ở dải khó nào và với cấu trúc ra sao**.
2. Mastery phản ánh năng lực học sinh theo từng ô `chuyên đề × dải độ khó`.
3. Readiness không được cao hơn năng lực đã chứng minh:

   ```text
   Readiness / 100 ≤ School Mastery
   ```

4. Phần chưa học, chưa làm hoặc chưa đủ mẫu không được coi là đã đạt 50%; phải hiển thị là **chưa kiểm chứng** và làm giảm evidence.
5. Không cộng hai lần cùng một kết quả qua topic mastery và cognitive mastery.
6. Mọi profile, snapshot và kết quả phải có phiên bản, nguồn dữ liệu và khả năng tính lại.
7. Migration là additive, chạy shadow trước, không ghi đè dữ liệu readiness hiện hành cho đến khi qua review gate.
8. Các ngưỡng và hệ số được quản trị bằng policy có phiên bản; không sửa trực tiếp policy đang active và không để hằng số nghiệp vụ rải trong code/UI.
9. Mọi lần tính lại phải tạo snapshot mới, truy vết được nguyên nhân và có thể quay về version trước; dữ liệu Attempt gốc không bị thay đổi.

### Ngoài phạm vi vòng đầu

- Không tuyên bố Readiness là xác suất đỗ cho đến khi có calibration bằng kết quả thi thử hoặc kết quả thực tế.
- Chưa dùng tốc độ làm bài để tăng điểm. Time pressure chỉ là đặc tính trường cho đến khi có dữ liệu timed attempt đủ tin cậy.
- Chưa tự động xoá các field JSON cũ trên `User`.
- Chưa áp dụng v4 cho Tiếng Anh và Tiếng Việt; hai môn này chỉ được xem xét sau khi Toán ổn định.

---

## 2. Hiện trạng production và khoảng cách cần xử lý

### 2.1 Hiện trạng code

Production hiện dùng:

```text
readiness
= 50
+ weighted topic deviation × ALPHA(80)
+ weighted level deviation × BETA(60)
− difficulty deviation × DIFF_K(1.0)
```

Các điểm chính:

- `lib/mastery.ts` tính topic mastery bằng Beta smoothing, prior `K=4`, sau đó gộp theo các dải hiện hành.
- `lib/readiness.ts` cộng topic term và level term từ cùng tập Attempt.
- `lib/school-profiles.ts` tạo profile từ `Question.topic`, `Question.grade`, loại câu hỏi, thời lượng và các hệ số cũ.
- `SchoolProfile` có primary key `(school, subject)` và không lưu lịch sử phiên bản.
- `User.topicMastery` và `User.readiness` là JSON string, không lưu công thức hoặc profile version đã dùng.
- `sourceHash` hiện chỉ dựa trên số câu và `latestCreatedAt`; sửa nội dung/tag/độ khó mà không đổi timestamp tạo có thể không làm hash thay đổi.
- Deploy hiện dùng `prisma db push`; `scripts/setup-remote.sh` còn gọi `--accept-data-loss`. Migration v4 không được dựa vào cơ chế chấp nhận mất dữ liệu tự động này mà chưa backup, diff và thử trên bản sao DB.

### 2.2 Khoảng cách so với v4

| Vấn đề hiện tại | Ảnh hưởng | Thiết kế v4 |
|---|---|---|
| Topic và level/cognitive cùng được cộng điểm | Có thể đếm năng lực hai lần | Cognitive chỉ chẩn đoán/gate, không cộng điểm lần hai |
| Difficulty có thể cộng điểm cho trường dễ | Readiness có thể vượt mastery | Difficulty Index chỉ mô tả profile trong vòng đầu |
| Profile chỉ có topic và level riêng rẽ | Không biết một topic nằm ở dải khó nào | Blueprint hai chiều `topic × difficultyBand` |
| Dải chưa làm nhận prior 50% | Dễ bị hiểu là đã biết 50% | UI ghi “chưa kiểm chứng”; evidence bằng 0 |
| Evidence chỉ theo dải tổng | Làm nhiều một mảng có thể che mảng khác | Evidence theo từng ô blueprint |
| `User.readiness` không version | Không truy được công thức đã dùng | Snapshot versioned, immutable theo lần compute |
| Profile bị update tại chỗ | Không rollback/đối chiếu được | Profile version mới, có trạng thái draft/shadow/active |

---

## 3. Mô hình khái niệm ba lớp

### 3.1 School Profile — trường yêu cầu gì

School Profile không chứa dữ liệu riêng của học sinh. Nó gồm:

1. Blueprint `topic × difficultyBand`.
2. Topic weights và difficulty-band weights suy ra từ blueprint.
3. Cognitive distribution để chẩn đoán và đặt gate nếu cần.
4. Cấu trúc điểm và hình thức câu hỏi.
5. Difficulty Index v2 cùng các thành phần base/tail/time.
6. Thông tin độ phủ: số đề, số câu, số năm, độ ổn định qua năm.
7. Taxonomy version, assessment model, source run và content hash.
8. Calibration metadata khi có dữ liệu thi thử/kết quả thực tế.

### 3.2 Student Mastery — học sinh hiện làm được gì

Student Mastery gồm:

- Số đúng/sai/tổng theo từng `topic × difficultyBand`.
- Mastery estimate và evidence của từng ô.
- Topic summary phục vụ UI.
- Cognitive summary phục vụ chẩn đoán.
- Danh sách ô chưa kiểm chứng và điểm yếu đã xác nhận.
- Attempt/source hash để biết snapshot có stale hay không.

### 3.3 Readiness Policy — thế nào được gọi là sẵn sàng

Readiness Policy là cấu hình có phiên bản, không nhúng cứng vào School Profile:

- Prior strength và prior mastery.
- Evidence target.
- Ngưỡng Ready/Strong Ready.
- Evidence gate tổng.
- Advanced evidence gate.
- Quy tắc chuyên đề trọng yếu.
- Công thức trạng thái và lý do gate chưa đạt.

Việc tách ba lớp cho phép thay đổi policy mà không phải đánh giá lại câu hỏi hoặc sửa profile gốc.

Policy có vòng đời bất biến:

```text
Draft → Shadow → Active → Retired
```

- `Draft`: được chỉnh sửa và chạy mô phỏng, chưa ảnh hưởng kết quả đang dùng.
- `Shadow`: cấu hình đã khóa để tính song song trên dữ liệu thật, nhưng chưa hiển thị cho học sinh/phụ huynh.
- `Active`: version đã được phê duyệt và đang được ít nhất một assignment/pointer sử dụng; mỗi phạm vi chỉ trỏ tới một version active.
- `Retired`: không dùng cho kết quả mới nhưng vẫn được giữ để audit và rollback.

Không sửa tại chỗ version ở trạng thái `shadow`, `active` hoặc `retired`. Muốn thay đổi phải clone thành một `draft` mới.

### 3.4 Phân loại cấu hình được phép quản trị

Không phải mọi con số trong phương pháp luận đều là “tham số Admin” cùng mức rủi ro.

| Nhóm | Ví dụ | Cách quản trị |
|---|---|---|
| Policy có thể calibration | `K`, prior mastery, evidence target/exponent, ngưỡng Ready/Strong, các evidence/critical/advanced gate | Cho phép tạo Draft trong Admin, có validation và impact preview |
| Lựa chọn nguồn/profile | official/reference scope, count/point weight, profile version active | Cho phép chọn version đã build và QA; không sửa blueprint bằng tay |
| Thay đổi phương pháp luận | định nghĩa D1–D5, taxonomy, cấu trúc công thức, partial credit, recency/source semantics | Không cho chỉnh như một ô cấu hình thông thường; cần code/design review, methodology version mới và migration plan riêng |
| Tham số vận hành | batch size, retry, concurrency, lịch recompute | Quản trị vận hành riêng; không làm thay đổi ý nghĩa điểm |

Admin UI không được biến phương pháp học thuật thành một “bảng hằng số” có thể sửa và áp dụng tức thì.

---

## 4. School Profile v2

### 4.1 Nguồn câu hỏi

Nguồn canonical cho profile Toán là câu hỏi thuộc đề trường đã được đánh giá bằng taxonomy/difficulty version được phê duyệt.

Quyết định cần review trước migration:

- **Khuyến nghị:** dùng `official` làm nguồn canonical; `reference` chỉ dùng fallback hoặc báo cáo riêng.
- Không dùng `mixed`, đề cá nhân hoá hoặc remedial để xây School Profile.
- Clone/practice question phải nối về canonical assessment qua `sourceQuestionId` hoặc fingerprint được kiểm soát.

### 4.2 Blueprint

Với trường `s`, topic `t`, band `b`:

```text
w(s,t,b) = số đơn vị trọng số trong ô (s,t,b)
           / tổng đơn vị trọng số của trường s
```

Band Toán v4:

```text
foundation  = D1–D2
application = D3
advanced    = D4–D5
```

Profile nên lưu cả hai biến thể:

- `countWeight`: trọng số theo số câu.
- `pointWeight`: trọng số theo điểm tối đa của câu.

Policy quyết định biến thể dùng cho readiness. Khuyến nghị ban đầu:

- Dùng `pointWeight` nếu điểm câu đáng tin và tổng điểm đề hợp lệ.
- Fallback về `countWeight` nếu thiếu hoặc không nhất quán.
- Shadow report phải so sánh hai cách trước khi chốt.

### 4.3 Chuyên đề trọng yếu

Chuyên đề trọng yếu là chỉ số **suy ra** từ blueprint, không phải dữ liệu nhập tay cố định.

Policy preview hiện tại:

```text
criticalTopic nếu topicWeight ≥ 5%
```

Rủi ro đã biết: vách ngưỡng `4,95%` so với `5,01%`. Trước cutover phải review một trong ba phương án:

1. Giữ hard threshold 5% nhưng luôn hiển thị thêm các gap dưới ngưỡng.
2. Dùng threshold mềm theo impact.
3. Kết hợp trọng số, độ khó, tính nền tảng và độ ổn định qua nhiều năm.

### 4.4 Difficulty Index v2

```text
base = 100 × (avgDifficultyD1D5 − 1) / 4
tail = 100 × (0,75 × pD4 + 1,00 × pD5)
time = percentile-normalized questions-per-minute

difficultyComposite = 0,70 × base + 0,20 × tail + 0,10 × time
difficultyIndex = 50 + composite − weightedCompositeMean
```

Trong Readiness v4 vòng đầu:

- Difficulty Index là thuộc tính mô tả và phục vụ so sánh trường.
- Không cộng/trừ trực tiếp vào điểm học sinh vì D1–D5 đã được phản ánh trong blueprint.
- Time pressure chỉ tham gia profile; student time factor sẽ là một feature riêng sau calibration.

### 4.5 Reliability của profile

Mỗi profile version phải có tối thiểu:

- `examCount`, `questionCount`, `yearCount`.
- Phạm vi năm và danh sách exam IDs.
- Coverage assessment/taxonomy.
- Phân bố theo năm và độ lệch blueprint giữa các năm.
- Confidence/quality flags.
- Content hash bao gồm nội dung liên quan, không chỉ qcount và created time.

---

## 5. Mastery v4 và Readiness v4

### 5.1 Mastery từng ô

Với `c` câu đúng trên `n` câu đã làm:

```text
p(t,b) = (c + K × m0) / (n + K)
```

Trong đó `K = priorStrength`, `m0 = priorMastery`. Policy preview dùng `K=4`, `m0=0,5`, nên công thức rút gọn thành:

```text
p(t,b) = (c + 2) / (n + 4)
```

Đây là posterior mean của prior `Beta(K×m0, K×(1−m0))`; với preview là `Beta(2,2)`:

- Hai quan sát đúng ảo và hai quan sát sai ảo.
- Prior mean 50%.
- Prior strength `K=4`.
- Mẫu nhỏ bị kéo về 50%; mẫu lớn tiến gần accuracy thật.

Quy ước hiển thị:

- `n=0`: `status=unverified`, không hiển thị “Mastery 50%” như năng lực đã đạt.
- `0<e<1`: hiển thị mastery estimate cùng nhãn evidence chưa đủ và tỷ lệ evidence cụ thể.
- Có đủ mẫu và kết quả thấp: `confirmed_weakness`.

`K=4` và `m0=0,5` là tham số cần calibration. Shadow report phải có sensitivity `K=2/4/6`; không cho thay `m0` tùy tiện nếu chưa có justification học thuật và impact review.

### 5.2 Evidence từng ô

Với target tổng `N=40` và blueprint weight `w(s,t,b)`:

```text
required(s,t,b) = max(1, N × w(s,t,b))
e(s,t,b)        = min(1, n(t,b) / required(s,t,b))
```

Ý nghĩa:

- Evidence được chứng minh tại đúng ô trường yêu cầu.
- Làm nhiều ở một topic/band không bù được ô khác chưa làm.
- `N=40` là policy parameter, chưa phải hằng số bất biến.

### 5.3 School Mastery

```text
SchoolMastery(s) = Σ w(s,t,b) × p(t,b)
```

Đây là mastery của cùng một học sinh khi đặt vào blueprint của trường `s`. Vì tỷ lệ D1–D5 khác nhau, mastery theo blueprint của cùng một chuyên đề có thể khác giữa hai trường.

### 5.4 School Evidence

```text
SchoolEvidence(s) = Σ w(s,t,b) × e(s,t,b)
```

Advanced evidence:

```text
AdvancedEvidence(s)
= Σ[w(s,t,advanced) × e(s,t,advanced)]
  / Σ[w(s,t,advanced)]
```

### 5.5 Readiness

```text
Readiness(s)
= 100 × SchoolMastery(s) × SchoolEvidence(s)^γ

Policy preview: γ = 0,5
⇒ Readiness(s) = 100 × SchoolMastery(s) × sqrt(SchoolEvidence(s))
```

Bất biến bắt buộc:

```text
0 ≤ Readiness ≤ 100
Readiness ≤ 100 × SchoolMastery
```

`γ = evidenceExponent` là policy parameter phải calibration. Với `0 < γ ≤ 1`, công thức luôn giữ bất biến Readiness không vượt School Mastery. Không dùng additive `ALPHA/BETA/DIFF_K` trong công thức v4.

### 5.6 Gate và trạng thái

Các giá trị dưới đây là **policy preview cần calibration**, không phải hằng số vĩnh viễn trong code:

Quy ước dữ liệu: các ratio/threshold trong policy được lưu dạng `0..1` (ví dụ `0,75`), UI hiển thị dạng phần trăm. `ReadinessSnapshot.readiness` lưu thang `0..100`, nên engine so sánh `readiness / 100` với threshold; không trộn hai thang đo.

| Điều kiện | Giá trị preview |
|---|---:|
| Bắt đầu trạng thái Đang chuẩn bị | Readiness ≥ 50% |
| Bắt đầu trạng thái Gần sẵn sàng | Readiness ≥ 65% |
| Ready score | Readiness ≥ 75% |
| Strong ready score | Readiness ≥ 85% |
| Evidence tổng | ≥ 85% |
| Trường phân hoá cao | advanced share ≥ 20% |
| Advanced evidence gate | ≥ 60% |
| Chuyên đề trọng yếu | topic weight ≥ 5% |
| Critical mastery gate | ≥ 55% |
| Critical evidence gate | ≥ 50% |

Trạng thái:

```text
<50       Chưa sẵn sàng
50–64,9   Đang chuẩn bị
65–74,9   Gần sẵn sàng
75–84,9   Sẵn sàng, chỉ khi qua mọi gate
≥85       Sẵn sàng cao, chỉ khi qua mọi gate
```

Nếu điểm đạt 75 nhưng fail gate: `evidence_limited`, không gắn nhãn Ready.

Quy tắc đánh giá trạng thái phải được triển khai bằng hàm thuần có version, nhận `ReadinessSnapshot inputs + ReadinessPolicyVersion` và trả về:

```text
status
passedGates[]
failedGates[]
reasonCodes[]
policyVersionId
```

Mỗi reason code phải ổn định để UI dịch/giải thích được; không lưu câu chữ tiếng Việt làm logic nghiệp vụ. Ví dụ:

```text
OVERALL_EVIDENCE_BELOW_GATE
ADVANCED_EVIDENCE_BELOW_GATE
CRITICAL_TOPIC_MASTERY_BELOW_GATE
CRITICAL_TOPIC_EVIDENCE_BELOW_GATE
SCORE_BELOW_READY_THRESHOLD
```

Ngưỡng phải được validate trước khi một Draft có thể chuyển sang Shadow, tối thiểu:

```text
0 ≤ priorMastery ≤ 1
priorStrength > 0
evidenceTarget > 0
0 < evidenceExponent ≤ 1
0 ≤ criticalTopicThreshold ≤ 1
0 ≤ mọi gate/threshold ≤ 1
preparingThreshold < nearReadyThreshold < readyThreshold < strongReadyThreshold
```

Các quan hệ bất thường giữa gate (ví dụ critical mastery cao hơn Strong Ready) phải phát cảnh báo và cần reviewer xác nhận, nhưng không tự áp một quan hệ toán học không thuộc phương pháp luận.

Thay đổi chỉ ngưỡng trạng thái có thể giữ nguyên các giá trị mastery/evidence/readiness và chỉ phân loại lại status/gate. Thay đổi tham số đi vào công thức phải tạo kết quả tính mới theo ma trận tại mục 8.5.

### 5.7 Vai trò của cognitive mastery

Cognitive mastery:

- Hiển thị chẩn đoán cơ bản/vận dụng/nâng cao/chuyên sâu.
- Dùng cho gap advice và có thể trở thành gate sau calibration.
- Không cộng độc lập vào Readiness v4 để tránh đếm cùng kết quả hai lần.

---

## 6. Thiết kế dữ liệu đích

Tên bảng dưới đây là đề xuất; có thể điều chỉnh theo convention của dự án trước migration.

### 6.1 `QuestionAssessment`

Lưu kết quả taxonomy/difficulty có phiên bản, thay vì ghi đè trực tiếp vào `Question`.

Các field tối thiểu:

```text
id
questionId
subject
taxonomyVersion
topicPrimary
topicSecondaryJson
difficultyBand       // 1..5
cognitiveLevel
reasoningType
confidence
model
sourceRunId
questionContentHash
assessedAt
createdAt
```

Ràng buộc/index:

```text
unique(questionId, taxonomyVersion)
index(subject, taxonomyVersion)
index(topicPrimary, difficultyBand)
```

### 6.2 `SchoolProfileVersion`

Mỗi lần rebuild tạo version mới; không update phá huỷ version đang active.

```text
id
school
subject
schemaVersion
methodologyVersion
taxonomyVersion
status                 // draft | shadow | active | retired
sourceHash
sourceExamIdsJson
examCount
questionCount
yearCount
yearRangeJson
blueprintCountJson
blueprintPointJson
topicWeightsJson
difficultyWeightsJson
cognitiveWeightsJson
difficultyIndex
difficultyFactorsJson
formatProfileJson
reliabilityJson
createdAt
activatedAt
retiredAt
```

Ràng buộc/index:

```text
unique(school, subject, methodologyVersion, sourceHash)
index(school, subject, status)
```

### 6.3 `MasterySnapshot`

```text
id
userId
subject
methodologyVersion
taxonomyVersion
attemptSourceHash
recomputeJobId
cellsJson
topicSummaryJson
cognitiveSummaryJson
coverageSummaryJson
computedAt
```

Snapshot phải lưu `c`, `n`, `p`, evidence metadata và trạng thái cho từng cell để audit được.

### 6.4 `ReadinessSnapshot`

```text
id
userId
school
subject
methodologyVersion
profileVersionId
masterySnapshotId
policyVersionId
recomputeJobId
schoolMastery
schoolEvidence
advancedEvidence
readiness
status
gatesJson
criticalTopicsJson
calibrationVersion
computedAt
```

Ràng buộc/index:

```text
index(userId, subject, computedAt)
index(school, subject, methodologyVersion)
unique(userId, school, subject, profileVersionId, masterySnapshotId, policyVersionId, methodologyVersion)
```

### 6.5 `ReadinessPolicyVersion` — khuyến nghị

Lưu policy dưới dạng immutable, versioned config thay vì hằng số rải trong code:

```text
id
subject
version
methodologyVersion
status                    // draft | shadow | active | retired
formulaKey                // ví dụ mastery-evidence-v4
priorStrength
priorMastery
evidenceTarget
evidenceExponent
blueprintWeightMode       // point | count | controlled-fallback
preparingThreshold
nearReadyThreshold
readyThreshold
strongReadyThreshold
overallEvidenceGate
advancedShareGate
advancedEvidenceGate
criticalTopicThreshold
criticalMasteryGate
criticalEvidenceGate
configJson
changeSummary
createdByUserId
reviewedByUserId
activatedByUserId
createdAt
updatedAt
shadowedAt
activatedAt
retiredAt
```

Ràng buộc/index:

```text
unique(subject, version)
index(subject, status)
```

Chỉ nội dung của `draft` được update; các trạng thái sau chỉ thay đổi lifecycle metadata qua action đã audit. `configJson` chỉ chứa extension có schema rõ ràng, không thay thế các field cốt lõi cần query/audit.

`ReadinessSnapshot` phải bổ sung `policyVersionId`; unique key và audit chain phải bao gồm policy version để cùng một mastery/profile có thể được tính đối chiếu bằng nhiều policy.

### 6.6 `ReadinessPolicyAssignment` — active pointer theo phạm vi

Không suy ra policy đang được đọc chỉ từ field `status`. Dùng assignment/pointer rõ ràng để global và canary không trộn version:

```text
id
subject
scopeType                 // global | cohort
scopeKey                  // global hoặc ID cohort nội bộ, không lưu danh sách PII
policyVersionId
previousPolicyVersionId
status                    // active | ended
activatedByUserId
approvedByUserId
reason
effectiveFrom
endedAt
createdAt
```

Quy tắc resolve:

1. Nếu user thuộc một canary cohort đang enabled, dùng assignment của cohort đó.
2. Nếu không, dùng assignment `global` của subject.
3. Nếu snapshot chưa có đúng policy/profile đã resolve, trả trạng thái `stale/pending` theo chiến lược đã phê duyệt; không lấy nhầm snapshot version khác mà không gắn nhãn.

Mỗi `subject + scopeType + scopeKey` chỉ có một assignment `active`. Chuyển pointer phải chạy trong transaction, kết thúc pointer cũ và ghi audit. Một policy chỉ được retire khi không còn assignment active tham chiếu tới nó.

### 6.7 `ReadinessRecomputeJob` — bắt buộc cho tính lại

Không tính lại hàng loạt ngay trong request của màn hình Admin. Mỗi yêu cầu tạo một job có thể resume, retry và audit:

```text
id
subject
jobType                   // reclassify-status | readiness | mastery-readiness | profile-readiness | full
reason                    // policy-preview | policy-activation | profile-activation | assessment-change | manual-repair
mode                      // preview | shadow | active-backfill
policyVersionId
profileVersionIdsJson
taxonomyVersion
scopeJson                 // user cohort, school set, attempt window; mặc định không chứa PII thô
sourceVersionJson
targetVersionJson
status                    // queued | running | paused | completed | failed | cancelled
requestedByUserId
approvedByUserId
totalItems
processedItems
successItems
failedItems
checkpointJson
errorSummaryJson
startedAt
completedAt
createdAt
```

Yêu cầu vận hành:

- Idempotency key dựa trên job type, scope và target versions để tránh tạo snapshot trùng ngoài ý muốn.
- Chia batch, lưu checkpoint, retry item lỗi và không khóa web request.
- Một job `preview` không thay đổi active read pointer.
- Một job `active-backfill` chỉ được chạy sau activation đã phê duyệt; kết quả mới vẫn là snapshot mới, không update snapshot cũ.
- Hủy job chỉ dừng các batch chưa chạy; snapshot đã tạo vẫn giữ và được đánh dấu theo job để audit.
- Progress phải phản ánh `processed/success/failed`, không chỉ một phần trăm ước lượng.
- Nếu lỗi vượt ngưỡng policy vận hành, job tự pause và phát cảnh báo; không tự cutover.

### 6.8 `ReadinessPolicyAuditLog` — lịch sử quản trị

Mọi hành động quản trị phải có audit record append-only:

```text
id
policyVersionId
action                    // create | edit-draft | validate | submit-review | shadow | activate | retire | rollback
actorUserId
fromState
toState
diffJson
reason
relatedJobId
assignmentId
createdAt
```

Không ghi secrets, token hoặc PII không cần thiết vào `diffJson`/log.

### 6.9 Tương thích dữ liệu cũ

Trong shadow/canary:

- Giữ nguyên `User.topicMastery` và `User.readiness` làm legacy output.
- Không đổi ý nghĩa hoặc shape của hai JSON này.
- V4 chỉ ghi vào snapshot tables.
- UI production tiếp tục đọc legacy cho đến cutover flag.
- Sau cutover vẫn giữ legacy tối thiểu một chu kỳ quan sát để rollback.

---

## 7. Kế hoạch migration và tích hợp tổng thể

### Phase 0 — Review và đóng băng quyết định

**Công việc**

1. Review tài liệu này với dashboard v4 và dữ liệu Mika.
2. Chốt các open decisions tại mục 10.
3. Gắn version chính thức, ví dụ:

   ```text
   taxonomyVersion    = math-topic-taxonomy-v1
   profileVersion     = school-profile-v2
   masteryVersion     = mastery-v4
   readinessVersion   = readiness-v4
   policyVersion      = math-readiness-policy-v1
   ```

4. Xuất baseline legacy cho toàn bộ user trước migration.
5. Chốt vai trò quản trị: người tạo Draft, reviewer học thuật, người được quyền activate/rollback và người vận hành recompute job.
6. Chốt schema validation, approval rule và phạm vi mặc định của từng loại recompute.

**Exit criteria**

- Công thức, schema và policy được phê duyệt.
- Có test fixtures tối thiểu: new user, Mika, user nhiều D4–D5, user lệch topic, user ít dữ liệu.
- Không còn field hoặc thuật ngữ chưa định nghĩa.
- Không một người tự tạo, tự duyệt và tự activate policy production nếu chưa có quyết định ngoại lệ được audit.

### Phase 1 — Additive schema migration

**Công việc**

1. Backup DB, ghi checksum và kiểm tra restore trước khi đổi schema.
2. Baseline trạng thái DB thực tế, đối chiếu Prisma schema với migration history và production schema.
3. Sinh schema diff, xác nhận chỉ có thao tác additive; chạy thử trên bản sao DB production.
4. Chốt chiến lược triển khai schema:
   - khuyến nghị chuyển sang migration có version và review SQL;
   - nếu vẫn dùng `db push` trong giai đoạn chuyển tiếp, không dùng `--accept-data-loss` cho rollout v4 khi chưa kiểm tra diff.
5. Thêm các bảng versioned mới, gồm policy, policy assignment, recompute job và policy audit log.
6. Thêm index/unique constraint.
7. Không sửa/xoá `SchoolProfile`, `User.topicMastery`, `User.readiness`.
8. Tạo feature flags:

   ```text
   readinessV4ComputeEnabled
   readinessV4ShadowEnabled
   readinessV4ReadEnabled
   readinessV4PersistLegacyEnabled
   ```
9. Áp dụng quyền Admin theo role và chặn endpoint activation/recompute đối với user không đủ quyền.

**Exit criteria**

- Migration chạy được trên bản sao DB production.
- Schema diff không chứa drop table/column hoặc destructive table rebuild ngoài kế hoạch đã duyệt.
- Rollback schema được kiểm tra.
- App cũ vẫn chạy bình thường khi các flag tắt.
- Tạo/edit Draft, activation transaction và audit append-only có integration test.

### Phase 2 — Import assessment có phiên bản

**Công việc**

1. Import assessment GPT-5.6 Sol từ run đã phê duyệt vào `QuestionAssessment`.
2. Kiểm tra `849/849` câu official/reference mục tiêu có assessment hợp lệ.
3. Resolve clone qua `sourceQuestionId` nhưng không copy mù khi content hash khác.
4. Lưu source run, model, taxonomy version và content hash.
5. Xuất reconciliation report:

   - imported;
   - missing;
   - duplicate/conflict;
   - stale content hash;
   - orphan assessment.

**Exit criteria**

- Không có conflict chưa xử lý.
- Coverage đạt ngưỡng đã chốt.
- Import idempotent: chạy lại không tạo duplicate.

### Phase 3 — Build School Profile v2 ở shadow

**Công việc**

1. Build profile theo `school + subject + taxonomyVersion + sourceHash`.
2. Chỉ lấy nguồn đề đã phê duyệt.
3. Lưu count blueprint và point blueprint.
4. Tính Difficulty Index v2 cùng reliability.
5. So sánh profile v2 với dashboard artifact:

   - question count;
   - topic/band distribution;
   - D4–D5 share;
   - time pressure;
   - Difficulty Index;
   - critical topics.

**Exit criteria**

- Tổng weight mỗi blueprint bằng 1 trong tolerance.
- Profile có thể tái lập từ sourceHash.
- Không profile shadow nào thay đổi legacy `SchoolProfile`.

### Phase 4 — Compute Mastery/Readiness v4 ở shadow

**Công việc**

1. Recompute `MasterySnapshot` theo batch.
2. Tạo `ReadinessSnapshot` cho từng user × school.
3. Không update JSON legacy.
4. Chạy qua `ReadinessRecomputeJob` ở mode `shadow`, có progress/checkpoint/retry và liên kết mọi snapshot với job/version.
5. Sinh comparison report v1/v2/v3/v4:

   - distribution theo trường;
   - min/max/median/spread;
   - tỷ lệ Ready;
   - gate failure frequency;
   - số ô unverified;
   - invariant violations;
   - độ nhạy K=2/4/6 và N=30/40/60.

**Acceptance fixture hiện tại của Mika**

Với payload preview đã chốt, kỳ vọng xấp xỉ:

```text
AMS: School Mastery ≈ 64,6%; Evidence ≈ 62,8%; Readiness ≈ 51,2%
NTL: School Mastery ≈ 68,9%; Evidence ≈ 78,0%; Readiness ≈ 60,9%
```

Sai khác chỉ được chấp nhận nếu có quyết định thay đổi point/count weighting, source scope hoặc policy và được ghi vào decision log.

**Exit criteria**

- `Readiness ≤ SchoolMastery × 100` cho 100% snapshot.
- Không có NaN, weight âm hoặc readiness ngoài 0..100.
- New user có status unverified/not ready, không bị hiểu là mastery 50% đã đạt.
- Comparison report được review.
- Job có thể dừng/resume và chạy lại idempotent mà không tạo kết quả mơ hồ.

### Phase 5 — Calibration và review gate

**Công việc**

1. Review các user có profile luyện tập khác nhau, không chỉ Mika.
2. Đối chiếu với bài thi thử đầy đủ và dữ liệu timed attempt nếu có.
3. Review false positive quan trọng nhất: user được Ready dù còn gap cốt lõi.
4. Review false negative: user có kết quả đề đầy đủ tốt nhưng readiness thấp bất hợp lý.
5. Dùng Admin Simulator để so sánh Draft với Active theo distribution, cohort, trường, gate failures và các acceptance fixtures.
6. Chuyển policy `Draft → Shadow`, chạy shadow recompute và khóa nội dung version.
7. Review impact report, xin phê duyệt và chỉ sau đó mới chốt policy version active.

**Không được bỏ qua:** nếu chưa có outcome calibration, UI phải gọi Readiness là **chỉ số sẵn sàng**, không gọi là xác suất đỗ.

**Exit criteria**

- Các threshold có justification bằng dữ liệu.
- Product/academic review ký duyệt.
- Có rollback version rõ ràng.
- Impact report lưu policy diff, phạm vi dữ liệu, số user đổi trạng thái và các outlier cần review.

### Phase 6 — Dual compute và canary read

**Công việc**

1. Khi submit Attempt:
   - legacy compute vẫn chạy;
   - v4 snapshot chạy best-effort hoặc qua queue/batch;
   - lỗi v4 không làm fail submit.
2. Admin UI hiển thị legacy và v4 cạnh nhau.
3. Bật `readinessV4ReadEnabled` cho admin/internal trước.
4. Canary theo nhóm user nhỏ.
5. Theo dõi latency, error, stale snapshot và chênh lệch điểm.
6. Khi activate policy/profile mới, tạo recompute job theo phạm vi canary trước; không mặc định backfill toàn bộ user trong cùng request.
7. Canary cohort phải được resolve qua assignment/pointer rõ ràng và có global fallback đã biết; không dùng điều kiện rải trong UI.
8. Chạy canary UI với học sinh/phụ huynh/giáo viên đại diện; kiểm tra mức hiểu Readiness–Mastery–Evidence, gate và trạng thái stale/computing.
9. Theo dõi telemetry và support signal nhưng không thu PII/nội dung câu trả lời ngoài nhu cầu đã duyệt.

**Exit criteria**

- Không ảnh hưởng submit flow.
- Snapshot freshness đạt SLA.
- Không phát sinh dữ liệu version mơ hồ.
- Có thể xác định chính xác cohort nào đang đọc policy/profile version nào.
- Không có màn hình canary hiển thị Ready khi fail gate hoặc trộn snapshot/policy version.
- Copy/interaction user-facing qua academic, product, privacy và accessibility review.

### Phase 7 — Cutover có kiểm soát

**Công việc**

1. UI đọc v4 snapshot cho nhóm đã chọn.
2. Luôn hiển thị:
   - School Mastery;
   - Evidence;
   - Readiness;
   - status;
   - gate chưa đạt;
   - thời điểm/freshness;
   - methodology version trong phần chi tiết/cách tính.
3. Gap advice chuyển sang cell/topic impact của v4.
4. Không ghi v4 trở lại shape JSON legacy trừ khi có adapter version rõ ràng.
5. Dùng shared readiness view model/component/copy mapping cho Home, Results, Overview và Library; không triển khai logic threshold riêng từng màn hình.
6. Bật School detail và recommendation deep link chỉ khi content mapping đã được kiểm tra.

**Rollback**

- Tắt `readinessV4ReadEnabled` để UI quay lại legacy.
- Không cần xoá snapshot v4.
- Profile version active có thể chuyển về version trước.
- Policy version active có thể chuyển về version trước; sau rollback tạo job phân loại/tính lại đúng phạm vi thay vì sửa snapshot cũ.

### Phase 8 — Ổn định và cleanup

Chỉ thực hiện sau ít nhất một chu kỳ quan sát được phê duyệt:

1. Ngừng legacy compute.
2. Đánh dấu legacy fields deprecated.
3. Quyết định giữ làm cache, archive hay xoá trong migration riêng.
4. Mở kế hoạch áp dụng cho môn khác, không tái sử dụng máy móc policy Toán.
5. Review dữ liệu lịch sử, telemetry và phản hồi user để điều chỉnh copy/advice; mọi thay đổi threshold vẫn đi qua policy workflow.

---

## 8. Điểm tích hợp trong ứng dụng

### 8.1 Submit exam

Hiện tại `app/exam/[examId]/actions.ts` recompute mastery/readiness và ghi JSON vào `User`.

Thiết kế đích:

1. Attempt submit là source event.
2. Compute mastery snapshot theo subject.
3. Resolve active School Profile versions.
4. Compute readiness snapshots.
5. Legacy path được giữ trong shadow/canary.
6. V4 failure được log/monitor nhưng không rollback Attempt đã submit.

### 8.2 Home, Results, Overview và Library

Các màn hình đang đọc readiness ở nhiều nơi. Cần một read service thống nhất:

```text
getEffectiveReadinessV4(userId, subject, options)
```

Service trả:

```text
score
scoreScale
schoolMastery
evidence
advancedEvidence
status
gates
reasonCodes
criticalGaps
profileVersion
policyVersion
computedAt
freshnessState          // current | computing | stale | unavailable
source                  // v4 | legacy-fallback
```

UI không tự parse JSON legacy hoặc tự fallback 50 khi dùng v4.

### 8.3 Tác động tới dữ liệu user và giao diện người dùng

#### 8.3.1 Nguyên tắc trải nghiệm

1. Readiness được gọi là **Chỉ số sẵn sàng theo trường**, không gọi là xác suất đỗ khi chưa có outcome calibration.
2. Thứ tự thông tin trên UI là: `trạng thái → điểm và độ tin cậy → lý do → hành động tiếp theo`. Không chỉ hiển thị một con số.
3. Luôn tách ba khái niệm:
   - **Mastery theo trường:** năng lực ước lượng khi đặt vào blueprint của trường.
   - **Evidence/Độ phủ dữ liệu:** mức độ kết quả đã được kiểm chứng đúng các mảng trường yêu cầu.
   - **Readiness:** mastery sau khi điều chỉnh bởi evidence và các gate.
4. Cùng một học sinh có School Mastery khác nhau giữa các trường vì blueprint khác nhau; UI phải giải thích điều này, không gọi đó là “mastery tổng quát của con”.
5. Không hiển thị prior 50% hoặc readiness 0 như năng lực thật khi chưa có dữ liệu. Trường hợp chưa làm phải ưu tiên nhãn **Chưa đủ dữ liệu để đánh giá**.
6. Difficulty Index là thuộc tính đề/trường, không phải điểm của học sinh và không được đặt cạnh Readiness như hai thước đo cùng nghĩa.
7. Methodology/profile/policy version có trong phần “Cách tính/Chi tiết dữ liệu”, không chiếm vị trí chính trên giao diện phổ thông nhưng luôn truy cập được để minh bạch.

#### 8.3.2 Dữ liệu user

- `Attempt`, câu trả lời và điểm bài làm là dữ liệu gốc; thay policy/profile không sửa các dữ liệu này.
- Mastery/Readiness mới được lưu trong snapshot versioned theo `userId`; không nhồi thêm shape v4 vào JSON legacy trên `User`.
- School Profile không chứa dữ liệu cá nhân. Cohort/canary assignment dùng ID nội bộ, không lưu email hoặc danh sách PII trong policy config/job log.
- Mọi kết quả user phải truy được Attempt set, mastery/profile/policy version, recompute job và thời điểm tính.
- Trong shadow/canary, user production tiếp tục thấy kết quả legacy trừ khi thuộc phạm vi đã bật. Không hiển thị đồng thời hai con số khác nhau cho cùng một khái niệm nếu không phải màn hình internal/admin.
- Quyền xem chi tiết theo chuyên đề/câu làm sai phải tuân theo quan hệ tài khoản hiện có giữa học sinh, phụ huynh và giáo viên; rollout v4 không tự mở rộng quyền truy cập.
- Retention/export/delete theo vòng đời tài khoản phải bao phủ cả snapshot v4 và audit link liên quan mà không phá vỡ yêu cầu audit hệ thống; chi tiết cần chốt ở R24/R28.

#### 8.3.3 Ma trận thay đổi theo màn hình

| Khu vực | Nội dung chính cần hiển thị | Hành động chính | Không nên làm |
|---|---|---|---|
| Home/Dashboard | Trường đang theo dõi, trạng thái, Readiness, Evidence, 1–3 ưu tiên học | Mở chi tiết readiness hoặc tiếp tục lộ trình | Chỉ đặt một vòng tròn phần trăm không có lý do |
| Overview/School comparison | Readiness, School Mastery, Evidence và gate theo từng trường | Chọn trường mục tiêu, so sánh yêu cầu | Xếp hạng trường chỉ theo Readiness hoặc Difficulty Index |
| School readiness detail | Blueprint rút gọn, chuyên đề trọng yếu, vùng D1–D5, gate đạt/chưa đạt | Xem “Cần làm gì tiếp theo” | Dùng mã `M`, `E`, `D4D5` mà không giải thích |
| Exam Results | Điểm của bài vừa làm tách biệt với tác động tới readiness; trạng thái đang cập nhật nếu snapshot chưa xong | Xem câu sai, luyện mảng liên quan | Hứa readiness chắc chắn tăng ngay sau một bài |
| Library/Practice | Danh sách nội dung ưu tiên kèm lý do: thiếu kiến thức hay thiếu evidence | Bắt đầu bài phù hợp topic/band | Đẩy D4–D5 chỉ vì trường khó khi nền tảng chưa đủ |
| Progress/History | Xu hướng Readiness, Mastery và Evidence theo cùng methodology version | Xem mốc bài làm/policy change | Nối biểu đồ qua lần đổi công thức mà không đánh dấu |
| Parent view | Giải thích dễ hiểu, mức độ tin cậy, gap và kế hoạch học | Theo dõi tiến bộ, mở chi tiết | Gọi readiness là tỷ lệ đỗ |
| Teacher/Advisor view | Breakdown topic × band, evidence, gate, nguồn dữ liệu và freshness | Lập kế hoạch can thiệp | Cho xem dữ liệu ngoài phạm vi lớp/quyền hiện có |

Nếu ứng dụng chưa có màn hình `School readiness detail` hoặc `Progress/History`, đây là deliverable UI mới; không ép toàn bộ nội dung vào Home card.

#### 8.3.4 Cấu trúc thẻ Readiness chuẩn

Thẻ readiness dùng chung giữa các màn hình cần có tối thiểu:

```text
Tên trường / trường mục tiêu
Trạng thái bằng chữ
Chỉ số sẵn sàng: x/100              // chỉ khi đủ điều kiện hiển thị
Mastery theo blueprint trường: x%
Độ phủ dữ liệu: x%
Lý do/gate quan trọng nhất
1–3 hành động tiếp theo
Cập nhật lúc ... / trạng thái dữ liệu
Link “Cách tính”
```

Màu sắc chỉ hỗ trợ trạng thái, không là tín hiệu duy nhất. Mỗi trạng thái phải có label/icon/text; không dùng đỏ/xanh đơn thuần vì accessibility và vì dễ tạo cảm giác đỗ/trượt tuyệt đối.

#### 8.3.5 Trạng thái hiển thị và fallback

| Trạng thái dữ liệu/kết quả | Cách hiển thị cho user |
|---|---|
| `unverified`, Evidence = 0 | “Chưa đủ dữ liệu để đánh giá”; không hiện prior 50% và không gọi score 0 là năng lực |
| Có dữ liệu nhưng evidence thấp | Có thể hiện score với nhãn “Kết quả tạm thời — cần thêm bài ở các mảng sau” |
| `not_ready` / `preparing` / `near_ready` | Hiện trạng thái, khoảng cách tới bước tiếp theo và gap có tác động lớn nhất |
| Score ≥ Ready nhưng fail gate | `evidence_limited`; nói rõ “Điểm tổng đã đạt nhưng chưa đủ bằng chứng ở …”, không gắn badge Ready |
| `ready` / `strong_ready` | Hiện trạng thái cùng các gate đã qua; vẫn chỉ là chỉ số sẵn sàng, không cam kết kết quả thi |
| `computing` sau khi submit | Hiện “Đang cập nhật”; giữ kết quả gần nhất nếu cùng version và gắn thời điểm, không tự hiển thị 50 |
| `stale` | Hiện kết quả gần nhất với cảnh báo “Dữ liệu đang được tính lại”; không trộn score cũ với gate/policy mới |
| `unavailable/error` | Fallback về kết quả hợp lệ gần nhất có nhãn nguồn hoặc trạng thái chưa khả dụng; không tính tạm trong UI |
| Legacy fallback trong canary | Nội dung vẫn dùng vocabulary hiện hành; không gắn nhãn v4 hoặc giải thích v4 cho dữ liệu legacy |

Reason code từ backend phải map sang câu chữ nhất quán. Ví dụ:

```text
OVERALL_EVIDENCE_BELOW_GATE
→ “Con cần làm thêm bài đúng các mảng trường này thường hỏi.”

CRITICAL_TOPIC_MASTERY_BELOW_GATE
→ “Chuyên đề Hình phẳng & diện tích là mảng trọng yếu và mức làm chủ hiện chưa đạt yêu cầu.”

CRITICAL_TOPIC_EVIDENCE_BELOW_GATE
→ “Chưa có đủ bài làm để kết luận chắc chắn về chuyên đề Chuyển động đều.”
```

UI có thể hiển thị số liệu chi tiết như `68% < 85%` trong phần mở rộng, nhưng câu chính phải giải thích ý nghĩa thay vì chỉ đưa bất đẳng thức.

#### 8.3.6 “Cách tính” và thuật ngữ

User-facing glossary cần giải thích bằng ví dụ cụ thể:

- Vì sao Mastery theo trường có thể khác Mastery tổng quát.
- Vì sao hai trường có gate khác nhau: chuyên đề chỉ thành critical khi đủ trọng số trong blueprint trường đó.
- Vì sao làm đúng nhiều nhưng readiness vẫn thấp nếu chưa phủ các chuyên đề/dải khó quan trọng.
- `Chưa kiểm chứng` khác `Yếu đã xác nhận`.
- D1–D5 và Foundation/Application/Advanced theo ngôn ngữ phù hợp với người dùng.
- Difficulty Index mô tả đề trường; không trực tiếp cộng vào điểm readiness v4.
- Ngày dữ liệu được cập nhật và việc thay đổi phương pháp có thể làm điểm được tính lại.

Dashboard giải thích hiện tại chỉ là acceptance reference. Nội dung production phải dùng component/copy chung để Home, Results, Overview và Library không định nghĩa thuật ngữ khác nhau.

#### 8.3.7 Khuyến nghị học tập từ gap

Gap advice phải phân biệt:

- **Chưa học/chưa có evidence:** ưu tiên học kiến thức hoặc làm diagnostic phù hợp; không kết luận yếu.
- **Evidence thấp:** đề xuất thêm bài cùng `topic × band` để kiểm chứng.
- **Mastery thấp với evidence đủ:** đề xuất ôn lại kiến thức, ví dụ hướng dẫn và bài luyện có scaffold.
- **Mastery tốt nhưng thiếu advanced evidence ở trường phân hoá cao:** đề xuất D4–D5 sau khi prerequisite đã đạt.

Thứ tự ưu tiên nên dựa trên impact theo blueprint, khoảng thiếu mastery/evidence, gate và prerequisite; không chỉ sắp theo accuracy thấp nhất. Công thức ranking advice phải versioned/testable và được chốt ở R27 trước implementation.

Mỗi recommendation cần có `reasonCode`, topic, band, priority và deep link tới nội dung phù hợp. Nếu Library không có nội dung tương ứng, UI phải báo thiếu content mapping thay vì dẫn tới bài không liên quan.

#### 8.3.8 Lịch sử và thay đổi phương pháp

- Chỉ nối thành một đường xu hướng khi các điểm có semantics tương thích.
- Khi profile/policy/methodology đổi, biểu đồ phải có marker “Cách tính đã cập nhật”.
- Không diễn giải delta do recompute policy thành tiến bộ/hụt lùi của học sinh.
- Nếu cần so sánh before/after policy, chỉ hiển thị trong Admin/internal hoặc một view giải thích rõ hai phương pháp; user phổ thông mặc định đọc active version.
- Attempt result lịch sử không thay đổi; chỉ chỉ số tổng hợp có thể được tính lại theo policy/profile mới.

#### 8.3.9 Accessibility, responsive và đo lường

- Mobile-first; phần giải thích/gate dài dùng disclosure, không làm mất thông tin cốt lõi.
- Màu đạt contrast, keyboard/focus đầy đủ, chart có text/table alternative và screen-reader labels.
- Copy tiếng Việt thống nhất; chuẩn bị key i18n thay vì hard-code câu chữ trong logic.
- Telemetry tối thiểu: card viewed, explanation opened, gate viewed, recommendation clicked, stale/error shown; không gửi nội dung câu trả lời hoặc PII không cần thiết.
- Theo dõi support signal: người dùng hiểu nhầm readiness là xác suất đỗ, không hiểu Evidence, hoặc thấy các trường “mâu thuẫn”.

#### 8.3.10 UX acceptance criteria

- New user không thấy Mastery 50% hoặc Readiness 0 như một kết luận năng lực.
- User phân biệt được Readiness, Mastery và Evidence trong usability review.
- Score đạt 75 nhưng fail gate không được hiển thị Ready ở bất kỳ màn hình nào.
- Cùng một snapshot cho kết quả/status/reason nhất quán trên Home, Results, Overview và Library.
- Không có màn hình tự tính threshold, tự parse legacy JSON hoặc tự fallback 50.
- Stale/computing/error/legacy fallback được test và có timestamp/source rõ ràng.
- User biết ít nhất một hành động tiếp theo và lý do hành động đó được đề xuất.
- Parent/student copy không tuyên bố hoặc ám chỉ xác suất đỗ khi chưa calibration.
- Teacher/parent chỉ xem được user nằm trong phạm vi quyền hiện có.
- Biểu đồ lịch sử không biến thay đổi policy thành “tiến bộ” giả.

### 8.4 Admin

Admin cần bốn khu vực tách biệt để tránh nhầm “sửa tham số” với “áp dụng production”.

#### A. Policy versions

- Danh sách version theo subject, methodology, trạng thái và thời điểm hiệu lực.
- Xem toàn bộ config, change summary, người tạo/review/activate và audit history.
- `Clone Active to Draft`; chỉ Draft có form chỉnh sửa.
- Validation theo schema, range, quan hệ threshold và required fields.
- So sánh diff Draft với Active bằng tên nghiệp vụ, không chỉ JSON thô.
- Thao tác `Submit for review`, `Move to Shadow`, `Activate`, `Retire`, `Rollback` theo quyền.
- Xem assignment global/canary hiện tại và version trước đó; mọi chuyển pointer có effective time và audit.
- Activation/rollback bắt buộc confirmation, lý do và approval; không cho sửa policy active tại chỗ.

#### B. Simulator và impact preview

- Chọn Draft/Shadow policy, profile version và cohort dữ liệu.
- Chạy fixture nhanh cho new user, Mika và các profile biên.
- So sánh Active vs Candidate:
  - phân bố Readiness/Mastery/Evidence;
  - số lượng và tỷ lệ user đổi trạng thái;
  - Ready mới, mất Ready, evidence-limited;
  - gate failure theo trường/chuyên đề;
  - percentile/delta/outlier lớn nhất;
  - invariant violations.
- Drill-down phải giải thích delta đến từ tham số nào, gate nào hoặc profile nào.
- Preview tạo snapshot/report riêng; không đổi kết quả mà production đang đọc.

#### C. Recompute jobs

- Tạo job từ policy/profile/taxonomy change với scope được hiển thị rõ trước khi xác nhận.
- Cho xem job type, mode, version nguồn/đích, cohort, tổng số item và ước lượng phạm vi.
- Progress theo processed/success/failed, checkpoint và lỗi có thể retry.
- Pause/resume/cancel/retry item lỗi theo quyền.
- Tải reconciliation report và liên kết từ job tới snapshot đã sinh.
- Không có nút “tính lại tất cả” một bước không preview, không approval và không scope guard.

#### D. Profile, monitoring và audit

- Danh sách profile versions và trạng thái; refresh/build shadow profile.
- Comparison distribution legacy/v4 và gate failure distribution.
- Snapshot freshness, stale rate, compute latency và lỗi compute.
- Activate/retire profile version theo cùng nguyên tắc version/approval/rollback.
- Audit trail lọc theo actor, action, subject, version, thời gian và related job.

Vai trò tối thiểu được khuyến nghị:

| Role | Quyền chính |
|---|---|
| Viewer/Analyst | Xem version, report, job và audit |
| Policy Editor | Clone/tạo/sửa Draft, chạy preview trong scope được cấp |
| Academic Reviewer | Review phương pháp, approve/reject candidate |
| Release Approver | Activate/retire/rollback version |
| Recompute Operator | Chạy/pause/resume/retry job đã được phê duyệt |

Một người có thể mang nhiều role trong giai đoạn nhỏ, nhưng hệ thống vẫn phải audit riêng từng hành động và hỗ trợ bật quy tắc four-eyes khi lên production.

### 8.5 Ma trận ảnh hưởng và phạm vi tính lại

Input gốc (`Attempt`, answer, điểm) luôn giữ nguyên. Mức tính lại phụ thuộc loại thay đổi:

| Thay đổi | Rebuild profile | Recompute mastery | Recompute readiness | Chỉ phân loại lại status/gate |
|---|:---:|:---:|:---:|:---:|
| Ready/Strong/status threshold | Không | Không | Không | Có |
| Evidence/critical/advanced gate không đi vào score | Không | Không | Không | Có |
| Evidence target hoặc evidence exponent | Không | Không | Có | Có |
| Prior strength `K` hoặc prior mastery | Không | Có | Có | Có |
| Count/point blueprint mode | Không nếu profile lưu đủ cả hai; nếu không thì Có | Không | Có | Có |
| Source exam/profile scope | Có | Không | Có | Có |
| Taxonomy/difficulty/answer-to-cell mapping | Có | Có | Có | Có |
| Grading, partial credit, attempt-source hoặc recency semantics | Có thể | Có | Có | Có |

“Chỉ phân loại lại” vẫn phải tạo `ReadinessSnapshot` hoặc status projection versioned mới gắn với `policyVersionId`; không update status trên snapshot cũ. Nếu snapshot schema không tách raw metrics khỏi decision output, ưu tiên tạo readiness snapshot mới từ mastery/profile inputs đã có.

### 8.6 Luồng thay đổi policy chuẩn

```text
Clone Active → Edit Draft → Validate
→ Preview fixtures/cohort → Academic review
→ Lock as Shadow → Shadow recompute
→ Impact review + approval → Activate
→ Canary recompute/read → Mở rộng phạm vi
→ Theo dõi → Giữ Active hoặc Rollback
```

Activation chỉ thay đổi `ReadinessPolicyAssignment` trong transaction. Nó **không đồng nghĩa** dữ liệu toàn bộ user đã được backfill xong. Read service phải biết snapshot nào stale/missing cho active version và áp dụng chiến lược đã chốt: chờ job, compute-on-read có giới hạn, hoặc fallback có nhãn; không im lặng trộn policy versions.

### 8.7 Deploy pipeline

`scripts/deploy-full.sh` hiện nhận diện thay đổi mastery/readiness rồi recompute toàn user. V4 cần tách:

- schema migration;
- assessment import;
- profile build;
- mastery snapshot backfill;
- readiness snapshot backfill;
- activation flag.

Không tự động cutover chỉ vì deploy code thành công.

---

## 9. Kiểm thử và tiêu chí nghiệm thu

### 9.1 Unit tests

- Beta smoothing với `0/0`, `1/1`, `2/2`, `0/2`, mẫu lớn.
- Cell evidence với weight nhỏ/lớn và `required >= 1`.
- Tổng blueprint bằng 1.
- School Mastery và School Evidence đúng weighted sum.
- Advanced evidence denominator đúng.
- Critical topic/gate đúng boundary.
- Status 49,9 / 50 / 65 / 75 / 85.
- Policy validation: range, required fields, `ready < strongReady` và schema version.
- Reason codes/gates ổn định khi chỉ thay đổi threshold.
- `evidenceExponent` và từng loại policy change tạo đúng recompute scope.
- Invariant `Readiness ≤ SchoolMastery × 100`.

### 9.2 Data tests

- Assessment coverage và unique constraint.
- Clone/source mapping.
- Official/reference scope.
- Count vs point weights.
- Profile hash thay đổi khi taxonomy, content, points hoặc assessment thay đổi.
- Snapshot source hash thay đổi khi Attempt liên quan thay đổi.
- Snapshot cùng input nhưng policy khác phải có `policyVersionId` khác và không overwrite nhau.
- Recompute job idempotency/checkpoint không bỏ sót hoặc nhân đôi logical result.
- Policy audit log append-only và diff không chứa PII ngoài thiết kế.

### 9.3 Integration tests

- Submit exam không fail khi v4 compute lỗi.
- Recompute idempotent.
- UI đọc đúng active version.
- Feature flag rollback tức thì.
- Admin activate profile/policy có audit trail.
- Không cho update policy `shadow/active/retired`; phải clone Draft.
- User không đủ role không thể activate/rollback/recompute.
- Activation transaction không để hai policy active ngoài phạm vi thiết kế.
- Preview/shadow job không đổi active read pointer.
- Pause/resume/retry/cancel recompute giữ đúng progress và version lineage.
- Rollback policy tạo kết quả theo version trước mà không sửa/xoá snapshot lịch sử.
- Subject isolation: Toán không ghi đè readiness môn khác.
- Shared presentation model trả cùng status/reason/freshness cho mọi màn hình.
- Stale/missing active snapshot không fallback sang policy version khác mà không gắn nhãn.
- Recommendation deep link chỉ trỏ tới content khớp subject/topic/band và quyền truy cập.

### 9.4 Acceptance scenarios

1. New user chưa làm bài.
2. User chỉ làm foundation một topic.
3. User accuracy cao nhưng thiếu coverage.
4. User coverage cao nhưng mastery thấp.
5. User làm đủ D4–D5.
6. User mạnh lệch topic.
7. Mika fixture.
8. Profile trường có ít đề hoặc một năm bất thường.
9. Chỉ đổi Ready threshold: raw mastery/evidence/readiness giữ nguyên, status/gate đổi đúng.
10. Đổi `K`: mastery và readiness được tạo lại, Attempt không đổi.
11. Candidate policy làm số Ready tăng/giảm mạnh: impact preview cảnh báo trước activation.
12. User score ≥75 nhưng fail critical/evidence gate: mọi màn hình đều hiển thị `evidence_limited`, không Ready.
13. Snapshot đang tính lại hoặc stale: hiển thị kết quả gần nhất đúng version khi hợp lệ, kèm timestamp/cảnh báo.
14. Policy đổi nhưng Attempt không đổi: lịch sử đánh dấu methodology change, không ghi nhận là tiến bộ học tập.
15. Hai trường có critical topics khác nhau: UI giải thích theo blueprint từng trường, không coi là dữ liệu mâu thuẫn.

### 9.5 UX, accessibility và quyền truy cập

- Usability review có đại diện học sinh, phụ huynh và giáo viên; kiểm tra họ phân biệt được Mastery, Evidence và Readiness.
- Snapshot test cho `unverified`, low evidence, preparing, near ready, evidence-limited, ready, strong ready, computing, stale và unavailable.
- Responsive QA trên mobile/desktop; text dài và gate list không tràn hoặc mất hành động chính.
- Keyboard, focus order, contrast, screen reader labels và chart text alternative đạt chuẩn accessibility đã chọn.
- Copy test bảo đảm không có từ “xác suất đỗ”, “chắc chắn đỗ” hoặc tương đương khi calibration chưa cho phép.
- Authorization test cho student/parent/teacher; không lộ breakdown của user ngoài phạm vi.
- Analytics/privacy review xác nhận event không chứa email, nội dung câu trả lời hoặc PII không cần thiết.

---

## 10. Danh sách bắt buộc review lại trước khi triển khai

Các quyết định dưới đây **chưa được coi là final** chỉ vì dashboard preview đã chạy:

| ID | Quyết định cần chốt | Giá trị preview/khuyến nghị |
|---|---|---|
| R1 | Nguồn profile | Official canonical; reference fallback riêng |
| R2 | Trọng số blueprint | So sánh countWeight và pointWeight |
| R3 | Taxonomy/difficulty version | GPT-5.6 Sol run đã QA, import versioned |
| R4 | Prior strength | Sensitivity K=2/4/6; preview K=4 |
| R5 | Evidence target | Sensitivity N=30/40/60; preview N=40 |
| R6 | Critical topic | Review vách 5% |
| R7 | Critical mastery/evidence | Preview 55% / 50% |
| R8 | Status/Ready/evidence threshold | Preview 50% / 65% / 75% / 85% và evidence tổng 85% |
| R9 | Advanced gate | Share 20%, evidence 60% |
| R10 | Cognitive gate | Diagnostic-only ở vòng đầu |
| R11 | Difficulty Index | Descriptive-only trong readiness v4 |
| R12 | Time factor học sinh | Chưa bật; cần timed full-exam data |
| R13 | Recency weighting | Chưa bật; cần quyết định toàn lịch sử hay decay |
| R14 | Remedial/private attempts | Có tính mastery hay tách nguồn evidence |
| R15 | Essay partial credit | Binary correct hay fraction theo points |
| R16 | Profile stability | Cách weight các năm và xử lý outlier |
| R17 | Calibration semantics | Index hay probability-like score |
| R18 | Legacy retention | Thời gian giữ JSON cũ sau cutover |
| R19 | Chiến lược schema migration | Baseline migration history; loại bỏ phụ thuộc không kiểm soát vào `db push --accept-data-loss` |
| R20 | Quyền quản trị policy | Role matrix và four-eyes cho activation/rollback production |
| R21 | Activation semantics | `ReadinessPolicyAssignment` theo subject/phạm vi; quy tắc resolve cohort/global và không trộn version ngầm |
| R22 | Recompute strategy | Queue/batch, idempotency, retry, scope guard và SLA freshness |
| R23 | Preview/canary cohort | Bộ fixture, cohort tối thiểu và ngưỡng cảnh báo impact trước activation |
| R24 | Lưu giữ snapshot/job/audit | Retention, archive và quyền truy cập dữ liệu lịch sử |
| R25 | Vocabulary và score visibility | Tên trạng thái, khi nào ẩn score ở `unverified`, copy cho student/parent/teacher |
| R26 | Phạm vi UI | Home/Overview/Results/Library thay đổi; có tạo School detail và Progress/History ở vòng đầu hay không |
| R27 | Gap advice ranking | Impact theo blueprint + mastery/evidence gap + gate + prerequisite; versioned và testable |
| R28 | User access/privacy | Quyền student/parent/teacher, cohort PII, export/delete và analytics events |
| R29 | History semantics | Cách vẽ/đánh dấu chuỗi thời gian khi profile/policy/methodology đổi |
| R30 | Freshness/fallback UX | SLA, khi giữ last-known-good, khi hiện pending/unavailable và cấm trộn version |

Mỗi quyết định phải có owner, ngày review, dữ liệu hỗ trợ và decision log.

---

## 11. Monitoring, audit và rollback

### Monitoring tối thiểu

- Compute success/error rate.
- Snapshot freshness.
- Số profile stale.
- Readiness distribution theo school/version.
- Tỷ lệ Ready và evidence-limited.
- Gate failure frequency.
- Legacy-v4 delta.
- Invariant violation count.
- Thời gian compute theo user và batch.
- Recompute queue depth, job duration, retry/failure rate và checkpoint age.
- Tỷ lệ snapshot thiếu/stale so với active policy/profile version.
- Số user/cohort đang đọc mỗi policy/profile version.
- Policy activation/rollback events và mức delta sau activation.
- Tỷ lệ user thấy `unverified`, `computing`, `stale`, `unavailable` và legacy fallback.
- Explanation/gate/recommendation engagement theo event đã privacy-review.
- Tỷ lệ recommendation thiếu content mapping hoặc deep link lỗi.
- Support/usability signal về nhầm Readiness với xác suất đỗ hoặc nhầm School Mastery giữa các trường.

### Audit

Mỗi readiness result phải truy ngược được:

```text
Attempt set
→ MasterySnapshot
→ SchoolProfileVersion
→ ReadinessPolicyVersion
→ ReadinessRecomputeJob
→ ReadinessSnapshot
```

Không dùng artifact chứa email/PII làm nguồn production. Run artifact chỉ phục vụ reconciliation và acceptance fixture; import production phải map bằng ID nội bộ và có log kiểm soát.

### Rollback

1. Tắt read flag để quay về legacy.
2. Retire profile/policy version lỗi.
3. Giữ snapshot phục vụ audit, không xoá ngay.
4. Recompute bằng version trước nếu cần.
5. Mọi cleanup destructive phải là migration riêng sau khi hết thời gian rollback.

Rollback policy không được sửa `activatedAt`, config hoặc kết quả của version cũ. Hệ thống chuyển active pointer về version đã biết tốt, ghi audit action `rollback`, rồi tạo job tính/phân loại lại cho đúng cohort cần thiết.

---

## 12. Deliverables và Definition of Done

### Deliverables

- Prisma migration additive.
- Assessment import/reconciliation script.
- School Profile v2 builder.
- Mastery v4 engine.
- Readiness v4 engine và policy loader.
- Snapshot backfill/resume script.
- Legacy-v4 comparison dashboard.
- Admin Policy Versions, Simulator, Recompute Jobs, Monitoring và Audit.
- Recompute worker/job store có idempotency, checkpoint, retry và scope guard.
- Policy validation schema, role/approval controls và immutable audit log.
- UI read adapter và feature flags.
- Shared user-facing readiness view model, status/reason copy mapping và glossary.
- UI updates cho Home, Overview, Results và Library; School detail/Progress theo quyết định R26.
- Gap advice service/ranking versioned và content deep-link validation.
- UX states cho unverified/computing/stale/unavailable/legacy fallback.
- Accessibility, responsive, authorization, privacy và usability test report.
- Unit/data/integration test suite.
- Runbook deploy, rollback và incident handling.
- Decision log cho R1–R30.

### Definition of Done cho cutover

- Schema và import idempotent.
- 100% profile active có source/version/audit metadata.
- 100% readiness snapshot thỏa invariants.
- Acceptance fixtures được duyệt.
- Shadow comparison được review trên nhiều kiểu user.
- Threshold được calibration hoặc ghi rõ là provisional.
- Candidate policy đã đi qua Draft/Shadow, impact preview và approval; không chỉnh active config tại chỗ.
- Recompute/rollback đã được diễn tập với job pause/resume/retry và version lineage đúng.
- Canary ổn định và rollback đã diễn tập.
- UI giải thích được Mastery, Evidence, Readiness và gate.
- Student/parent/teacher usability review đạt tiêu chí đã chốt; không hiểu readiness là xác suất đỗ.
- Tất cả màn hình dùng cùng status/reason/freshness và không tự tính threshold.
- Recommendation có lý do, đúng topic/band/prerequisite và không có deep link mồ côi trong phạm vi rollout.
- Unverified/stale/computing/error/history-method-change và quyền truy cập đã qua acceptance test.
- Không ghi đè hoặc làm mất dữ liệu legacy trước khi hết rollback window.

---

## 13. Trình tự thực hiện được khuyến nghị

```text
Review R1–R30
→ Additive schema
→ Import versioned assessments
→ Build shadow profiles
→ Backfill mastery/readiness snapshots
→ Comparison + calibration
→ Policy Draft + Simulator + Shadow approval
→ Shared user UX + glossary + recommendation mapping
→ Dual compute
→ Internal/canary read
→ Controlled cutover
→ Observation
→ Legacy cleanup riêng
```

Tài liệu phải được review lại sau mỗi thay đổi lớn về taxonomy, nguồn đề, grading, mastery, evidence, threshold hoặc cấu trúc School Profile. Việc dashboard preview cho kết quả hợp lý là điều kiện cần, không phải điều kiện đủ để migration production.
