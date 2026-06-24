# Thiết kế: Bộ luyện riêng theo từng học sinh (Personalized Remedial Sets)

> Trạng thái: **P1 đã triển khai (local, chưa deploy)** — schema + 4 điểm chạm + trang `/luyen-rieng` + sidebar + seed bộ đầu tiên cho mika. P2/P3 chưa làm.
>
> Triển khai P1 (2026-06-24):
> - `prisma/schema.prisma`: `Exam.ownerUserId/position/active/archivedAt` (+ index). Đã `db push`.
> - `app/(app)/library/page.tsx`: lọc `ownerUserId: null`. `app/api/reference-exams/claim/route.ts`: loại `ownerUserId != null`.
> - `app/exam/[examId]/page.tsx`: guard owner-only. `app/(app)/layout.tsx`: tính `assignedCount`. `components/Sidebar.tsx`: mục "Bài thầy giao" → `/luyen-rieng` (ẩn khi 0 bài).
> - `app/(app)/luyen-rieng/page.tsx`: trang danh sách bài.
> - `scripts/seed-remedial-mika.ts`: 9 bài / 64 câu cho `mikayeubo@gmail.com`; wired vào `scripts/setup-remote.sh` (block RUN_SEED). Idempotent qua exam id `rmd-<userId>-<key>`.
> Liên quan: `public/ref_exam/4B0/LuyenTap-ChuyenDe.md`, `BaoCao-DanhGia.md`; readiness (`docs/READINESS-REDESIGN.md`).

## 1. Mục tiêu & tầm nhìn

Tính năng (không phải one-off): mỗi học sinh có thể được giao **các bài luyện nhỏ, riêng tư, theo kỹ năng**. Về sau, một **trợ lý AI đánh giá cá nhân** đọc lịch sử làm bài → xác định kỹ năng yếu → tự sinh/khuyến nghị bộ luyện riêng, cập nhật định kỳ.

Nguyên tắc: "**mỗi bài nhỏ = 1 Exam**, bộ luyện của một học sinh = tập các Exam thuộc về học sinh đó". Số lượng bài biến thiên (9 hôm nay, 10 hôm sau) chỉ là thêm/bớt hàng — **không đụng schema**.

## 2. Khoảng trống hiện tại (đã xác minh trong code)

| Thành phần | Hành vi hiện tại | Vấn đề |
|---|---|---|
| `app/(app)/library/page.tsx` | `prisma.exam.findMany()` — catalog CHUNG, lọc theo tab trường/kind | Không có khái niệm "đề riêng của 1 user" |
| `UserReferenceExam` + `api/reference-exams/claim` | Pool reference dùng chung, claim FIFO theo quota | Không nhắm đích người dùng cụ thể |
| `app/exam/[examId]/page.tsx` | `findUnique` rồi chạy | Không gác quyền sở hữu |
| Sidebar (student) | 5 mục: Trang chính / Đề thi mẫu / Luyện chuyên đề / Kết quả / Hướng dẫn | Chưa có mục cho bài được giao |

→ Hệ thống **chưa có** cơ chế gán đề riêng cho một học sinh.

## 3. Mô hình dữ liệu

Thêm vào `model Exam` (đều nullable / có default → **backward-compatible với `db push`**, không phá đề công khai):

```prisma
ownerUserId String?   // null = đề công khai (như cũ); set = bài riêng của user này
position    Int     @default(0)   // thứ tự hiển thị trong "Bài thầy giao"
active      Boolean @default(true) // false = đã lưu trữ (KHÔNG xóa — bảo toàn lịch sử)
archivedAt  DateTime?
// (P3) batchId String?  // gom các bài cùng một "đợt giao" / một lần AI đánh giá
```

Lý do từng cột:
- **`ownerUserId`** — phạm vi riêng tư. Đây là nền của cả tính năng.
- **`position`** — khi số bài thay đổi, danh sách vẫn có thứ tự ổn định (admin/AI sắp lại được).
- **`active` / `archivedAt`** — khi AI/thầy cập nhật bộ, bài cũ được **archive** thay vì xóa. ⚠️ `Attempt.exam` đang `onDelete: Cascade` → **xóa Exam = xóa luôn lịch sử làm bài**; archive để giữ tiến độ + mastery.
- **`batchId`** (để dành P3) — gom các bài của cùng một lần đánh giá, để hiển thị "đợt luyện tuần này" và so tiến bộ giữa các đợt.

Mỗi `Question` trong bài riêng **vẫn gắn `topic` id chuẩn** (1 trong 10 chuyên đề hệ thống) + `grade` → vẫn cộng vào mastery/readiness như đề thường. Đính kèm `source` tag (vd `4b0-remedial-<userId>`) để seed idempotent.

> Lưu ý map chuyên đề: 9 nhóm kỹ năng trong file luyện là **kỹ năng nhỏ**, không phải 10 topic hệ thống. Khi seed, mỗi câu nhận topic id tương ứng (phan/soh/hinh/do/ti/xs/tuoi/log…). Bảng map chi tiết: xem `BaoCao-DanhGia.md` + phần 6 dưới.

## 4. Điểm chạm code (P1)

1. **Library** (`library/page.tsx`): query thêm điều kiện `ownerUserId IN (null, me)`; KHÔNG trộn bài riêng vào lưới trường công khai.
2. **Trang mới** `app/(app)/luyen-rieng/`: list `exam where ownerUserId = me AND active` `orderBy position`. Tái dùng UI thẻ của Library.
3. **Sidebar**: thêm mục **"Bài thầy giao"** dưới "Luyện chuyên đề"; ẩn/empty-state nếu user chưa có bài nào.
4. **Claim route** (`api/reference-exams/claim`): loại `ownerUserId != null` khỏi pool (tránh phát nhầm bài riêng cho người khác).
5. **Exam runner** (`exam/[examId]/page.tsx`): nếu `exam.ownerUserId != null && != viewer` → `notFound()`.

## 5. UX — mika đăng nhập thấy gì

```
Sidebar:
  🏠 Trang chính
  📚 Đề thi mẫu
  ▦  Luyện chuyên đề
  🎯 Bài thầy giao        ← MỚI (chỉ user có bài mới thấy nội dung)
  📈 Kết quả gần đây
  📖 Hướng dẫn sử dụng

Trang "Bài thầy giao" (route `/luyen-rieng`):
  ┌─ Bài thầy giao cho con ──────────────────────────┐
  │  [Phân số — rút gọn & so sánh]      14 câu        │
  │  [Toán lời văn & suy luận]          12 câu        │
  │  [Dãy & tổng phân số]               10 câu        │
  │  [Hình bình hành & hình thoi]        5 câu        │
  │  … (mỗi thẻ = 1 Exam riêng, bấm vào làm & chấm)   │
  └───────────────────────────────────────────────────┘
```

Đóng gói: **nhiều bài nhỏ theo kỹ năng** (theo 9 nhóm A–I của file luyện), gộp vài nhóm quá ngắn (H, I) cho cân ~10–15 câu/bài.
**Không hiện nhãn ưu tiên (🔴🟠🟡)** cho học sinh — chỉ hiện tên kỹ năng. Mức ưu tiên dùng nội bộ để sắp `position`.

## 6. Lộ trình

| Pha | Nội dung | Phụ thuộc |
|---|---|---|
| **P1** | Schema (ownerUserId/position/active); lọc 4 điểm chạm + trang + sidebar. Chuẩn hóa `LuyenTap-ChuyenDe.md` → JSON câu hỏi (mcq→letter, fill→value, tự luận→essay+đáp số, gắn topic/grade). Seed standalone idempotent (`source:"4b0-remedial-<mikaId>"`) tạo Exam(ownerUserId=mika)+Questions, wire vào `setup-remote.sh`. | — |
| **P2** | Admin UI: chọn học sinh → tạo bài riêng (chọn câu từ bank / dán câu mới) → set ownerUserId/position. Lặp lại không cần script. | P1 |
| **P3** | AI đánh giá cá nhân: đọc Attempt/TopicSession/mastery → LLM (tái dùng `lib/llm`) xác định kỹ năng yếu + sắp chuỗi → tự tạo Exam(ownerUserId) theo `batchId`. Cập nhật định kỳ, archive đợt cũ. | P1, P2 |

## 7. Quyết định đã chốt

- Mỗi bài nhỏ = 1 Exam; bộ = tập Exam theo `ownerUserId`. Số bài biến thiên không ảnh hưởng schema.
- Thêm `position` (thứ tự) và `active/archivedAt` (lưu trữ thay vì xóa — bảo toàn lịch sử/mastery) ngay từ P1.
- Đóng gói "nhiều bài nhỏ theo kỹ năng".
- `batchId`/"đợt giao" để dành P3.
- **Tên menu: "Bài thầy giao".**
- **Route: `/luyen-rieng`.**
- **Không hiện nhãn ưu tiên** cho học sinh (chỉ tên kỹ năng); ưu tiên chỉ dùng nội bộ để sắp `position`.
- **Bài riêng nằm NGOÀI quota** — không tính vào `referenceExamLimit`. Claim route loại `ownerUserId != null` (đã nêu ở mục 4) nên không đụng bộ đếm quota.

## 8. (Đã chốt toàn bộ — không còn câu hỏi mở)
