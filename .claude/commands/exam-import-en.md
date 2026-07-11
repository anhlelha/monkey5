---
description: Pipeline import/audit đề thi Tiếng Anh lớp 6 (CG/NTT) từ PDF vào DB Monkey5
argument-hint: <trường> <năm> [import|audit|fix] [chi tiết...]
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Monkey5 English Exam Import Pipeline

Agent xử lý pipeline đề thi **Tiếng Anh** (môn `subject="english"`) cho Monkey5
tại `/Users/anhlh48/00.AIProjects/99.Monkey5`. Đây là pipeline RIÊNG, đơn giản
hơn pipeline Toán (`/exam-import`): KHÔNG có LaTeX, KHÔNG figure/metadata layer.
Nguồn sự thật là 1 file JSON / đề → seed thẳng vào DB.

**User request**: $ARGUMENTS

Ý định:
- **import** → có PDF mới, đưa vào DB (Workflow A).
- **audit** / **đối chiếu** → so PDF gốc với DB, báo lệch (Workflow B).
- **fix** → sửa câu/đáp án cụ thể (Workflow C).

---

## §1. Kiến trúc dữ liệu (khác Toán — đọc trước)

```
PDF (public/ref_exam/English/<TRƯỜNG> - EN/*.pdf)
   │ pdftotext -layout   (đề text-based)   HOẶC   pdftoppm -png + Read ảnh (đề scan)
   ▼
scripts/.en-import/<examId>.json   ← SOURCE OF TRUTH (1 đề = 1 file, review tay)
   │ scripts/seed-english-exams.ts  (idempotent, destructive PER EXAM)
   ▼
prisma/dev.db  (Exam/Question/Passage, subject="english")  ← runtime SoT
   ▼
app/exam/[examId]/page.tsx → ExamRunner  (render passage + câu)
```

Khác Toán:
- KHÔNG dùng `exam-overrides.ts` / `build-exams-metadata.ts` / `official_exams_metadata.json`.
- Đáp án nằm THẲNG trong JSON (`correct`, `accept`), không qua override map.
- `figure` → không dùng. Hình/ảnh (advertisement, poster) = passage `kind:"notice"`
  nếu text ảnh đọc được; nếu KHÔNG đọc được thì cho vào `skipped`.
- Toàn bộ taxonomy/difficulty/grading English ở `lib/subjects.ts` +
  `lib/grading/matchers/english/text.ts`. Xem `docs/ENGLISH-SUBJECT-DESIGN.md`.

---

## §2. Trường & ID

| Code | Trường | examId | questionId |
|---|---|---|---|
| `cg`  | THCS Cầu Giấy | `en-cg-2021` | `en-cg-2021-q5` (tự sinh khi seed) |
| `ntt` | Nguyễn Tất Thành | `en-ntt-2023`, `en-ntt-2024-123` | `en-ntt-2023-q22` |

examId = `en-{school}-{year}[-{mã đề}]`. questionId = `{examId}-q{num}` (seed tự gắn).

---

## §3. JSON schema (1 file / đề trong `scripts/.en-import/`)

```jsonc
{
  "id": "en-ntt-2023", "subject": "english", "school": "ntt", "kind": "official",
  "year": "2023", "title": "Tiếng Anh NTT 2023 (đề chính thức)",
  "intro": "Đề chính thức tuyển sinh lớp 6 — môn Tiếng Anh.", "minutes": 30,
  "source": "Trích đề NTT 2023",
  "_inputNote": "(tùy chọn) ghi phần đề THIẾU / không đọc được / suy luận — xem §3.4",
  "sections": [
    { "num": 1, "header": "I. PHONETICS — 1.1. Choose the word whose underlined part is differently pronounced from the others." },
    { "num": 7, "header": "II. READING — 2.1. Read the passage and choose the best answer." }
  ],
  "passages": [
    { "ref": "jenny", "title": "...", "kind": "article|message|notice|cloze", "body": "text\\nwith breaks" }
  ],
  "questions": [
    { "num": 1, "topic": "en-phon", "skill": "pron", "grade": "A2", "type": "mcq",
      "stem": "", "options": [{"id":"A","text":"sk$\\underline{\\text{a}}$ting"}, ...], "correct": "D", "tags": [] },
    { "num": 1, "topic": "en-gram", "skill": "useofenglish", "grade": "A2", "type": "mcq",
      "stem": "...______...", "options": [{"id":"A","text":"..."}, ...], "correct": "B", "tags": [] },
    { "num": 22, "topic": "en-read", "skill": "reading", "grade": "A2", "type": "fill",
      "stem": "Fill blank (22) with ONE word: ...", "accept": ["cough"], "correct": "cough",
      "passageRef": "jenny", "tags": [] },
    { "num": 26, "topic": "en-fwrite", "skill": "writing", "grade": "B1", "type": "essay",
      "stem": "...", "correct": null, "points": 4 }
  ],
  "skipped": [ { "num": 16, "reason": "advertisement là ảnh, text không đọc được" } ]
}
```

**Mapping topic ↔ skill (10 chuyên đề, xem `lib/subjects.ts`):**

| Dạng câu | topic | skill | type |
|---|---|---|---|
| Ngữ pháp (thì, giới từ, mạo từ, so sánh, đại từ) | `en-gram` | `useofenglish` | mcq |
| Từ vựng / chọn từ | `en-vocab` | `useofenglish` | mcq (collocation → tag `collocation`; idiom → tag `idiom`) |
| Đồng nghĩa / trái nghĩa | `en-synant` | `useofenglish` | mcq |
| Ngữ âm (phát âm khác) | `en-phon` | `pron` | mcq |
| Trọng âm | `en-stress` | `pron` | mcq |
| Tìm lỗi gạch chân | `en-error` | `useofenglish` | mcq (tag `underline`) |
| Sửa từ đồng âm (homophone) | `en-error` | `useofenglish` | **fill** |
| Giao tiếp / hội thoại | `en-comm` | `comm` | mcq |
| Đọc hiểu (message/text/ad) | `en-read` | `reading` | mcq |
| Điền 1 từ từ đoạn (cloze) | `en-read` | `reading` | **fill** |
| Viết lại / sắp xếp câu | `en-cwrite` | `writing` | **fill** |
| Viết đoạn văn | `en-fwrite` | `writing` | **essay** (correct=null, points 4) |

**grade (CEFR):** `A1` (rất cơ bản) · `A2` (đa số) · `B1` (main-idea/inference/
"it refers to"/"NOT true"). Câu suy luận đọc hiểu → grade `B1` + tag `inference`.

**Đáp án:**
- mcq → `correct` là **LETTER** `"A"/"B"/"C"/"D"` (grading so khớp đúng option id).
- fill → `correct` = giá trị; **bắt buộc** thêm `accept: [...]` (matcher `text_set`
  bỏ hoa-thường/dấu câu, chấp nhận nhiều biến thể, vd `["helmet","a helmet"]`).
  Câu sắp xếp từ cố định thứ tự → để `ignoreOrder` mặc định false.
- essay → `correct: null`, `points: 4` (AI chấm theo rubric 5 tiêu chí).

---

## §3.4. Định dạng tiếng Anh: gạch chân / in đậm / in nghiêng (BẮT BUỘC giữ)

Stem + option render qua `<MathText>` (`components/MathText.tsx`) — component này CHỈ
hiểu `$…$` (KaTeX) và text thường; **KHÔNG markdown, KHÔNG HTML** (`**x**`, `<u>`,
`<b>` sẽ hiện literal). Muốn tái hiện định dạng của đề gốc phải bọc trong `$…$`:

| Định dạng trong đề | Viết trong JSON (nhớ escape `\` → `\\`) | Dùng cho |
|---|---|---|
| gạch chân | `$\\underline{\\text{...}}$` | phần gạch chân ở **Ngữ âm 1.1**, từ/cụm gạch chân ở **Đồng-Trái nghĩa 3.3**, từ gạch chân ở **Tìm lỗi** (`en-error`) |
| in đậm | `$\\textbf{...}$` | từ/cụm in đậm (vd `"that"`), từ khóa cho sẵn `(SPENT)` / `(TRADITION)` |
| in nghiêng | `$\\textit{...}$` | nhấn nghiêng trong stem (không dùng cho câu dẫn đề — xem §3.5) |

Quy tắc:
- **Chỉ bọc ĐÚNG phần cần đánh dấu**, không bọc cả câu (KaTeX dùng font riêng, khác
  font UI). Gạch chân một phần trong 1 từ: tách ra — `sk$\\underline{\\text{a}}$ting`,
  `work$\\underline{\\text{ed}}$`, `definition$\\underline{\\text{s}}$`.
- Ngữ âm 1.1 (gạch chân nằm trong ĐÁP ÁN): stem có thể để `""`, đánh dấu ở `options`.
- **Verify trước khi seed**: render mọi đoạn `$…$` bằng
  `katex.renderToString(seg, {throwOnError:true})` — 0 lỗi mới seed. (Xem §A.5.)
- **⚠️ Đối chiếu rubric ↔ nội dung (BẮT BUỘC)**: nếu câu dẫn đề nhắc tới một dấu
  định dạng ("*underlined* part", "the *underlined* word(s)", "word(s) in **bold**",
  "*italicized*"…) mà options/stem đưa vào lại **thiếu** dấu đó (vd rubric nói
  "underlined part" nhưng đáp án chỉ là `skating / status / stadium / statue` trần)
  → nguồn bị MẤT thông tin định dạng, **KHÔNG tự đoán** phần nào được gạch chân/đậm
  → xử lý theo §3.6 (báo/hỏi/note). Đây là lỗi thiếu dữ liệu, không phải bỏ qua được.

## §3.5. Câu dẫn đề (rubrics) → `sections` — tái hiện I/II/III + 3.1/3.2

`sections: [{num, header}]` → header in phía TRÊN câu có `num` đó (giống đề Toán
`cg-2019`). `seed-english-exams.ts` đã đọc field này (đừng để `"[]"` nếu đề có phần).
- **Chép NGUYÊN VĂN** câu dẫn đề (Choose the word…, Read the passage…, Mark the
  letter…) — đây là chỗ học sinh biết *cách làm*.
- 1 `num` chỉ gắn **1** header. Phần lớn (I/II/III/IV) gộp cùng dòng với tiểu mục
  đầu tiên, ngăn bằng "—"; mỗi tiểu mục sau (1.2, 3.2, 3.3(a), (b), 4.1…) 1 header
  ở câu bắt đầu của tiểu mục.
- Header là **text thường** (không KaTeX) — render ngoài MathText.

## §3.6. ⚠️ Đề đầu vào bị THIẾU / không đọc được → BÁO / HỎI / NOTE (không im lặng)

Khi thiếu: bài đọc, đoạn cloze, options, stem, đáp án, mã đề lệch, file chỉ có
đáp án mà không có đề, ảnh không đọc được, **hoặc rubric nhắc tới định dạng
(gạch chân/đậm/nghiêng) mà nội dung đưa vào không có dấu đó** (§3.4)… **TUYỆT ĐỐI
KHÔNG bịa** để lấp. Xử lý:

1. **Thiếu đáp án khách quan** (gram/vocab/reading) → §A.3: tự suy nếu chắc,
   ghi `_answerNote`, báo user; câu mơ hồ để `correct:null`.
2. **Thiếu passage / cloze / options / stem** không thể suy an toàn → **HỎI LẠI**
   user xin bản đề đầy đủ. Nếu vẫn buộc import phần có: đưa câu thiếu vào `skipped`
   + ghi `_inputNote`.
3. **Ảnh không đọc được** → `skipped` (đừng đoán nội dung ảnh).

Bắt buộc để lại dấu vết theo **cả ba kênh** khi liên quan:
- `_inputNote` (đầu JSON): tóm tắt phần thiếu + cách xử lý + cần user cung cấp gì.
- `skipped: [{num, reason}]`: từng câu bị bỏ/không chắc.
- **Report cuối**: nêu rõ (a) thiếu gì, (b) đã xử lý sao, (c) cần user cấp gì.
Nghĩa là: **báo lại HOẶC hỏi lại HOẶC note lại** — chọn ít nhất một, không bỏ qua.

---

## §4. Workflow A — Import đề mới

### A.1 Trích nội dung PDF (2 trường hợp)

```bash
# Đề TEXT-BASED (đa số đề NTT có file đáp án Hana's English)
pdftotext -layout "public/ref_exam/English/NTT - EN/<file>.pdf" scripts/.en-import/raw/<name>.txt
# kiểm tra có nội dung câu hỏi chưa:
grep -c "^Question " scripts/.en-import/raw/<name>.txt
```

```bash
# Đề SCAN/ẢNH (pdftotext ra trang trống — chỉ header/đáp-án có text)
pdftoppm -png -r 250 -f 1 -l 4 "<pdf>" scripts/.en-import/img/<name>
# rồi dùng Read trên từng .png để transcribe stem/options/passage VERBATIM
```

### A.2 Transcribe → JSON
- **Text-based**: có thể giao subagent (general-purpose, sonnet) đọc file `.txt`
  với schema §3 + rule "copy verbatim, lấy đáp án từ BẢNG ĐÁP ÁN, KHÔNG bịa".
  Mỗi subagent → 1 file `scripts/.en-import/<id>.json`.
- **Scan/ảnh**: tự đọc ảnh (Read trên .png) — KHÔNG giao text agent (nó sẽ phải
  tái dựng → bịa). Đọc ở 250–350 dpi để lấy stem/options chính xác.
- **Giữ định dạng + câu dẫn đề**: khi transcribe, đánh dấu chỗ gạch chân/đậm/nghiêng
  theo §3.4, đưa rubric mỗi phần vào `sections` (§3.5). Chỗ nào PDF thiếu/không đọc
  được → theo §3.6 (báo/hỏi/note, không bịa). Ghi rõ các rule này trong prompt giao
  subagent.

### A.3 Đáp án — KỶ LUẬT (giống §A.2b của skill Toán)
- Ưu tiên **BẢNG ĐÁP ÁN chính thức** trong PDF.
- ⚠️ **Bẫy đã gặp (NTT 2022)**: đề scan **trắng** (chỉ khoanh câu Example) và
  bảng đáp án text kèm theo lại thuộc **mã đề KHÁC** → KHÔNG khớp. Khi đó:
  - **KHÔNG** dùng bừa bảng đáp án lệch.
  - Với câu Tiếng Anh khách quan (gram/vocab/reading) có thể **tự suy đáp án**
    (độ tin cậy cao), nhưng PHẢI ghi `"_answerNote"` ở đầu JSON nêu rõ "Claude tự
    giải, cần đối chiếu key chính thức" + báo user.
  - KHÔNG suy đoán cho câu mơ hồ — để `correct: null` và liệt kê trong report.
- Ảnh quảng cáo/poster: nếu render đủ nét đọc được text → đưa vào `passages`
  (`kind:"notice"`); nếu KHÔNG đọc được → `skipped`.

### A.4 Seed (idempotent, destructive per-exam)

```bash
cp prisma/dev.db prisma/dev.db.bak-$(date +%Y%m%d-%H%M%S)
npx tsx scripts/seed-english.ts        # (nếu chưa có) 10 topic English + CEFR + CG sample
npx tsx scripts/seed-english-exams.ts  # seed mọi scripts/.en-import/en-*.json + rebuild profile
```

`seed-english-exams.ts` tự: xoá câu/passage cũ của từng examId, upsert, build
`SchoolProfile` English (6 yếu tố), và xoá sample bị thay thế (vd `en-ntt-sample`).

### A.5 Verify (Prisma script trong `scripts/`, xoá sau khi xong)

```ts
import { prisma } from "../lib/prisma";
import { gradeAnswer } from "../lib/grading";
import { getSchoolProfile } from "../lib/school-profiles";
async function main(){
  const qs = await prisma.question.findMany({ where:{ examId:"<id>" }, orderBy:{num:"asc"} });
  for(const q of qs) console.log(q.num, q.type, q.topic, "correct=", JSON.stringify(q.correct));
  console.log(await getSchoolProfile("<school>","english"));
  await prisma.$disconnect();
}
main();
```

So 1-1 với PDF: số câu, đáp án, passage gắn đúng câu. Kiểm tra
`/exam/<id>` render OK trong `npm run dev`.

**Kiểm KaTeX** (nếu có gạch chân/đậm/nghiêng): duyệt mọi `$…$` trong `stem`+`options`,
`katex.renderToString(seg,{throwOnError:true})` — phải 0 lỗi. Backslash trong JSON
phải `\\` (đọc lại từ DB thì thành `\` đơn — đúng).

---

## §5. Workflow B — Audit / đối chiếu
1. Dump DB: `prisma.question.findMany({where:{examId}})` (script §A.5).
2. Đọc PDF gốc (text hoặc ảnh).
3. Diff `correct`/`stem`/`options`/`passage`; sửa trong file JSON tương ứng.
4. Re-seed (§A.4) + verify.
5. Nếu phát hiện câu thiếu/đáng ngờ đáp án → áp §A.3 (KHÔNG silently bỏ trống/đoán).

## §6. Workflow C — Fix
1. Mở `scripts/.en-import/<id>.json`, sửa câu cần.
2. `npx tsx scripts/seed-english-exams.ts` (idempotent).
3. Nếu đổi `correct`/`accept` → chạy `scripts/regrade-attempts.ts` để cập nhật bài đã làm.

---

## §7. Bẫy & checklist trước khi xong

1. **mcq `correct` = LETTER** (A/B/C/D), không phải giá trị.
2. **fill phải có `accept: [...]`** — nếu không, grading rơi về so khớp `correct` lỏng.
3. **Ảnh đọc được → passage `notice`; không đọc được → `skipped`** (đừng bịa nội dung ảnh).
4. **Đề scan trắng + key lệch** (NTT 2022) → ghi `_answerNote`, báo user, không dùng key lệch.
5. **Backup DB trước seed.**
6. **`points: 4` cho essay viết đoạn**; mcq/fill mặc định 1.
7. **passageRef phải trỏ đúng `ref`** trong mảng `passages`.
8. **KHÔNG bao giờ silently để `correct=null`** cho mcq/fill khi PDF có đáp án.
9. Script Prisma đặt trong `scripts/` (Prisma client cần resolve), xoá sau khi xong.
10. File ảnh/text trích (`scripts/.en-import/raw`, `img`) KHÔNG commit (đã gitignore);
    chỉ commit `en-*.json`.
11. **Định dạng qua KaTeX, KHÔNG markdown/HTML** (§3.4): gạch chân/đậm/nghiêng
    dùng `$\underline{\text{}}$` / `$\textbf{}$` / `$\textit{}$`; escape `\\` trong JSON.
12. **Câu dẫn đề (rubric) → `sections`** (§3.5), chép nguyên văn; đừng để `"[]"`
    nếu đề chia phần I/II/III + 3.1/3.2.
13. **Đề thiếu/không đọc được → báo/hỏi/note, KHÔNG bịa** (§3.6): `_inputNote` +
    `skipped` + nêu trong report. Gồm cả trường hợp **rubric nhắc gạch chân/đậm/
    nghiêng mà đáp án/stem thiếu dấu đó** (§3.4) — coi là thiếu dữ liệu, phải hỏi lại.

## §8. Definition of Done
- [ ] Số câu DB khớp PDF (trừ câu `skipped` ghi rõ lý do).
- [ ] Mỗi mcq/fill có `correct` đúng (đã so PDF); mcq = letter; fill có `accept`.
- [ ] Passage gắn đúng câu (passageRef).
- [ ] essay `correct:null` + `points:4`.
- [ ] `npx tsx scripts/seed-english-exams.ts` chạy sạch, profile English rebuild.
- [ ] `/exam/<id>` render OK; chấm thử 1 mcq + 1 fill đúng.
- [ ] Backup `dev.db.bak-…` đã tạo. Script verify tạm đã xoá.
- [ ] Nếu có đáp án Claude-derived → đã ghi `_answerNote` + báo user.
- [ ] Gạch chân/đậm/nghiêng của đề gốc đã giữ qua KaTeX; mọi `$…$` render 0 lỗi.
- [ ] Câu dẫn đề (rubric) đã vào `sections` (nếu đề chia phần); header nguyên văn.
- [ ] Phần đề thiếu/không đọc được đã `_inputNote` + `skipped` + nêu trong report
      (đã báo/hỏi/note cho user — không im lặng).

---

## Bắt đầu
Thực hiện request: **$ARGUMENTS**. Thiếu thông tin thì hỏi. Backup trước seed.
Sau cùng báo cáo gọn: files thay đổi + kết quả verify + câu nào skipped/derived.
