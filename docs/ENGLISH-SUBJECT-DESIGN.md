# Thiết kế môn Tiếng Anh (English subject) — Monkey5

> Mở rộng nền tảng luyện thi lớp 6 từ **đơn môn (Toán)** sang **đa môn**, bổ sung
> Tiếng Anh. Nguồn phân tích: dashboard so sánh đề CG vs NTT
> (`dashboard_so_sanh_de_thi_tieng_anh.html`) — 7 file PDF, 3 đề Cầu Giấy
> (2021–2023) + 3 đề Nguyễn Tất Thành (2022–2024).
>
> Quyết định kiến trúc: **MỞ RỘNG nền tảng đa môn, KHÔNG fork repo mới.** ~70%
> hạ tầng (auth, exam runner, attempt, AI essay grading, quota/plan, deploy,
> mastery→readiness pipeline, radar Chart.js) dùng lại được. [Inference] — dựa
> trên đọc schema + lib, chưa đo thực tế.

---

## 0. Phát hiện then chốt định hình thiết kế

**Cả 7 đề là đề giấy — KHÔNG có Listening, KHÔNG có Speaking.** Toàn bộ là
Use of English + Reading + Writing. ⇒ MVP **không cần audio storage / ghi âm**.
Listening & Speaking đẩy sang phase sau.

Hai triết lý ra đề (radar độ khó dashboard):
- **Cầu Giấy = rộng & rời rạc:** ngữ âm, trọng âm, ngữ pháp điểm, đồng/trái
  nghĩa, sửa lỗi, giao tiếp, viết câu kiểm soát. (CG ~48/100)
- **NTT = sâu & tích hợp:** đọc hiểu văn bản thật (~35% đề) + viết đoạn tự do
  chấm rubric + câu suy luận. (NTT ~77/100)

⚠️ Đề CG do trung tâm gõ lại theo trí nhớ → **thiếu phần Reading**. Bank Reading
sẽ NTT-heavy; cần bổ sung nguồn Reading riêng cho CG.

---

## A. Phạm vi kỹ năng (skill scope) — MVP

5 kỹ năng (skill domain) / 10 chuyên đề (topic), gom từ 10 nhóm câu dashboard:

| Kỹ năng (skill) | Chuyên đề (topic) | Đề mạnh |
|---|---|---|
| **Ngữ âm** (`pron`) | Ngữ âm, Trọng âm | CG (chữ ký riêng, 4 câu/đề) |
| **Use of English** (`useofenglish`) | Ngữ pháp, Từ vựng, Đồng/Trái nghĩa, Sửa lỗi | Cả hai |
| **Giao tiếp** (`comm`) | Giao tiếp | Cả hai (2 câu/đề) |
| **Đọc hiểu** (`reading`) | Đọc hiểu | NTT (~35%) |
| **Viết** (`writing`) | Viết câu (kiểm soát), Viết đoạn (tự do) | CG=câu, NTT=đoạn |

Listening / Speaking = **ngoài MVP** (Phase 5).

---

## B. Taxonomy chuyên đề — tái dùng model `Topic`

Thêm 2 cột (`subject`, `skill`); data Toán default `subject="math"`:

```prisma
model Topic {
  id       String @id
  subject  String  @default("math")  // NEW: "math" | "english"
  skill    String?                   // NEW (english): pron|useofenglish|comm|reading|writing
  name     String
  short    String
  ico      String
  color    String
  position Int     @default(0)
}
```

Seed 10 topic English (id/skill/màu lấy thẳng từ dashboard để đồng bộ visual):

| id | skill | name | màu |
|---|---|---|---|
| `en-phon`   | pron         | Ngữ âm              | `#06b6d4` |
| `en-stress` | pron         | Trọng âm            | `#14b8a6` |
| `en-gram`   | useofenglish | Ngữ pháp            | `#3b82f6` |
| `en-vocab`  | useofenglish | Từ vựng             | `#f59e0b` |
| `en-synant` | useofenglish | Đồng/Trái nghĩa     | `#a855f7` |
| `en-error`  | useofenglish | Sửa lỗi             | `#ec4899` |
| `en-comm`   | comm         | Giao tiếp           | `#84cc16` |
| `en-read`   | reading      | Đọc hiểu            | `#ef4444` |
| `en-cwrite` | writing      | Viết câu (kiểm soát)| `#f97316` |
| `en-fwrite` | writing      | Viết đoạn (tự do)   | `#8b5cf6` |

Cấp độ: đổi `L4/L5/NC` → **CEFR `A1/A2/B1`** trong `LevelConfig` (cùng cơ chế).

---

## C. Mô hình Radar (2 radar)

### C1. Radar độ khó đề thi (school profile) — 6 yếu tố English
Copy nguyên từ tab "Đánh giá độ khó" của dashboard:

| Yếu tố | Trọng số | field |
|---|---|---|
| Tải đọc hiểu (văn bản thật + suy luận) | 25% | `readingLoad` |
| Viết sản sinh tự do | 20% | `productiveWriting` |
| Câu vận dụng/suy luận bậc cao | 20% | `higherOrder` |
| Áp lực thời gian (câu/phút) | 15% | `timePressure` |
| Độ sâu & phạm vi từ vựng | 10% | `vocabDepth` |
| Đa dạng kỹ năng/dạng bài | 10% | `skillDiversity` |

### C2. Radar năng lực học sinh (readiness)
Overlay mastery học sinh (5 kỹ năng) lên yêu cầu trường → "% phù hợp CG / NTT".
`User.topicMastery` đã có sẵn; aggregate 10 topic → 5 skill để vẽ 5 trục.

Frontend tái dùng đúng pattern Chart.js radar trong dashboard
(`type:'radar'`, scale 0–100, 2 dataset overlay).

---

## D. Trạng thái hiện có (chấm / mastery / readiness / difficulty)

Bộ khung **đã tồn tại đầy đủ** cho Toán. Bảng tái dùng:

| Hạng mục | File | Tái dùng English |
|---|---|---|
| **Chấm** | `lib/grading/index.ts`, `lib/grading/essay-attempt.ts` (`recomputeAttemptScore` — single source of truth, dùng cả submit & regrade) | Khung 100%. Matcher `numeric/numeric-set/labeled` là Toán → viết mới `english-text`. AI essay → đổi rubric. |
| **Update mastery** | `lib/mastery.ts` (`computeMastery`) — tính lại từ Attempt qua `gradeAnswer`, Beta smoothing | Mastery theo `q.topic` **đã subject-agnostic** → radar kỹ năng chạy ngay. LEVELS/BANDS `L4/L5/NC` hardcoded → đổi CEFR. |
| **Readiness** | `lib/readiness.ts` (`computeReadiness`, `computeAllReadiness`, `getEffectiveReadiness`, `computeGapTop3`) | Công thức `topicWeights·mastery + levelWeights + diffPenalty` dùng lại nguyên; chỉ vướng LEVELS hardcoded. |
| **Difficulty trường** | `lib/school-profiles.ts` (`buildSchoolProfile`, `ensureSchoolProfilesFresh` — auto-rebuild qua `sourceHash`) | Hạ tầng auto-rebuild dùng lại. Công thức 6 yếu tố là Toán (`olympicGeoPct` = topic "hinh"+NC) → viết lại 6 yếu tố English. |
| **Deploy hooks** | `scripts/recompute-mastery-readiness.ts`, `deploy-full.sh` | Dùng lại; chỉ cần chạy theo subject. |

### Hai chỗ phải sửa (dính cứng Toán)

**1. Chưa scope theo môn.** `computeMastery` / `buildSchoolProfile` /
`getAllSchoolProfiles` query toàn bộ Attempt/Question/Profile bất kể `subject`
→ user có cả 2 môn sẽ bị **trộn lẫn**. Phải thêm filter `subject`:
- `computeMastery(userId, subject)` — lọc `attempt.exam.subject`.
- `buildSchoolProfile(school, subject)` — `where: { exam: { school, subject } }`.
- `getAllSchoolProfiles(subject)` + `SchoolProfile` composite id `[school, subject]`.

**2. Taxonomy/công thức Toán hardcoded:**
- `LEVELS = L4/L5/L4+5/NC`, `BANDS`, `bandOf()` (`lib/mastery.ts`) → CEFR.
- Công thức difficulty (`lib/school-profiles.ts:67-73`) → 6 yếu tố English.
  **`timePressure` (line 62) + `diversity` (line 65) đã tính sẵn → dùng lại.**
  Chỉ cần thêm `readingLoad / productiveWriting / higherOrder / vocabDepth` từ
  tag câu hỏi.

### Công thức difficulty English (điền vào `buildSchoolProfile` biến thể English)

| Yếu tố | Cách tính từ Question English |
|---|---|
| `readingLoad` (25%) | % câu topic `en-read` (cộng trọng số subtag `inference`) |
| `productiveWriting` (20%) | có/tỉ lệ `en-fwrite` (essay) + yêu cầu độ dài đoạn |
| `higherOrder` (20%) | tỉ lệ câu subtag `inference`/`application` |
| `timePressure` (15%) | `qcount / minutes` — **đã có** (`timePressure`) |
| `vocabDepth` (10%) | tỉ lệ vocab nâng cao (subtag `collocation`/`idiom`) |
| `skillDiversity` (10%) | số kỹ năng/dạng bài xuất hiện — **đã có** (`diversity`) |

⇒ Lưu `SchoolProfile.factors` (JSON) thay cột cứng để mỗi môn có bộ yếu tố riêng:
```prisma
model SchoolProfile {
  school   String
  subject  String  @default("math")  // NEW
  factors  String  @default("{}")    // NEW: JSON 6-factor (math | english)
  topicWeights String
  levelWeights String
  difficulty   Float
  ...
  @@id([school, subject])            // đổi từ school-only → composite
}
```

---

## E. Backend

### E1. Subject discriminator
Thêm `subject String @default("math")` vào `Exam`, `Question`, `Topic`,
`SchoolProfile`. Data Toán cũ default `"math"` → không vỡ.

### E2. Question types & grading

| Dạng bài | type | matcher | Việc cần làm |
|---|---|---|---|
| Ngữ âm/trọng âm (chọn từ khác) | `mcq` | exact | tái dùng |
| Ngữ pháp/từ vựng/đồng-trái nghĩa/giao tiếp | `mcq` | exact | tái dùng |
| Sửa lỗi gạch chân (chọn A/B/C/D) | `mcq` | exact | UI gạch chân |
| Sửa lỗi đồng âm (sale→sail) | `fill` | **english-text (mới)** | matcher mới |
| Điền từ / cloze trong đoạn | `fill` | **english-text** | + group theo passage |
| Viết câu (sắp xếp/viết lại) | `fill` | **english-text** (tập đáp án) | chấp nhận nhiều đáp án đúng |
| Viết đoạn tự do | `essay` | **AI** | tái dùng `EssayGrade` + rubric mới |

**Matcher mới** `lib/grading/matchers/english/text.ts`: chuẩn hóa hoa-thường,
bỏ dấu câu thừa, chấp nhận **synonym set** + **nhiều đáp án đúng**
(`answerSchema` kiểu `{kind:"text_set", accept:[...]}`). `gradeAnswer()` route
theo `subject`.

**Reading passage grouping** — thêm vào `Question`:
```prisma
groupId    String?   // các câu cùng 1 ngữ liệu
passageRef String?   // id tới Passage
```
+ model mới:
```prisma
model Passage {
  id      String @id @default(cuid())
  examId  String
  title   String?
  body    String
  kind    String  // notice | message | article | cloze
  order   Int     @default(0)
}
```

**AI Writing grading** — tái dùng `LLMSetting` + `EssayGrade` +
`lib/llm/grade-essay.ts`. Đổi **rubric** sang 5 tiêu chí NTT:
**Task / Lexical / Grammar / Cohesion / Length**. Khái quát
`EssayGrade.methodScore/answerCorrect/guessed` (Toán) → JSON `criteria` (5 trục).
Rubric lưu theo subject trong `LLMSetting` (thêm cột `subject` / bảng riêng).

---

## F. Frontend / UI

- **F1. Subject switcher** — header chọn Toán / Tiếng Anh; lọc toàn bộ
  exam/topic/readiness theo `subject`.
- **F2. Exam runner — 3 layout mới:**
  - Reading split-view: passage trái cố định, câu hỏi cuộn phải (mobile:
    passage collapse trên đầu).
  - Error-underline: stem có 4 đoạn gạch chân A/B/C/D click chọn.
  - Cloze inline: ô điền nằm trong dòng văn bản.
  - Viết đoạn: textarea + đếm từ (50–70) → hiện feedback AI sau chấm.
- **F3. Radar charts** (Chart.js): radar 6 yếu tố độ khó (CG vs NTT) +
  radar 5 kỹ năng năng lực học sinh.
- **F4. Topic dashboard English:** 10 thẻ gom theo 5 kỹ năng, màu bảng B.
  Bỏ LaTeX/figure rendering.
- **F5. Results — Writing feedback:** thay 3 badge Toán (đáp số/cách làm/đoán mò)
  bằng 5 badge rubric (Task/Lexical/Grammar/Cohesion/Length) + nhận xét AI.

---

## G. Luồng người dùng (student)

1. Chọn môn → Tiếng Anh.
2. Đặt trường mục tiêu (CG/NTT) → radar độ khó trường + "cần mạnh kỹ năng X".
3. Luyện theo chuyên đề hoặc làm đề full → `Attempt`/`TopicSession` (tái dùng).
4. Viết đoạn được AI chấm theo rubric, có feedback.
5. Radar năng lực + readiness % cập nhật theo từng trường.

Quota/plan/lịch sử (`UserReferenceExam`, `UserTopicSet`, `PlanConfig`) dùng lại.

---

## H. Admin

- Quản lý chuyên đề English (`/admin?tab=topics` lọc subject).
- Quản lý trường English (CG/NTT) + nhập/duyệt 6 yếu tố radar độ khó.
- Import đề (pipeline H bên dưới); QA panel bỏ FIGURE/MATH check, thêm check
  passage thiếu + answer key writing.
- Setup AI rubric Writing (`/admin?tab=llm`) — rubric 5 tiêu chí theo môn.

---

## I. Content pipeline

Bỏ LaTeX/figure. Thay bằng **passage + answer key + tagging skill/topic + subtag**
(`inference`/`collocation`/`idiom`/...) để công thức difficulty tính được.
Giữ pattern override map + seed destructive + audit như Toán. Đề CG thiếu
Reading → ghi rõ, bổ sung nguồn Reading riêng.

---

## J. Lộ trình theo phase

| Phase | Nội dung | Quy mô |
|---|---|---|
| **0. Nền đa môn** | `subject` vào schema + switcher + filter; seed 10 topic/5 skill; CEFR levels; **subject scoping cho computeMastery/buildSchoolProfile/getAllSchoolProfiles** | nhỏ–vừa |
| **1. Use of English MVP** | mcq/fill + matcher `english-text` + UI error-underline; import vài đề | vừa |
| **2. Reading** | model `Passage` + groupId + split-view runner + cloze | vừa |
| **3. Writing AI** | rubric 5 tiêu chí + tái dùng `EssayGrade` + UI feedback | nhỏ (tái dùng nhiều) |
| **4. Radar & Readiness** | difficulty 6-yếu-tố English + 2 radar + readiness % theo trường (port `READINESS-REDESIGN`) | vừa |
| **5. (sau)** | Listening (audio storage) + Speaking (ghi âm + AI phát âm) | lớn — ngoài MVP |

---

## K. Tham chiếu

- `docs/READINESS-REDESIGN.md` — mô hình readiness derived (port sang English).
- `lib/mastery.ts`, `lib/readiness.ts`, `lib/school-profiles.ts` — bộ khung tái dùng.
- `lib/grading/`, `lib/llm/grade-essay.ts` — chấm + AI essay.
- Dashboard nguồn: `dashboard_so_sanh_de_thi_tieng_anh.html`.
</invoke>
