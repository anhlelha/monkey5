---
description: Pipeline import/audit đề thi lớp 6 (CG/LTV/TX/NTT) từ PDF vào DB Monkey5
argument-hint: <trường> <năm> [import|audit|fix] [chi tiết...]
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Monkey5 Exam Import Pipeline

Bạn là agent xử lý pipeline đề thi cho ứng dụng Monkey5 (Next.js + Prisma + SQLite) tại `/Users/anhlh48/00.AIProjects/99.Monkey5`.

**User request**: $ARGUMENTS

Khi xử lý request, đầu tiên xác định ý định:
- **import** → có PDF mới, đưa vào DB (Workflow A)
- **audit** / **đối chiếu** / **kiểm tra** → so PDF gốc với DB hiện tại, báo cáo lệch (Workflow B)
- **fix** / **sửa** → user đã chỉ ra lỗi cụ thể hoặc audit ra rồi, giờ sửa (Workflow C)
- **vẽ hình** → cần SVG figure cho câu cụ thể (Workflow D — xem § 9)

Nếu không rõ, hỏi user trước.

---

## §1. Kiến trúc dữ liệu — BẮT BUỘC ĐỌC TRƯỚC KHI SỬA

```
SOURCE OF TRUTH (edit bằng tay)
├── scripts/exam-overrides.ts
│   ├── interface ExamOverride { stem?, correct?, unit?, figure?, modelAnswer? }
│   ├── MANUAL_OVERRIDES   ← per-question, mọi trường
│   └── CG_ENRICHMENT_MAP  ← CG-only, ưu tiên cao hơn MANUAL_OVERRIDES
│
├── ref_exam/CG_parsed_questions.json
│   └── stem, options, explanation cho CG (KHÔNG ai đọc correct/unit từ đây)
│
└── /Users/anhlh48/.gemini/antigravity-ide/brain/97d27547-…/scratch/smart_parsed_exams.json
    └── stem, options, explanation cho LTV / TX / NTT (file NGOÀI project)

       ↓ build-exams-metadata.ts (regen) ↓

official_exams_metadata.json  (GENERATED — KHÔNG edit tay)
    ├── correct, unit, figure  ← lấy từ override map
    └── exam structure (sections, qcount, intro, …)

       ↓ seed-all-exams.ts (re-seed, DESTRUCTIVE) ↓

prisma/dev.db — Question table (runtime SoT)
    stem        ← parsed_json.stem        OR override.stem
    modelAnswer ← parsed_json.explanation OR override.modelAnswer
    correct     ← metadata.correct        (luôn từ metadata)
    unit        ← metadata.unit
    figure      ← metadata.figure
    options     ← parsed_json.options     (auto-split nếu MCQ + rỗng)

       ↓ app/exam/[examId]/page.tsx (Prisma findUnique) ↓

UI render cho học sinh
```

**Bảng quyết định nhanh — sửa GÌ, sửa ở ĐÂU:**

| Cần sửa | File |
|---|---|
| `correct` (đáp án) | `scripts/exam-overrides.ts` → override map. **MCQ phải là letter A/B/C/D, không phải giá trị.** |
| `unit` | override map. Đặt `unit: null` để xoá đơn vị. |
| `figure` (tên figure ID) | override map. |
| Stem — sửa từng câu, có công thức | override `stem` (pre-formatted LaTeX `$...$`). |
| Stem — viết mới hàng loạt | parsed JSON (CG → `CG_parsed_questions.json`; LTV/TX/NTT → `smart_parsed_exams.json`). |
| Lời giải (modelAnswer) — từng câu lệch lạc | override `modelAnswer` với LaTeX sạch. |
| Lời giải hàng loạt | `.explanation` trong parsed JSON. |
| Options MCQ | `.options` trong parsed JSON. |

---

## §2. Trường & ID

| Code | Trường | ExamId | QuestionId |
|---|---|---|---|
| `cg`  | THCS Cầu Giấy | `cg-2020`, `cg-2025` | `CG-2020-21-C5`, `CG-2020-21-B2` |
| `tx`  | THCS Thanh Xuân | `tx-2020`, `tx-2025` | `TX-2020-21-C3` |
| `ltv` | Lương Thế Vinh | `ltv-2020`, `ltv-2024` | `LTV-2020-21-C20` |
| `ntt` | Nguyễn Tất Thành | `ntt-2018`, `ntt-2025` | `NTT-2025-26-C8` |

ExamId = `{school}-{year_start}` (4 chữ số). QuestionId = `{SCHOOL}-{YYYY}-{YY}-{C|B}{N}`.

---

## §3. Lookup metadata

**`type`**: `mcq` (4 đáp án A/B/C/D — `correct` lưu letter) · `fill` (điền đáp số) · `essay` (tự luận, thường `correct=null`).

**`topic`**: `soh` (số học) · `hinh` (hình) · `phan` (phân số/%) · `cd` (chuyển động) · `log` (logic) · `do` (đo lường) · `xs` (biểu đồ/xác suất) · `tuoi` (tuổi) · `ti` (tỉ lệ/bản đồ) · `tg` (thời gian).

**`grade`**: `L4` · `L5` · `L4+5` · `NC` (chuyên/Olympic).

**`difficulty_score`**: 1 (nhận biết) – 5 (Olympic).

---

## §4. Workflow A — Import đề mới từ PDF

### A.0 Xác minh thông tin
Hỏi nếu thiếu: file PDF ở đâu, trường + năm chính xác, cấu trúc đề (bao nhiêu MCQ/fill/essay), có chia phần không.

### A.1 Đọc PDF
- Dùng `Read` với `pages="N-M"`, tối đa 20 trang/lần.
- Lần 1: đọc mục lục (trang 1–3) để biết vị trí đề + đáp án của năm cần lấy.
- Lần 2: đọc phần đề (~2–4 trang).
- Lần 3: đọc phần đáp án (~4–8 trang).

### A.2 Cho mỗi câu, xác định
- `id`, `num`, `type` (mcq/fill/essay), `topic`, `grade`, `difficulty_score`, `points`.
- `stem` (đề bài).
- `options` (nếu MCQ — list `[{id:"A",text:"…"}, …]`).
- `correct`:
  - MCQ → **letter** (`"A"` / `"B"` / `"C"` / `"D"`).
  - fill → giá trị (vd `"132,8"`, `"x = 8"`, `"8 giờ 15 phút"`).
  - essay → giá trị đáp số (vd `"6 tuổi"`, `"60 m"`); nếu chỉ chấm rubric thì `null`.
- `unit` (vd `"phút"`, `"cm²"`, `"em"`, `null`).
- `figure` (vd `"tx-2025-c7"`) nếu có hình.
- `explanation` / `modelAnswer` — lời giải từng bước.

### A.2b Khi PDF KHÔNG có đáp án / lời giải (BẮT BUỘC HỎI USER)

Nếu PDF chỉ có đề (không có file đáp án kèm theo), hoặc khi đối chiếu thấy
một số câu **thiếu `correct` và/hoặc `modelAnswer`**, KHÔNG được im lặng để
trống và báo "done". Phải:

1. **Liệt kê** ngay trong report các câu thiếu, ghi rõ trạng thái:
   - Câu chỉ thiếu `correct` (fill/mcq).
   - Câu cần `modelAnswer` (essay) mà chưa có.
2. **Hỏi user** với 3 lựa chọn rõ ràng (mỗi câu hoặc batch theo câu):

   | Option | Hành động của Claude |
   |---|---|
   | (a) User cung cấp đáp án | User paste đáp án / upload đáp án PDF → Claude điền `correct` + viết `modelAnswer` clean LaTeX |
   | (b) Claude tự giải | Claude tự derive đáp số bằng **kỹ thuật phù hợp grade-level** (xem rule bên dưới); ghi chú trong override map rằng đây là Claude-derived |
   | (c) Để trống | `correct = null` (và `modelAnswer = null` cho essay) — chấp nhận grade sẽ skip câu này |

3. **Rule cho option (b) — Claude tự giải**:
   - `grade: L4` → chỉ dùng số học lớp 4 (cộng/trừ/nhân/chia, đại lượng đơn giản).
   - `grade: L5` → thêm phân số, %, chuyển động, hình học cơ bản (chu vi/diện tích/thể tích).
   - `grade: L4+5` → hỗn hợp.
   - `grade: NC` (chuyên/Olympic) → có thể dùng kỹ thuật cao hơn (telescoping, vesica piscis, đếm tổ hợp …) — **trong giới hạn nội dung tiểu học**.
   - **KHÔNG dùng đại số ẩn `x`, `y`** ở bất kỳ grade nào — đây là toán tiểu học. Dùng "sơ đồ phần / tổng-hiệu / tỉ số" thay thế.
   - **KHÔNG websearch / không gọi API ngoài** — chỉ dùng đề bài + kiến thức nội tại.
   - Ghi comment trong override rõ ràng: `// Claude-derived (no official answer key)`.

4. Sau khi user trả lời từng lựa chọn, **echo lại quyết định** trong override:

   ```ts
   "TX-2026-27-C16": {
     stem: "…",
     // Option (a): từ đáp án PDF MathX
     correct: "2,35; 25,6",
     modelAnswer: "…",
   },
   "TX-2026-27-Cxx": {
     stem: "…",
     // Option (b) Claude-derived (L5 chuyển động); kiểm tra lại trước khi seed
     correct: "2,88",
     unit: "km/giờ",
   },
   "TX-2026-27-Cyy": {
     stem: "…",
     // Option (c): user chấp nhận để trống — grade sẽ skip
   },
   ```

→ KHÔNG bao giờ silently leave `correct=null` cho fill/mcq, hoặc `modelAnswer=null`
cho essay khi PDF đáp án có sẵn nhưng tôi không kéo về.

### A.3 Update source files

**Bước 3a** — thêm stem + options + explanation:
- CG: edit `ref_exam/CG_parsed_questions.json`, thêm key `"YYYY-YY"`.
- LTV/TX/NTT: edit `smart_parsed_exams.json` (đường dẫn ở §1) hoặc dùng `MANUAL_OVERRIDES.stem` nếu muốn tránh đụng file ngoài.

**Bước 3b** — thêm correct/unit/figure vào `scripts/exam-overrides.ts`:

```ts
// CG → CG_ENRICHMENT_MAP
"CG-2026-27-C1": { correct: "132,8", unit: null },
"CG-2026-27-C8": { correct: "10", unit: "cm²", figure: "cg-2026-c8" },

// Khác → MANUAL_OVERRIDES
"TX-2025-26-C1": { correct: "B", unit: null },  // MCQ → letter
"TX-2025-26-C7": {
  stem: "Cho hình lập phương cạnh $a = 12$ cm. …",  // pre-formatted, bypass auto-format
  correct: "864",
  unit: "cm²",
  modelAnswer: "Diện tích toàn phần là $6 \\times 12^2 = 864$ cm².",
},
```

**Bước 3c** — thêm exam metadata + questions skeleton vào `scripts/build-exams-metadata.ts` (id, school, year, title, minutes, sections, list of {id, num, type, topic, grade, points}).

### A.4 Build + seed (DESTRUCTIVE)

```bash
cp prisma/dev.db prisma/dev.db.bak-$(date +%Y%m%d-%H%M%S)
npx tsx scripts/build-exams-metadata.ts
npx tsx scripts/seed-all-exams.ts
```

### A.5 Verify

Tạo `scripts/verify-<exam>.ts` (Prisma client chỉ resolve trong project root — đừng để file ngoài):

```ts
import { PrismaClient } from "@prisma/client";
async function main() {
  const p = new PrismaClient();
  const qs = await p.question.findMany({
    where: { examId: "<id>" }, orderBy: { num: "asc" },
    select: { id: true, num: true, type: true, correct: true, unit: true, stem: true, modelAnswer: true },
  });
  for (const q of qs) {
    console.log(`${String(q.num).padStart(2)} ${q.id} | ${q.type} | correct=${JSON.stringify(q.correct)} unit=${JSON.stringify(q.unit)}`);
  }
  await p.$disconnect();
}
main().catch((e)=>{console.error(e);process.exit(1)});
```

Chạy `npx tsx scripts/verify-<exam>.ts`, so 1-1 với PDF, **xoá file verify sau khi xong**.

### A.6 Audit

```bash
npx tsx scripts/audit-questions.ts         # console
npx tsx scripts/audit-questions.ts --json  # ghi scripts/audit-results.json
```

Codes: `FIGURE_MISSING` · `FIGURE_LIKELY` · `NO_ANSWER` · `SHORT_STEM`.

---

## §5. Workflow B — Đối chiếu / audit đề có sẵn với PDF

### B.1 Lấy trạng thái hiện tại

```bash
# Đáp án trong metadata
python3 -c "import json; m=json.load(open('official_exams_metadata.json')); \
  e=[x for x in m['exams'] if x['id']=='cg-2020'][0]; \
  [print(q['id'], q.get('correct'), q.get('unit'), q['type']) for q in e['questions']]"
```

Hoặc viết Prisma script lấy từ DB (xem A.5).

### B.2 Đọc PDF gốc cho năm đó

Đề + đáp án + lời giải (§A.1).

### B.3 Diff & phân loại

| Lỗi | Sửa ở | Notes |
|---|---|---|
| `correct` / `unit` sai | override map | MCQ → letter |
| MCQ `correct` đang là số (vd `"0,5"`) | bắt buộc đổi sang `"B"` | grading so sánh `text === q.correct` |
| Stem nhỏ (chính tả, công thức) | override `stem` | pre-formatted LaTeX |
| Stem lệch nhiều câu | parsed JSON | |
| Lời giải khớp đề khác | override `modelAnswer` HOẶC `.explanation` trong parsed JSON | |
| Lời giải vỡ LaTeX (`×x=6$`, `S PAN`) | override `modelAnswer` LaTeX sạch | bug từ formatter cũ |
| Header bleed cuối lời giải | đã có pattern strip; chỉ cần re-seed | nếu vẫn còn → thêm pattern vào `WATERMARK_PATTERNS_SEED` |
| Stale rows CUID id (`set-*`/`ref-*` topic sets) | `scripts/sync-clone-answers.ts` (rồi `regrade-attempts.ts`) | re-seed không động tới clone; sync bám `sourceQuestionId` về câu gốc. Xem §6 bước 5. |

### B.4 Apply + verify
Theo §A.4 + A.5.

### B.5 Khi audit phát hiện câu thiếu đáp án
Áp dụng §A.2b (BẮT BUỘC HỎI USER) — KHÔNG được report "clean" khi vẫn còn
`correct=null` cho fill/mcq hoặc essay thiếu `modelAnswer` mà PDF đáp án có
sẵn nhưng chưa pull về.

---

## §6. Workflow C — Fix lỗi cụ thể

1. Xác định câu cần sửa (questionId).
2. Tra bảng §1 "sửa GÌ → sửa ở ĐÂU".
3. Edit file tương ứng (tối thiểu để vá đúng).
4. `build-exams-metadata.ts` + `seed-all-exams.ts` + verify.
5. **BẮT BUỘC nếu đổi `correct` / `modelAnswer` / `answerSchema`** — re-seed chỉ
   sửa câu gốc, KHÔNG động tới bản clone trong set luyện tập (`set-*`/`ref-*`),
   nên các bài đã làm trước đó vẫn chấm theo đáp án CŨ (pitfall #5). Chạy:
   ```bash
   npx tsx scripts/sync-clone-answers.ts --dry-run   # xem clone nào lệch
   npx tsx scripts/sync-clone-answers.ts             # đồng bộ clone từ câu gốc
   npx tsx scripts/regrade-attempts.ts               # cập nhật điểm bài đã làm
   ```
   Khi deploy lên prod, `deploy-full.sh` Step 3b tự chạy sync này sau SEED — chỉ
   cần `bash scripts/deploy-full.sh` (hoặc `--full` nếu chỉ đổi file script).

---

## §7. Auto-clean (đã có trong `seed-all-exams.ts`)

**`stripWatermarks()`** — xoá `MathExpress Education`, `Toán Tuổi Thơ`, `violympic`, và header bleed:
`ĐỀ KIỂM TRA TUYỂN SINH VÀO LỚP N …`, `TRƯỜNG THCS …`, `Năm học: YYYY–YYYY`, `Môn: Toán`, `Thời gian làm bài: N phút`.

**`formatMathText()`** — **idempotent**: nếu text đã chứa `$` thì BYPASS, không thì auto-wrap fractions/percent/equations.

**`MANUAL_OVERRIDES` & `CG_ENRICHMENT_MAP`** — apply SAU watermark/format, coi là source-of-truth.

→ Hệ quả: override stem/modelAnswer phải **pre-formatted LaTeX `$...$` đầy đủ**.

---

## §7b. Lời giải tự luận (essay) — pattern lỗi cố định & cách xử lý

Phần `B` (Bài 1/2/3, tự luận) trong `smart_parsed_exams.json` **liên tục bị PDF
column-extraction shred**. Auto-format `formatMathText` không cứu được, dẫn
đến lời giải UI hiển thị "X = .", "× 9 = 3,6", phép tính trùng đôi, hoặc
mất hệ số. **Mặc định: với mỗi đề mới import có essay, đọc thẳng `.explanation`
trong parsed JSON, nếu thấy bất kỳ pattern dưới đây thì viết `modelAnswer` override luôn.**

**Triệu chứng nhận diện nhanh:**

1. **Phân số bị xoá hệ số/tử số** — `× = 24`, `: × 2 =`, `= 70 cm²` (mất `\frac{...}` ngay trước dấu `=`).
2. **Equation duplicated trong UI** — text gốc có "180 × 2 − 180 = 180" + KaTeX hiển thị "180×2−180=180" stuck cạnh nhau (formatter wrap nguyên cụm chứ không lọc theo `$...$`).
3. **Label hình bay lẻ** — "C / B / A" hoặc "A / D / F / E / C" đứng riêng dòng giữa text (PDF column tách).
4. **Block parenthesis-only** — dòng chỉ có `(` hoặc `)` xen kẽ trong đoạn văn (PDF text-frame splits).
5. **"S PAN" / "ABCD" inline glitch** — variable subscript bị PDF text engine viết thành `S ABCD`, `SAFC =`.
6. **Header bleed cuối lời giải** — `ĐỀ THI TUYỂN SINH LỚP 6` hoặc `MathExpress Education` (đã có pattern strip, nhưng nếu năm mới dùng phrasing khác thì bổ sung vào `WATERMARK_PATTERNS_SEED`).

**Quy trình fix:**

1. Dump `.explanation` từ parsed JSON cho riêng câu đó (1 dòng python script là đủ).
2. So với phép tính gốc — tự re-derive đáp số để kiểm tra logic, **không tin tưởng vào text bị shred**.
3. Viết lại `modelAnswer` theo format:
   ```ts
   "NTT-YYYY-YY-BN": {
     modelAnswer: [
       "**Bước 1.** …",
       "$$\\frac{a}{b} \\times … = …$$",
       "",
       "**Đáp số**: …",
     ].join("\n"),
   },
   ```
   - Dùng `**Bước N.**` hoặc `**a)** / **b)**` để chia mục.
   - Mọi phân số: `\\dfrac{a}{b}` (inline) hoặc `\\frac{a}{b}` (display).
   - Display math (centered): `$$…$$` đặt riêng dòng.
   - Inline: `$…$`.
   - LaTeX subscript: `$S_{ABCD}$`, `$v_{\\text{xuôi}}$`.
   - **Đáp số** bold cuối cùng, dạng `**Đáp số**: $X = Y$.`
4. Sau seed: kiểm tra UI render — `/exam/ntt-YYYY` → câu N.

**Đã thấy ở các đề (per 2026-06-11/12 audit):**

| Đề | Câu | Lỗi chính |
|---|---|---|
| NTT 2007-08 | B5 (Câu 5) | MA có `( )` floating + HẾT bleed; topic sai `hinh` (thực ra `log` — đếm khối) |
| NTT 2022-23 | B1 (Câu 9) | mất phân số `3/7`, `7/10` |
| NTT 2022-23 | B2 (Câu 10) | mất `3/2`, `2/3`, `2/5` |
| NTT 2023-24 | B2 (Câu 10) | phân số split dòng, parenthesis-only, header bleed |
| NTT 2025-26 | B2 (Câu 14) | label C/B/A floating, equation duplicated |
| NTT 2025-26 | B3 (Câu 15) | hệ số $\frac{7}{2}$ và $\frac{1}{2}$ bị xoá |
| TX 2019-20 | C3/C5/C6/C7 | stem cụt giữa câu → từ cuối bị lưu nhầm vào `correct` (`"lớp?"`, `"đó"`, `"2 4 8 16 32"`, `"7"`) |
| TX 2019-20 | C6/C8/C10 | MA shred: cột mẫu số `4 4 4 4 4`, answer-box bleed `$a=7;b=3$` mid-text |
| TX 2020-21 | C3 + B5 | stem cụt + MA cột figure-labels (A/B/G/E/D/C/40cm/30cm/…) |
| TX 2021-22 | C7-C10 | parsed JSON đánh dấu sai `type=fill`, đáng ra essay (Phần II: Tự luận); MA mất phân số/hệ số |
| TX 2022-23 | C4/C5 | `correct` cross-mapped giữa hai câu (C4 lưu 60 thay vì 615) |
| TX 2022-23 | B2 | MA fraction split + `correct="A ="` (text bị cắt) |
| TX 2023-24 | C2/C3 | superscript glitch (`20 dm 2 23cm 2`); C14 `correct="8 35 80 143"` (lưu denominators, đúng ra `1/4760`) |
| TX 2023-24 | C15/C16 | `type=fill` đáng ra essay (Phần III: Tự luận) |
| TX 2024-25 | C2-C12 + B1/B2 | nhiều MA shred (mixed numbers tách, AB/CD ratio mất, fractions split dòng) |
| TX 2025-26 | C11 + B2 | C11 mixed `$2\frac{1}{2}$ + $\frac{1}{8}$:0,125` mất operator; B2 stem có label bleed `A M K B N` + MA 8 labels floating |

→ Khi bạn audit / import năm mới mà có essay, **luôn check lời giải essay trước**.

---

## §7c. Audit shred — process discipline (per 2026-06-12 post-mortem)

Lần audit TX đầu tiên báo "P3 — chưa fix lần này" rồi dừng, nhưng vẫn để lọt
**stems bị cắt giữa câu** (TX-2019-20-C8 ends with "chia"), **MA cột labels bay**
(TX-2020-21-B5 với A/B/G/E/D/C/40cm/30cm...), và **fractions split-dòng** trên
nhiều câu. Lý do là 3 lỗi process — sửa ngay để lần sau không lặp lại:

### Lỗi 1: collapse `\n` trước khi check pattern

**SAI:**
```ts
const s = (q.stem || "").replace(/\s+/g, " ").trim();  // ← mất cấu trúc
if (/× =|: =/.test(s)) flags.push("BROKEN");
```

Shred PDF luôn có `\n` đặc trưng: cột mẫu số (`4\n4\n4\n4`), labels bay lẻ
(`A\nB\nG\nE\n`), `(\n)\n(\n)`. Collapse → mất signal.

**ĐÚNG:** giữ raw text khi check pattern, chỉ collapse khi PRINT preview.

```ts
const raw = q.modelAnswer ?? "";
const flat = raw.replace(/\s+/g, " ").trim();
// dùng raw cho pattern check, flat chỉ để hiển thị
const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
const standaloneNums = lines.filter(l => /^[\d\s,.]+$/.test(l) && l.length < 20).length;
const standaloneLabels = lines.filter(l => /^[A-Z]{1,3}$/.test(l)).length;
if (standaloneNums >= 2) flags.push("DENOM_COLUMN");
if (standaloneLabels >= 3) flags.push("LABEL_FLOAT");
```

### Lỗi 2: heuristic patterns quá hẹp

Thêm các check sau vào script audit:

| Triệu chứng | Pattern phát hiện | Tránh false positive |
|---|---|---|
| Stem cụt giữa câu | `!stem.match(/[?.:)]$\|bao nhiêu\?$\|tính\b.*$\|tìm\b.*$/i)` | Stem có thể kết thúc bằng `)` (note trong ngoặc) — nhớ include `)` |
| `correct` là phần stem bị cắt | `correct` matches `/^(đó\|này\|vậy\|sao\|nhất\|lớp\?\|cả\|đúng \d+ mặt\?\|loại\?\|gì\?)$/i` | — |
| `correct` quá dài | `q.type === "fill" && correct.length > 40` | — |
| Cột số đứng lẻ trong MA | dòng matches `/^[\d\s,.]+$/`, `length ∈ [3,25)`, NOT pure-int | Pure integer line (e.g. "1000") thường là một số đứng riêng, không phải cột |
| Label đứng lẻ trong MA (≥ 3) | dòng matches `/^[A-Z]{1,3}$/` | — |
| Equation thiếu vế | dòng matches `/^[+×÷:=]\s/` hoặc `/\s[+×÷:=]$/` | **EXCLUDE** dòng bắt đầu `- ` (Markdown bullet) — `-` không phải dấu trừ |
| Coefficient missing | `/× =\|: =\|= \.(?!\d)/` | **DROPPED** `=\s+\(` — legit LaTeX `= (a + b)` hit pattern này khắp nơi |
| Paren-only | dòng = `(` hoặc `)` | — |
| Header bleed | `/TUYỂN SINH\|MathExpress\|HẾT.*HẾT\|----.*-----/i` | — |

### Lỗi 3: defer không escalate

Khi tìm thấy issues mà KHÔNG fix:

**SAI:** "Còn lại P3 — chưa fix lần này" rồi dừng.

**ĐÚNG:** Có 3 lựa chọn rõ ràng, phải pick một:

1. **Fix luôn** trong cùng iteration (nếu count ≤ ~15 và data đã có).
2. **Stop & ask**: "Còn N issues, fix tiếp ngay hay tách session khác? Tôi liệt kê chi tiết để bạn quyết."
3. **Defer with explicit todo file**: Ghi `docs/AUDIT-TODO-<school>-<date>.md` với danh sách cụ thể từng câu + lý do hoãn (vd: "cần đọc thêm PDF page X-Y") → user mở file đó khi muốn tiếp.

KHÔNG được vừa báo cáo "đã rà soát" vừa để lọt issues mà không có document tracking.

### Quy trình audit shred — version 2

1. **Read raw từ DB**, không collapse `\n` trước khi check.
2. **Run heuristics theo Lỗi 2 bảng trên** (ít nhất 7 patterns).
3. **Spot-check 5–10 câu random** bằng cách render Markdown → KaTeX trong đầu, hoặc dump ra console với LaTeX-aware print, kiểm tra phép tính có ý nghĩa không.
4. **Compare với PDF answer page** cho các câu có essay/multi-step.
5. **Sau khi fix**, re-run heuristic, đảm bảo flag count = 0 trước khi báo cáo "clean".
6. **Báo cáo cuối**: nếu có defer, output `docs/AUDIT-TODO-...md` ngay trong cùng turn.

---

## §8. Bẫy đã gặp — checklist trước khi commit

1. **MCQ `correct` = letter** (A/B/C/D), không phải giá trị. Lib grading so sánh chính xác.
2. **`correct/unit` trong `CG_parsed_questions.json` BỊ IGNORE** — seed lấy từ metadata sinh ra từ `CG_ENRICHMENT_MAP`.
3. **Override LaTeX phải đủ `$...$`** — formatter cũ phá pre-formatted nếu thấy `$` lẻ, nay đã idempotent nhưng vẫn dùng đầy đủ.
4. **Backup DB trước seed**: `cp prisma/dev.db prisma/dev.db.bak-...`. Seed dùng `deleteMany` rồi insert lại.
5. **Header bleed**: nếu vẫn còn pattern lạ cuối modelAnswer → thêm vào `WATERMARK_PATTERNS_SEED` rồi re-seed; stale rows cần migration 1 lần.
6. **C9/C10 stale entries** trong CG_ENRICHMENT_MAP cho năm chỉ có C1–C8: vô hại nhưng nên xoá.
7. **Script Prisma phải đặt trong project root** (`scripts/`), không trong `/tmp` → Prisma client mới resolve.
8. **`npx tsx -e "await …"` heredoc lỗi CJS top-level await** → tạo file `.ts` rồi `npx tsx <file>`.
9. **Năm cần parse**: `cg-2020` ứng với `"2020-21"` short hoặc `"2020-2021"` full — kiểm tra format trong build-exams-metadata.ts.
10. **Xoá script verify tạm** sau khi xong (không commit).

---

## §9. Workflow D — Vẽ figure SVG (delegate Codex → Gemini)

**Nguyên tắc**: chỉ dùng PDF gốc làm nguồn. **KHÔNG websearch**.

**Engine ưu tiên (per 2026-06-12)**: **Codex CLI làm default**, Gemini CLI làm
fallback. Lý do:
- Codex dùng ChatGPT auth (`~/.codex/auth.json`) — không phụ thuộc quota Gemini
  free tier (1500 RPD `gemini-2.5-flash-lite`).
- Codex có flag `-i <file>` chuẩn để attach ảnh (rõ hơn `@path` của Gemini).
- Codex sandbox `read-only` chặn agent tool-calls — không đốt extra requests.

Dispatcher: **`scripts/draw-figure.sh`** (mới) — tự gọi Codex trước, fallback
sang Gemini nếu Codex lỗi (auth, network, không sinh `<svg>`).

| Helper | Khi dùng |
|---|---|
| `scripts/draw-figure.sh` (default) | `--engine auto` — Codex trước, Gemini fallback |
| `scripts/draw-figure-codex.sh` | Chỉ Codex (debug Codex output) |
| `scripts/draw-figure-gemini.sh` | Chỉ Gemini (debug, hoặc khi Codex quota hết) |

Claude chỉ điều phối: chuẩn bị input, đọc kết quả, tích hợp vào codebase,
fallback Claude tự vẽ nếu cả 2 engine fail.

### D.1 Xác định input
- `--pdf`: đường dẫn PDF (vd `public/ref_exam/Tổng hợp đề thi … Cầu Giấy (2).pdf`).
- `--page`: số trang chứa hình (1-indexed, theo mục lục PDF).
- `--figure-id`: ID figure (vd `cg-2020-c8`, `ltv-2024-c15`).
- `--description`: mô tả ngắn cho Gemini (vd "Hình thang ABCD, AC và BD cắt nhau tại O, tam giác OAD và OAB được tô khác màu").
- (tuỳ chọn) `--crop WxH+X+Y`: cắt vùng quanh hình để tránh Gemini đọc nhầm watermark / câu kế bên. Lấy giá trị sau khi xem nhanh trang PDF.

### D.2 Đọc PDF trước khi gọi Gemini
Đọc trang chứa hình bằng `Read` với `pages="<page>"` để:
1. Xác nhận đúng trang (mục lục có thể lệch nếu phần dạo đầu chiếm thêm trang).
2. Soạn `--description` chính xác (loại hình, nhãn điểm, đoạn bằng nhau, vùng tô …).
3. Ước lượng `--crop` nếu hình nhỏ trong trang nhiều câu.

### D.3 Gọi helper (default: dispatcher tự routing Codex → Gemini)
```bash
scripts/draw-figure.sh \
  --pdf "public/ref_exam/Tổng hợp đề thi chính thức vào lớp 6 trường THCS Cầu Giấy (2).pdf" \
  --page 22 \
  --figure-id cg-2020-c8 \
  --description "Tam giác ABC, Q trên AB với BQ=1/6·AB, K trên AC với AK=1/3·AC, nối K với Q và K với B" \
  --crop "900x900+50+200"
```

Mặc định `--engine auto` (Codex → Gemini fallback). Có thể force:
- `--engine codex` — debug Codex output, không fallback
- `--engine gemini` — bỏ qua Codex, dùng thẳng Gemini (vd Codex auth lỗi)

Output theo engine thắng:
- Codex success → `scripts/.codex-figure-out/<figure-id>.{svg,raw.txt,last.txt,prompt.txt}`
- Gemini success → `scripts/.gemini-figure-out/<figure-id>.{svg,raw.txt,prompt.txt}`

### D.4 Đọc lại SVG, sửa nhẹ nếu cần
- `Read` file SVG, đánh giá viewBox + style.
- Đổi `fill="black"`, `stroke="black"`, hex màu cứng → `var(--ink)` (nếu Gemini bỏ sót quy ước).
- Thêm class wrapper khi nhúng vào React (xem D.5).

### D.5 Insert vào `components/ExamFigure.tsx`
```tsx
case "<figure-id>":
  return (
    <div className="q-figure-wrapper" style={{ maxWidth: "Npx" }}>
      {/* paste nội dung <svg>…</svg> từ scripts/.gemini-figure-out/<figure-id>.svg ở đây */}
      {/* thêm width="100%" style={{display:"block", height:"auto"}} vào thẻ <svg> root */}
    </div>
  );
```

### D.6 Đăng ký figure ID
1. ID vào `IMPLEMENTED_FIGURES` của `app/(app)/admin/qa-constants.ts` + `scripts/audit-questions.ts`.
2. Gán `figure: "<figure-id>"` vào override map của câu tương ứng.
3. Re-build + re-seed.
4. `npx tsc --noEmit`.

### D.7 Khi engine sinh SVG sai geometry

Single-shot prompt (default) thường ổn cho hình 2D + cube/box đơn giản.
Khi thấy **geometry sai** (vd cavity nằm sai chỗ, ratio lệch, dashed/solid
ngược) thì thử theo thứ tự:

**Step 1: Refine description, re-run cùng engine.**
Mô tả CHÍNH XÁC topology trong `--description`:
- Cavity ở đâu? "Along front-top edge", "centered in top face", "at back-right corner".
- Cavity mở ra mấy mặt? "Opens to top face only" hay "opens to BOTH top + front face".
- Hidden edges là gì? Liệt kê cụ thể (vd "back wall of cavity, bottom of cavity").

Re-run thường fix được lỗi geometry. Lần fix Câu 12 NTT 2026-27 từ "centered"
sang "along edge" chỉ cần 1 lần re-prompt.

**Step 2 (optional): JSON-intermediate cho figures phức tạp.**

Nếu figure có nhiều shape lồng nhau (vd tam giác có cevian + đường tròn nội
tiếp, hình thang có nhiều đường chia), single-shot có thể trộn lẫn topology.
Tách thành 2 bước thủ công:

1. **Pass 1 — Parser (PNG → JSON):**
   ```
   You are a Geometry Diagram Parser.
   Your task is NOT to solve the problem — only reconstruct the figure.
   1. Read the image.
   2. Cross-check dimensions against the problem statement.
   3. Extract all geometry entities.
   Return JSON:
   {
     "shapes": [...],
     "dimensions": [...],
     "labels": [...],
     "constraints": [...],
     "svg_instructions": [...]
   }
   ```

2. **Pass 2 — Renderer (JSON → SVG)**: dùng `draw-figure-codex.sh` với
   `--description` chứa JSON đã parse (paste JSON vào description).

Trade-off: 2× API calls + thêm thủ công. Chỉ dùng khi step 1 thất bại 2+
lần. Helper hiện tại **không** tự chain — phải gọi 2 lần thủ công, copy
JSON output sang description của lần 2.

**Step 3: Claude tự vẽ tay.**
Khi cả 2 engine + JSON intermediate đều fail, hoặc SVG ra vẫn lệch tỉ lệ /
clipping. Pattern hand-craft: tọa độ math, scale sang SVG, helper `sq(col, row)`
cho grid, arc `A rx,ry …`. Style chuẩn:

```tsx
<div className="q-figure-wrapper" style={{ maxWidth: "Npx" }}>
  <svg viewBox="0 0 W H" width="100%" style={{ display: "block", height: "auto" }}>
    <line stroke="var(--ink)" strokeWidth="1.5" />
    <circle fill="orange" stroke="orange" r="4.5" />
    <text fill="var(--ink)" fontSize="..." style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>A</text>
  </svg>
</div>
```

Tham khảo LTV 2020-21 Câu 20 + NTT 2026-27 Câu 12 trong git history cho
pattern triangle-with-cevian và cube-with-corner-cavity.

**Exit codes của mỗi helper:**
- `2` — sai args
- `3` — thiếu binary (codex/gemini/pdftoppm/magick)
- `4` — gọi engine fail (auth, network, rate limit)
- `5` — output không chứa `<svg>…</svg>` hợp lệ

Thì Claude tự vẽ tay theo §D.5 cũ (tọa độ math, scale sang SVG, helper `sq(col, row)` cho grid, arc `A rx,ry …`):

```tsx
// Style chuẩn khi tự vẽ
<div className="q-figure-wrapper" style={{ maxWidth: "Npx" }}>
  <svg viewBox="0 0 W H" width="100%" style={{ display: "block", height: "auto" }}>
    <line stroke="var(--ink)" strokeWidth="1.5" />
    <circle fill="orange" stroke="orange" r="4.5" />
    <text fill="var(--ink)" fontSize="..." style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>A</text>
  </svg>
</div>
```

Tham khảo trường hợp LTV 2020-21 Câu 20 trong git history để xem pattern tam giác có cevian (toạ độ math y-up, tính intersection, scale + invert y sang SVG coords).

### D.8 Dự phòng cuối cùng
Hình quá phức tạp cho cả Gemini lẫn vẽ tay (vd biểu đồ nhiều cột nhãn dày) → crop PNG từ PDF vào `public/figures/<id>.png`, dùng `<img src="/figures/<id>.png" alt="Hình câu …" style={{ maxWidth: "Npx", width: "100%" }} />` trong `ExamFigure.tsx`.

### D.9 Yêu cầu môi trường & các quirk đã verify

**Codex CLI** (default):
- `codex` ở PATH (`brew install codex` → `/opt/homebrew/bin/codex`; npm: `npm i -g @openai/codex`).
- **Auth pattern (verified 2026-06-12)**: ChatGPT Free/Plus accounts hiện
  **KHÔNG** unlock `gpt-5.x-codex` models. Helper bypass bằng **ephemeral
  isolated CODEX_HOME** + OpenAI API key.

  **User setup — chỉ 1 lần:**
  ```
  echo 'OPENAI_API_KEY=sk-...' >> .env.local   # .env.local đã .gitignored
  ```

  **Mỗi lần gọi figure-gen** (không cần source gì cả):
  ```
  scripts/draw-figure.sh --pdf … --page … --figure-id … --description …
  ```

  **Helper tự làm trong nội bộ:**
  1. Đọc `OPENAI_API_KEY` từ shell env. Nếu chưa có, **auto-source
     `<project>/.env.local`** (project root suy ra từ vị trí script).
  2. `mktemp -d -t monkey5-codex-XXXXXX` → tạo dir tạm cho auth.
  3. `trap 'rm -rf "$ISOLATED_HOME"' EXIT INT TERM` → tự xoá dir tạm khi
     script kết thúc (kể cả error/signal).
  4. `printf '%s' "$OPENAI_API_KEY" | CODEX_HOME=$tmp codex login --with-api-key`
     → cài key vào dir tạm (stdin, không prompt).
  5. `CODEX_HOME=$tmp codex exec -i <png> …` → call model, không động
     `~/.codex/auth.json` của user (vẫn dùng ChatGPT cho việc khác).
  6. Trap xoá dir → key **không** persist sang lần chạy sau.
- **Default model**: `gpt-5.5` (supports vision; `gpt-5.5-codex` không tồn tại
  trên API tính đến 2026-06-12). Override bằng `--model <name>` nếu cần.
- Helper auto-detect API error (model rejected / quota / auth) → exit 4 →
  dispatcher fallback Gemini. **Nếu cả 2 fail**: Claude tự vẽ (§D.7) hoặc
  dùng PNG crop (§D.8).
- Quirks helper đã set:
  1. `-i <png>` — Codex flag chuẩn cho image (khác Gemini dùng `@path`).
  2. `-s read-only` — sandbox chặn shell/write side-effects của agent loop.
  3. `--skip-git-repo-check` — không phụ thuộc git status của workspace.
  4. `--ephemeral` — không persist session vào `~/.codex/sessions/`.
  5. `--ignore-rules` — bỏ qua project `.rules` (clean prompt).
  6. `-o <file>` — Codex ghi last assistant message vào file, dễ extract SVG hơn capture stdout.
  7. **Stdout grep cho `"type":"error"`** — Codex CLI exit 0 ngay cả khi API
     reject; helper check pattern này → force exit 4 để dispatcher fallback đúng.

**Gemini CLI** (fallback):
- `gemini` ở PATH (đã cài `@google/gemini-cli` tại `~/.npm-global/bin/gemini`).
- Auth: env `GEMINI_API_KEY` HOẶC OAuth.
- Quirks (giữ trong `draw-figure-gemini.sh`):
  1. **`GEMINI_CLI_TRUST_WORKSPACE=true`** bắt buộc cho mode headless.
  2. **Image attach qua `@path` trong prompt** — KHÔNG dùng flag `-i` (interactive mode).
  3. **`--approval-mode plan`** bắt buộc — nếu không model tự gọi WebSearch/Shell, đốt 5–10 API calls/figure → hết quota.
  4. **Model default `gemini-2.5-flash-lite`** — free 1500 RPD. `gemini-3.5-flash` chỉ 20 RPD.
  5. **Quota free tier**: 429 → helper exit 4, dispatcher fallback Gemini? Không — dispatcher đang Codex → Gemini, không có engine sau Gemini. Hết quota → Claude tự vẽ.

**Render PDF → PNG (cả 2 engine dùng chung):**
- `pdftoppm` (poppler — `/opt/homebrew/bin/pdftoppm`) ưu tiên hơn `magick`.
- `magick` chỉ cần khi muốn `--crop`.

**Prompt template trong `draw-figure-codex.sh`** (technical style, 2026-06-12):

Prompt gồm 4 block:
1. **ROLE** — "Mathematical illustrator + SVG engineer. NOT drawing a picture
   — constructing a mathematical diagram. Geometric primitives only."
2. **OUTPUT FORMAT** — single `<svg>` block, SVG 1.1, viewBox no width/height,
   editable vectors, no markdown/prose.
3. **GEOMETRY RULES** — preserve proportions + topology exactly, compute from
   given dimensions, hidden edges dashed, dimension labels included.
4. **3D FIGURES** — isometric projection, cavity topology MUST match source
   (along edge vs centered = different openings).
5. **MONKEY5 STYLE** — `var(--ink)`, Times italic labels, `fill="white"` only
   when needed to occlude hidden edges, no `black`/hex.

**Đánh giá chất lượng output (2026-06-12 verified):**

| Test | Engine | Result |
|---|---|---|
| LTV 2020-21 Câu 20 (triangle + cevian) | Gemini | ✓ math, ⚠ clipping |
| NTT 2026-27 Câu 12 (cube + corner cavity) | Codex gpt-5.5 | First attempt: centered cavity (WRONG topology). Second attempt với description nhấn "along front-top edge + opens to 2 faces": ✓ correct corner-cut với dashed hidden edges + dimension ticks |

**Lesson learned**: model có thể sai topology lần đầu cho 3D figures phức
tạp. Quy trình ổn:
1. Run với description ngắn → inspect output → nếu sai topology, fix description CỤ THỂ (vị trí cavity, mặt mở) → re-run.
2. Hand touch-up cho clipping/label position (§D.4).
3. Khi step 1 fail 2+ lần với figure phức tạp → JSON-intermediate (§D.7 step 2).

---

## §10. Helper snippets

```bash
# Backup
cp prisma/dev.db prisma/dev.db.bak-$(date +%Y%m%d-%H%M%S)

# Tìm header bleed còn sót
npx tsx -e 'import("./node_modules/@prisma/client/index.js").then(async ({PrismaClient}) => {
  const p = new PrismaClient();
  const n = await p.question.count({ where: { modelAnswer: { contains: "ĐỀ KIỂM TRA TUYỂN SINH" } } });
  console.log("Header bleed còn lại:", n);
  await p.$disconnect();
});'

# Đếm câu có modelAnswer cho 1 nhóm
python3 -c "import json; m=json.load(open('official_exams_metadata.json')); \
  cnt=sum(1 for e in m['exams'] if e['school']=='cg' for q in e['questions'] if q['type']!='essay'); \
  print(cnt)"

# Compare PDF correct vs metadata (paste bảng PDF vào dict rồi diff)
```

---

## §11. Definition of Done

- [ ] DB count câu khớp PDF.
- [ ] Mỗi fill/mcq có `correct` đúng (đã so PDF từng câu).
- [ ] MCQ `correct` là letter A/B/C/D.
- [ ] `unit` chính xác hoặc `null`.
- [ ] Stem không có watermark / header bleed / LaTeX vỡ.
- [ ] **Khi có PDF đáp án**: mọi essay đã có `modelAnswer` clean LaTeX + `correct` (giá trị đáp số) — không silently leave `null`.
- [ ] **Khi PDF không có đáp án**: đã hỏi user theo §A.2b và mỗi câu đã có resolution rõ ràng (a/b/c) — không có câu nào "quên hỏi".
- [ ] `modelAnswer` (nếu có) đọc được, công thức render đúng.
- [ ] Tất cả `figure` đã có SVG (audit không còn `FIGURE_MISSING`).
- [ ] `npx tsx scripts/audit-questions.ts` clean.
- [ ] Mở `/exam/<examId>` trong `npm run dev` → load + render OK.
- [ ] Backup `dev.db.bak-…` đã tạo trước seed.
- [ ] Script verify tạm đã xoá.

---

## §12. 7 nguyên tắc bất biến

1. **DB = runtime source of truth** — app KHÔNG đọc JSON.
2. **Override map = SoT cho `correct/unit/figure`** — không sửa metadata JSON trực tiếp.
3. **MCQ `correct` = letter**, không bao giờ là giá trị.
4. **Override `stem` / `modelAnswer` phải pre-formatted LaTeX**.
5. **Backup DB trước mọi re-seed**.
6. **Không websearch hình** — chỉ dùng PDF gốc.
7. **Không tạo script động ngoài project root** — Prisma client cần resolve.

---

## Bắt đầu

Bây giờ thực hiện request của user: **$ARGUMENTS**

- Nếu thiếu thông tin, hỏi user trước khi đụng vào file.
- Trước khi re-seed: luôn backup DB.
- Sau khi sửa: chạy verify + audit.
- Sau cùng: báo cáo gọn (1–2 đoạn) với danh sách files thay đổi và kết quả verify.
