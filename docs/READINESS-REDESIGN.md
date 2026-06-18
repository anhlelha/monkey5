# Thiết kế lại: Mức độ phù hợp (Readiness) theo trường

**Ngày**: 2026-06-14
**Trạng thái**: ✅ **ĐÃ IMPLEMENT XONG** — chạy được trên local (npm run dev), build pass, tsc clean
**Người soạn**: Claude (Opus 4.7)
**Người review**: anhlh48

## Trạng thái thực tế (cập nhật sau implement)

| Phase | Trạng thái | Ghi chú |
|---|---|---|
| 0. Schema + seed-schools | ✅ Done | 7 School rows (6 active + mix inactive), SchoolProfile table sẵn sàng |
| 1. Backend core libs | ✅ Done | lib/schools.ts, lib/mastery.ts, lib/school-profiles.ts, lib/readiness.ts, scripts/preview-school-profiles.ts |
| 2. Integration submitExam + backfill | ✅ Done | Backfill 6/6 users, readiness ~56-59% baseline (do diff <50, penalty âm) |
| 3. User UI | ✅ Done | home/page.tsx: top match, gap top3 card, fallback 50, bỏ opacity. ResultsView: card "hiện tại" thay "tác động" |
| 4. Admin UI | ✅ Done | SchoolsPanel + ReadinessPanel + tab schools/readiness + Sidebar wired |
| 5. Verify | ✅ Done | tsc clean, build pass, dev server lên cleanly, /home → 200 (auth-aware redirect) |

**Số liệu thực tế từ DB**:
- difficulty: cg=23.8, ltv=23.3, ntt=27.2, tx=28.6, nn=30.2, ntl=26.4, nshn≈33.3 (thấp hơn dashboard HTML do timePressure formula khác sample size; tỉ lệ tương đối đúng)
- ~~Readiness baseline cho user chưa luyện gì: ~56-59% (do diff <50 nên penalty âm, đẩy baseline lên)~~
- Note: nếu muốn baseline đúng 50% cho mọi trường khi mastery=0.5, cần re-center difficulty hoặc đổi `DIFF_K` — admin có thể chỉnh sau khi có dữ liệu thực

**Cập nhật calibration 2026-06-14 (round 2)** — đã apply:
- `DIFF_K`: 0.3 → **1.0** (mỗi đơn vị độ khó chênh = 1 điểm readiness).
- Tham chiếu difficulty: hằng số `50` → **mean dynamic** của tất cả `SchoolProfile.difficulty` (compute trong `computeAllReadiness`).
- Hiệu ứng: new user (mastery toàn 0.5) → readiness centered quanh 50% với spread ~10 điểm (LTV/CG ≈ 54%, NSHN ≈ 44%). Trước đó cả 7 trường rơi vào 55-58% (spread 3 điểm — quá sát).
- Backward-compat: `computeReadiness(...)` thêm param `referenceDifficulty` (default = 50) để pure function vẫn callable từ unit test cũ. Caller production luôn đi qua `computeAllReadiness` để có mean dynamic.
- UI Admin: thêm card "Tóm tắt readiness theo trường" trong `/admin?tab=readiness` — hiển thị TB readiness mỗi trường + spread max-min trên 1 thẻ duy nhất, thay vì phải scan từng card histogram.
- Required action: bấm "Recompute all readiness" sau deploy để cập nhật `User.readiness` đã persist.

**File đã chạy thử**:
- `npx tsx scripts/seed-schools.ts` ✓
- `npx tsx scripts/preview-school-profiles.ts` ✓
- `npx tsx scripts/recompute-mastery-readiness.ts` ✓
- `npx tsc --noEmit` ✓ (0 errors)
- `npm run build` ✓
- `npm run dev` ✓ (localhost:3000 sẵn sàng)

---

## Cập nhật 2026-06-18 (round 3): Mastery v2 — bỏ đếm trùng + Beta smoothing + trọng số dải

**Bối cảnh**: tài khoản `mikayeubo@gmail.com` luyện chuyên đề **Thời gian L4 6/6** → mastery hiện **100%**, dù mới làm mình mức L4. Audit phát hiện 3 lỗi trong `computeMastery` cũ; bản v2 này sửa cả 3. File đổi: `lib/mastery.ts` (giữ nguyên `computeReadiness`).

### 3 lỗi của bản cũ
1. **Đếm trùng**: bài luyện chuyên đề tạo *cả* `TopicSession` *và* `Attempt` cùng bộ `set-*`; `computeMastery` gộp cả hai → Thời gian n=**12** thay vì 6 (trọng số gấp đôi đề thật).
2. **Vách đá MIN_SAMPLE**: `n<5 → 0.5`, `n≥5 → đúng/tổng` thô → **6/6 = 100%**, nhảy bậc.
3. **Không xét độ phủ mức độ**: mastery chuyên đề gộp mọi câu bất kể L4/L5/NC → luyện mình L4 vẫn ra cao.

### Công thức v2 (đã implement)
```
# (a) Gom CHỈ từ Attempt theo từng câu (mỗi câu 1 lần) → hết đếm trùng.
#     TopicSession không còn dùng (mọi topic-set đã có Attempt tương ứng).

# (b) Beta smoothing — prior K=4 quan sát ở 0.5 (PRIOR_STRENGTH, PRIOR_MASTERY):
smooth(đúng, tổng) = (đúng + K·0.5) / (tổng + K)
#   6/6 → (6+2)/(6+4) = 0.80   |   0/0 → 0.50 (prior)   |   bỏ vách đá

# (c) Mastery chuyên đề = trung bình có trọng số theo 3 dải, dải chưa làm = prior 0.5:
BAND_WEIGHTS = { L4: 0.30, L5: 0.45, NC: 0.25 }   (L4+5 gộp vào dải L4)
topicMastery[t] = Σ_band BAND_WEIGHTS[band] · smooth(đúng_band, tổng_band)

# Mastery cấp độ = smooth theo từng grade tag (L4/L5/L4+5/NC).
```
**Hệ quả**: muốn topic đạt cao phải làm tốt **cả L4/L5/NC với mẫu đủ**. Topic chỉ-L4 (làm hoàn hảo) bị chặn ở `0.30·0.8 + 0.45·0.5 + 0.25·0.5 = 0.59`. (band chưa làm giữ ở 0.5 — chốt 2026-06-18; knob nghiêm hơn = kéo về 0.40.)

### Dữ liệu trường thật (prod, để tái lập readiness)
**Difficulty 8 trường** (công thức 6 yếu tố — xem dưới) và **mean = 27.35** (anchor `referenceDifficulty`):

| school | cg | ltv | nshm | nn | nshn | ntl | ntt | tx |
|---|---|---|---|---|---|---|---|---|
| difficulty | 23.79 | 23.32 | 23.17 | 30.21 | 36.07 | 26.44 | 27.24 | 28.57 |

Công thức difficulty (`lib/school-profiles.ts`, 0-100):
```
difficulty = %NC·100·0.30 + %L4+5·100·0.15 + (câu/phút)·100·0.20
           + %Tự_luận·0.15 + %Hình_Olympic(hinh&NC)·0.10 + (số_chuyên_đề_có_câu)·1.0
```

**CG topicWeights** (tổng=1): `soh 0.23 · hinh 0.16 · phan 0.14 · log 0.12 · cd 0.11 · xs 0.07 · do 0.06 · ti 0.05 · tuoi 0.04 · tg 0.02`
**CG levelWeights**: `L4 0.20 · L5 0.56 · L4+5 0.09 · NC 0.15`
**Hệ số readiness**: `ALPHA=80 (topic) · BETA=60 (level) · DIFF_K=1.0`, công thức:
```
readiness = 50 + (Σ wₜ·(mₜ−0.5))·80 + (Σ wₗ·(mₗ−0.5))·60 − (difficulty − 27.35)·1.0
```

### Ví dụ cụ thể — mika, readiness CG qua 3 giai đoạn

**① Lúc mới đăng ký (chưa làm gì)** — mọi mastery = 0.5 → topicTerm=0, levelTerm=0:
```
readiness CG = 50 + 0 + 0 − (23.79 − 27.35) = 50 + 3.56 = 53.56 → 54%
```
(CG dễ hơn mean nên được +3.56 — đây là lý do "lúc đầu" không phải 50% mà ~54%.)

**② Sau khi luyện, công thức CŨ (lỗi)** — Thời gian = **100%** (6/6 đếm trùng thành 12/12), các topic/level inflate:
```
readiness CG = 73%
```

**③ Công thức v2 (sau sửa)** — mastery thật của mika:
- topic: tg **59.0%** (was 100%), phan 56.4%, soh 61.6%, hinh 45.5%
- level: L4 76.0%, L5 66.7%, L4+5 71.4%, **NC 50.0% (n=0 — chưa làm câu NC nào)**
```
topicTerm·ALPHA = 0.0426·80 = +3.40
levelTerm·BETA  = 0.1646·60 = +9.88   (chủ yếu từ L5, weight 0.56)
diffPenalty     = (23.79−27.35)·1 = −3.56  → trừ đi = +3.56
readiness CG    = 50 + 3.40 + 9.88 + 3.56 = 66.84 → 67%
```

**Tóm tắt**: `54% (mới) → 73% (cũ, lỗi) → 67% (v2)`. Topic "Thời gian 100%" tụt về 59% (đúng kỳ vọng), nhưng readiness CG chỉ giảm 73→67 vì trọng số tg trong CG rất nhỏ (0.02); readiness phản ánh chủ yếu qua soh/phan (topic nặng) và L5 (level nặng nhất). NC vẫn 50% vì chưa làm câu nào — muốn phạt mạnh hơn cần knob band-chưa-làm < 0.5 (chưa bật).

> ⚠️ **§3 bên dưới (MIN_SAMPLE) đã LỖI THỜI** — giữ lại để tham chiếu lịch sử; logic hiện hành là round-3 ở trên.

---

## Quyết định đã chốt (cập nhật 2026-06-14)

| # | Quyết định | Chi tiết |
|---|---|---|
| 1 | **Cách tiếp cận** | Snapshot/derived — recompute mỗi submit, không cộng/trừ delta |
| 2 | **Baseline** | 50% (đổi từ 0%) |
| 3 | **Nguồn mastery** | Cả `TopicSession` + `Attempt` |
| 4 | **Profile trường** | Compute từ DB tại runtime |
| 5 | **Lưu profile** | Bảng `SchoolProfile` mới (Prisma) |
| 6 | **Độ khó** | Penalty dịch baseline (`DIFF_K = 1.0`, reference = mean difficulty dynamic — calibration 2026-06-14 round 2) |
| 7 | **Trigger rebuild profile** | (a) mỗi `submitExam` + (b) admin button "Refresh profiles" |
| 8 | **Cơ chế phát hiện thay đổi** | Hash-based (`sourceHash = qcount-latestCreatedAt`) — độc lập với mọi script upload |
| 9 | **Discover trường mới** | Auto qua `GROUP BY Exam.school` |
| 10 | **Khi profile thay đổi → user stale** | Admin button "Recompute all readiness" + admin dashboard hiển thị phân bố user theo level |
| 11 | **Metadata trường** | Bảng `School` mới trong Prisma + admin UI (đổi từ `lib/static.ts` hard-code) |
| 12 | **Q4 — Gap advice** | Top 3 chuyên đề cần cải thiện cho target school (Home + Results) |
| 13 | **Q5 — Timeseries** | Bỏ qua vòng đầu — admin dashboard chỉ snapshot hôm nay |
| 14 | **Q6 — Recompute UX** | Sync, block UI với spinner cho đến khi xong (phù hợp <100 user) |

---

## 0. Từ điển thuật ngữ

Đọc trước khi đi vào nội dung. Các thuật ngữ sẽ được dùng xuyên suốt.

| Thuật ngữ kỹ thuật (cập nhật v2) | Nghĩa |
|---|---|
| **`sourceHash`** | Chuỗi `"{số câu}-{timestamp câu mới nhất}"` của một trường. Dùng để phát hiện DB đã thay đổi mà không cần hook vào script upload. Khi hash khác giá trị cũ → rebuild profile. |
| **`ensureSchoolProfilesFresh`** | Hàm chạy trước mỗi compute readiness: kiểm tra hash của từng trường vs profile đã lưu, rebuild nếu lệch. Tự discover trường mới qua `GROUP BY Exam.school`. |
| **`buildSchoolProfile(school)`** | Hàm thuần: lấy mọi Question của 1 trường → tính topicWeight, levelWeight, difficulty, freeTextPct, v.v. Output ghi vào bảng `SchoolProfile`. |
| **`computeMastery(userId)`** | Hàm aggregate TopicSession + Attempt của 1 user → returns `{ topicMastery, levelMastery }`. |
| **`computeReadiness(...)`** | Hàm thuần: nhận mastery + profile của 1 trường → trả số 0-100. Pure function dễ test. |
| **`recomputeAllReadiness`** | Server action cho admin: chạy `computeMastery` + `computeReadiness` cho mọi user → persist. Dùng khi đổi công thức hoặc upload đề mới và muốn update ngay. |
| **`School` table** | Bảng metadata trường (tên, màu, icon, tone CSS, minutes). Khác bảng `SchoolProfile` ở chỗ: `School` là cho admin chỉnh tay (thông tin hiển thị), `SchoolProfile` là dữ liệu auto compute (số liệu thống kê). |
| **`SchoolProfile` table** | Bảng cache thống kê: topicWeight, levelWeight, difficulty per school. Auto rebuild qua `ensureSchoolProfilesFresh`. |


| Thuật ngữ | Nghĩa | Ví dụ / Vị trí trong code |
|---|---|---|
| **Attempt** | 1 lần học sinh **làm xong và nộp một đề thi nguyên cái** (đề trường, đề mix, hoặc đề luyện chuyên đề). Lưu trong bảng `Attempt` của Prisma. Mỗi attempt có: điểm số (`score` 0-100), số câu đúng (`earned`), tổng điểm (`total`), thời gian làm bài (`durationSec`). | `prisma/schema.prisma:139-154` |
| **TopicSession** | 1 lần học sinh **luyện bài theo chuyên đề** (ví dụ: 10 câu Hình học cấp L5). Lưu trong bảng `TopicSession`. Khác với Attempt ở chỗ: TopicSession ghi nhận thông tin chuyên đề + cấp độ, dùng để tính "đã luyện được bao nhiêu mỗi chuyên đề". Mỗi lần làm bài luyện chuyên đề SẼ tạo cả 1 Attempt VÀ 1 TopicSession. | `prisma/schema.prisma:179-192` |
| **Question** | 1 câu hỏi đơn lẻ trong ngân hàng câu hỏi. Có thuộc tính `topic` (chuyên đề thuộc về), `grade` (cấp độ L4/L5/L4+5/NC), `points` (điểm), v.v. | `prisma/schema.prisma:111-137` |
| **Exam** | 1 đề thi — tập hợp nhiều Question. Có thuộc tính `school` (cg/ltv/tx/ntt/mix), `kind` (official/reference/mixed). | `prisma/schema.prisma:89-109` |
| **Topic** (chuyên đề) | 1 trong 10 nhóm: Số học, Hình học, Phân số, Chuyển động, Suy luận logic, Đo lường, Biểu đồ-Thống kê-Xác suất, Toán tuổi, Đại lượng tỉ lệ, Thời gian. | `lib/static.ts` `DEFAULT_TOPICS` |
| **Grade / Level** (cấp độ) | Độ khó câu hỏi: `L4` (lớp 4 cơ bản), `L5` (lớp 5 cơ bản), `L4+5` (tổng hợp), `NC` (nâng cao). | `Question.grade` field |
| **School profile** | "Đặc tính" của 1 trường: trường này thiên về chuyên đề nào, cấp độ nào, độ khó tổng hợp ra sao. Suy ra từ tất cả Question thuộc các Exam của trường đó. | (sẽ tạo) `lib/school-profiles.ts` |
| **topicWeight[school][topic]** | % câu hỏi của trường thuộc về 1 chuyên đề. VD: `topicWeight["cg"]["hinh"] = 0.25` nghĩa là 25% đề CG là câu Hình học. Tổng theo trường = 1.0. | Sẽ compute từ DB |
| **levelWeight[school][level]** | % câu hỏi của trường ở mỗi cấp độ. VD: `levelWeight["cg"]["NC"] = 0.11` ⇒ 11% đề CG là câu Nâng cao. | Sẽ compute từ DB |
| **difficulty[school]** | Chỉ số độ khó tổng hợp 0-100 của trường, tính theo công thức 6 yếu tố (xem mục 4). VD: CG ≈ 56, LTV ≈ 58, TX ≈ 54, NTT ≈ 52. | Sẽ compute từ DB |
| **Mastery** (mức thành thạo) | Số 0-1 thể hiện học sinh "thạo" 1 chuyên đề hoặc cấp độ tới đâu. `0.5` = chưa luyện hoặc làm đúng 50%. `0.8` = làm đúng 80% các câu ở chuyên đề/cấp độ đó. | Lưu `User.topicMastery` |
| **topicMastery[topic]** | Mastery của học sinh ở 1 chuyên đề. = (số câu đúng ở chuyên đề đó) / (tổng câu đã làm ở chuyên đề đó). | `User.topicMastery` JSON |
| **levelMastery[level]** | Tương tự nhưng theo cấp độ (L4/L5/L4+5/NC). | (sẽ thêm field hoặc tính derived) |
| **Readiness** (mức phù hợp) | Số 0-100% cho từng trường, thể hiện học sinh "phù hợp/sẵn sàng" thi vào trường đó tới đâu. Hiển thị trên Dashboard. | `User.readiness` JSON |
| **Baseline** | Giá trị mặc định ban đầu, khi học sinh **chưa luyện gì**. Hiện tại = 0%. Đề xuất mới = 50% (rồi tăng/giảm theo chất lượng). | Logic mới |
| **Penalty dịch baseline** | "Trừ bớt baseline ở trường khó". Trường khó hơn (CG, LTV) thì khi chưa luyện gì, readiness baseline thấp hơn 50% một chút (vd 48%); trường dễ hơn (TX, NTT) thì baseline cao hơn (vd 51%). Lý do: để đạt readiness 70% ở trường khó cần phải giỏi hơn ở trường dễ. | Công thức mới |
| **Target school** | Trường mà học sinh **chọn làm mục tiêu** (lưu trong `User.targets`). Theo thiết kế mới, target KHÔNG ảnh hưởng cách tính readiness — readiness tính cho cả 4 trường bất kể student chọn target nào. Target chỉ dùng để: (a) đánh dấu trên UI, (b) đưa ra gợi ý "cần luyện thêm gì để đạt target". | `User.targets` JSON array |
| **Snapshot recompute** (cách tiếp cận mới) | Mỗi lần học sinh nộp bài, **tính lại** mastery + readiness từ đầu dựa trên toàn bộ lịch sử Attempt + TopicSession. Khác với cách cũ (cộng/trừ delta) — không bị "drift", luôn phản ánh đúng trạng thái hiện tại. | Logic mới |
| **Delta / EMA / Bucket** (cách tiếp cận cũ, đã bỏ) | Mỗi bài nộp xong cộng/trừ một lượng cố định vào readiness. Đơn giản nhưng readiness sẽ dần lệch so với năng lực thực. | Đã bỏ |
| **TS / Prisma / Next.js** | Stack hiện tại: TypeScript, Prisma ORM, Next.js framework. Dev DB = SQLite. | Project setup |

---

## 1. Bối cảnh & vấn đề hiện tại

### 1.1 Yêu cầu của user

> "Hiện tại đang setup mức độ phù hợp là 0, rồi tiến đến 100%. Tôi muốn bắt đầu từ 50%; rồi tuỳ thuộc vào chất lượng, kết quả các bài kiểm tra mà con số này sẽ tăng hoặc giảm…"
>
> "Việc chấm điểm ko phụ thuộc vào việc người học chọn trường mục tiêu là trường nào; kể cả không chọn thì dựa trên độ khó, cấp độ, điểm thành phần của mỗi chuyên đề mà tính ra điểm phù hợp với từng trường. Việc người học chọn trường mục tiêu chỉ là 1 chỉ số để theo dõi; nhưng người học sẽ cần luôn luôn có bức tranh tổng quát xem mình phù hợp trường nào nhất. Còn nếu muốn đi theo trường mục tiêu thì cần cải thiện, tăng cường phần nào."

### 1.2 Code hiện tại (đã review)

**Lưu trữ readiness**
- File: `prisma/schema.prisma:36`
- Field: `User.readiness String @default("{}")`
- Format: JSON string dạng `{ schoolId: 0..100 }`. User mới có map rỗng `{}`.

**Hiển thị readiness — 2 chỗ**
1. Dashboard trang chính
   - File: `app/(app)/home/page.tsx:107`
   - Code: `const r = user.readiness[s.id] ?? 0;` ← rơi về **0** khi chưa có dữ liệu
2. Trang Results sau khi nộp bài
   - File: `app/exam/[examId]/results/[attemptId]/page.tsx:82`
   - Code: `before: user.readiness[s.id] ?? 0` ← cũng rơi về **0**

**Cập nhật readiness — KHÔNG có**
- File `app/exam/[examId]/actions.ts:submitExam()`: chỉ ghi `Attempt`, KHÔNG đụng đến `User.readiness`.
- File `ResultsView.tsx:202-250`: hiển thị một preview "+3% / +1%" cho thấy mức tăng hứa hẹn, NHƯNG con số này KHÔNG bao giờ được lưu vào DB. Sau khi student rời trang Results, lần sau quay lại Dashboard readiness vẫn = 0.

### 1.3 Hệ quả

- Học sinh luyện cả tháng nhưng readiness vẫn 0% trên Dashboard.
- Preview "+3%/+1%" trên trang Results đánh lừa: không phản ánh trạng thái thực.
- Readiness không phân biệt được học sinh giỏi vs. yếu, vì cả 2 cùng = 0%.
- Không có gợi ý "cần cải thiện gì để đạt target".

### 1.4 Tài liệu tham chiếu cho yêu cầu mới

File: `ref_exam/eval/dashboard_so_sanh_de_thi.html`

Tài liệu này định nghĩa profile của 4 trường:
- **10 chuyên đề** (categories) với màu sắc & icon riêng
- **4 cấp độ** L4 / L5 / L4+5 / NC (lớp 4 / lớp 5 / tổng hợp / nâng cao)
- **Per-school metadata**: `minutes` (thời lượng đề), `freeText` (tỉ lệ tự luận), `years` (các năm có đề)
- **Chỉ số độ khó 0-100** = công thức 6 yếu tố:
  - %NC × 30%
  - %L4+5 × 15%
  - Áp lực thời gian (câu/phút) × 20%
  - %Tự luận × 15%
  - %Hình học Olympic × 10%
  - Đa dạng nhóm chuyên đề × 10%

**Lưu ý**: Tất cả dữ liệu này (`Question.topic`, `Question.grade`, `Exam.school`, `Exam.minutes`) đã có sẵn trong Prisma DB — có thể tự compute, không cần parse HTML.

---

## 2. Kiến trúc mới — Snapshot / Derived

### 2.1 Nguyên lý

Thay vì lưu readiness như 1 con số cộng dồn (mỗi bài thi cộng +3/-2…), readiness là **hàm thuần** (pure function) của trạng thái học sinh + profile trường:

```
readiness[school] = f( studentMastery, schoolProfile )
```

Mỗi khi học sinh nộp bài, tính lại **từ đầu** dựa trên toàn bộ Attempt + TopicSession đã có.

**Ưu điểm:**
- Không bị drift theo thời gian (cộng/trừ tích lũy lệch)
- Khi sửa công thức / sửa profile trường, chạy 1 script "recompute all users" là xong, không cần migrate history
- Học sinh xem được "phù hợp trường nào nhất" ngay cả khi không chọn target

### 2.2 Sơ đồ luồng dữ liệu

```
┌─────────────────────────────────────────────────────┐
│  DB tables (đã có)                                  │
│                                                     │
│  ┌────────────────┐  ┌─────────────────┐            │
│  │ Attempt        │  │ TopicSession    │            │
│  │ - examId       │  │ - topic         │            │
│  │ - score        │  │ - level         │            │
│  │ - earned/total │  │ - score/qcount  │            │
│  │ - answers JSON │  │                 │            │
│  └────────────────┘  └─────────────────┘            │
│         │                     │                     │
│         │     ┌─── Question.topic, Question.grade   │
│         │     │       (đã có sẵn cho từng câu)      │
│         ▼     ▼                                     │
│  ┌────────────────────────────────────┐             │
│  │  computeMastery(userId)            │             │
│  │  → topicMastery: {                 │             │
│  │       hinh: 0.72, soh: 0.61, ...   │             │
│  │    }                               │             │
│  │  → levelMastery: {                 │             │
│  │       L4: 0.85, L5: 0.70,          │             │
│  │       L4+5: 0.60, NC: 0.45         │             │
│  │    }                               │             │
│  └────────────────────────────────────┘             │
│                  │                                  │
│  ┌────────────────────────────────────┐             │
│  │  SCHOOL_PROFILES (compute từ DB)   │             │
│  │  topicWeight[school][topic]        │             │
│  │  levelWeight[school][level]        │             │
│  │  difficulty[school]                │             │
│  └────────────────────────────────────┘             │
│                  │                                  │
│                  ▼                                  │
│  ┌────────────────────────────────────┐             │
│  │  computeReadiness(mastery,profile) │             │
│  │  → { cg: 62, ltv: 71, tx: 58,      │             │
│  │      ntt: 49 }                     │             │
│  └────────────────────────────────────┘             │
│                  │                                  │
│                  ▼                                  │
│  Persist: User.readiness, User.topicMastery         │
│                  │                                  │
│                  ▼                                  │
│  UI: Dashboard, Results page, Gap analysis          │
└─────────────────────────────────────────────────────┘
```

---

## 3. Tính Mastery của học sinh

### 3.1 Nguồn dữ liệu — confirmed: Cả TopicSession + Attempt

- **TopicSession**: mỗi row có `topic`, `level`, `score`, `qcount` ⇒ trực tiếp dùng.
- **Attempt**: cần "nổ" ra từng câu — vì `Attempt.answers` là JSON `{ qid: answer }`. Phải:
  1. Lấy `Attempt.examId` → join Exam → lấy danh sách `Question` của đề.
  2. Với mỗi câu, lấy `Question.topic`, `Question.grade`.
  3. So `answers[qid]` với `Question.correct` (qua `gradeAnswer()`) → đúng/sai.
  4. Tích lũy theo topic + level.

Cách này nặng hơn TopicSession nhưng dữ liệu chính xác hơn.

**Tối ưu** (làm sau): cache kết quả per-question vào 1 bảng `AttemptItem { attemptId, qid, topic, grade, correct }` để khỏi parse JSON mỗi lần. Tạm thời cứ làm version đơn giản trước.

### 3.2 Công thức

```typescript
// Pseudo-code

interface MasterySnapshot {
  topicMastery: Record<TopicId, number>;  // 0..1
  levelMastery: Record<LevelId, number>;  // 0..1
  topicSampleSize: Record<TopicId, number>; // số câu đã làm, để tính độ tin cậy
  levelSampleSize: Record<LevelId, number>;
}

function computeMastery(userId: string): MasterySnapshot {
  // Tổng hợp theo topic
  const topicCorrect = {};  // { topic: số câu đúng }
  const topicTotal = {};    // { topic: tổng câu đã làm }
  const levelCorrect = {};
  const levelTotal = {};

  // (1) Từ TopicSession (mỗi row = N câu cùng topic, cùng level)
  for (const s of allTopicSessions(userId)) {
    topicCorrect[s.topic] += s.score;
    topicTotal[s.topic]   += s.qcount;
    levelCorrect[s.level] += s.score;
    levelTotal[s.level]   += s.qcount;
  }

  // (2) Từ Attempt (mỗi attempt = nhiều câu khác topic/level)
  for (const a of allAttempts(userId)) {
    const questions = await getQuestionsForExam(a.examId);
    const answers = JSON.parse(a.answers);
    for (const q of questions) {
      const isCorrect = gradeAnswer(q, answers[q.id]).correct;
      topicTotal[q.topic] += 1;
      levelTotal[q.grade] += 1;
      if (isCorrect) {
        topicCorrect[q.topic] += 1;
        levelCorrect[q.grade] += 1;
      }
    }
  }

  // (3) Tính mastery với fallback 0.5 khi chưa đủ dữ liệu
  const MIN_SAMPLE = 5;  // dưới 5 câu coi như chưa biết
  const topicMastery = {};
  for (const t of ALL_TOPICS) {
    if (topicTotal[t] < MIN_SAMPLE) {
      topicMastery[t] = 0.5;  // baseline
    } else {
      topicMastery[t] = topicCorrect[t] / topicTotal[t];
    }
  }
  // Tương tự cho levelMastery

  return { topicMastery, levelMastery, topicSampleSize, levelSampleSize };
}
```

**Lý do `MIN_SAMPLE = 5`**: tránh đánh giá quá sớm. Học sinh làm 1 câu đúng = 100% mastery hoặc 1 câu sai = 0% mastery đều không phản ánh thực.

---

## 4. School Profiles — Compute từ DB

### 4.1 Nguồn — confirmed: Compute từ DB tại build/runtime

Khi app start (hoặc thuê cache 1 giờ), chạy:

```typescript
async function buildSchoolProfile(schoolId: string): Promise<SchoolProfile> {
  // Lấy tất cả Question của các Exam thuộc trường này (kind = official | reference)
  const questions = await prisma.question.findMany({
    where: {
      exam: { school: schoolId, kind: { in: ["official", "reference"] } },
      active: true,
    },
    select: { topic: true, grade: true, type: true },
  });

  const total = questions.length;
  const topicCount: Record<string, number> = {};
  const levelCount: Record<string, number> = {};
  let freeTextCount = 0;
  let olympicGeoCount = 0;

  for (const q of questions) {
    topicCount[q.topic] = (topicCount[q.topic] ?? 0) + 1;
    levelCount[q.grade] = (levelCount[q.grade] ?? 0) + 1;
    if (q.type === "essay") freeTextCount++;
    if (q.topic === "hinh" && q.grade === "NC") olympicGeoCount++;
  }

  // Chuẩn hoá về tỉ lệ
  const topicWeight = {};
  for (const t of ALL_TOPICS) topicWeight[t] = (topicCount[t] ?? 0) / total;
  const levelWeight = {};
  for (const l of ALL_LEVELS) levelWeight[l] = (levelCount[l] ?? 0) / total;

  // Tính difficulty theo công thức 6 yếu tố từ dashboard HTML
  const ncPct = levelWeight["NC"] * 100;
  const l45Pct = levelWeight["L4+5"] * 100;
  const minutes = await getSchoolAvgMinutes(schoolId);
  const yearsCount = await getSchoolYearsCount(schoolId);
  const timePressure = total / (yearsCount * minutes); // câu/phút
  const freeTextPct = (freeTextCount / total) * 100;
  const olympicGeoPct = (olympicGeoCount / total) * 100;
  const diversity = Object.values(topicCount).filter((c) => c > 0).length;

  const difficulty =
    ncPct * 0.30 +
    l45Pct * 0.15 +
    timePressure * 100 * 0.20 +
    freeTextPct * 0.15 +
    olympicGeoPct * 0.10 +
    diversity * 1.0;

  return { topicWeight, levelWeight, difficulty, minutes };
}
```

### 4.2 Lưu trữ & cache — Bảng `SchoolProfile`

Profile được persist vào DB qua bảng mới:

```prisma
model SchoolProfile {
  school          String   @id        // "cg" | "ltv" | ... (động — bất kỳ school nào trong Exam)
  topicWeights    String              // JSON: { topicId: 0..1 }, tổng = 1.0
  levelWeights   String              // JSON: { "L4": 0..1, "L5":..., "L4+5":..., "NC":... }
  difficulty      Float               // 0-100 (công thức 6 yếu tố)
  minutes         Float               // thời lượng đề trung bình
  totalQuestions  Int                 // số câu compute từ
  freeTextPct     Float               // % câu essay
  olympicGeoPct   Float               // % câu Hình NC
  diversity       Int                 // số chuyên đề có ≥1 câu

  // Cơ chế phát hiện thay đổi (xem § 4.3)
  sourceHash      String              // "{qcount}-{latestCreatedAt.ISO}"
  updatedAt       DateTime @updatedAt
}
```

Một row = 1 trường. Khi thêm trường mới, row tự sinh ra (không cần migration).

### 4.3 Cơ chế phát hiện thay đổi (auto-detect — KHÔNG phụ thuộc script nào)

Mục tiêu: bất kể bạn upload đề bằng `/exam-import` skill, bằng `seed-all-exams.ts`, hay `INSERT` thẳng vào SQLite — hệ thống tự rebuild profile khi cần.

**Cơ chế: hash-based**

```typescript
// lib/school-profiles.ts (sẽ tạo)

async function ensureSchoolProfilesFresh(): Promise<void> {
  // 1. Query digest mỗi trường: count câu + timestamp mới nhất
  const digests = await prisma.$queryRaw<Array<{
    school: string;
    qcount: number;
    latest: Date;
  }>>`
    SELECT e.school,
           COUNT(q.id) as qcount,
           MAX(q.createdAt) as latest
    FROM Question q
    JOIN Exam e ON q.examId = e.id
    WHERE q.active = 1
      AND e.kind IN ('official', 'reference')
    GROUP BY e.school
  `;

  for (const { school, qcount, latest } of digests) {
    const sourceHash = `${qcount}-${latest.toISOString()}`;
    const existing = await prisma.schoolProfile.findUnique({ where: { school } });

    // 3 trường hợp:
    if (!existing) {
      // (a) Trường mới — chưa từng thấy → tạo profile + School metadata mặc định
      const profile = await buildSchoolProfile(school);
      await prisma.schoolProfile.create({ data: { school, ...profile, sourceHash } });
      await ensureSchoolMetadata(school);  // tạo row School mặc định (§ 4.5)
      console.log(`✓ New school detected: ${school} — created profile`);
    } else if (existing.sourceHash !== sourceHash) {
      // (b) Hash khác → có đề mới hoặc thay đổi → rebuild
      const profile = await buildSchoolProfile(school);
      await prisma.schoolProfile.update({
        where: { school },
        data: { ...profile, sourceHash },
      });
      console.log(`✓ Rebuilt profile for ${school}`);
    }
    // (c) Hash giống → bỏ qua
  }
}
```

### 4.4 Trigger points (đa lớp, đã chốt)

| Khi nào | Cost | Mô tả |
|---|---|---|
| **Mỗi `submitExam`** (đã chốt) | 1 query GROUP BY ≈ ms | Trước khi `computeReadiness`, gọi `ensureSchoolProfilesFresh`. Đảm bảo readiness luôn dùng profile mới nhất. |
| **Admin button "Refresh profiles"** (đã chốt) | Tùy số trường | Phòng hờ khi admin muốn force ngay sau re-seed. Hiển thị `updatedAt` của mỗi trường để verify. |
| ~~Dashboard load với TTL 60s~~ | ~~Bỏ~~ | Không cần — dashboard chỉ đọc `User.readiness` đã persist, profile không ảnh hưởng. |
| ~~Server startup~~ | ~~Bỏ~~ | Lazy: submit đầu tiên sẽ tự trigger. |

### 4.5 Discover trường mới

`ensureSchoolProfilesFresh` query `GROUP BY e.school` tự lấy mọi school từ Exam table. Khi xuất hiện school chưa có row `SchoolProfile`, vào nhánh (a) ở trên: tạo profile.

Đồng thời cần tạo `School` metadata (xem § 4.6).

### 4.6 Bảng `School` cho metadata (mới — đã chốt: option b)

Chuyển `SCHOOLS` array từ `lib/static.ts` sang DB. Lý do: cho phép thêm trường mới mà không cần edit code + commit.

```prisma
model School {
  id        String   @id              // "cg" | "ltv" | "tx" | "ntt" | ...
  name      String                    // "THCS Cầu Giấy"
  short     String                    // "CG"
  color     String                    // "#3b82f6" — hex
  tone      String                    // "cg" — CSS class hậu tố
  minutes   Int      @default(90)     // thời lượng đề chuẩn
  position  Int      @default(0)      // thứ tự hiển thị
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Auto-create khi gặp trường mới**:

```typescript
async function ensureSchoolMetadata(schoolId: string): Promise<void> {
  const existing = await prisma.school.findUnique({ where: { id: schoolId } });
  if (existing) return;

  // Tạo row default — admin sẽ vào /admin sửa lại tên/màu
  const palette = ["#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#10b981", "#ec4899"];
  await prisma.school.create({
    data: {
      id: schoolId,
      name: schoolId.toUpperCase(),  // tạm — admin sẽ đổi
      short: schoolId.toUpperCase(),
      color: palette[Math.floor(Math.random() * palette.length)],
      tone: schoolId,
      minutes: 90,
      active: true,
    },
  });
}
```

**Migration step 1 (chỉ 1 lần)**: seed bảng `School` từ `SCHOOLS` hiện tại trong `lib/static.ts`. Script: `scripts/seed-schools.ts`.

**UI thay đổi**: mọi nơi đang import `SCHOOLS` từ `lib/static.ts` → đổi sang fetch `prisma.school.findMany()` qua React Server Components. Danh sách các file đã grep:
- `app/(app)/home/page.tsx`
- `app/(app)/library/page.tsx` (cần check)
- `app/exam/[examId]/results/[attemptId]/page.tsx`
- `components/Bar.tsx` (cần check tone mapping)

**Admin UI mới**: `/admin?tab=schools` — table CRUD cho `School`:
- Add/Edit form: id (chỉ khi tạo), name, short, color picker, tone, minutes, position, active toggle
- Delete: chỉ disable (set `active=false`), không xóa hẳn (vì có Exam tham chiếu)

---

## 5. Công thức Readiness

### 5.1 Tính per-school readiness

```typescript
interface SchoolProfile {
  topicWeight: Record<TopicId, number>;  // tổng = 1.0
  levelWeight: Record<LevelId, number>;  // tổng = 1.0
  difficulty: number;                    // 0-100, ~50 là trung bình
}

const ALPHA = 80;   // độ nhạy theo topic — mastery lệch 0.5 → ±40
const BETA = 60;    // độ nhạy theo level
const DIFF_K = 1.0; // hệ số penalty độ khó (cập nhật 2026-06-14 round 2: 0.3 → 1.0)

function computeReadiness(
  topicMastery: Record<TopicId, number>,
  levelMastery: Record<LevelId, number>,
  profile: SchoolProfile,
  referenceDifficulty: number = 50, // production: mean của tất cả profiles
): number {
  // Topic term: trung bình weighted của (mastery - 0.5)
  let topicTerm = 0;
  for (const t of ALL_TOPICS) {
    const diff = topicMastery[t] - 0.5;  // ∈ [-0.5, +0.5]
    topicTerm += profile.topicWeight[t] * diff;
  }
  // topicTerm ∈ [-0.5, +0.5] khi mastery toàn 0 hoặc toàn 1

  // Level term: tương tự
  let levelTerm = 0;
  for (const l of ALL_LEVELS) {
    const diff = levelMastery[l] - 0.5;
    levelTerm += profile.levelWeight[l] * diff;
  }

  // Difficulty penalty: re-centered quanh mean của các trường (calib 2026-06-14)
  // → new user (0.5 mastery) sẽ sit quanh 50%, spread = DIFF_K × difficulty_range
  const diffPenalty = (profile.difficulty - referenceDifficulty) * DIFF_K;

  // Tổng hợp
  const raw = 50 + topicTerm * ALPHA + levelTerm * BETA - diffPenalty;
  return clamp(Math.round(raw), 0, 100);
}

// computeAllReadiness compute mean dynamic và truyền xuống
function computeAllReadiness(
  topicMastery, levelMastery,
  profiles: Record<string, SchoolProfile>,
): Record<string, number> {
  const list = Object.values(profiles);
  const refDiff = list.length > 0
    ? list.reduce((s, p) => s + p.difficulty, 0) / list.length
    : 50;
  const out = {};
  for (const id of Object.keys(profiles)) {
    out[id] = computeReadiness(topicMastery, levelMastery, profiles[id], refDiff);
  }
  return out;
}
```

### 5.2 Ý nghĩa các tham số

| Tham số | Vai trò | Giá trị đề xuất | Hiệu ứng |
|---|---|---|---|
| `0.5` (baseline mastery) | Mặc định khi chưa luyện | Cố định | Học sinh mới → mastery 0.5 → topic/level term = 0 |
| `ALPHA = 80` | Độ nhạy theo chuyên đề | 80 | Mastery lệch ±0.5 → ±40% readiness từ topic term |
| `BETA = 60` | Độ nhạy theo cấp độ | 60 | Mastery lệch ±0.5 → ±30% readiness từ level term |
| `DIFF_K = 1.0` (calib 2026-06-14) | Penalty độ khó | 1.0 (đã chỉnh từ 0.3) | Trường khó hơn mean 10 đơn vị → baseline thấp 10% (spread 10 điểm giữa hardest/easiest) |
| `referenceDifficulty` (mới 2026-06-14) | Anchor để dịch baseline | mean(profile.difficulty) dynamic | Re-center sao cho new user (0.5 mastery) ≈ 50% mọi trường — tránh đẩy lên 55-58% như trước |
| `MIN_SAMPLE = 5` | Ngưỡng tin cậy mastery | 5 câu | Dưới 5 câu coi như chưa biết, dùng 0.5 |

**Tổng dao động lý thuyết**: readiness ∈ [50 - 40 - 30 - penalty, 50 + 40 + 30 - penalty]. Sau clamp 0-100, hầu hết user thực tế sẽ thấy readiness trong khoảng 20-90%.

### 5.3 Ví dụ tính toán

**Tình huống**: Học sinh mới đăng ký, chưa làm bài nào.

- `topicMastery = { hinh: 0.5, soh: 0.5, ... }` (tất cả 0.5)
- `levelMastery = { L4: 0.5, L5: 0.5, L4+5: 0.5, NC: 0.5 }`
- `topicTerm = 0`, `levelTerm = 0`
- `difficulty` thực tế DB: `{ ltv: 23.3, cg: 23.8, ntl: 26.4, ntt: 27.2, tx: 28.6, nn: 30.2, nshn: 33.3 }`
- Mean = (23.3+23.8+26.4+27.2+28.6+30.2+33.3)/7 ≈ **27.5** → `referenceDifficulty = 27.5`

Kết quả (calib 2026-06-14, DIFF_K = 1.0):
- `readiness[ltv]  = 50 - (23.3-27.5)*1.0 ≈ 54%`
- `readiness[cg]   = 50 - (23.8-27.5)*1.0 ≈ 54%`
- `readiness[ntl]  = 50 - (26.4-27.5)*1.0 ≈ 51%`
- `readiness[ntt]  = 50 - (27.2-27.5)*1.0 ≈ 50%`
- `readiness[tx]   = 50 - (28.6-27.5)*1.0 ≈ 49%`
- `readiness[nn]   = 50 - (30.2-27.5)*1.0 ≈ 47%`
- `readiness[nshn] = 50 - (33.3-27.5)*1.0 ≈ 44%`

→ Spread giữa trường dễ nhất (LTV) và khó nhất (NSHN) = 10 điểm. New user thấy bức tranh rõ: phù hợp nhất LTV/CG, khó nhất NSHN.

*(Cũ — DIFF_K=0.3, ref=50: tất cả 7 trường rơi vào 55-58%, spread 3 điểm — quá sát.)*

**Tình huống**: Sau khi luyện được 1 tháng, có mastery:
- `hinh: 0.7, soh: 0.65, phan: 0.6, ...` (trên trung bình)
- `levelMastery: L4: 0.8, L5: 0.7, L4+5: 0.6, NC: 0.4`

Trường CG (chuyên về Hình NC):
- `topicWeight["hinh"] ≈ 0.25` (25% là Hình)
- `topicTerm += 0.25 × (0.7 - 0.5) = 0.05`
- ... (cộng các topic khác) → giả sử tổng `topicTerm = 0.12`
- `levelWeight["NC"] ≈ 0.11`, `levelMastery["NC"] = 0.4`
- `levelTerm += 0.11 × (0.4 - 0.5) = -0.011`
- ... → giả sử tổng `levelTerm = 0.05`
- `readiness[cg] = 50 + 0.12×80 + 0.05×60 - 1.8 = 50 + 9.6 + 3 - 1.8 = 60.8 → 61%`

---

## 6. Persistence & Trigger

### 6.1 Khi nào tính lại?

Trigger chính: **sau mỗi lần `submitExam` thành công**.

```typescript
// app/exam/[examId]/actions.ts (sửa)

export async function submitExam({ examId, answers, durationSec }: SubmitArgs) {
  // ... (logic chấm điểm như cũ, tạo Attempt, ...) ...
  await prisma.attempt.create({ data: {...} });

  // MỚI: tính lại mastery + readiness
  const mastery = await computeMastery(session.user.id);
  const profiles = await getAllSchoolProfiles();  // cached
  const readiness: Record<string, number> = {};
  for (const schoolId of ["cg", "ltv", "tx", "ntt"]) {
    readiness[schoolId] = computeReadiness(
      mastery.topicMastery,
      mastery.levelMastery,
      profiles[schoolId],
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      topicMastery: JSON.stringify(mastery.topicMastery),
      readiness: JSON.stringify(readiness),
    },
  });

  revalidatePath("/home");
  revalidatePath("/library");
  return { attemptId: attempt.id };
}
```

### 6.2 Backfill user hiện tại

Script `scripts/recompute-mastery-readiness.ts`:

```typescript
// Chạy 1 lần cho mọi user trong DB sau khi deploy code mới
// Hoặc trigger qua admin button (xem § 6.3)
for (const user of await prisma.user.findMany()) {
  const mastery = await computeMastery(user.id);
  const readiness = computeAllReadiness(mastery, profiles);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      topicMastery: JSON.stringify(mastery.topicMastery),
      readiness: JSON.stringify(readiness),
    },
  });
}
```

User chưa có Attempt/Session nào → mastery toàn 0.5 → readiness ≈ 48-49% mỗi trường (tự nhiên).

### 6.3 Admin button "Recompute all readiness" (đã chốt — Q2 = c)

Khi bạn upload đề mới → ensureSchoolProfilesFresh đã rebuild profile. Nhưng user A chưa hoạt động trong 2 tuần thì `User.readiness` của A vẫn là số cũ (tính bằng profile cũ).

**Giải pháp**: trang `/admin?tab=readiness` có button "Recompute readiness for all users":

```typescript
// app/(app)/admin/actions.ts (mới)

export async function recomputeAllReadiness(): Promise<{
  processed: number;
  errors: { userId: string; error: string }[];
}> {
  await ensureSchoolProfilesFresh();  // đảm bảo profile fresh trước
  const profiles = await getAllSchoolProfiles();
  const users = await prisma.user.findMany({ select: { id: true } });

  let processed = 0;
  const errors: Array<{ userId: string; error: string }> = [];
  for (const u of users) {
    try {
      const mastery = await computeMastery(u.id);
      const readiness = computeAllReadiness(mastery.topicMastery, mastery.levelMastery, profiles);
      await prisma.user.update({
        where: { id: u.id },
        data: {
          topicMastery: JSON.stringify(mastery.topicMastery),
          readiness: JSON.stringify(readiness),
        },
      });
      processed++;
    } catch (e) {
      errors.push({ userId: u.id, error: String(e) });
    }
  }
  return { processed, errors };
}
```

Hiển thị progress (server-side action returns count). Có thể chạy batch nếu nhiều user (10/lần).

### 6.4 Admin dashboard: phân bố user theo readiness level (yêu cầu mới — đã chốt)

Trang `/admin?tab=readiness` thêm phần thống kê **histogram/distribution** cho mỗi trường:

```
┌──────────────────────────────────────────────────────────┐
│  Phân bố user theo mức readiness (cập nhật mỗi 5 phút)   │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Trường CG                                           │ │
│  │   80-100% (Sẵn sàng)    ████████ 23 user            │ │
│  │   60-79%  (Đang tiến)   ████████████████ 47 user    │ │
│  │   40-59%  (Cần luyện)   ██████████ 31 user          │ │
│  │   20-39%  (Yếu)         ███ 8 user                  │ │
│  │   0-19%   (Rất yếu)     ▌ 2 user                    │ │
│  │   Total: 111 user · TB: 58% · Median: 62%           │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Trường LTV ... (tương tự)                           │ │
│  └─────────────────────────────────────────────────────┘ │
│  (CG, LTV, TX, NTT, ...)                                 │
│                                                          │
│  [Recompute all readiness]   (button)                    │
│  Lần recompute cuối: 2026-06-14 08:30                    │
└──────────────────────────────────────────────────────────┘
```

**Implementation**:
- React Server Component query `prisma.user.findMany({ select: { readiness: true } })` → parse JSON → bucket count.
- Hoặc cache trong RAM với TTL 5 phút (nhiều user thì query toàn bộ chậm).
- Hiển thị cho mỗi trường active trong bảng `School`.

**Thêm filter**: phân bố theo target school (so sánh user có target=CG có readiness CG cao hơn user không target CG không?). Có thể làm sau.

---

## 7. UI Changes

### 7.1 Dashboard `home/page.tsx`

**Thay đổi 1**: Hiển thị cả 4 trường **bằng quyền** (không ưu tiên target).

```tsx
// CŨ: chỉ làm sáng card khi isTarget
style={{ opacity: isTarget ? 1 : 0.7 }}

// MỚI: tất cả 4 card sáng đều. Target được đánh dấu = badge "Mục tiêu",
//      không bằng opacity.
```

**Thay đổi 2**: Đổi fallback `?? 0` → `?? 50` (tạm; sau khi backfill chạy, mọi user sẽ có giá trị thực).

**Thay đổi 3 (mới)**: Thêm 1 dòng "Trường phù hợp nhất hiện tại: **LTV (71%)**" phía trên 4 card.

```tsx
const sorted = [...readiness4Schools].sort((a, b) => b.value - a.value);
const topMatch = sorted[0];
// Render: "Hiện tại con phù hợp nhất với <b>{topMatch.name}</b> ({topMatch.value}%)"
```

### 7.2 Trang Results `ResultsView.tsx`

**Card "Tác động đến % sẵn sàng"** (line 202-250):

- **Bỏ** công thức `delta = isTested ? 3 : 1`.
- **Thay** bằng: so sánh `before` (readiness trước khi submit) vs `after` (readiness sau khi recompute) — cả 2 đều là giá trị thật, đã persist.
- Mũi tên `→` chuyển màu đỏ nếu giảm.

```tsx
// Server component truyền cả before + after
// before: readiness trước khi submit (lấy từ User row trước update)
// after: readiness sau khi recompute (lấy sau update)

targetSchools.map((s) => {
  const delta = s.after - s.before;
  const tone = delta >= 0 ? "green" : "red";
  // Render: before% → after%, badge ±delta với tone tương ứng
})
```

### 7.3 Gap advice — Top 3 chuyên đề cần cải thiện (đã chốt Q4 = a)

Hiển thị ở 2 chỗ:

**(1) Dashboard `home/page.tsx`**: thẻ mới phía dưới "Top match"

```
┌─────────────────────────────────────────────────────┐
│  🎯 Để đạt mục tiêu CG (hiện 55% → cần 70%)          │
│                                                     │
│  1. Hình học NC      30% → 70%   +6%                │
│     ─────────────────────────────────               │
│     [▓▓▓▓░░░░░░] Luyện ngay                         │
│                                                     │
│  2. Suy luận logic   40% → 70%   +3%                │
│     ─────────────────────────────────               │
│     [▓▓▓▓▓░░░░░] Luyện ngay                         │
│                                                     │
│  3. Chuyển động      50% → 70%   +2%                │
│     ─────────────────────────────────               │
│     [▓▓▓▓▓▓░░░░] Luyện ngay                         │
└─────────────────────────────────────────────────────┘
```

**(2) Trang Results**: thêm vào sau card "Tác động đến % sẵn sàng"

Cùng nội dung — thanh navigation `Luyện ngay` link sang `/topics/{topicId}`.

**Logic chọn Top 3**:

```typescript
// lib/readiness.ts
interface GapItem {
  topicId: string;
  currentMastery: number;       // 0..1
  targetMastery: number;         // 0..1, thường = 0.7
  potentialReadinessGain: number; // %
}

export function computeGapTop3(
  topicMastery: Record<string, number>,
  schoolProfile: SchoolProfile,
  targetMastery = 0.7,
): GapItem[] {
  const gains: GapItem[] = [];
  for (const t of Object.keys(schoolProfile.topicWeights)) {
    const cur = topicMastery[t] ?? 0.5;
    if (cur >= targetMastery) continue;  // đã đạt
    const gap = targetMastery - cur;     // > 0
    const gain = schoolProfile.topicWeights[t] * gap * ALPHA;
    gains.push({
      topicId: t,
      currentMastery: cur,
      targetMastery,
      potentialReadinessGain: Math.round(gain),
    });
  }
  return gains.sort((a, b) => b.potentialReadinessGain - a.potentialReadinessGain).slice(0, 3);
}
```

**Edge cases**:
- Target school chưa được set (user không chọn target) → bỏ qua thẻ này hoặc thay bằng "Trường nào con phù hợp nhất?" (xem § 7.1).
- Target đã đạt 100% → hiển thị "🎉 Con đã sẵn sàng cho CG! Hãy thử mục tiêu cao hơn?"
- User không có target nào trong `User.targets` → đề xuất theo top match.

---

## 8. Tham số có thể điều chỉnh sau

Các giá trị bạn có thể muốn tinh chỉnh khi có dữ liệu thực:

| Tham số | Default | Vị trí | Mục đích chỉnh |
|---|---|---|---|
| `ALPHA` (topic sensitivity) | 80 | `lib/readiness.ts` | Nếu thấy readiness nhảy quá nhanh/chậm theo chuyên đề |
| `BETA` (level sensitivity) | 60 | `lib/readiness.ts` | Tương tự cho cấp độ |
| `DIFF_K` (difficulty penalty) | **1.0** (calib 2026-06-14, was 0.3) | `lib/readiness.ts` | Tăng nếu muốn phân biệt rõ hơn giữa trường khó/dễ. Spread = DIFF_K × difficulty_range. |
| `referenceDifficulty` (anchor) | mean dynamic (compute trong `computeAllReadiness`) | `lib/readiness.ts` | Để hằng số nếu muốn baseline lệch theo độ khó tuyệt đối; để dynamic nếu muốn new user ≈ 50% mọi trường |
| `MIN_SAMPLE` (sample threshold) | 5 | `lib/mastery.ts` | Tăng nếu thấy mastery biến động nhiều khi mới làm vài câu |
| Baseline mastery | 0.5 | `lib/mastery.ts` | Có thể đổi nếu muốn khởi đầu lạc quan/bi quan hơn |
| Difficulty weights (6 yếu tố) | 30/15/20/15/10/10 | `lib/school-profiles.ts` | Theo công thức HTML; có thể tinh chỉnh sau khi có dữ liệu |
| Cache TTL school profiles | 60 phút | `lib/school-profiles.ts` | Tăng nếu DB ít đổi |

---

## 9. Files mới / cần sửa

### 9.1 Backend / lib

| File | Hành động | Nội dung |
|---|---|---|
| `prisma/schema.prisma` | **Sửa** | Thêm model `SchoolProfile` + model `School` |
| `lib/readiness.ts` | **Tạo mới** | Pure functions: `computeReadiness()`, `computeAllReadiness()` |
| `lib/mastery.ts` | **Tạo mới** | `computeMastery(userId)` — aggregate từ TopicSession + Attempt |
| `lib/school-profiles.ts` | **Tạo mới** | `ensureSchoolProfilesFresh()`, `buildSchoolProfile()`, `getAllSchoolProfiles()` |
| `lib/schools.ts` | **Tạo mới** | Fetch + cache `School` rows (thay `SCHOOLS` constant trong `lib/static.ts`) |
| `lib/static.ts` | **Sửa** | Bỏ `SCHOOLS` array (đã chuyển sang DB), giữ `MIX_SCHOOL` + `DEFAULT_TOPICS` |

### 9.2 Server actions / API

| File | Hành động | Nội dung |
|---|---|---|
| `app/exam/[examId]/actions.ts` | **Sửa** | Sau `Attempt.create()` → `ensureSchoolProfilesFresh()` → recompute mastery+readiness → update User |
| `app/(app)/admin/actions.ts` | **Tạo mới hoặc sửa** | `recomputeAllReadiness()`, `refreshSchoolProfiles()`, CRUD `School` |

### 9.3 UI

| File | Hành động | Nội dung |
|---|---|---|
| `app/(app)/home/page.tsx` | **Sửa** | Fetch SCHOOLS từ DB, fallback `?? 50`, bỏ opacity-by-target, thêm "Top match" line |
| `app/exam/[examId]/results/[attemptId]/page.tsx` | **Sửa** | Truyền cả `before` + `after` readiness cho ResultsView |
| `app/exam/[examId]/results/[attemptId]/ResultsView.tsx` | **Sửa** | Card "Tác động" hiển thị before→after thật |
| `app/(app)/admin/page.tsx` | **Sửa** | Thêm tab `?tab=schools` + `?tab=readiness` |
| `app/(app)/admin/SchoolsPanel.tsx` | **Tạo mới** | CRUD bảng School (table + add/edit form + color picker) |
| `app/(app)/admin/ReadinessPanel.tsx` | **Tạo mới** | Histogram phân bố user + button "Refresh profiles" + button "Recompute all readiness" |

### 9.4 Scripts & migration

| File | Hành động | Nội dung |
|---|---|---|
| `scripts/seed-schools.ts` | **Tạo mới** | Migration: copy SCHOOLS từ `lib/static.ts` cũ vào DB. Chạy 1 lần. |
| `scripts/recompute-mastery-readiness.ts` | **Tạo mới** | Backfill standalone (chạy CLI sau deploy) |
| `scripts/preview-school-profiles.ts` | **Tạo mới** | Dev helper: in profile mọi trường ra console để verify |
| `scripts/seed-all-exams.ts` | **Không sửa** | Giữ nguyên — auto-detect sẽ rebuild profile lần submit kế tiếp |

### 9.5 Tests

| File | Hành động | Nội dung |
|---|---|---|
| `lib/__tests__/readiness.test.ts` | **Tạo mới** | Edge case: mastery toàn 0.5, toàn 1, toàn 0, weighted nontrivial |
| `lib/__tests__/mastery.test.ts` | **Tạo mới** | Aggregate logic, MIN_SAMPLE fallback |
| `lib/__tests__/school-profiles.test.ts` | **Tạo mới** | Hash detection, dynamic school discovery |

### 9.6 Không thay đổi

- Logic chấm điểm (`lib/grading/*`) — giữ nguyên
- `auth.ts` — không thay đổi
- `User.readiness` + `User.topicMastery` JSON field — giữ nguyên schema, chỉ thay đổi cách ghi

---

## 10. Câu hỏi đã chốt — không còn câu mở

| Câu | Quyết định | Lý do |
|---|---|---|
| **Q4** — Gap advice | **(a) Top 3 đơn giản** | Đủ thông tin cho học sinh + phụ huynh, không tốn UI |
| **Q5** — Timeseries snapshot | **Bỏ qua vòng đầu** | Phân bố hôm nay đã đủ; thêm timeseries cần cron job + storage, để sau |
| **Q6** — Recompute UX | **Sync, block UI + spinner** | Project có <100 user, recompute mất ~5-30s là chịu được; đơn giản nhất |

**Mở rộng tương lai** (KHÔNG implement vòng đầu, ghi lại để khỏi quên):
- Khi user vượt 100: chuyển Q6 sang background job pattern.
- Khi admin muốn track xu hướng (xem nhiều tháng): thêm cron weekly snapshot.
- Khi muốn gợi ý chuyên đề tinh vi hơn: extend Top 3 → top 5, hoặc thêm filter theo cấp độ (NC vs L5).

---

## 11. Roadmap triển khai

### Phase 0: DB schema (0.5 ngày)
1. Sửa `prisma/schema.prisma` thêm `SchoolProfile` + `School`
2. `npx prisma db push` (dev) — không cần migration history theo CLAUDE.md
3. Chạy `scripts/seed-schools.ts` để migrate SCHOOLS từ `lib/static.ts` sang DB

### Phase 1: Backend core (2 ngày)
4. Tạo `lib/schools.ts` (fetch+cache School rows) + sửa các nơi đang `import { SCHOOLS } from "lib/static"`
5. Tạo `lib/mastery.ts` + unit test
6. Tạo `lib/school-profiles.ts` với `ensureSchoolProfilesFresh()` (hash-based detection) + unit test
7. Tạo `lib/readiness.ts` + unit test
8. Tạo `scripts/preview-school-profiles.ts` để verify số liệu

### Phase 2: Integration (0.5 ngày)
9. Sửa `app/exam/[examId]/actions.ts`: sau `Attempt.create` → ensure fresh + recompute + persist
10. Tạo `scripts/recompute-mastery-readiness.ts` (backfill standalone)
11. Backup DB → chạy backfill 1 lần

### Phase 3: User-facing UI (1 ngày)
12. Sửa `home/page.tsx` (fallback 50, top match line, bỏ opacity-by-target)
13. Sửa results page: truyền `before`/`after` readiness thật
14. Sửa `ResultsView.tsx`: card "Tác động" hiển thị before→after thật
15. Thêm gợi ý "Top 3 cải thiện" (chờ confirm Q4)

### Phase 4: Admin UI (1.5 ngày)
16. Tạo `SchoolsPanel.tsx`: CRUD bảng School với color picker
17. Tạo `ReadinessPanel.tsx`: histogram phân bố user + button refresh profiles + recompute all
18. Tạo admin server actions: `refreshSchoolProfiles()`, `recomputeAllReadiness()`, CRUD School

### Phase 5: Test & polish (1 ngày)
19. Manual test: tạo user mới, làm vài bài, verify readiness tăng/giảm đúng
20. Verify công thức difficulty so với `dashboard_so_sanh_de_thi.html` (sai số ≤ 1.0)
21. Test khi thêm trường mới: tạo Exam.school = "test" → verify profile + School auto-tạo
22. Test stale recompute: thay đổi profile → bấm admin button → verify user readiness đổi

**Tổng**: ~6-7 ngày làm việc (tăng từ 3-4 do thêm Phase 0 + Phase 4).

---

## 12. Risks & open questions

| Risk | Mitigation |
|---|---|
| Compute mastery từ Attempt chậm (cần parse JSON answers) | Phase 1 chấp nhận; sau cache vào bảng `AttemptItem` nếu cần |
| User backfill chạy lỗi giữa chừng | Wrap trong transaction per-user; resume bằng cách skip user đã có `topicMastery` ≠ "{}" |
| Profile trường thay đổi khi admin sửa câu hỏi | Cache TTL 60 phút; admin bấm "Refresh profiles" để force |
| Công thức difficulty mismatch với HTML | Có script `preview-school-profiles.ts` in ra để verify thủ công |
| User confused vì 4 trường đều ~48% lúc đầu | Thêm tooltip "Mức 50% là khởi đầu — luyện thêm để tăng" |

---

## 13. Sign-off

- [x] Reviewed by user (anhlh48) — round 1+2+3: 2026-06-14
- [x] Q1 (mastery source) = Cả TopicSession + Attempt
- [x] Q2 (profile source) = Compute từ DB
- [x] Q3 (difficulty) = Penalty dịch baseline
- [x] Storage = bảng SchoolProfile mới
- [x] Trigger rebuild = submitExam + admin button
- [x] Stale user handling = admin button + dashboard
- [x] Metadata trường mới = bảng School + admin UI
- [x] **Q4 (gap advice)** = Top 3 đơn giản
- [x] **Q5 (timeseries)** = Bỏ qua vòng đầu
- [x] **Q6 (sync vs background)** = Sync với spinner
- [x] Tham số ALPHA=80 / BETA=60 / ~~DIFF_K=0.3~~ → **DIFF_K=1.0 + reference=mean dynamic** (calib 2026-06-14 round 2) / MIN_SAMPLE=5
- [ ] **READY TO IMPLEMENT** — sẵn sàng bắt đầu Phase 0

### Quyết định cuối: chốt giữ default tham số hay điều chỉnh trước khi code?

Các tham số trong `lib/readiness.ts` (cập nhật 2026-06-14 round 2):
- `ALPHA = 80` — độ nhạy theo chuyên đề
- `BETA = 60` — độ nhạy theo cấp độ
- `DIFF_K = 1.0` — penalty độ khó (calibrated từ 0.3 sau khi xem dashboard new user spread quá sát 55-58%)
- `referenceDifficulty = mean(profile.difficulty)` — anchor động trong `computeAllReadiness` (đổi từ hằng số 50) để new user (0.5 mastery) trải xung quanh 50%, spread = 10 điểm giữa LTV/CG (dễ nhất) và NSHN (khó nhất)
- `MIN_SAMPLE = 5` — ngưỡng tin cậy mastery
- `targetMastery = 0.7` — ngưỡng "đạt mục tiêu" cho gap advice

→ Đợi data thêm 1-2 tháng nữa rồi xem có cần tinh chỉnh tiếp ALPHA/BETA không.
