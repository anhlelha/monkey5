# Hệ thống chấm điểm (Grading)

Tài liệu chi tiết về cách app chấm câu trả lời. Tập trung vào các tình huống dễ
nhầm liên quan đến dấu `,` và `.` — vì trong tiếng Việt `,` là dấu thập phân
còn `.` là dấu hàng nghìn, ngược hoàn toàn với chuẩn Anh-Mỹ.

> Nguồn gốc: tất cả logic ở `lib/grading/`. Cả submit-time
> (`app/exam/[examId]/actions.ts`) và render-time (`ResultsView.tsx`) đều gọi
> `gradeAnswer()` — đây là điểm vào duy nhất.

---

## 0. Thuật ngữ (Glossary)

Tra cứu nhanh các thuật ngữ dùng trong tài liệu này và trong codebase.

### Vòng đời dữ liệu

| Thuật ngữ | Nghĩa |
|---|---|
| **Seed / seed-time** | Quá trình ghi dữ liệu đề thi từ source (PDF / JSON / override map) vào SQLite database. Chạy script `scripts/seed-all-exams.ts`. Là **destructive**: `deleteMany` theo examId rồi `createMany`. Chỉ xảy ra khi developer chạy lệnh thủ công. |
| **Run-time** | Lúc app chạy thực tế trong production (Next.js server đã build). Tất cả truy vấn câu hỏi đọc từ Prisma DB, không đọc JSON. |
| **Submit-time** | Khoảnh khắc user bấm "Nộp bài" trong `/exam/[examId]`. `gradeAnswer` chạy ở server action (`app/exam/[examId]/actions.ts`), kết quả ghi vào bảng `Attempt`. |
| **Render-time** | Khi `ResultsView.tsx` hiển thị lại kết quả. `gradeAnswer` chạy LẠI để render dấu ✓/✗ từng câu — nghĩa là fix logic chấm sẽ phản ánh ngay khi reload, dù `Attempt.earned`/`score` đã đóng băng từ submit-time. |
| **Bank** | "Kho câu hỏi gốc" — các Question có examId dạng `cg-2020`, `ltv-2018`, … (tên trường + năm). Sinh ra từ `official_exams_metadata.json`. |
| **Clone / spawn** | Bản sao câu hỏi từ bank tạo bởi `lib/spawn-exam.ts` khi user click "Phỏng đề". examId là CUID dạng `set-…` hoặc `ref-…`. `sourceQuestionId` trỏ về câu gốc. |
| **Attempt** | Một lần làm bài (`prisma.attempt`). Lưu `earned`, `score`, `correctCount` đóng băng từ submit-time. Re-grade attempt cũ bằng `scripts/regrade-attempts.ts`. |
| **Regrade** | Chạy `gradeAnswer` lại trên `Attempt.answers` đã lưu để cập nhật điểm sau khi sửa logic. |
| **Override map** | `scripts/exam-overrides.ts` — chứa `MANUAL_OVERRIDES` và `CG_ENRICHMENT_MAP`. Là "single source of truth" cho `correct` / `unit` / `figure` / `modelAnswer`. |
| **Metadata** | `official_exams_metadata.json` — file sinh ra bởi `build-exams-metadata.ts`, là input cho seed. Đừng sửa tay. |

### Cấu trúc câu hỏi

| Thuật ngữ | Nghĩa |
|---|---|
| **Stem** | Phần đề bài (câu hỏi) hiển thị cho user, lưu trong `Question.stem`. Có thể chứa LaTeX (`$...$`). |
| **Type** | `mcq` (trắc nghiệm 4 đáp án A/B/C/D), `fill` (điền đáp số/text), hoặc `essay` (tự luận — không chấm tự động). |
| **Correct** | Đáp án đúng, lưu ở `Question.correct`. Dạng: với MCQ là 1 ký tự `"A"|"B"|"C"|"D"`; với fill là chuỗi đáp số (`"6"`, `"x = 4"`, `"7/8; 9/10; 4/3"`, `"mẹ 50, con 25"`). |
| **Options** | Cho MCQ: 4 lựa chọn A/B/C/D (lưu JSON). |
| **Model answer** | Lời giải chi tiết (LaTeX), lưu ở `Question.modelAnswer`. Hiển thị sau khi user nộp. |
| **Unit** | Đơn vị đáp số (`"km"`, `"cm²"`, …), tách riêng để render đẹp. |
| **Figure** | ID hình vẽ (vd `"ltv-2020-c5"`), tham chiếu sang SVG trong `components/ExamFigure.tsx`. |

### Pipeline chấm

| Thuật ngữ | Nghĩa |
|---|---|
| **Classifier** | Hàm `classifyAnswer(correct)` ở `lib/grading/classify.ts`. **Input**: chuỗi `correct`. **Output**: `AnswerSchema` + confidence (high/medium/low) + reason. Chạy seed-time. |
| **AnswerSchema** | Cấu trúc mô tả "loại đáp án này là gì". 5 dạng: `numeric`, `numeric_set`, `labeled`, `regex`, `exact`. Lưu JSON-stringified trong `Question.answerSchema`. |
| **Dispatcher** | Thân hàm `gradeAnswer(q, raw)` ở `lib/grading/index.ts`. Vai trò: nhìn `q.type` + `q.answerSchema` rồi quyết định gọi matcher nào. Xem mục §1. |
| **Matcher** | Các hàm `match*` trong `lib/grading/matchers/*.ts`. Mỗi loại schema có matcher riêng. Trả về `GradeResult { correct, method, confidence, diagnostic }`. |
| **Extractor** | `extractNumbers(input, opts?)` ở `lib/grading/extractors.ts`. Bóc số (int/decimal/fraction/mixed) ra khỏi chuỗi tiếng Việt tự do. Là "trái tim" của mọi matcher numeric. |
| **Normalize** | `normalizeText` / `normalizeForExact` ở `lib/grading/normalize.ts`. Lowercase + bỏ dấu (`stripDiacritics`) + gộp whitespace. Dùng cho `matchExact`. |
| **Tolerance** | Sai số chấp nhận khi so 2 số float. Mặc định `1e-9`; phân số dùng `1e-4` (cho phép sai số làm tròn 1/3 ≈ 0.333). |

### Cơ chế xử lý chuỗi

| Thuật ngữ | Nghĩa |
|---|---|
| **Chunk** | Một dãy ký tự liên tục "giống số" (digit + `.`, `,`, `/`, dấu trừ đầu) tách ra bởi `NUMBER_CHUNK_RE`. `parseChunk` xử lý từng chunk độc lập. |
| **Mixed fraction** | Phân số hỗn số dạng `1 3/4` (= 1.75). Phải xử lý TRƯỚC chunk-splitting vì chứa khoảng trắng. |
| **Vietnamese decimal** | `,` là dấu thập phân kiểu Việt: `1,5` = 1.5. Ngược chuẩn Anh-Mỹ. |
| **Thousands separator** | Dấu phân tách hàng nghìn. Việt dùng `.` (`1.000` = 1000), Anh-Mỹ dùng `,` (`1,000` = 1000). Hệ thống nhận diện cả hai. |
| **European style** | Chunk có cả `,` và `.` (`1.000,5`): `.` là ngàn, `,` là thập phân. |
| **List separator** | `,` hoặc `;` tách các phần tử trong dãy số. Phân biệt với decimal/thousands qua 4 rule (xem §3.3 nhánh E). |
| **Diacritics** | Dấu thanh tiếng Việt (à, ả, ã, á, ạ, …). `stripDiacritics` bỏ hết: `"Siêu thị"` → `"sieu thi"`. |
| **LaTeX wrap** | Bọc công thức bằng `$...$` để renderer hiển thị math. Override `stem`/`modelAnswer` phải pre-wrap; `formatMathText` không động vào chuỗi đã có `$`. |

### Cơ chế disambiguation

| Thuật ngữ | Nghĩa |
|---|---|
| **Schema kind** | Tag phân loại `AnswerSchema`: `"numeric" | "numeric_set" | "labeled" | "regex" | "exact"`. |
| **Confidence (classifier)** | Mức độ chắc chắn của classifier: `high`/`medium`/`low`. `low` không được ghi schema vào DB. |
| **Confidence (matcher)** | Trường `confidence` trong `GradeResult`. `1.0` = chính xác hoàn toàn; `0.95` = chấm đúng qua fallback `commasAsListSeparators`; `0.9`/`0.85` = `labeled` chấp nhận multiset không có nhãn. |
| **Fallback (commasAsListSeparators)** | Mode đặc biệt của `extractNumbers`: ép coi `,` là dấu phân tách danh sách (thay vì decimal). Kích hoạt khi default extract trả count khác kỳ vọng. |
| **Expected count** | Số lượng số mong đợi, lấy từ `schema.values.length`. Là tín hiệu chính để dispatcher quyết định có dùng fallback hay không. Xem §4.5. |
| **Multiset** | Tập hợp có cho phép trùng, không quan tâm thứ tự. `matchNumericSet` với `ordered:false` so theo multiset. |
| **Diagnostic** | Trường `diagnostic` trong `GradeResult` — chuỗi mô tả vì sao chấm ra kết quả đó. Hữu ích để debug. |

### Hạ tầng dữ liệu

| Thuật ngữ | Nghĩa |
|---|---|
| **CUID** | Định dạng ID tự sinh kiểu `cmqb7ifv0000012z5aid6eohs` (Prisma `@default(cuid())`). Khác với ID có cấu trúc như `LTV-2018-19-C7`. |
| **Source question** | Câu gốc trong bank mà clone trỏ về qua `sourceQuestionId`. |
| **Audit** | `scripts/audit-questions.ts`. Quét DB tìm vấn đề (`FIGURE_MISSING`, `NO_ANSWER`, `WATERMARK`, `SHORT_STEM`, `MATH_RAW`, `FIGURE_LIKELY`). |
| **Watermark strip** | Hàm `stripWatermarks` trong seed: lọc text "MathExpress Education", "Toán Tuổi Thơ", header trang lẫn vào stem. |

---

## 1. Kiến trúc 3 lớp

```
                ┌─────────────────────────────────────────┐
SEED-TIME       │  classifyAnswer(q.correct)              │
(scripts/       │       └─→ AnswerSchema                  │
 seed-all       │                                          │
 -exams.ts)     │  Lưu vào Question.answerSchema (JSON)   │
                └─────────────────────────────────────────┘
                                  ↓
                ┌─────────────────────────────────────────┐
RUN-TIME        │  gradeAnswer(q, userInput)              │
(lib/grading/   │       └─→ parseSchema(q.answerSchema)   │
 index.ts)      │       └─→ dispatch theo schema.kind     │
                └─────────────────────────────────────────┘
                                  ↓
                ┌─────────────────────────────────────────┐
MATCHER         │  matchNumeric / matchNumericSet /       │
(matchers/*)    │  matchLabeled / matchRegex / matchExact │
                │       └─→ extractNumbers(...)           │
                └─────────────────────────────────────────┘
```

**Quy tắc dispatcher** (`lib/grading/index.ts:67`):

1. `text.length === 0` → `correct: false, method: "empty"`.
2. `q.type === "mcq"` → so khớp ký tự tuyệt đối `text === q.correct`
   (`"A" | "B" | "C" | "D"`). Schema bị bỏ qua.
3. Có schema khác `exact` → gọi `gradeWithSchema`.
4. Còn lại (không có schema, hoặc schema là `exact`) → `matchExact` so chuỗi
   theo `normalizeForExact` (lowercase + bỏ dấu + bỏ punctuation đuôi).

---

## 2. Năm loại AnswerSchema

| `kind` | Khi nào tạo | Matcher | Confidence khi chấm |
|---|---|---|---|
| `numeric` | `correct` là 1 số (vd `"6"`, `"−2,5"`, `"a=6"`, `"7/8"`) | `matchNumeric` | 1.0 nếu chính xác |
| `numeric_set` | nhiều số ngăn bằng `;` `,` (vd `"24; 26; 28"`, `"a=13; b=17"`) | `matchNumericSet` | 1.0 hoặc 0.95 (fallback) |
| `labeled` | có nhãn (vd `"mẹ 50, con 25"`) | `matchLabeled` | 1.0 / 0.9 / 0.85 |
| `regex` | gắn thủ công qua override | `matchRegex` | 1.0 |
| `exact` | mặc định cho text thuần (vd `"Siêu thị"`) — KHÔNG ghi vào DB; rơi vào fallback | `matchExact` | 1.0 |

> Quy tắc seed: chỉ ghi schema vào DB khi `confidence !== "low"` **và**
> `kind !== "exact"`. Text thuần luôn rớt xuống `matchExact`.

---

## 3. Tâm điểm: `extractNumbers()` xử lý dấu `,` `.` thế nào

`extractNumbers(input, opts?)` ở `lib/grading/extractors.ts`. Đây là hàm dễ
gây nhầm nhất vì cùng một dấu `,` có 3 nghĩa: dấu thập phân (`1,5` = 1.5),
dấu phân tách hàng nghìn (`1,000` = 1000 kiểu Anh-Mỹ), hoặc dấu phân tách
danh sách (`24,26,28` = ba số).

### 3.1. Bước 1 — Mixed fraction trước

Regex: `/(-?\d+)\s+(\d+)\/(\d+)/g`

Bắt mẫu `số nguyên + space + tử/mẫu` rồi đánh dấu vùng đã ăn để bước 2 không
đụng lại.

```
INPUT                    EXTRACT
"1 3/4"                  [1.75]
"-2 1/2"                 [-2.5]
"2 5/6 và 3 1/4"         [2.833..., 3.25]
```

> ⚠️ Lưu ý: regex này CỐ Ý chỉ chạy ở mode mặc định. Trong mode
> `commasAsListSeparators` đã chia item theo `[,;]+` trước nên mỗi item được
> extract độc lập — tránh bug "8 9/10" bị bắt nhầm khi user gõ "7/8,9/10".
> (Xem mục 6.)

### 3.2. Bước 2 — Chia chunk theo `NUMBER_CHUNK_RE`

Regex: `/-?\d[\d.,/]*\d|-?\d/g`

Mỗi chunk là một dãy ký tự "giống số" (digit, `.`, `,`, `/`, dấu trừ đầu).
Khoảng trắng, dấu `;`, chữ cái — đều ngắt chunk.

```
INPUT                    CHUNKS
"3,14"                   ["3,14"]
"24; 26"                 ["24", "26"]
"884,1105"               ["884,1105"]
"7/8; 9/10"              ["7/8", "9/10"]
"7km và 60%"             ["7", "60"]
```

### 3.3. Bước 3 — `parseChunk()` áp các quy tắc

Đây là chỗ phán định một chunk có dấu `,` `.` nghĩa là gì. Bốn nhánh chính:

#### Nhánh A — số nguyên / phân số đơn giản

```
"7"        → 7
"-12"      → -12
"7/8"      → 0.875
"-3/4"     → -0.75
```

#### Nhánh B — 1 dấu `.` (singleDot)

Đếm số chữ số sau dấu chấm:

| Trước | Sau | Diễn giải | Ví dụ |
|---|---|---|---|
| 1–3 chữ số | đúng 3 chữ số | Hàng nghìn (Việt) | `1.000` → 1000, `12.345` → 12345 |
| còn lại | bất kỳ | Decimal Anh-Mỹ | `3.14` → 3.14, `0.5` → 0.5, `1.2345` → 1.2345 |

```
"1.000"     → 1000      (hàng nghìn)
"3.14"      → 3.14      (decimal)
"1.5"       → 1.5       (decimal — sau chỉ 1 chữ số, không phải 3)
"1.500"     → 1500      (hàng nghìn — sau đúng 3 chữ số)
"12.345"    → 12345     (hàng nghìn)
```

> 📝 Trường hợp khó: `"1.500"` có thể là 1500 (Việt) hoặc 1.5 (Mỹ chữ số có
> nghĩa). Hệ thống quyết định theo Việt: ưu tiên hàng nghìn nếu khớp pattern
> `(\d{1,3})\.(\d{3})`. Nếu đề thực sự muốn 1.5 mà gốc ghi "1.500" thì cần
> ghi `1,5` (kiểu Việt) hoặc `1.5` (1 chữ số sau dấu chấm).

#### Nhánh C — Có `,` và `.` cùng lúc (European style)

Khi chunk có **đúng 1 dấu `,` và ≥1 dấu `.`**: `.` là hàng nghìn, `,` là
thập phân. Tháo `.` rồi đổi `,` thành `.`.

```
"1.000,5"      → 1000.5
"1.234.567,89" → 1234567.89
"12.000,75"    → 12000.75
```

#### Nhánh D — Chỉ có `.` (≥2 dấu, không `,`)

Pattern hàng nghìn: phần đầu 1–3 chữ số, mọi phần sau đúng 3 chữ số.

```
"1.000.000"     → 1000000
"12.345.678"    → 12345678
"1.234"         → 1234        (từ nhánh B, vì chỉ có 1 dấu chấm)
"1.23.456"      → [1, 23, 456] (không khớp pattern hàng nghìn → rớt xuống fallback cuối, tách thành digit runs)
```

#### Nhánh E — Chỉ có `,` (không `.`) — **NHIỀU TRƯỜNG HỢP PHỨC TẠP NHẤT**

Bốn quy tắc, áp theo thứ tự:

| Rule | Điều kiện | Diễn giải | Ví dụ |
|---|---|---|---|
| **1** | `parts.length === 2 && parts[0] === "0"` | Bắt đầu bằng `0,` luôn là decimal | `0,5` → 0.5; `0,125` → 0.125 |
| **2** | `parts.length === 2 && /^\d{1,2}$/.test(parts[1])` | 2 phần, phần sau 1–2 chữ số → decimal Việt | `1,5` → 1.5; `3,14` → 3.14; `12,99` → 12.99 |
| **3** | parts đầu 1–3 chữ số, phần sau mỗi cái **đúng 3 chữ số** | Hàng nghìn Anh-Mỹ | `1,000` → 1000; `1,234,567` → 1234567 |
| **4** | Còn lại | Danh sách số | `24,26,28,30` → [24, 26, 28, 30]; `884,1105` → [884, 1105] |

**Ma trận quyết định** với 2 phần (`A,B`):

```
A=0 ?              ──Yes──→  decimal     (Rule 1: "0,5" → 0.5)
 ↓ No
B độ dài 1–2 ?     ──Yes──→  decimal     (Rule 2: "1,5" / "3,14" → 1.5 / 3.14)
 ↓ No
B độ dài 3 và
A độ dài 1–3 ?     ──Yes──→  hàng nghìn  (Rule 3: "1,000" → 1000)
 ↓ No
                              danh sách  (Rule 4: "884,1105" → [884, 1105])
```

**Ví dụ minh hoạ vùng tranh chấp:**

```
INPUT          OUT          QUY TẮC ÁP DỤNG
"1,5"          [1.5]        Rule 2 (2 phần, B=1 ký tự)
"1,55"         [1.55]       Rule 2 (2 phần, B=2 ký tự)
"1,555"        [1555]       Rule 3 (B đúng 3 ký tự → hàng nghìn)
"1,5555"       [1, 5555]    Rule 4 (B 4 ký tự, không khớp Rule 2/3)
"0,5"          [0.5]        Rule 1 (luôn ép decimal vì A=0)
"0,5555"       [0.5555]     Rule 1 (vẫn ép decimal — '0' không bao giờ là số nguyên đứng đầu trong văn bản Việt)
"24,26,28,30"  [24,26,28,30] Rule 4 (3+ parts không khớp hàng nghìn)
"884,1105"     [884, 1105]  Rule 4 (B=4 ký tự, không khớp hàng nghìn)
"1,234,567"    [1234567]    Rule 3 (mọi part sau đều đúng 3)
"1,234,56"     [1, 234, 56] Rule 4 (part cuối chỉ 2 ký tự → không phải hàng nghìn)
```

> 💡 **Tại sao `0,X` luôn là decimal?** Vì trong tiếng Việt không có số
> nguyên nào bắt đầu bằng `0` (không ai viết `0125`). Nên `0,125` chắc chắn
> là 0.125 chứ không phải hàng nghìn hay danh sách.

---

## 4. Khi nào `commasAsListSeparators` được kích hoạt

Mặc định, `extractNumbers` áp dụng nhánh E rule 1-4. Nhưng nếu sau lần extract
đầu, **số lượng số tìm được khác số kỳ vọng**, dispatcher sẽ thử lại với
`commasAsListSeparators: true`:

```typescript
// matchNumericSet
let nums = extractNumbers(userInput);
if (nums.length !== opts.values.length) {
  const alt = extractNumbers(userInput, { commasAsListSeparators: true });
  if (alt.length === opts.values.length) {
    nums = alt;
    fallbackUsed = true;   // confidence hạ xuống 0.95
  }
}
```

Trong mode này, input được **chia theo `[,;]+` trước**, rồi mỗi item được
extract độc lập (mixed-fraction vẫn chạy trong từng item, nhưng không xuyên
qua ranh giới item).

**Ví dụ:**

```
INPUT (mode mặc định)        EXTRACT       INPUT (commasAsList)         EXTRACT
"3,14"                       [3.14]        "3,14"                       [3, 14]
"24,26,28,30"                [24,26,28,30] "24,26,28,30"                [24,26,28,30]  (giống nhau)
"7/8,9/10,4/3"               []            "7/8,9/10,4/3"               [0.875, 0.9, 1.333...]
"1 3/4, 2 5/6"               [1.75, 2.833] "1 3/4, 2 5/6"               [1.75, 2.833]
```

> ⚠️ **Bug đã fix tháng 6/2026**: trước đây mode này dùng
> `input.replace(/,/g, " ")` rồi đệ quy → khi input là `"7/8,9/10,4/3"`,
> string tạm `"7/8 9/10 4/3"` bị `MIXED_FRACTION_RE` bắt nhầm `"8 9/10"`
> thành 8 + 9/10 = 8.9. Đã thay bằng split theo `[,;]+` rồi extract từng
> item — đảm bảo ranh giới item ngăn regex xuyên qua.

---

## 4.5. Context-aware extraction — nguồn "số lượng kỳ vọng"

Một câu hỏi thường ngầm định số lượng đáp số (vd "Tìm **3** số…"). Hệ thống
hiện tại **CÓ** dùng số lượng này làm tín hiệu disambiguate, nhưng nguồn lấy
số lượng đó **không phải stem câu hỏi** — mà là `values.length` của schema
(suy ra từ `correct` lúc seed).

### Cơ chế hiện hữu

```
seed-time:    correct = "24; 26; 28"
              → classifyAnswer → schema = {kind:"numeric_set", values:[24,26,28]}
              → values.length = 3   (đây là "context")

run-time:     matchNumericSet(userInput, {values:[24,26,28]})
              ├── Lần 1: extractNumbers(userInput)
              │   └── Nếu count = 3 → dùng ngay (confidence 1.0)
              │
              └── Lần 2: extractNumbers(userInput, {commasAsListSeparators:true})
                  └── Nếu count = 3 → dùng fallback (confidence 0.95)
```

**Đây là lý do "7/8,9/10,4/3" chấm đúng**: schema đã biết kỳ vọng 3 phân số,
nên khi default extract ra `[]` (0 số), fallback `commasAsList` kích hoạt và
xác nhận được 3 số đúng count → chấp nhận.

### Ví dụ minh hoạ vai trò của "expected count"

Giả sử user gõ `"3,14"` (chuỗi mơ hồ — có thể là số π hoặc danh sách [3, 14]):

| Schema | values.length | Default | Fallback | Kết quả |
|---|---|---|---|---|
| `{numeric, value: 3.14}` | n/a (1 số) | `[3.14]` | — | ✓ |
| `{numeric_set, values:[3, 14]}` | 2 | `[3.14]` (sai count) | `[3, 14]` | ✓ qua fallback |
| `{numeric, value: 3}` | n/a (1 số) | `[3.14]` (≠ 3) | — | ✗ (đúng, không thể disambig) |

→ Schema lái cách phân tích cùng một chuỗi user.

### Stem-aware grading — **CHƯA implement**

Hiện tại `GradeQuestion` interface (`lib/grading/types.ts`) **không nhận `stem`**:

```typescript
export interface GradeQuestion {
  type: "fill" | "mcq" | "essay";
  correct: string | null;
  answerSchema?: AnswerSchema | string | null;
  // stem?: string;  ← KHÔNG CÓ
}
```

Nên grader không "đọc" được đề bài. Mọi tín hiệu context phải đi qua schema.

**Khi nào điều này thực sự là vấn đề?**

99% tình huống không vấn đề, vì:
1. Nếu `correct` đã được classify thành `numeric_set` đúng số lượng — schema đã có context.
2. Nếu `correct` là 1 số — `matchNumeric` strict, từ chối input có >1 số (tránh false positive).

Các tình huống stem-parsing **có thể giúp**:

- `correct = "1,5"` nhưng đề là "Tìm 2 số nhỏ nhất thoả…": classifier hiện
  đọc "1,5" thành 1 số (1.5 decimal) → schema `numeric`. User gõ "1, 5" cũng
  bị extract thành `[1.5]`. Stem nói "2 số" sẽ ép parse thành `[1, 5]`.
- `correct` thiếu/null nhưng đề là MCQ ngầm: rất hiếm, thường là lỗi import.

**Cách bổ sung nếu cần** (chưa có trong code):

1. Thêm field `stem?: string` vào `GradeQuestion`.
2. Viết helper `parseExpectedCountFromStem(stem)` regex các pattern: `tìm (\d+) số`, `(\d+) số có`, `gồm (\d+) số`, "hai số" / "ba số" (chữ số Việt).
3. Trong `gradeAnswer`, nếu schema không có hoặc số lượng schema lệch stem, ưu tiên count từ stem khi gọi `extractNumbers` với `commasAsListSeparators`.
4. Update cả 2 call site (`actions.ts`, `ResultsView.tsx`) để truyền `stem`.

Trade-off: stem parse Việt khá noisy ("tìm số có tổng" vs "tìm 2 số có tổng"
vs "tìm hai số…"); rủi ro detect sai → ép parse sai. Hiện tại schema-based
đã giải quyết 100% case đã gặp, nên chưa làm.

---

## 5. Ví dụ end-to-end theo từng schema

### 5.1. `numeric` — câu hỏi đáp số duy nhất

Đáp án gốc: `"6"` → schema `{kind:"numeric", value:6}`.

```
USER INPUT       GRADE
"6"              correct
"6 quyển"        correct          (extract bỏ chữ → [6])
"a = 6"          correct          (Vietnamese-aware extractor)
"khoảng 6"       correct          (1 số, đúng giá trị)
"5 hoặc 6"       wrong            ("expected single number, got 2")
""               wrong            (empty)
```

Đáp án gốc: `"−2,5"` → schema `{kind:"numeric", value:-2.5}`.

```
"−2,5"           correct          (Rule 2 nhánh E)
"-2.5"           correct          (singleDot Mỹ-style cũng ok vì 1 chữ số sau)
"-2,50"          correct          (Rule 2, B=2 chữ số: -2.50)
"x = -2,5"       correct
```

Đáp án gốc: `"7/8"` → schema `{kind:"numeric", value:0.875, tolerance:1e-4}`.

```
"7/8"            correct          (simple fraction)
"0,875"          correct          (decimal Việt)
"0.875"          correct          (decimal Mỹ)
"0,88"           correct (~)      (tol=1e-4? Thực ra |0.88-0.875|=0.005 > tol → WRONG)
```

> ⚠️ Tolerance `1e-4` chỉ đủ cho làm tròn 1/3 = 0.333 vs 0.3333… Để chấp
> nhận `"0,88"` cho 7/8 thì cần override tolerance lớn hơn.

### 5.2. `numeric_set` — nhiều đáp số

Đáp án gốc: `"24; 26; 28; 30"` → `{kind:"numeric_set", values:[24,26,28,30], ordered:false}`.

```
USER INPUT             GRADE     DIAGNOSTIC
"24; 26; 28; 30"       correct   default extract → [24,26,28,30]
"24,26,28,30"          correct   default Rule 4 → [24,26,28,30]
"30,28,26,24"          correct   multiset, unordered
"24 26 28 30"          correct   space ngắt chunk
"24; 26; 28"           wrong     "got [24,26,28] vs expected [24,26,28,30]"
"24; 26; 28; 30; 32"   wrong     thừa số
```

Đáp án gốc: `"7/8; 9/10; 4/3"` → `{kind:"numeric_set", values:[0.875, 0.9, 1.333], ordered:false}`.

```
USER INPUT             GRADE       LÝ DO
"7/8; 9/10; 4/3"       correct     ; ngắt chunk → 3 phân số
"7/8;9/10;4/3"         correct     ; vẫn ngắt chunk
"7/8, 9/10, 4/3"       correct     phẩy + space → space ngắt chunk
"7/8,9/10,4/3"         correct     default trả [] → fallback commasAsList → 3 phân số  (FIX 06/2026)
"0,875; 0,9; 1,333"    correct     decimal Việt (Rule 2)
"4/3; 9/10; 7/8"       correct     unordered = true
```

### 5.3. `labeled` — nhãn + giá trị

Đáp án gốc: `"mẹ 50, con 25"` → labeled schema với aliases.

```
USER INPUT                GRADE     CASE
"mẹ 50, con 25"           correct   Case A — đủ nhãn
"mẹ: 50, con: 25"         correct   filler ":" được hấp thụ
"me 50 con 25"            correct   bỏ dấu (normalize)
"50 và 25"                correct   Case B — unlabeled multiset
"25, 50"                  correct   Case B — unordered (multiset)
"mẹ 50"                   wrong     partial — chỉ 1 nhãn
"con 50, mẹ 25"           wrong     sai giá trị theo nhãn (Case A nhưng giá trị lệch)
```

### 5.4. MCQ — bỏ qua mọi normalize

```
correct: "B"

USER INPUT       GRADE
"B"              correct
"b"              WRONG    (case-sensitive, không normalize)
" B "            WRONG    (không trim — UI submit phải chuẩn hoá trước)
"B."             WRONG
```

> 📌 UI luôn submit option ID nguyên vẹn (`"A" | "B" | "C" | "D"`). Nếu thấy
> hành vi lạ, kiểm tra `app/exam/[examId]/actions.ts` xem có hậu xử lý nào
> ép case hay không.

### 5.5. `exact` fallback — câu trả lời text thuần

Khi không có schema (hoặc `kind === "exact"`), `matchExact` so sánh sau khi:
- Bỏ dấu (Vietnamese diacritics → ASCII)
- Lowercase
- Gộp khoảng trắng
- Bỏ punctuation đuôi (`.,;!?`)

```
correct: "Siêu thị"

USER INPUT       GRADE     normalizeForExact
"Siêu thị"       correct   "sieu thi"
"sieu thi"       correct   "sieu thi"
"SIÊU THỊ"       correct   "sieu thi"
"Siêu thị."      correct   "sieu thi"     (bỏ '.')
"siêu  thị"      correct   "sieu thi"     (gộp khoảng trắng)
"siêu thị mới"   WRONG     "sieu thi moi"
"shop"           WRONG
```

---

## 6. Bài học từ các bug đã gặp

### 6.1. `"7/8,9/10,4/3"` chấm sai (fix tháng 6/2026)

- Schema: `numeric_set` với 3 phân số.
- Default extract: trả `[]` vì cả chuỗi gom thành 1 chunk lẫn `,` `/`.
- Fallback `commasAsListSeparators` cũ: `replace(/,/g, " ")` rồi đệ quy →
  string `"7/8 9/10 4/3"` bị `MIXED_FRACTION_RE` bắt `"8 9/10"` thành 8.9.
- Kết quả: `[8.9, 7, 1.333]` ≠ `[0.875, 0.9, 1.333]` → SAI.
- Fix: tách items theo `[,;]+` trước rồi extract từng item.

### 6.2. MCQ correct là value thay vì letter

Lỗi cổ điển khi import từ JSON: lưu `"0,5"` thay vì `"B"` cho câu MCQ mà
option B là `1/2`. Dispatcher MCQ làm so chuỗi tuyệt đối → submit nào cũng
sai. Phải sửa override để `correct: "B"`.

### 6.3. Auto-classify confidence "low" không ghi schema

Một số đáp án ngắn (`"42m"`) lúc seed bị classify `medium`/`high` nên có
schema. Nhưng nếu cấu trúc lạ (vd `"khoảng 42"`) ra `low` → không lưu schema
→ rớt vào `matchExact` → user gõ `"42"` (đúng nghĩa) vẫn SAI. Khắc phục:
gắn schema thủ công qua override map.

### 6.4. `spawn-exam` clone không mang `answerSchema` (fix tháng 6/2026)

- Câu LTV-2018-19-C7 (`correct="x = 4"`) trong bank được auto-classify thành
  `{kind:"numeric", value:4}` lúc seed.
- Khi user mở library và click "Phỏng đề LTV", `lib/spawn-exam.ts` clone câu
  này vào exam mới với CUID examId (`set-*` / `ref-*`) — nhưng **chỉ copy
  `correct`**, không copy `answerSchema`.
- Question clone có `answerSchema = null` → dispatcher rớt xuống
  `matchExact` → so chuỗi `"4"` ≠ `"x = 4"` → SAI.
- Fix: thêm field `answerSchema` ở cả 2 `createMany` trong `lib/spawn-exam.ts`,
  fallback `classifyAnswer` khi source row cũ chưa có schema. Backfill bằng
  `scripts/backfill-answer-schema.ts`.

### 6.5. `formatMathText` ăn LaTeX trong override

Override `stem` / `modelAnswer` đã chứa `$…$` thì seed không động vào.
Override chưa wrap mà có `\frac{a}{a+b}` có thể bị thêm `$` lạ. Luôn pre-wrap
LaTeX trong override map.

---

## 7. Khi user báo "chấm sai" — quy trình debug

1. **Lấy 3 giá trị**: `correct` gốc (từ DB), `userInput` user gõ, `answerSchema` đang lưu.
   ```bash
   sqlite3 prisma/dev.db "SELECT correct, answerSchema FROM Question WHERE id='<qid>';"
   ```
2. **Chạy thử `gradeAnswer`** trong script tạm để xem `diagnostic`:
   ```ts
   import { gradeAnswer } from "@/lib/grading";
   console.log(gradeAnswer({ type:"fill", correct, answerSchema }, userInput));
   ```
3. **Nếu schema sai** (vd `numeric_set` mà chỉ có 1 giá trị): chạy thử
   `classifyAnswer(correct)` để xem classifier sẽ ra gì lần seed tới.
4. **Nếu schema đúng nhưng extractor sai**: chạy
   `extractNumbers(userInput)` và `extractNumbers(userInput, {commasAsListSeparators:true})`
   để xem chỗ nào vỡ.
5. **Sau khi fix logic**: re-seed (`scripts/seed-all-exams.ts`) hoặc nếu chỉ
   cần cập nhật điểm cũ, chạy `scripts/regrade-attempts.ts`.

---

## 8. Bảng tra nhanh — gặp dấu này thì hiểu thế nào

| Dấu trong câu trả lời | Nghĩa mặc định | Ví dụ |
|---|---|---|
| `,` giữa 2 phần, sau ≤ 2 chữ số | Thập phân Việt | `1,5` = 1.5, `3,14` = 3.14 |
| `,` giữa 2 phần, sau đúng 3 chữ số | Hàng nghìn Anh-Mỹ | `1,000` = 1000 |
| `,` giữa 2 phần, sau ≥ 4 chữ số | Danh sách | `884,1105` = [884, 1105] |
| `,` ≥ 3 phần, mọi phần sau đúng 3 | Hàng nghìn | `1,234,567` = 1234567 |
| `,` ≥ 3 phần, có phần sai | Danh sách | `24,26,28` = [24,26,28] |
| `0,XXX` | Luôn thập phân | `0,125` = 0.125 |
| `.` 1 dấu, sau đúng 3 chữ số | Hàng nghìn Việt | `1.000` = 1000 |
| `.` 1 dấu, sau khác 3 chữ số | Thập phân Anh-Mỹ | `3.14` = 3.14 |
| `.` ≥ 2 dấu, pattern khớp | Hàng nghìn | `1.000.000` = 1000000 |
| `.` + `,` cùng chunk | European: `.` ngàn, `,` thập phân | `1.000,5` = 1000.5 |
| `;` | Luôn ngắt danh sách | `24;26;28` = [24,26,28] |
| space giữa số nguyên + phân số | Mixed fraction | `1 3/4` = 1.75 |
| `/` giữa 2 số nguyên | Phân số | `7/8` = 0.875 |

---

## 9. Reference

- Code: `lib/grading/{index,classify,extractors,normalize}.ts`,
  `lib/grading/matchers/*.ts`
- Schema gốc trong DB: cột `Question.answerSchema` (JSON string)
- Pipeline content: xem `CLAUDE.md` mục "Exam content pipeline"
- Re-grade attempt cũ: `scripts/regrade-attempts.ts`
