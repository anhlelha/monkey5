# Readiness v4 — Decision log

Ngày chốt: 2026-08-26. Owner quyết định nghiệp vụ: Product owner. Owner triển
khai: Engineering. Các ngưỡng dưới đây vẫn là policy có phiên bản; thay đổi
policy phải đi qua Draft → Review → Shadow → Activation, không sửa bản active.

| ID | Quyết định đã chốt | Dữ liệu/lý do hỗ trợ |
|---|---|---|
| R1 | Profile chỉ dùng đề official canonical. | Tránh reference/private làm lệch yêu cầu của trường. |
| R2 | Ưu tiên point weight khi toàn bộ point hợp lệ; fallback có kiểm soát sang count weight. | Shadow report luôn so sánh cả hai mode. |
| R3 | Dùng taxonomy `math-topic-taxonomy-v1` 13 topic từ artifact GPT-5.6 Sol đã QA. Từ 2026-08-26, student Mastery UI hiển thị trực tiếp 13 topic; nút luyện dùng crosswalk sang content hiện có. | Không trình bày prior 50% khi topic chưa có evidence. |
| R4 | `priorStrength K=4`, `priorMastery=0.5`. | Giá trị preview được chọn; tiếp tục theo dõi sensitivity. |
| R5 | `evidenceTarget N=40`, `evidenceExponent=0.5`, required tối thiểu một câu/cell. | Ngăn prior 50% bị hiểu là kết quả đã xác minh. |
| R6–R9 | Critical share 5%; critical mastery/evidence 55%/50%; status 50/65/75/85%; overall evidence 85%; advanced share/evidence 20%/60%. | Lưu trong policy version, không hard-code ở UI. |
| R10–R13 | Cognitive và Difficulty Index chỉ diagnostic; chưa dùng time factor học sinh hoặc recency decay. | Chưa đủ dữ liệu calibration để đưa vào gate. |
| R14 | Attempt official/reference/private đều có thể đóng góp mastery khi câu hỏi được assessment hợp lệ; nguồn attempt được giữ trong lineage. | Không dùng nguồn đề của attempt để thay đổi School Profile. |
| R15 | Essay dùng partial credit từ `EssayGrade.fraction`; thiếu grade hợp lệ thì không tính evidence/mastery. | Phản ánh đúng điểm thành phần và tránh tự suy đoán. |
| R16–R17 | Profile theo toàn bộ official canonical đã duyệt; readiness là index, không phải xác suất đỗ. | UI bắt buộc dùng vocabulary Mastery/Evidence/Readiness. |
| R18–R19 | Giữ JSON legacy trong rollback window; schema dùng baseline migration + additive migration, không phụ thuộc deploy `db push --accept-data-loss`. | Baseline được kiểm chứng schema trước khi adopt lịch sử migration. |
| R20 | Chỉ admin IT được cấp capability; activation/rollback áp dụng four-eyes. | Hai user admin khác nhau cho create/review/activate hoặc rollback. |
| R21 | Assignment global cho toàn bộ user; vòng đầu không có cohort. Policy và profile có active pointer riêng, không trộn version ngầm. | Phù hợp phạm vi hiện chỉ có IT user quản trị. |
| R22–R23 | DB-backed worker/job item, lease, tối đa 3 attempt, auto-pause khi lỗi >5%; shadow toàn bộ user trước cutover. | Web submit chỉ enqueue best-effort. |
| R24 | Snapshot/job/audit được giữ phục vụ lineage; cleanup destructive là migration riêng sau rollback window. | Audit log append-only ở database boundary. |
| R25–R26 | Ẩn score khi `unverified`; dùng shared card/view model trên Home, Overview, Results, Library và thêm School detail. | Không hiển thị prior như readiness đã xác minh. |
| R27 | Recommendation xếp theo blueprint impact, mastery/evidence gap và gate; deep link chỉ tạo khi có taxonomy mapping. | Mapping thiếu thì UI hiển thị chưa có nội dung phù hợp. |
| R28 | Rollout global all users; chỉ user hiện tại xem breakdown của chính mình, admin dùng capability. Không đưa email/answer vào report. | Shadow report dùng user key đã hash. |
| R29–R30 | Snapshot giữ nguyên policy/profile/methodology lineage; stale/computing/unavailable được gắn nhãn. Thiếu snapshot đúng active version mới fallback legacy, không lấy snapshot version khác. | Read adapter resolve exact active pointers. |

## Trạng thái chuyển sang UI/content taxonomy 13 topic

Dashboard Mastery của học sinh đã chuyển sang hiển thị trực tiếp 13 analytical
topic. Thư viện nội dung vẫn dùng các content topic hiện có; mỗi analytical
topic trỏ tới content phù hợp qua crosswalk đã version hóa.

Việc tách hoàn toàn navigation và ngân hàng nội dung thành 13 topic vẫn là một
migration riêng, chỉ thực hiện khi đủ cả ba điều kiện:

1. 100% topic phân tích có content mapping được review, không còn deep link mồ côi.
2. Nội dung luyện tập và reporting đã có acceptance test cho từng topic mới.
3. Product owner duyệt tác động URL, lịch sử user, dashboard và rollback.

Việc activate Readiness v4 không tự động kích hoạt migration UI này.
