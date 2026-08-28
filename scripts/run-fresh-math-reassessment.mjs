import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const outputArgIndex = process.argv.indexOf("--output-dir");
if (outputArgIndex < 0 || !process.argv[outputArgIndex + 1]) {
  throw new Error("Usage: node scripts/run-fresh-math-reassessment.mjs --output-dir <fresh-directory> [--pass a|b|all] [--max-jobs N] [--model <model-id>]");
}
const OUTPUT_DIR = path.resolve(ROOT, process.argv[outputArgIndex + 1]);
const passArgIndex = process.argv.indexOf("--pass");
const requestedPass = passArgIndex >= 0 ? process.argv[passArgIndex + 1] : "all";
const maxJobsArgIndex = process.argv.indexOf("--max-jobs");
const maxJobs = maxJobsArgIndex >= 0 ? Number(process.argv[maxJobsArgIndex + 1]) : null;
const inputArgIndex = process.argv.indexOf("--input");
const INPUT_PATH = inputArgIndex >= 0
  ? path.resolve(ROOT, process.argv[inputArgIndex + 1])
  : path.join(OUTPUT_DIR, "model-input-manifest.json");
const prefixArgIndex = process.argv.indexOf("--output-prefix");
const OUTPUT_PREFIX = prefixArgIndex >= 0 ? `${process.argv[prefixArgIndex + 1]}-` : "";
const modelArgIndex = process.argv.indexOf("--model");
const MODEL = modelArgIndex >= 0 ? process.argv[modelArgIndex + 1] : "gpt-5.4";
const APP_CODEX_BIN = "/Applications/ChatGPT.app/Contents/Resources/codex";
const CODEX_BIN = process.env.CODEX_BIN || (existsSync(APP_CODEX_BIN) ? APP_CODEX_BIN : "codex");
const MAX_WORKERS = 3;
const BATCH_SIZE = 8;

if (!existsSync(path.join(OUTPUT_DIR, "run-metadata.json"))) throw new Error("Fresh run metadata is missing; export input first");
if (!new Set(["a", "b", "all"]).has(requestedPass)) throw new Error("--pass must be a, b or all");
if (maxJobs !== null && (!Number.isInteger(maxJobs) || maxJobs < 1)) throw new Error("--max-jobs must be a positive integer");

const SCHEMA_DIR = path.join(OUTPUT_DIR, "schemas");
const TEMP_DIR = path.join(OUTPUT_DIR, "tmp");
mkdirSync(SCHEMA_DIR, { recursive: true });
mkdirSync(TEMP_DIR, { recursive: true });

const questions = JSON.parse(readFileSync(INPUT_PATH, "utf8"));
if (!Array.isArray(questions) || !questions.length) throw new Error("Input manifest is empty or invalid");
for (const forbidden of ["systemTopic", "systemGrade", "topic", "grade"]) {
  if (questions.some((question) => Object.hasOwn(question, forbidden))) throw new Error(`Forbidden source label in model input: ${forbidden}`);
}

const PASS_A_ITEM = {
  type: "object",
  additionalProperties: false,
  required: ["questionId", "cognitiveLevel", "difficulty", "reasoningType", "assessmentConfidence", "figureRead", "assessmentNote"],
  properties: {
    questionId: { type: "string" },
    cognitiveLevel: { type: "string", enum: ["co_ban", "van_dung", "nang_cao", "chuyen_sau"] },
    difficulty: { type: "integer", minimum: 1, maximum: 5 },
    reasoningType: { type: "string", enum: ["direct", "multi_step", "non_routine", "proof_or_modeling"] },
    assessmentConfidence: { type: "integer", minimum: 0, maximum: 100 },
    figureRead: { type: "string" },
    assessmentNote: { type: "string" },
  },
};

const TOPICS = [
  "num_div", "frac_decimal", "ratio_percent", "sequence_pattern", "plane_geometry", "solid_geometry",
  "measurement", "time_calendar", "motion", "work_rate", "data_probability", "counting_combinatorics", "logic_strategy",
];
const TAGS = ["ctx_age", "ctx_map_scale", "ctx_finance_commerce", "rep_diagram_required", "cross_domain"];
const PASS_B_ITEM = {
  type: "object",
  additionalProperties: false,
  required: ["questionId", "topicPrimary", "topicSecondary", "contextTags", "topicConfidence", "topicRationale", "figureRead"],
  properties: {
    questionId: { type: "string" },
    topicPrimary: { type: "string", enum: TOPICS },
    topicSecondary: { type: "array", maxItems: 2, items: { type: "string", enum: TOPICS } },
    contextTags: { type: "array", maxItems: 5, items: { type: "string", enum: TAGS } },
    topicConfidence: { type: "integer", minimum: 0, maximum: 100 },
    topicRationale: { type: "string" },
    figureRead: { type: "string" },
  },
};

function wrappedSchema(item) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["assessments"],
    properties: { assessments: { type: "array", items: item } },
  };
}

const schemas = {
  aSingle: path.join(SCHEMA_DIR, "pass-a-single.schema.json"),
  aBatch: path.join(SCHEMA_DIR, "pass-a-batch.schema.json"),
  bSingle: path.join(SCHEMA_DIR, "pass-b-single.schema.json"),
  bBatch: path.join(SCHEMA_DIR, "pass-b-batch.schema.json"),
};
writeFileSync(schemas.aSingle, JSON.stringify(PASS_A_ITEM, null, 2) + "\n");
writeFileSync(schemas.aBatch, JSON.stringify(wrappedSchema(PASS_A_ITEM), null, 2) + "\n");
writeFileSync(schemas.bSingle, JSON.stringify(PASS_B_ITEM, null, 2) + "\n");
writeFileSync(schemas.bBatch, JSON.stringify(wrappedSchema(PASS_B_ITEM), null, 2) + "\n");

const PASS_A_PROMPT = `Bạn là chuyên gia độc lập đánh giá câu Toán tuyển sinh vào lớp 6 tại Việt Nam.

Mục tiêu: gán HAI TRỤC ĐỘC LẬP cho từng câu. Bạn không biết và không được suy đoán nhãn chuyên đề hay nhãn mức độ sẵn có của hệ thống.

A. cognitiveLevel mô tả THAO TÁC TƯ DUY cần có:
- co_ban: nhận biết/áp dụng trực tiếp một quy tắc hoặc thao tác quen thuộc.
- van_dung: chọn mô hình/biểu diễn quen thuộc, nối từ hai dữ kiện hoặc nhiều thao tác có mục tiêu rõ.
- nang_cao: cần chiến lược không lộ ngay, kết hợp ràng buộc, lập luận suy diễn đáng kể hoặc cách giải không theo quy trình chuẩn.
- chuyen_sau: cần insight chọn lọc rất mạnh, khám phá cấu trúc, chứng minh/đếm tinh tế kiểu olympic; chỉ dùng khi thật sự cần thiết.

B. difficulty là mức cản trở thực tế với học sinh lớp 5 luyện thi, tách biệt với cognitiveLevel:
1 = rất dễ; 2 = cơ bản nhưng cần cẩn thận; 3 = vừa–khá, nhiều bước hoặc một liên kết; 4 = khó, nhiều ràng buộc/bẫy/chiến lược; 5 = rất khó, câu phân loại mạnh.

C. reasoningType: direct, multi_step, non_routine hoặc proof_or_modeling.

D. assessmentConfidence là phần trăm 0–100 về độ chắc chắn của chính đánh giá, không phải độ khó và không phải xác suất đáp án đúng. Chỉ hạ khi input mơ hồ hoặc thiếu dữ kiện thật sự. Nếu có hình đính kèm, phải đọc hình trước khi đánh giá.

E. correct, modelAnswer và options chỉ dùng để hiểu đủ yêu cầu. Đánh giá việc học sinh phải tự làm, không làm hạ độ khó vì đã thấy lời giải.

Không dùng công cụ, không đọc file khác, không tìm nhãn nguồn. Chỉ trả JSON đúng schema.`;

const PASS_B_PROMPT = `Bạn là chuyên gia độc lập phân loại chuyên đề câu Toán tuyển sinh vào lớp 6 tại Việt Nam. Bạn không biết và không được suy đoán nhãn chuyên đề hay nhãn mức độ sẵn có của hệ thống.

Chọn chính xác MỘT topicPrimary: kiến thức/kỹ năng mà nếu học sinh không nắm, em đó khó mở khóa phương pháp giải nhất. Chọn tối đa HAI topicSecondary nếu kiến thức phụ thực sự được vận dụng. contextTags chỉ mô tả bối cảnh/cách biểu diễn.

Taxonomy chính:
- num_div: Số tự nhiên, chữ số & chia hết — cấu tạo số, chữ số, ước-bội, chia hết, số dư, số nguyên tố, GCD/LCM, tổ hợp chữ số.
- frac_decimal: Phân số & số thập phân — phép tính/so sánh/rút gọn/quy đồng phân số hoặc số thập phân là công cụ trung tâm.
- ratio_percent: Tỉ số, phần trăm & tỉ lệ — chia theo tỉ lệ, tổng-hiệu-tỉ số, phần trăm, tăng/giảm %, scale là phương pháp mở khóa.
- sequence_pattern: Dãy số, quy luật & đại số sơ cấp — quy luật tạo sinh, chu kỳ, vị trí số hạng, quan hệ biến thiên hoặc ẩn đơn giản.
- plane_geometry: Hình phẳng & diện tích — tam giác, tứ giác, đường tròn, góc, chu vi/diện tích, tỉ lệ diện tích, suy luận hình phẳng.
- solid_geometry: Hình khối & thể tích — hình hộp/lập phương, khối ghép-cắt, triển khai, thể tích, diện tích các mặt.
- measurement: Đo lường, đơn vị & ước lượng — đổi đơn vị, số đo, ước lượng, tiền tệ khi conversion là nút thắt.
- time_calendar: Thời gian & lịch — đồng hồ, ngày-tháng-năm, khoảng thời gian; không có vận tốc.
- motion: Chuyển động đều — quãng đường-vận tốc-thời gian, gặp/đuổi, chuyển động tròn, tàu-cầu-dòng nước.
- work_rate: Công việc, năng suất & lưu lượng — cùng làm, vòi, người-giờ-sản phẩm, phần công việc, lưu lượng.
- data_probability: Dữ liệu, thống kê & xác suất — bảng/biểu đồ, trung bình, tần suất, xác suất đơn giản.
- counting_combinatorics: Đếm & tổ hợp — đếm trường hợp, chọn/sắp xếp/ghép, quy tắc đếm, bắt tay, phân chia.
- logic_strategy: Logic, bất biến & chiến lược — suy luận điều kiện, bất biến, phản chứng, trò chơi, tối ưu/chiến lược.

Nhãn context:
- ctx_age: bài toán tuổi.
- ctx_map_scale: tỉ lệ bản đồ/mô hình scale.
- ctx_finance_commerce: mua bán, giá, chiết khấu, lãi/lỗ, doanh thu, tiền tệ.
- rep_diagram_required: phải đọc hình/biểu đồ mới hiểu hoặc giải được.
- cross_domain: hai chuyên đề chính đều thiết yếu, không có trục chi phối rõ.

Ranh giới bắt buộc:
- plane_geometry thay measurement khi quan hệ hình/công thức/diện tích là mấu chốt; measurement khi đổi đơn vị là nút thắt.
- solid_geometry thay measurement khi cấu trúc khối hoặc công thức thể tích là bắt buộc.
- frac_decimal khi phép tính phân số/thập phân chi phối; ratio_percent khi quan hệ phần-toàn bộ, tỉ số hoặc % chi phối.
- work_rate nếu có suất làm, vòi, người-giờ hoặc phần việc.
- motion nếu có vận tốc/quãng đường; time_calendar nếu chỉ đồng hồ/lịch/khoảng thời gian.
- counting_combinatorics nếu cần đếm cấu hình; logic_strategy nếu cần bất biến/chiến lược/suy luận điều kiện không phải đếm.
- topicSecondary không lặp topicPrimary.
- Nếu hasFigure=false: figureRead phải đúng “Không có hình minh họa” và không gán rep_diagram_required.
- Nếu có hình đính kèm: đọc hình trước; chỉ gán rep_diagram_required khi hình bắt buộc.
- topicConfidence là độ chắc chắn của nhãn chuyên đề, không phải độ khó.
- correct/modelAnswer/options chỉ dùng để hiểu yêu cầu.

Không dùng công cụ, không đọc file khác, không tìm nhãn nguồn. Chỉ trả JSON đúng schema.`;

function compactQuestion(question) {
  return {
    questionId: question.questionId,
    examId: question.examId,
    school: question.school,
    year: question.year,
    examTitle: question.examTitle,
    examMinutes: question.examMinutes,
    examQuestionCount: question.examQuestionCount,
    questionNo: question.questionNo,
    questionType: question.questionType,
    points: question.points,
    stem: question.stem,
    options: question.optionsParsed ?? question.optionsRawJson,
    correct: question.correct,
    modelAnswer: question.modelAnswer,
    unit: question.unit,
    placeholder: question.placeholder,
    hasFigure: question.hasFigure,
    figureKey: question.figureKey,
  };
}

function loadCompleted(file) {
  const completed = new Map();
  if (!existsSync(file)) return completed;
  for (const [index, line] of readFileSync(file, "utf8").split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    if (!row.questionId || completed.has(row.questionId)) throw new Error(`Invalid/duplicate JSONL row at ${file}:${index + 1}`);
    completed.set(row.questionId, row);
  }
  return completed;
}

function chunk(rows, size) {
  const result = [];
  for (let index = 0; index < rows.length; index += size) result.push(rows.slice(index, index + size));
  return result;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function codexRequest({ prompt, schemaPath, imagePath, outputPath }) {
  const args = [
    "exec", "--ephemeral", "--ignore-user-config", "--ignore-rules", "--skip-git-repo-check",
    "--sandbox", "read-only", "--color", "never", "-C", OUTPUT_DIR, "-m", MODEL,
    "--output-schema", schemaPath, "--output-last-message", outputPath,
  ];
  if (imagePath) args.push("--image", imagePath);
  args.push("-");
  return new Promise((resolve, reject) => {
    const child = spawn(CODEX_BIN, args, { cwd: OUTPUT_DIR, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 && existsSync(outputPath)) resolve({ stdout, stderr });
      else reject(new Error(`codex exec exited ${code}: ${stderr.slice(-4000)} ${stdout.slice(-2000)}`));
    });
    child.stdin.end(prompt);
  });
}

function validateA(row, expectedId) {
  if (row.questionId !== expectedId) throw new Error(`Pass A wrong questionId: expected ${expectedId}, got ${row.questionId}`);
  if (!["co_ban", "van_dung", "nang_cao", "chuyen_sau"].includes(row.cognitiveLevel)) throw new Error(`Invalid cognitiveLevel: ${expectedId}`);
  if (!Number.isInteger(row.difficulty) || row.difficulty < 1 || row.difficulty > 5) throw new Error(`Invalid difficulty: ${expectedId}`);
  if (!["direct", "multi_step", "non_routine", "proof_or_modeling"].includes(row.reasoningType)) throw new Error(`Invalid reasoningType: ${expectedId}`);
  if (!Number.isInteger(row.assessmentConfidence) || row.assessmentConfidence < 0 || row.assessmentConfidence > 100) throw new Error(`Invalid assessmentConfidence: ${expectedId}`);
  if (!row.figureRead || !row.assessmentNote) throw new Error(`Missing Pass A rationale: ${expectedId}`);
}

function validateB(row, expectedId, hasFigure) {
  if (row.questionId !== expectedId) throw new Error(`Pass B wrong questionId: expected ${expectedId}, got ${row.questionId}`);
  if (!TOPICS.includes(row.topicPrimary)) throw new Error(`Invalid topicPrimary: ${expectedId}`);
  if (!Array.isArray(row.topicSecondary) || row.topicSecondary.length > 2 || new Set(row.topicSecondary).size !== row.topicSecondary.length || row.topicSecondary.includes(row.topicPrimary) || row.topicSecondary.some((topic) => !TOPICS.includes(topic))) throw new Error(`Invalid topicSecondary: ${expectedId}`);
  if (!Array.isArray(row.contextTags) || new Set(row.contextTags).size !== row.contextTags.length || row.contextTags.some((tag) => !TAGS.includes(tag))) throw new Error(`Invalid contextTags: ${expectedId}`);
  if (!Number.isInteger(row.topicConfidence) || row.topicConfidence < 0 || row.topicConfidence > 100) throw new Error(`Invalid topicConfidence: ${expectedId}`);
  if (!hasFigure && (row.figureRead !== "Không có hình minh họa" || row.contextTags.includes("rep_diagram_required"))) throw new Error(`Invalid text-only figure fields: ${expectedId}`);
  if (!row.figureRead || !row.topicRationale) throw new Error(`Missing Pass B rationale: ${expectedId}`);
}

function buildJobs(pass, completed) {
  const pending = questions.filter((question) => !completed.has(question.questionId));
  const textJobs = chunk(pending.filter((question) => !question.hasFigure), BATCH_SIZE).map((items, index) => ({
    id: `${OUTPUT_PREFIX}${pass}-text-${index + 1}`,
    pass,
    kind: "text",
    items,
  }));
  const visualJobs = pending.filter((question) => question.hasFigure).map((question, index) => {
    if (!question.pngAsset) throw new Error(`Visual question has no PNG: ${question.questionId}`);
    return { id: `${OUTPUT_PREFIX}${pass}-visual-${index + 1}-${question.questionId}`, pass, kind: "visual", items: [question], imagePath: path.join(OUTPUT_DIR, question.pngAsset) };
  });
  return [...textJobs, ...visualJobs];
}

async function runPass(pass) {
  const isA = pass === "a";
  const jsonlPath = path.join(OUTPUT_DIR, OUTPUT_PREFIX + (isA ? "cognition-difficulty-assessments.jsonl" : "topic-taxonomy-v1-assessments.jsonl"));
  const jsonPath = path.join(OUTPUT_DIR, OUTPUT_PREFIX + (isA ? "cognition-difficulty-assessments.json" : "topic-taxonomy-v1-assessments.json"));
  const completed = loadCompleted(jsonlPath);
  let jobs = buildJobs(pass, completed);
  const originalJobCount = jobs.length;
  if (maxJobs !== null) jobs = jobs.slice(0, maxJobs);
  console.log(JSON.stringify({ event: "pass_start", pass: pass.toUpperCase(), alreadyCompleted: completed.size, pendingQuestions: questions.length - completed.size, jobsScheduled: jobs.length, totalPendingJobs: originalJobCount }));
  const failureLog = path.join(OUTPUT_DIR, "failures.jsonl");
  let nextJob = 0;
  let finishedJobs = 0;

  async function executeJob(job) {
    const isVisual = job.kind === "visual";
    const schemaPath = isA ? (isVisual ? schemas.aSingle : schemas.aBatch) : (isVisual ? schemas.bSingle : schemas.bBatch);
    const basePrompt = isA ? PASS_A_PROMPT : PASS_B_PROMPT;
    const taskPrompt = isVisual
      ? `${basePrompt}\n\nĐây là một câu có hình chính thức đã được đính kèm. Hãy đọc hình và đánh giá câu sau:\n${JSON.stringify(compactQuestion(job.items[0]))}`
      : `${basePrompt}\n\nCác câu sau đều không có hình minh họa. Trả về object có trường assessments chứa đúng một kết quả cho mỗi questionId, theo đúng thứ tự bất kỳ:\n${JSON.stringify(job.items.map(compactQuestion))}`;
    let lastError;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const outputPath = path.join(TEMP_DIR, `${job.id}-attempt-${attempt}.json`);
      try {
        await codexRequest({ prompt: taskPrompt, schemaPath, imagePath: job.imagePath, outputPath });
        const payload = JSON.parse(readFileSync(outputPath, "utf8"));
        const rows = isVisual ? [payload] : payload.assessments;
        if (!Array.isArray(rows) || rows.length !== job.items.length) throw new Error(`Wrong result count for ${job.id}`);
        const byId = new Map(rows.map((row) => [row.questionId, row]));
        for (const question of job.items) {
          const row = byId.get(question.questionId);
          if (!row) throw new Error(`Missing ${question.questionId} in ${job.id}`);
          if (isA) validateA(row, question.questionId);
          else validateB(row, question.questionId, question.hasFigure);
          const stored = {
            ...row,
            usedVisual: isVisual,
            figureKey: question.figureKey,
            imagePath: isVisual ? question.pngAsset : null,
            model: MODEL,
            assessedAt: new Date().toISOString(),
          };
          appendFileSync(jsonlPath, JSON.stringify(stored) + "\n", "utf8");
          completed.set(question.questionId, stored);
        }
        return;
      } catch (error) {
        lastError = error;
        appendFileSync(failureLog, JSON.stringify({ at: new Date().toISOString(), pass, jobId: job.id, attempt, error: String(error) }) + "\n", "utf8");
        if (attempt < 4) await sleep(Math.min(20000, 1000 * (2 ** (attempt - 1))));
      }
    }
    throw new Error(`Job failed after retries: ${job.id}: ${lastError}`);
  }

  async function worker(workerId) {
    while (true) {
      const index = nextJob;
      nextJob += 1;
      if (index >= jobs.length) return;
      const job = jobs[index];
      await executeJob(job);
      finishedJobs += 1;
      console.log(JSON.stringify({ event: "job_complete", pass: pass.toUpperCase(), workerId, finishedJobs, scheduledJobs: jobs.length, completedQuestions: completed.size, totalQuestions: questions.length, jobId: job.id }));
    }
  }

  const heartbeat = setInterval(() => {
    console.log(JSON.stringify({ event: "heartbeat", pass: pass.toUpperCase(), finishedJobs, scheduledJobs: jobs.length, completedQuestions: completed.size, at: new Date().toISOString() }));
  }, 30000);
  try {
    await Promise.all(Array.from({ length: Math.min(MAX_WORKERS, Math.max(1, jobs.length)) }, (_, index) => worker(index + 1)));
  } finally {
    clearInterval(heartbeat);
  }
  const orderedRows = questions.filter((question) => completed.has(question.questionId)).map((question) => completed.get(question.questionId));
  writeFileSync(jsonPath, JSON.stringify(orderedRows, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ event: "pass_end", pass: pass.toUpperCase(), completed: orderedRows.length, coveragePct: Number((orderedRows.length / questions.length * 100).toFixed(2)), limitedRun: maxJobs !== null }));
}

async function main() {
  if (requestedPass === "a" || requestedPass === "all") await runPass("a");
  if (requestedPass === "b" || requestedPass === "all") await runPass("b");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
