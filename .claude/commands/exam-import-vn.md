---
description: Pipeline import/audit đề thi Tiếng Việt lớp 6 (CG/NTT/LTV) từ PDF vào DB Monkey5
argument-hint: <trường> <năm> [import|audit|fix] [chi tiết...]
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Monkey5 Vietnamese Exam Import Pipeline

Agent xử lý pipeline đề thi **Tiếng Việt** (môn `subject="vietnamese"`) cho Monkey5
tại `/Users/anhlh48/00.AIProjects/99.Monkey5`. Pipeline RIÊNG, đơn giản như English:
KHÔNG LaTeX, KHÔNG figure/metadata layer. Nguồn sự thật = 1 file JSON / đề →
seed thẳng vào DB.

**User request**: $ARGUMENTS

Ý định:
- **import** → có PDF mới, đưa vào DB (Workflow A).
- **audit** / **đối chiếu** → so PDF gốc với DB, báo lệch (Workflow B).
- **fix** → sửa câu/đáp án cụ thể (Workflow C).

---

## §1. Kiến trúc dữ liệu (đọc trước)

```
PDF (public/ref_exam/TV/<TRƯỜNG>/*.pdf)
   │ pdftotext -layout  (đề text-based)  HOẶC  pdftoppm -png + Read ảnh (đề scan)
   ▼
scripts/vn-exams/<examId>.json   ← SOURCE OF TRUTH (1 đề = 1 file, review tay, ĐÃ COMMIT)
   │ scripts/seed-vietnamese.ts   (idempotent, destructive PER EXAM)
   ▼
prisma/dev.db  (Exam/Question/Passage, subject="vietnamese")  ← runtime SoT
   ▼
app/exam/[examId]/page.tsx → ExamRunner  (render ngữ liệu thơ/văn + câu)
```

Đặc thù Tiếng Việt:
- KHÔNG dùng `exam-overrides.ts` / `build-exams-metadata.ts` / metadata layer.
- Đáp án nằm THẲNG trong JSON (`correct`, `accept`, `modelAnswer`).
- Phần lớn **PHẦN TỰ LUẬN** (đặt câu, nêu biện pháp tu từ, cảm thụ, viết đoạn/bài)
  là `type:"essay"` — AI chấm theo **rubric 5 tiêu chí văn** (nội dung/cảm thụ/
  diễn đạt/chính tả/sáng tạo). Đáp án mẫu / dàn ý → field `modelAnswer` (key cho AI).
- Taxonomy/difficulty ở `lib/subjects.ts` (VIETNAMESE_TOPICS/SKILLS/FACTORS);
  văn-grader ở `lib/llm/grade-vietnamese.ts`. Chấm fill = matcher `text_set`
  (`lib/grading/matchers/english/text.ts`) — **GIỮ DẤU tiếng Việt** (không bỏ dấu).

---

## §2. Trường & ID

| Code | Trường | examId | questionId |
|---|---|---|---|
| `cg`  | THCS Cầu Giấy        | `vn-cg-2021`   | `vn-cg-2021-q5` (seed tự sinh) |
| `ntt` | Nguyễn Tất Thành     | `vn-ntt-2023`  | `vn-ntt-2023-q22` |
| `ltv` | Lương Thế Vinh       | `vn-ltv-2022`  | `vn-ltv-2022-q10` |

examId = `vn-{school}-{year}`. questionId = `{examId}-q{num}` (seed tự gắn, đánh số
LẠI tuần tự 1..N theo thứ tự mảng `questions` — `num` trong JSON chỉ để bạn theo dõi).

---

## §3. JSON schema (1 file / đề trong `scripts/vn-exams/`)

```jsonc
{
  "id": "vn-ntt-2023", "subject": "vietnamese", "school": "ntt",
  "year": "2022-2023", "minutes": 45,
  "title": "Tiếng Việt vào 6 — THCS & THPT Nguyễn Tất Thành 2022-2023",
  "intro": "Nguồn: ... Thời gian 45 phút.",
  "passages": [
    { "ref": "p1", "title": "Tên đoạn/bài", "kind": "poem|article", "body": "câu 1\\ncâu 2..." }
  ],
  "questions": [
    { "num": 1, "type": "mcq", "topic": "vn-vocab", "grade": "TH", "points": 1,
      "tags": [], "stem": "...", "options": [{"id":"A","text":"..."}, ...], "correct": "B" },
    { "num": 2, "type": "fill", "topic": "vn-wordform", "grade": "TH", "points": 1,
      "tags": ["bay"], "stem": "Tìm từ láy trong đoạn...", "correct": "xôn xao",
      "accept": ["xôn xao, ngân nga","ngân nga, xôn xao"], "ignoreOrder": true, "passageRef": "p1" },
    { "num": 3, "type": "essay", "topic": "vn-writing", "grade": "VD", "points": 3,
      "stem": "Viết đoạn văn 10 câu...", "correct": null,
      "modelAnswer": "Dàn ý / đoạn văn tham khảo từ đáp án..." }
  ]
}
```

**Mapping dạng câu ↔ topic (10 chuyên đề, xem `lib/subjects.ts`):**

| Dạng câu | topic | type |
|---|---|---|
| Từ nhiều nghĩa/đồng âm/đồng-trái nghĩa/từ loại/nghĩa gốc-chuyển/đại từ/quan hệ từ (nghĩa), thành ngữ-tục ngữ | `vn-vocab` | mcq/fill |
| Phân biệt/đếm từ láy ↔ từ ghép | `vn-wordform` | mcq/fill |
| Chủ ngữ/vị ngữ, trạng ngữ, câu đơn/ghép, phân tích cấu tạo câu | `vn-syntax` | mcq/essay |
| Câu kể/hỏi/cảm/khiến (mục đích nói) | `vn-senttype` | mcq/fill |
| Liên kết câu (lặp/thế/nối, điền từ liên kết, đại từ thay thế) | `vn-cohesion` | mcq/fill |
| Biện pháp tu từ (so sánh/nhân hóa/điệp ngữ) + tác dụng | `vn-rhetoric` | mcq/essay |
| Chính tả (ch/tr, s/x), điền dấu câu, viết hoa danh từ riêng | `vn-spelling` | mcq/fill/essay |
| Đọc hiểu nội dung đoạn thơ/văn, nối cột, cảm nhận | `vn-reading` | mcq/fill/essay |
| Đặt câu theo yêu cầu | `vn-makesent` | essay |
| Viết đoạn / bài văn / bức thư | `vn-writing` | essay |

**grade (mức độ nhận thức):** `NB` (nhận biết/nhớ) · `TH` (thông hiểu — đa số MCQ)
· `VD` (vận dụng/sáng tạo — viết, cảm thụ, sắp xếp, suy luận nhiều bước).

**tags (điều khiển radar độ khó — `lib/school-profiles.ts buildVietnameseProfile`):**
- `camthu` = đọc hiểu/cảm thụ thơ-văn (→ litComprehension).
- `vandung` = sắp xếp/phân loại/suy luận nhiều bước (→ higherOrder).
- `bay` = bẫy phân biệt tinh tế (đồng âm vs nhiều nghĩa, láy vs ghép, chính tả dễ nhầm) (→ trickiness).
- Để `[]` nếu không có.

**Đáp án:**
- mcq → `correct` là **LETTER** `"A"/"B"/"C"/"D"` (so khớp option id), KHÔNG phải giá trị.
- fill → `correct` = giá trị chuẩn; **bắt buộc** `accept: [...]` gồm MỌI biến thể hợp lệ
  trong đáp án (vd `["như","giống như"]`). Matcher `text_set` bỏ hoa-thường + dấu câu
  nhưng **GIỮ dấu tiếng Việt**. Danh sách không thứ tự → `ignoreOrder: true`.
- essay → `correct: null`; đặt đáp án mẫu / yêu cầu cần đạt / dàn ý vào `modelAnswer`
  (AI dùng làm key tham khảo). `points`: số nguyên (làm tròn 0.5→1, 1.5→2, 2.5→3).

---

## §4. Workflow A — Import đề mới

### A.1 Trích nội dung PDF
```bash
# Đề TEXT-BASED (đa số đề Văn có cả đề + đáp án trong 1 file)
pdftotext -layout "public/ref_exam/TV/<TRƯỜNG>/<file>.pdf" /tmp/vn-<name>.txt
grep -c "Câu" /tmp/vn-<name>.txt   # kiểm tra có nội dung chưa
```
```bash
# Đề SCAN/ẢNH (pdftotext ra trang trống) → render rồi Read từng ảnh
pdftoppm -png -r 300 "<pdf>" /tmp/vn-<name>
```

### A.2 Transcribe → JSON
- **Text-based**: có thể giao subagent (general-purpose, sonnet) đọc file `.txt`
  với schema §3 + rule "copy VERBATIM giữ đủ dấu tiếng Việt, lấy đáp án từ phần
  ĐÁP ÁN/HƯỚNG DẪN GIẢI, KHÔNG bịa". Mỗi subagent → 1 file `scripts/vn-exams/<id>.json`.
  Đoạn thơ/văn nhiều câu dùng chung → đưa 1 lần vào `passages` + set `passageRef`.
- **Scan/ảnh**: tự Read ảnh (250–350 dpi), KHÔNG giao text agent.

### A.3 Đáp án — KỶ LUẬT
- Ưu tiên phần **ĐÁP ÁN / HƯỚNG DẪN GIẢI** trong PDF.
- mcq/fill có đáp án rõ → điền đúng. KHÔNG silently để `correct=null`.
- Câu mơ hồ/đáp án ảnh không đọc được → `correct:null` + ghi `"_answerNote"` đầu JSON
  ("cần đối chiếu key chính thức") + báo user. Câu tự luận luôn `correct:null` + `modelAnswer`.

### A.4 Seed (idempotent, destructive per-exam)
```bash
cp prisma/dev.db prisma/dev.db.bak-$(date +%Y%m%d-%H%M%S)
npx tsx scripts/seed-vietnamese.ts   # 10 topic + seed MỌI scripts/vn-exams/*.json + rebuild profile
```
`seed-vietnamese.ts` tự: xoá câu/passage cũ của từng examId, upsert exam, tạo passage
(map theo `ref`), tạo question (fill → answerSchema `text_set` từ `accept`), và build
`SchoolProfile` Tiếng Việt (6 yếu tố).

### A.5 Verify (script Prisma tạm trong `scripts/`, xoá sau khi xong)
```ts
import { prisma } from "../lib/prisma";
import { gradeAnswer } from "../lib/grading";
import { getSchoolProfile } from "../lib/school-profiles";
async function main(){
  const qs = await prisma.question.findMany({ where:{ examId:"<id>" }, orderBy:{num:"asc"} });
  for(const q of qs) console.log(q.num, q.type, q.topic, q.grade, "correct=", JSON.stringify(q.correct));
  console.log(await getSchoolProfile("<school>","vietnamese"));
  await prisma.$disconnect();
}
main();
```
So 1-1 với PDF: số câu, đáp án, passage gắn đúng. Mở `/exam/<id>` trong `npm run dev`.

---

## §5. Workflow B — Audit / đối chiếu
1. Dump DB (script §A.5). 2. Đọc PDF gốc. 3. Diff `correct`/`stem`/`options`/`passage`/
`modelAnswer`; sửa trong file JSON. 4. Re-seed (§A.4) + verify. 5. Câu thiếu/đáng ngờ → áp §A.3.

## §6. Workflow C — Fix
1. Sửa `scripts/vn-exams/<id>.json`. 2. `npx tsx scripts/seed-vietnamese.ts`.
3. Nếu đổi `correct`/`accept`/`modelAnswer` → chạy `scripts/regrade-attempts.ts` (cập nhật bài đã làm; bài tự luận chỉ chấm lại khi gọi "Chấm lại bằng AI").

---

## §7. Bẫy & checklist

1. **mcq `correct` = LETTER** (A/B/C/D), không phải giá trị.
2. **fill phải có `accept: [...]`** — nếu thiếu, grading rơi về `matchExact` (BỎ DẤU tiếng Việt → sai).
   Vì vậy KHÔNG để fill tiếng Việt thiếu `accept`.
3. **essay**: `correct:null` + `modelAnswer` (đáp án mẫu/dàn ý) + `points` nguyên (viết đoạn=3, viết bài=4).
4. **passageRef phải trỏ đúng `ref`** trong `passages`; thơ → `kind:"poem"`, văn xuôi → `kind:"article"`.
5. **Giữ đủ dấu tiếng Việt**; chỉ sửa lỗi OCR dính chữ (vd "nắngsớm"→"nắng sớm"). KHÔNG bịa nội dung.
6. **Backup DB trước seed.**
7. File JSON trong `scripts/vn-exams/` **được commit** (VM pull từ git). Đổi JSON → `deploy-full.sh` tự bật SEED.
8. Script Prisma tạm đặt trong `scripts/`, xoá sau khi xong.

## §8. Definition of Done
- [ ] Số câu DB khớp PDF (trừ câu ghi rõ lý do bỏ).
- [ ] mcq = letter; fill có `accept` (giữ dấu); essay `correct:null` + `modelAnswer` + `points`.
- [ ] Passage gắn đúng câu (passageRef).
- [ ] `npx tsx scripts/seed-vietnamese.ts` chạy sạch, profile Tiếng Việt rebuild.
- [ ] `/exam/<id>` render OK; chấm thử 1 mcq + 1 fill đúng.
- [ ] Backup `dev.db.bak-…` đã tạo; script verify tạm đã xoá.
- [ ] Nếu có đáp án Claude-derived → đã ghi `_answerNote` + báo user.

---

## Bắt đầu
Thực hiện request: **$ARGUMENTS**. Thiếu thông tin thì hỏi. Backup trước seed.
Sau cùng báo cáo gọn: files thay đổi + kết quả verify + câu nào skipped/derived.
