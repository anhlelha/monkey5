import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(import.meta.dirname, "..");
const runArg = process.argv.indexOf("--run-dir");
if (runArg < 0 || !process.argv[runArg + 1]) {
  throw new Error("Usage: node scripts/generate-readiness-v2-preview-dashboard.mjs --run-dir <assessment-run> [--output <filename>]");
}

const runDir = path.resolve(ROOT, process.argv[runArg + 1]);
const outputArg = process.argv.indexOf("--output");
const outputName = outputArg >= 0 && process.argv[outputArg + 1]
  ? path.basename(process.argv[outputArg + 1])
  : "dashboard-readiness-v2-preview.html";
const outputPath = path.join(runDir, outputName);
const questions = JSON.parse(readFileSync(path.join(runDir, "questions-with-figures.json"), "utf8"));
const assessments = JSON.parse(readFileSync(path.join(runDir, "cognition-difficulty-assessments.json"), "utf8"));
const taxonomyAssessments = JSON.parse(readFileSync(path.join(runDir, "topic-taxonomy-v1-assessments.json"), "utf8"));
const metadata = JSON.parse(readFileSync(path.join(runDir, "run-metadata.json"), "utf8"));
const assessmentById = new Map(assessments.map((row) => [row.questionId, row]));
const taxonomyById = new Map(taxonomyAssessments.map((row) => [row.questionId, row]));

const SCHOOL_NAMES = {
  ams: "Amsterdam",
  arc: "Archimedes",
  cg: "Cầu Giấy",
  ltv: "Lương Thế Vinh",
  nksp: "Năng Khiếu Sư Phạm",
  nn: "Ngoại ngữ",
  nshm: "Ngôi Sao Hoàng Mai",
  nshn: "Ngôi Sao Hà Nội",
  ntl: "Nam Từ Liêm",
  ntt: "Nguyễn Tất Thành",
  tx: "Thanh Xuân",
};

const COLORS = ["#6f4fb2", "#3d6fa9", "#2f806d", "#b56a2b", "#a94f6b", "#40788e", "#7f6041", "#675b9b", "#397563", "#9b5d36", "#536f9a"];
const TOPICS = {
  num_div: { label: "Số tự nhiên, chữ số & chia hết", color: "#4267a7" },
  frac_decimal: { label: "Phân số & số thập phân", color: "#6a62b3" },
  ratio_percent: { label: "Tỉ số, phần trăm & tỉ lệ", color: "#3d87a1" },
  sequence_pattern: { label: "Dãy số, quy luật & đại số", color: "#8a6db5" },
  plane_geometry: { label: "Hình phẳng & diện tích", color: "#cf7447" },
  solid_geometry: { label: "Hình khối & thể tích", color: "#b8586e" },
  measurement: { label: "Đo lường, đơn vị & ước lượng", color: "#b8843d" },
  time_calendar: { label: "Thời gian & lịch", color: "#60778d" },
  motion: { label: "Chuyển động đều", color: "#2f8990" },
  work_rate: { label: "Công việc, năng suất & lưu lượng", color: "#4f9d78" },
  data_probability: { label: "Dữ liệu, thống kê & xác suất", color: "#8065a5" },
  counting_combinatorics: { label: "Đếm & tổ hợp", color: "#a46083" },
  logic_strategy: { label: "Logic, bất biến & chiến lược", color: "#7e618f" },
};
const COGNITIVE_LABELS = { co_ban: "Cơ bản", van_dung: "Vận dụng", nang_cao: "Nâng cao", chuyen_sau: "Chuyên sâu" };
const TYPE_LABELS = { choice: "Trắc nghiệm", fill: "Điền đáp án", essay: "Tự luận" };
const bandOf = (difficulty) => difficulty <= 2 ? "foundation" : difficulty === 3 ? "application" : "advanced";
const bySchool = new Map();
for (const question of questions) {
  const assessment = assessmentById.get(question.questionId);
  const taxonomy = taxonomyById.get(question.questionId);
  if (!assessment) throw new Error(`Missing assessment for ${question.questionId}`);
  if (!taxonomy) throw new Error(`Missing taxonomy assessment for ${question.questionId}`);
  if (!bySchool.has(question.school)) {
    bySchool.set(question.school, { difficulties: [], exams: new Map() });
  }
  const school = bySchool.get(question.school);
  school.difficulties.push(assessment.difficulty);
  school.exams.set(question.examId, {
    minutes: question.examMinutes,
    questionCount: question.examQuestionCount,
  });
}

const quantile = (sorted, p) => {
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const preliminary = [...bySchool.entries()].map(([school, data]) => {
  const n = data.difficulties.length;
  const exams = [...data.exams.values()];
  const rawAverage = data.difficulties.reduce((sum, value) => sum + value, 0) / n;
  const d4 = data.difficulties.filter((value) => value === 4).length / n;
  const d5 = data.difficulties.filter((value) => value === 5).length / n;
  const qpm = exams.reduce((sum, exam) => sum + exam.questionCount / exam.minutes, 0) / exams.length;
  return { school, name: SCHOOL_NAMES[school] ?? school.toUpperCase(), n, examCount: exams.length, rawAverage, d4, d5, qpm };
});

const qpmValues = preliminary.map((row) => row.qpm).sort((a, b) => a - b);
const timeP10 = quantile(qpmValues, 0.10);
const timeP90 = quantile(qpmValues, 0.90);
for (const row of preliminary) {
  row.baseIndex = ((row.rawAverage - 1) / 4) * 100;
  row.tailIndex = (0.75 * row.d4 + row.d5) * 100;
  row.timeIndex = clamp(((row.qpm - timeP10) / (timeP90 - timeP10)) * 100, 0, 100);
  row.compositeRaw = 0.70 * row.baseIndex + 0.20 * row.tailIndex + 0.10 * row.timeIndex;
}

const totalQuestions = preliminary.reduce((sum, row) => sum + row.n, 0);
const calibrationMean = preliminary.reduce((sum, row) => sum + row.compositeRaw * row.n, 0) / totalQuestions;
const rows = preliminary.map((row, index) => ({
  ...row,
  color: COLORS[index % COLORS.length],
  difficultyIndex: 50 + row.compositeRaw - calibrationMean,
  confidence: row.examCount >= 5 && row.n >= 50 ? "high" : row.examCount >= 3 && row.n >= 30 ? "medium" : "low",
}));

const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const schoolProfiles = rows.map((row) => {
  const items = questions.filter((question) => question.school === row.school).map((question) => ({
    question,
    assessment: assessmentById.get(question.questionId),
    taxonomy: taxonomyById.get(question.questionId),
  }));
  const validPointItems = items.filter(({ question }) => Number.isFinite(Number(question.points)) && Number(question.points) > 0);
  const totalPoints = validPointItems.reduce((sum, { question }) => sum + Number(question.points), 0);
  const topicMap = new Map();
  for (const { question, assessment, taxonomy } of items) {
    const topicId = taxonomy.topicPrimary;
    if (!topicMap.has(topicId)) {
      topicMap.set(topicId, {
        topic: topicId,
        label: TOPICS[topicId]?.label ?? topicId,
        color: TOPICS[topicId]?.color ?? "#697487",
        count: 0,
        points: 0,
        bands: {
          foundation: { count: 0, points: 0 },
          application: { count: 0, points: 0 },
          advanced: { count: 0, points: 0 },
        },
      });
    }
    const topic = topicMap.get(topicId);
    const points = Number.isFinite(Number(question.points)) && Number(question.points) > 0 ? Number(question.points) : 0;
    const band = bandOf(assessment.difficulty);
    topic.count += 1;
    topic.points += points;
    topic.bands[band].count += 1;
    topic.bands[band].points += points;
  }
  const topics = [...topicMap.values()].map((topic) => ({
    ...topic,
    countWeight: topic.count / items.length,
    pointWeight: totalPoints > 0 ? topic.points / totalPoints : null,
    critical: topic.count / items.length >= 0.05,
    bands: Object.fromEntries(Object.entries(topic.bands).map(([band, cell]) => [band, {
      ...cell,
      countWeight: cell.count / items.length,
      pointWeight: totalPoints > 0 ? cell.points / totalPoints : null,
    }])),
  })).sort((a, b) => b.countWeight - a.countWeight || a.label.localeCompare(b.label, "vi"));

  const difficultyCounts = Object.fromEntries([1, 2, 3, 4, 5].map((difficulty) => [difficulty, items.filter(({ assessment }) => assessment.difficulty === difficulty).length]));
  const cognitiveCounts = Object.fromEntries(Object.keys(COGNITIVE_LABELS).map((level) => [level, items.filter(({ assessment }) => assessment.cognitiveLevel === level).length]));
  const typeCounts = Object.fromEntries([...new Set(items.map(({ question }) => question.questionType ?? "unknown"))].map((type) => [type, items.filter(({ question }) => (question.questionType ?? "unknown") === type).length]));
  const examMap = new Map();
  for (const item of items) {
    const { question, assessment } = item;
    if (!examMap.has(question.examId)) {
      examMap.set(question.examId, {
        examId: question.examId,
        title: question.examTitle,
        year: question.year,
        minutes: Number(question.examMinutes) || 0,
        expectedQuestions: Number(question.examQuestionCount) || 0,
        items: [],
      });
    }
    examMap.get(question.examId).items.push(item);
  }
  const exams = [...examMap.values()].map((exam) => {
    const examPoints = exam.items.reduce((sum, { question }) => sum + (Number.isFinite(Number(question.points)) ? Number(question.points) : 0), 0);
    const examDifficulty = exam.items.map(({ assessment }) => assessment.difficulty);
    return {
      examId: exam.examId,
      title: exam.title,
      year: exam.year,
      minutes: exam.minutes,
      questionCount: exam.items.length,
      expectedQuestions: exam.expectedQuestions,
      points: examPoints,
      qpm: exam.minutes > 0 ? exam.items.length / exam.minutes : 0,
      averageDifficulty: mean(examDifficulty),
      d4d5Share: examDifficulty.filter((difficulty) => difficulty >= 4).length / examDifficulty.length,
    };
  }).sort((a, b) => String(b.year).localeCompare(String(a.year)) || a.examId.localeCompare(b.examId));
  const years = [...new Set(exams.map((exam) => exam.year).filter(Boolean))].sort();
  return {
    school: row.school,
    name: row.name,
    color: row.color,
    questionCount: items.length,
    examCount: exams.length,
    yearCount: years.length,
    years,
    yearRange: years.length ? `${years[0]} – ${years[years.length - 1]}` : "—",
    averageMinutes: mean(exams.map((exam) => exam.minutes).filter((value) => value > 0)),
    averageQuestions: mean(exams.map((exam) => exam.questionCount)),
    averageQpm: mean(exams.map((exam) => exam.qpm).filter((value) => value > 0)),
    totalPoints,
    pointCoverage: validPointItems.length / items.length,
    averageDifficulty: mean(items.map(({ assessment }) => assessment.difficulty)),
    d4d5Share: items.filter(({ assessment }) => assessment.difficulty >= 4).length / items.length,
    averageAssessmentConfidence: mean(items.map(({ assessment }) => assessment.assessmentConfidence)),
    averageTopicConfidence: mean(items.map(({ taxonomy }) => taxonomy.topicConfidence)),
    visualShare: items.filter(({ question }) => question.hasFigure).length / items.length,
    difficultyIndex: row.difficultyIndex,
    baseIndex: row.baseIndex,
    tailIndex: row.tailIndex,
    timeIndex: row.timeIndex,
    confidence: row.confidence,
    topics,
    difficultyCounts,
    cognitiveCounts,
    typeCounts,
    exams,
  };
});

const payload = {
  model: metadata.model,
  runId: metadata.runId,
  totalQuestions,
  formula: { baseWeight: 0.70, tailWeight: 0.20, timeWeight: 0.10, alpha: 80, beta: 60, diffK: 0.60, anchor: 50 },
  calibration: { compositeMean: calibrationMean, timeP10, timeP90 },
  rows,
  schoolProfiles,
};

const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Monkey5 · Difficulty Index v2 Preview</title>
  <style>
    :root{--paper:#f5f6fa;--ink:#18202d;--muted:#697487;--line:#dfe4ec;--card:#fff;--purple:#6f4fb2;--purple-soft:#eee9f8;--blue:#3d6fa9;--green:#2f806d;--amber:#a85f22;--rose:#a94f6b;--shadow:0 13px 34px rgba(24,32,45,.08)}
    *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.45}.shell{max-width:1480px;margin:auto;padding:28px 28px 60px}.hero{display:grid;grid-template-columns:1fr auto;gap:24px;padding:30px 32px;border-radius:22px;color:#fff;background:radial-gradient(circle at 88% 0,#d7caff 0,transparent 29%),radial-gradient(circle at 60% 140%,#0b6372 0,transparent 37%),linear-gradient(122deg,#191537,#46347d);box-shadow:var(--shadow)}.eyebrow{margin:0 0 8px;color:#dcd5f4;text-transform:uppercase;letter-spacing:.13em;font-size:11px;font-weight:850}.hero h1{margin:0 0 10px;font-size:clamp(28px,4vw,43px);line-height:1.06;letter-spacing:-.045em}.hero p{max-width:860px;margin:0;color:#ebe8f7}.preview{height:min-content;padding:8px 12px;border:1px solid rgba(255,255,255,.3);border-radius:999px;background:rgba(255,255,255,.12);font-size:12px;font-weight:850;white-space:nowrap}.formula{display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;margin:18px 0;padding:15px 18px;border:1px solid #dad4ed;border-left:4px solid var(--purple);border-radius:13px;background:var(--purple-soft);color:#41365f}.formula code{font-size:13px;font-weight:750}.locked{display:flex;gap:7px;flex-wrap:wrap}.pill{display:inline-flex;padding:5px 9px;border-radius:999px;background:#fff;border:1px solid #d9d2eb;font-size:11px;font-weight:850;white-space:nowrap}.control-row{display:grid;grid-template-columns:1fr 230px;gap:15px;margin-bottom:15px}.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.kpi,.panel{background:var(--card);border:1px solid var(--line);box-shadow:0 2px 10px rgba(20,30,47,.025)}.kpi{padding:17px;border-radius:14px}.label{font-size:11px;color:var(--muted);font-weight:800}.value{margin:4px 0;font-size:28px;letter-spacing:-.045em;font-weight:900}.sub{font-size:11px;color:#8b94a4}.slider{padding:15px 17px;border-radius:14px;background:#fff;border:1px solid var(--line)}.slider-head{display:flex;justify-content:space-between;align-items:baseline;font-size:12px;font-weight:850}.slider output{font-size:24px;color:var(--purple)}input[type=range]{width:100%;accent-color:var(--purple)}.grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-top:15px}.panel{padding:20px;border-radius:16px}.panel h2{margin:0 0 2px;font-size:17px;letter-spacing:-.02em}.caption{margin:0 0 18px;color:var(--muted);font-size:12px}.chart{display:grid;gap:10px}.chart-row{display:grid;grid-template-columns:56px 1fr 58px;align-items:center;gap:10px;font-size:12px}.school-id{font-weight:900;text-transform:uppercase}.track{height:13px;border-radius:999px;background:#edf0f5;overflow:hidden;position:relative}.fill{height:100%;border-radius:inherit}.track.center:after{content:"";position:absolute;left:50%;top:0;bottom:0;width:1px;background:#8b94a4}.num{text-align:right;font-variant-numeric:tabular-nums;font-weight:850}.legend{display:flex;gap:16px;flex-wrap:wrap;margin-top:14px;color:var(--muted);font-size:11px}.legend span:before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;background:var(--dot)}.table-panel{margin-top:15px}.scroll{overflow:auto;border:1px solid var(--line);border-radius:12px}.data-table{width:100%;min-width:1160px;border-collapse:collapse;font-size:12px}.data-table th{padding:10px 11px;background:#f8f9fc;text-align:right;text-transform:uppercase;letter-spacing:.055em;font-size:10px;color:#6b7484;white-space:nowrap}.data-table th:first-child,.data-table td:first-child{text-align:left}.data-table td{padding:11px;border-bottom:1px solid #edf0f4;text-align:right;vertical-align:middle}.data-table tr:last-child td{border:0}.data-table tr:hover td{background:#fbfbfe}.school-name b{display:block}.school-name span{color:var(--muted);font-size:10px}.index{font-size:16px;color:var(--purple);font-weight:900}.raw{font-weight:850}.conf{display:inline-flex;padding:3px 7px;border-radius:999px;font-size:10px;font-weight:850}.conf.high{background:#e6f3ef;color:#246b5a}.conf.medium{background:#f8eddc;color:#8a541d}.conf.low{background:#f6e7eb;color:#91485e}.breakdown{display:flex;justify-content:flex-end;gap:3px}.seg{height:8px;border-radius:99px}.seg.base{background:#6f4fb2}.seg.tail{background:#a94f6b}.seg.time{background:#3d6fa9}.foot{margin-top:14px;color:var(--muted);font-size:11px}.foot b{color:#455063}
    [hidden]{display:none!important}.tabs{display:flex;gap:6px;margin:18px 0;padding:5px;width:max-content;max-width:100%;border:1px solid var(--line);border-radius:13px;background:#fff;box-shadow:0 2px 10px rgba(20,30,47,.03)}.tab{appearance:none;border:0;border-radius:9px;padding:10px 15px;background:transparent;color:var(--muted);font:inherit;font-size:12px;font-weight:850;cursor:pointer}.tab[aria-selected="true"]{background:var(--purple);color:#fff;box-shadow:0 4px 10px rgba(111,79,178,.24)}.profile-head{display:flex;justify-content:space-between;gap:18px;align-items:end;margin:4px 0 15px}.profile-head h2{margin:0;font-size:24px;letter-spacing:-.035em}.profile-select{min-width:310px}.profile-select label{display:block;margin-bottom:6px;color:var(--muted);font-size:11px;font-weight:850;text-transform:uppercase;letter-spacing:.05em}.profile-select select{width:100%;padding:11px 13px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--ink);font:inherit;font-weight:750}.profile-note{margin-bottom:15px;padding:14px 16px;border:1px solid #d8e8e3;border-left:4px solid var(--green);border-radius:12px;background:#edf7f4;color:#295d52;font-size:12px}.profile-kpis{grid-template-columns:repeat(6,minmax(0,1fr));margin-bottom:15px}.profile-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:15px}.metric-list{display:grid;gap:11px}.metric-row{display:grid;grid-template-columns:145px 1fr 58px;gap:10px;align-items:center;font-size:12px}.metric-row .track{height:10px}.metric-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:750}.profile-table{min-width:980px}.profile-table th:first-child,.profile-table td:first-child{position:sticky;left:0;z-index:1;background:#fff}.profile-table th:first-child{background:#f8f9fc}.topic-cell b{display:block}.topic-cell small{color:var(--muted)}.cell-share{display:block;font-size:10px;color:var(--muted)}.critical{display:inline-flex;margin-left:5px;padding:2px 6px;border-radius:999px;background:#f8e7ed;color:#91485e;font-size:9px;font-weight:900}.profile-summary{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 16px}.summary-chip{padding:6px 9px;border:1px solid var(--line);border-radius:999px;background:#fff;color:#4c586a;font-size:11px;font-weight:750}.exam-table{min-width:850px}.profile-source{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:15px}.source-card{padding:13px;border:1px solid var(--line);border-radius:11px;background:#fafbfc}.source-card b{display:block;margin-bottom:3px;font-size:12px}.source-card span{color:var(--muted);font-size:11px}
    @media(max-width:1200px){.profile-kpis{grid-template-columns:repeat(3,1fr)}.profile-source{grid-template-columns:repeat(2,1fr)}}@media(max-width:1050px){.control-row,.grid,.profile-grid{grid-template-columns:1fr}.kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:680px){.shell{padding:15px 12px 35px}.hero{grid-template-columns:1fr;padding:23px 20px}.preview{justify-self:start}.kpis,.profile-kpis{grid-template-columns:1fr 1fr}.formula{grid-template-columns:1fr}.chart-row{grid-template-columns:45px 1fr 48px}.tabs{width:100%}.tab{flex:1}.profile-head{display:block}.profile-select{min-width:0;margin-top:12px}.metric-row{grid-template-columns:110px 1fr 48px}.profile-source{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div><p class="eyebrow">Monkey5 · Readiness calibration</p><h1>Difficulty Index v2</h1><p>Giữ nguyên độ khó trung bình D1–D5, bổ sung chỉ số 0–100 để phản ánh cả mặt bằng câu hỏi, đuôi D4–D5 và áp lực thời gian.</p></div>
      <div class="preview">Preview · chưa áp dụng hệ thống</div>
    </section>
    <nav class="tabs" role="tablist" aria-label="Nội dung dashboard">
      <button class="tab" id="difficultyTab" type="button" role="tab" aria-selected="true" aria-controls="difficultyPane" data-tab="difficulty">Difficulty Index</button>
      <button class="tab" id="profileTab" type="button" role="tab" aria-selected="false" aria-controls="profilePane" data-tab="profile">School Profile</button>
    </nav>
    <div id="difficultyPane" role="tabpanel" aria-labelledby="difficultyTab">
    <section class="formula">
      <code>Index = center₅₀(70% × mean difficulty + 20% × D4–D5 tail + 10% × time pressure)</code>
      <div class="locked"><span class="pill">ALPHA = 80 · giữ nguyên</span><span class="pill">BETA = 60 · giữ nguyên</span><span class="pill">Anchor = 50 · cố định</span></div>
    </section>
    <section class="control-row">
      <div class="kpis" id="kpis"></div>
      <div class="slider"><div class="slider-head"><span>DIFF_K</span><output id="kOut">0.60</output></div><input id="diffK" type="range" min="0" max="1.2" step="0.05" value="0.60"><div class="sub">Điều chỉnh gap readiness, không đổi raw/index.</div></div>
    </section>
    <section class="grid">
      <article class="panel"><h2>Difficulty Index theo trường</h2><p class="caption">Thang 0–100, đường giữa là anchor 50. Sắp xếp từ khó đến dễ.</p><div id="indexChart" class="chart"></div><div class="legend"><span style="--dot:#6f4fb2">Difficulty Index v2</span><span style="--dot:#8b94a4">Anchor 50</span></div></article>
      <article class="panel"><h2>Readiness của học sinh mới</h2><p class="caption">Mastery topic/cognitive đều 0.5, vì vậy ALPHA và BETA chưa tạo chênh lệch; gap đến từ DIFF_K.</p><div id="readinessChart" class="chart"></div><div class="legend"><span style="--dot:#2f806d">Readiness baseline</span><span style="--dot:#8b94a4">Baseline 50</span></div></article>
    </section>
    <section class="panel table-panel"><h2>Chi tiết hệ số theo trường</h2><p class="caption">Raw average luôn được giữ lại. Confidence dựa trên số đề và số câu hiện có trong run chính thức.</p><div class="scroll"><table class="data-table"><thead><tr><th>Trường</th><th>Câu / đề</th><th>Confidence</th><th>Raw D1–D5</th><th>D4–D5</th><th>Câu/phút</th><th>Base</th><th>Tail</th><th>Time</th><th>Cơ cấu 70/20/10</th><th>Index v2</th><th>Readiness mới</th></tr></thead><tbody id="schoolRows"></tbody></table></div><p class="foot"><b>Confidence thấp</b> không có nghĩa đề dễ/khó sai; chỉ cho biết số năm/đề còn ít, nên cần thận trọng khi coi đó là cực trị.</p></section>
    </div>
    <div id="profilePane" role="tabpanel" aria-labelledby="profileTab" hidden>
      <section class="profile-head">
        <div><p class="eyebrow" style="color:#6f4fb2;margin-bottom:5px">School Profile v2 · dữ liệu chi tiết</p><h2 id="profileTitle">School Profile</h2><p class="caption" id="profileCaption" style="margin:5px 0 0">Blueprint theo chuyên đề × dải độ khó.</p></div>
        <div class="profile-select"><label for="schoolSelect">Chọn trường</label><select id="schoolSelect"></select></div>
      </section>
      <section class="profile-note"><b>Profile trường không chứa dữ liệu học sinh.</b> Tab này mô tả trường thường hỏi chuyên đề gì, ở dải khó nào, với cấu trúc và áp lực thời gian ra sao. Critical topic dùng ngưỡng preview ≥5% theo trọng số số câu.</section>
      <section class="kpis profile-kpis" id="profileKpis"></section>
      <section class="profile-grid">
        <article class="panel"><h2>Phân bố độ khó D1–D5</h2><p class="caption">Phản ánh mặt bằng và phần đuôi phân hoá của toàn bộ câu trong profile.</p><div class="metric-list" id="difficultyDistribution"></div></article>
        <article class="panel"><h2>Mức nhận thức</h2><p class="caption">Cognitive distribution dùng để chẩn đoán cấu trúc đề, không cộng độc lập vào readiness v4.</p><div class="metric-list" id="cognitiveDistribution"></div></article>
      </section>
      <section class="panel table-panel"><h2>Blueprint chuyên đề × dải độ khó</h2><p class="caption">Count weight là trọng số theo số câu; point weight là trọng số theo điểm khi dữ liệu điểm hợp lệ. Các ô hiển thị số câu và tỷ trọng trên toàn profile.</p><div class="profile-summary" id="criticalTopics"></div><div class="scroll"><table class="data-table profile-table"><thead><tr><th>Chuyên đề</th><th>Số câu</th><th>Count weight</th><th>Point weight</th><th>D1–D2 · Nền tảng</th><th>D3 · Vận dụng</th><th>D4–D5 · Phân hoá</th></tr></thead><tbody id="blueprintRows"></tbody></table></div></section>
      <section class="profile-grid">
        <article class="panel"><h2>Cơ cấu chuyên đề</h2><p class="caption">Sắp xếp theo count weight; nhãn “trọng yếu” ở ngưỡng preview 5%.</p><div class="metric-list" id="topicDistribution"></div></article>
        <article class="panel"><h2>Hình thức câu hỏi</h2><p class="caption">Cơ cấu format giúp hiểu cách trường yêu cầu học sinh trình bày hoặc chọn đáp án.</p><div class="metric-list" id="typeDistribution"></div><div class="profile-source" id="profileSources"></div></article>
      </section>
      <section class="panel table-panel"><h2>Lịch sử đề trong profile</h2><p class="caption">Mỗi đề là một nguồn cấu thành profile; có thể dùng để review độ ổn định giữa các năm.</p><div class="scroll"><table class="data-table exam-table"><thead><tr><th>Năm / đề</th><th>Số câu</th><th>Thời lượng</th><th>Câu/phút</th><th>Độ khó TB</th><th>D4–D5</th><th>Tổng điểm ghi nhận</th></tr></thead><tbody id="examRows"></tbody></table></div></section>
    </div>
  </main>
  <script>
    const DATA=${JSON.stringify(payload)};
    const COGNITIVE_LABELS=${JSON.stringify(COGNITIVE_LABELS)};
    const TYPE_LABELS=${JSON.stringify(TYPE_LABELS)};
    const $=id=>document.getElementById(id);
    const fmt=(value,digits=1)=>Number(value).toFixed(digits);
    const pct=value=>fmt(value*100,1)+'%';
    const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const confLabel={high:'Cao',medium:'Vừa',low:'Thấp'};
    const sorted=[...DATA.rows].sort((a,b)=>b.difficultyIndex-a.difficultyIndex);
    function readiness(row,k){return Math.max(0,Math.min(100,50-(row.difficultyIndex-50)*k))}
    function render(){
      const k=Number($('diffK').value);$('kOut').value=fmt(k,2);
      const raw=DATA.rows.map(r=>r.rawAverage),indexes=DATA.rows.map(r=>r.difficultyIndex),ready=DATA.rows.map(r=>readiness(r,k));
      const rawGap=Math.max(...raw)-Math.min(...raw),indexGap=Math.max(...indexes)-Math.min(...indexes),readinessGap=Math.max(...ready)-Math.min(...ready);
      const cards=[['Raw gap',fmt(rawGap,2),'thang D1–D5'],['Index gap',fmt(indexGap,1),'thang 0–100'],['Readiness gap',fmt(readinessGap,1),'với DIFF_K '+fmt(k,2)],['Coverage',DATA.totalQuestions,'câu · '+DATA.rows.length+' trường']];
      $('kpis').innerHTML=cards.map(([label,value,sub])=>'<article class="kpi"><div class="label">'+label+'</div><div class="value">'+value+'</div><div class="sub">'+sub+'</div></article>').join('');
      $('indexChart').innerHTML=sorted.map(r=>'<div class="chart-row"><span class="school-id">'+r.school+'</span><div class="track center"><div class="fill" style="width:'+Math.max(0,Math.min(100,r.difficultyIndex))+'%;background:'+r.color+'"></div></div><span class="num">'+fmt(r.difficultyIndex,1)+'</span></div>').join('');
      $('readinessChart').innerHTML=sorted.map(r=>{const value=readiness(r,k);return '<div class="chart-row"><span class="school-id">'+r.school+'</span><div class="track center"><div class="fill" style="width:'+value+'%;background:#2f806d"></div></div><span class="num">'+fmt(value,1)+'%</span></div>'}).join('');
      $('schoolRows').innerHTML=sorted.map(r=>{const value=readiness(r,k),hard=r.d4+r.d5;return '<tr><td class="school-name"><b>'+r.school.toUpperCase()+' · '+r.name+'</b><span>'+r.examCount+' đề chính thức</span></td><td>'+r.n+' / '+r.examCount+'</td><td><span class="conf '+r.confidence+'">'+confLabel[r.confidence]+'</span></td><td class="raw">'+fmt(r.rawAverage,2)+'</td><td>'+pct(hard)+'</td><td>'+fmt(r.qpm,3)+'</td><td>'+fmt(r.baseIndex,1)+'</td><td>'+fmt(r.tailIndex,1)+'</td><td>'+fmt(r.timeIndex,1)+'</td><td><div class="breakdown"><span class="seg base" style="width:42px"></span><span class="seg tail" style="width:12px"></span><span class="seg time" style="width:6px"></span></div></td><td class="index">'+fmt(r.difficultyIndex,1)+'</td><td><b>'+fmt(value,1)+'%</b></td></tr>'}).join('');
    }
    const distributionRows=(entries,total,color)=>entries.map(([label,count,rowColor])=>'<div class="metric-row"><span class="metric-label" title="'+esc(label)+'">'+esc(label)+'</span><div class="track"><div class="fill" style="width:'+(total?count/total*100:0)+'%;background:'+(rowColor||color)+'"></div></div><span class="num">'+count+' · '+(total?pct(count/total):'—')+'</span></div>').join('');
    const cellHtml=(cell)=>'<b>'+cell.count+' câu</b><span class="cell-share">'+pct(cell.countWeight)+' toàn profile</span>';
    function renderProfile(){
      const p=DATA.schoolProfiles.find(profile=>profile.school===$('schoolSelect').value)||DATA.schoolProfiles[0];
      $('profileTitle').textContent=p.school.toUpperCase()+' · '+p.name;
      $('profileCaption').textContent=p.examCount+' đề · '+p.yearCount+' năm học ('+p.yearRange+') · profile từ '+p.questionCount+' câu đã đánh giá';
      const cards=[
        ['Số đề',p.examCount,p.yearCount+' năm học'],
        ['Số câu',p.questionCount,'coverage assessment 100%'],
        ['Độ khó TB',fmt(p.averageDifficulty,2),'thang D1–D5'],
        ['D4–D5',pct(p.d4d5Share),'phần phân hoá'],
        ['Difficulty Index',fmt(p.difficultyIndex,1),'anchor 50'],
        ['Áp lực thời gian',fmt(p.averageQpm,3),'câu/phút']
      ];
      $('profileKpis').innerHTML=cards.map(([label,value,sub])=>'<article class="kpi"><div class="label">'+label+'</div><div class="value">'+value+'</div><div class="sub">'+sub+'</div></article>').join('');
      $('difficultyDistribution').innerHTML=distributionRows([1,2,3,4,5].map(d=>['D'+d,p.difficultyCounts[d]||0,d>=4?'#a94f6b':d===3?'#6f4fb2':'#2f806d']),p.questionCount,'#6f4fb2');
      $('cognitiveDistribution').innerHTML=distributionRows(Object.keys(COGNITIVE_LABELS).map((key,index)=>[COGNITIVE_LABELS[key],p.cognitiveCounts[key]||0,['#64748b','#3d6fa9','#a94f6b','#71468d'][index]]),p.questionCount,'#3d6fa9');
      const critical=p.topics.filter(topic=>topic.critical);
      $('criticalTopics').innerHTML='<span class="summary-chip"><b>'+critical.length+'</b> chuyên đề trọng yếu ≥5%</span>'+critical.map(topic=>'<span class="summary-chip" style="border-color:'+topic.color+'55"><b>'+esc(topic.label)+'</b> · '+pct(topic.countWeight)+'</span>').join('');
      $('blueprintRows').innerHTML=p.topics.map(topic=>'<tr><td class="topic-cell"><b><span style="color:'+topic.color+'">●</span> '+esc(topic.label)+(topic.critical?'<span class="critical">TRỌNG YẾU</span>':'')+'</b><small>'+esc(topic.topic)+'</small></td><td><b>'+topic.count+'</b></td><td><b>'+pct(topic.countWeight)+'</b></td><td>'+(topic.pointWeight==null?'—':'<b>'+pct(topic.pointWeight)+'</b>')+'</td><td>'+cellHtml(topic.bands.foundation)+'</td><td>'+cellHtml(topic.bands.application)+'</td><td>'+cellHtml(topic.bands.advanced)+'</td></tr>').join('');
      $('topicDistribution').innerHTML=distributionRows(p.topics.map(topic=>[topic.label,topic.count,topic.color]),p.questionCount,'#6f4fb2');
      const typeEntries=Object.entries(p.typeCounts).sort((a,b)=>b[1]-a[1]).map(([type,count])=>[TYPE_LABELS[type]||type,count,type==='essay'?'#a94f6b':type==='fill'?'#6f4fb2':'#3d6fa9']);
      $('typeDistribution').innerHTML=distributionRows(typeEntries,p.questionCount,'#3d6fa9');
      $('profileSources').innerHTML=[
        ['Run',DATA.runId],
        ['Model',DATA.model],
        ['Confidence độ khó',fmt(p.averageAssessmentConfidence,1)+'/100'],
        ['Coverage điểm',pct(p.pointCoverage)]
      ].map(([label,value])=>'<div class="source-card"><b>'+label+'</b><span>'+esc(value)+'</span></div>').join('');
      $('examRows').innerHTML=p.exams.map(exam=>'<tr><td class="school-name"><b>'+esc(exam.year||'—')+' · '+esc(exam.examId)+'</b><span>'+esc(exam.title||'')+'</span></td><td>'+exam.questionCount+(exam.expectedQuestions&&exam.expectedQuestions!==exam.questionCount?' / dự kiến '+exam.expectedQuestions:'')+'</td><td>'+fmt(exam.minutes,0)+' phút</td><td>'+fmt(exam.qpm,3)+'</td><td><b>'+fmt(exam.averageDifficulty,2)+'</b></td><td>'+pct(exam.d4d5Share)+'</td><td>'+fmt(exam.points,1)+'</td></tr>').join('');
    }
    const profileOptions=[...DATA.schoolProfiles].sort((a,b)=>a.name.localeCompare(b.name,'vi'));
    $('schoolSelect').innerHTML=profileOptions.map(p=>'<option value="'+p.school+'">'+p.school.toUpperCase()+' · '+esc(p.name)+'</option>').join('');
    $('schoolSelect').value=profileOptions.some(p=>p.school==='ams')?'ams':profileOptions[0].school;
    $('schoolSelect').addEventListener('change',renderProfile);
    const tabButtons=[...document.querySelectorAll('[data-tab]')];
    function showTab(tab){
      const profile=tab==='profile';
      $('difficultyPane').hidden=profile;
      $('profilePane').hidden=!profile;
      tabButtons.forEach(button=>button.setAttribute('aria-selected',String(button.dataset.tab===tab)));
      if(profile)renderProfile();
      history.replaceState(null,'',profile?'#school-profile':'#difficulty-index');
    }
    tabButtons.forEach(button=>button.addEventListener('click',()=>showTab(button.dataset.tab)));
    $('diffK').addEventListener('input',render);render();
    showTab(location.hash==='#school-profile'?'profile':'difficulty');
  </script>
</body>
</html>`;

writeFileSync(outputPath, html, "utf8");
console.log(JSON.stringify({ output: outputPath, runId: metadata.runId, model: metadata.model, schools: rows.length, rawGap: Math.max(...rows.map((r) => r.rawAverage)) - Math.min(...rows.map((r) => r.rawAverage)), indexGap: Math.max(...rows.map((r) => r.difficultyIndex)) - Math.min(...rows.map((r) => r.difficultyIndex)), calibration: payload.calibration }, null, 2));
