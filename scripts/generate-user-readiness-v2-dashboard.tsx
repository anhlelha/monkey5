import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import { gradeAnswer, type RawAnswer } from "../lib/grading";
import { prisma } from "../lib/prisma";

type Cognitive = "co_ban" | "van_dung" | "nang_cao" | "chuyen_sau";
type Band = "foundation" | "application" | "advanced";
type Cell = { correct: number; total: number };

const ROOT = path.resolve(import.meta.dirname, "..");
const arg = (name: string, fallback?: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
};
const runInput = arg("--run-dir");
const email = arg("--email", "mikayeubo@gmail.com")!;
if (!runInput) throw new Error("Usage: pnpm tsx scripts/generate-user-readiness-v2-dashboard.tsx --run-dir <assessment-run> [--email <email>]");
const runDir = path.resolve(ROOT, runInput);

const cognitionPath = path.join(runDir, "cognition-difficulty-assessments.json");
const taxonomyPath = path.join(runDir, "topic-taxonomy-v1-assessments.json");
const manifestPath = path.join(runDir, "questions-with-figures.json");
const metadataPath = path.join(runDir, "run-metadata.json");
for (const file of [cognitionPath, taxonomyPath, manifestPath, metadataPath]) {
  if (!existsSync(file)) throw new Error(`Missing input: ${file}`);
}

const cognitionRows = JSON.parse(readFileSync(cognitionPath, "utf8"));
const taxonomyRows = JSON.parse(readFileSync(taxonomyPath, "utf8"));
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
const cognitionById = new Map(cognitionRows.map((row: any) => [row.questionId, row]));
const taxonomyById = new Map(taxonomyRows.map((row: any) => [row.questionId, row]));
const supplementalCognitionPath = path.join(runDir, "mika-unmatched-cognition-difficulty-assessments.json");
const supplementalTaxonomyPath = path.join(runDir, "mika-unmatched-topic-taxonomy-v1-assessments.json");
if (existsSync(supplementalCognitionPath) && existsSync(supplementalTaxonomyPath)) {
  for (const row of JSON.parse(readFileSync(supplementalCognitionPath, "utf8"))) cognitionById.set(row.questionId, row);
  for (const row of JSON.parse(readFileSync(supplementalTaxonomyPath, "utf8"))) taxonomyById.set(row.questionId, row);
}

const TOPICS: Record<string, { label: string; color: string }> = {
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
const COGNITIVE: Record<Cognitive, string> = {
  co_ban: "Cơ bản",
  van_dung: "Vận dụng",
  nang_cao: "Nâng cao",
  chuyen_sau: "Chuyên sâu",
};
const BAND_LABELS: Record<Band, string> = { foundation: "Nền tảng · D1–D2", application: "Vận dụng · D3", advanced: "Phân hóa · D4–D5" };
const BAND_WEIGHTS: Record<Band, number> = { foundation: 0.25, application: 0.40, advanced: 0.35 };
const PRIOR_STRENGTH = 4;
const PRIOR_MASTERY = 0.5;
const ALPHA = 80;
const BETA = 60;
const DIFF_K = 0.60;
const EVIDENCE_TARGET_TOTAL = 40;
const READY_EVIDENCE_MIN = 0.85;
const ADVANCED_SCHOOL_SHARE_GATE = 0.20;
const ADVANCED_EVIDENCE_MIN = 0.60;
const bandOf = (difficulty: number): Band => difficulty <= 2 ? "foundation" : difficulty === 3 ? "application" : "advanced";
const smooth = (cell: Cell): number => (cell.correct + PRIOR_STRENGTH * PRIOR_MASTERY) / (cell.total + PRIOR_STRENGTH);
const blankCell = (): Cell => ({ correct: 0, total: 0 });
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const quantile = (sorted: number[], p: number): number => {
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index), upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

async function main() {
const user = await prisma.user.findUnique({ where: { email } });
if (!user) throw new Error(`User not found: ${email}`);
const attempts = await prisma.attempt.findMany({
  where: { userId: user.id, submitted: true, exam: { subject: "math" } },
  include: { exam: { include: { questions: true } } },
  orderBy: { createdAt: "asc" },
});

const topicCells: Record<string, Record<Band, Cell>> = {};
for (const topic of Object.keys(TOPICS)) topicCells[topic] = { foundation: blankCell(), application: blankCell(), advanced: blankCell() };
const cognitiveCells = Object.fromEntries(Object.keys(COGNITIVE).map((key) => [key, blankCell()])) as Record<Cognitive, Cell>;
const bandCells: Record<Band, Cell> = { foundation: blankCell(), application: blankCell(), advanced: blankCell() };
let answered = 0, matched = 0, correct = 0;
const unmatched = new Map<string, { questionId: string; sourceQuestionId: string | null; examId: string; count: number }>();
const unmatchedInputs = new Map<string, Record<string, unknown>>();

for (const attempt of attempts) {
  let answers: Record<string, unknown> = {};
  try { answers = JSON.parse(attempt.answers); } catch { continue; }
  for (const question of attempt.exam.questions) {
    const answer = answers[question.id];
    if (answer === undefined || answer === null || answer === "") continue;
    answered += 1;
    const assessmentId = cognitionById.has(question.id) ? question.id : question.sourceQuestionId ?? question.id;
    const cognition = cognitionById.get(assessmentId) as any;
    const taxonomy = taxonomyById.get(assessmentId) as any;
    if (!cognition || !taxonomy) {
      const key = `${question.id}:${assessmentId}`;
      const previous = unmatched.get(key);
      unmatched.set(key, { questionId: question.id, sourceQuestionId: question.sourceQuestionId, examId: attempt.examId, count: (previous?.count ?? 0) + 1 });
      unmatchedInputs.set(question.id, {
        questionId: question.id,
        examId: attempt.examId,
        school: attempt.exam.school,
        year: attempt.exam.year,
        examTitle: attempt.exam.title,
        examMinutes: attempt.exam.minutes,
        examQuestionCount: attempt.exam.qcount,
        questionNo: question.num,
        questionType: question.type,
        points: question.points,
        stem: question.stem,
        optionsParsed: JSON.parse(question.options || "[]"),
        correct: question.correct,
        modelAnswer: question.modelAnswer,
        unit: question.unit,
        placeholder: question.placeholder,
        figureKey: null,
        hasFigure: false,
        pngAsset: null,
      });
      continue;
    }
    matched += 1;
    const result = gradeAnswer(
      { type: question.type as "fill" | "mcq" | "essay", correct: question.correct, answerSchema: question.answerSchema },
      answer as RawAnswer,
    );
    if (result.correct) correct += 1;
    const band = bandOf(cognition.difficulty);
    const topic = taxonomy.topicPrimary as string;
    const cognitive = cognition.cognitiveLevel as Cognitive;
    topicCells[topic] ??= { foundation: blankCell(), application: blankCell(), advanced: blankCell() };
    topicCells[topic][band].total += 1;
    cognitiveCells[cognitive].total += 1;
    bandCells[band].total += 1;
    if (result.correct) {
      topicCells[topic][band].correct += 1;
      cognitiveCells[cognitive].correct += 1;
      bandCells[band].correct += 1;
    }
  }
}

const topicMastery = Object.fromEntries(Object.keys(TOPICS).map((topic) => {
  const cells = topicCells[topic];
  const mastery = (Object.keys(BAND_WEIGHTS) as Band[]).reduce((sum, band) => sum + BAND_WEIGHTS[band] * smooth(cells[band]), 0);
  const sampleSize = (Object.keys(cells) as Band[]).reduce((sum, band) => sum + cells[band].total, 0);
  const bands = Object.fromEntries((Object.keys(cells) as Band[]).map((band) => [band, { ...cells[band], mastery: smooth(cells[band]) }]));
  return [topic, { mastery, sampleSize, bands }];
}));
const cognitiveMastery = Object.fromEntries((Object.keys(COGNITIVE) as Cognitive[]).map((key) => [key, { ...cognitiveCells[key], mastery: smooth(cognitiveCells[key]) }]));
const difficultyMastery = Object.fromEntries((Object.keys(BAND_LABELS) as Band[]).map((key) => [key, { ...bandCells[key], mastery: smooth(bandCells[key]) }]));

const schoolGroups = new Map<string, { difficulties: number[]; exams: Map<string, { minutes: number; questionCount: number }>; topics: Record<string, number>; cognitive: Record<string, number>; cells: Record<string, number> }>();
for (const question of manifest) {
  const cognition = cognitionById.get(question.questionId) as any;
  const taxonomy = taxonomyById.get(question.questionId) as any;
  if (!cognition || !taxonomy) continue;
  if (!schoolGroups.has(question.school)) schoolGroups.set(question.school, { difficulties: [], exams: new Map(), topics: {}, cognitive: {}, cells: {} });
  const group = schoolGroups.get(question.school)!;
  group.difficulties.push(cognition.difficulty);
  group.exams.set(question.examId, { minutes: question.examMinutes, questionCount: question.examQuestionCount });
  group.topics[taxonomy.topicPrimary] = (group.topics[taxonomy.topicPrimary] ?? 0) + 1;
  group.cognitive[cognition.cognitiveLevel] = (group.cognitive[cognition.cognitiveLevel] ?? 0) + 1;
  const cellKey = `${taxonomy.topicPrimary}::${bandOf(cognition.difficulty)}`;
  group.cells[cellKey] = (group.cells[cellKey] ?? 0) + 1;
}
const schoolNames: Record<string, string> = { ams: "Amsterdam", arc: "Archimedes", cg: "Cầu Giấy", ltv: "Lương Thế Vinh", nksp: "Năng Khiếu Sư Phạm", nn: "Ngoại ngữ", nshm: "Ngôi Sao Hoàng Mai", nshn: "Ngôi Sao Hà Nội", ntl: "Nam Từ Liêm", ntt: "Nguyễn Tất Thành", tx: "Thanh Xuân" };
const schoolPre = [...schoolGroups.entries()].map(([school, group]) => {
  const n = group.difficulties.length;
  const rawAverage = group.difficulties.reduce((sum, value) => sum + value, 0) / n;
  const d4 = group.difficulties.filter((value) => value === 4).length / n;
  const d5 = group.difficulties.filter((value) => value === 5).length / n;
  const exams = [...group.exams.values()];
  const qpm = exams.reduce((sum, exam) => sum + exam.questionCount / exam.minutes, 0) / exams.length;
  return { school, name: schoolNames[school] ?? school.toUpperCase(), n, examCount: exams.length, rawAverage, d4, d5, qpm, group };
});
const qpmSorted = schoolPre.map((row) => row.qpm).sort((a, b) => a - b);
const p10 = quantile(qpmSorted, 0.10), p90 = quantile(qpmSorted, 0.90);
for (const row of schoolPre) {
  (row as any).baseIndex = ((row.rawAverage - 1) / 4) * 100;
  (row as any).tailIndex = (0.75 * row.d4 + row.d5) * 100;
  (row as any).timeIndex = clamp(((row.qpm - p10) / (p90 - p10)) * 100, 0, 100);
  (row as any).compositeRaw = 0.70 * (row as any).baseIndex + 0.20 * (row as any).tailIndex + 0.10 * (row as any).timeIndex;
}
const schoolQuestionTotal = schoolPre.reduce((sum, row) => sum + row.n, 0);
const compositeMean = schoolPre.reduce((sum, row) => sum + (row as any).compositeRaw * row.n, 0) / schoolQuestionTotal;
let persistedReadiness: Record<string, number> = {};
try { persistedReadiness = JSON.parse(user.readiness); } catch { persistedReadiness = {}; }

const schoolReadiness = schoolPre.map((row) => {
  const topicWeights = Object.fromEntries(Object.entries(row.group.topics).map(([key, value]) => [key, value / row.n]));
  const cognitiveWeights = Object.fromEntries(Object.entries(row.group.cognitive).map(([key, value]) => [key, value / row.n]));
  const topicTerm = Object.entries(topicWeights).reduce((sum, [topic, weight]) => sum + weight * (((topicMastery as any)[topic]?.mastery ?? 0.5) - 0.5), 0);
  const cognitiveTerm = Object.entries(cognitiveWeights).reduce((sum, [key, weight]) => sum + weight * (((cognitiveMastery as any)[key]?.mastery ?? 0.5) - 0.5), 0);
  const difficultyIndex = 50 + (row as any).compositeRaw - compositeMean;
  const topicPoints = topicTerm * ALPHA;
  const cognitivePoints = cognitiveTerm * BETA;
  const difficultyPoints = -(difficultyIndex - 50) * DIFF_K;
  const fit = clamp(50 + topicPoints + cognitivePoints + difficultyPoints, 0, 100);
  const schoolBandWeights = (Object.keys(BAND_LABELS) as Band[]).reduce((result, band) => {
    result[band] = row.group.difficulties.filter((difficulty) => bandOf(difficulty) === band).length / row.n;
    return result;
  }, {} as Record<Band, number>);
  const evidenceByBand = (Object.keys(BAND_LABELS) as Band[]).reduce((result, band) => {
    const required = EVIDENCE_TARGET_TOTAL * schoolBandWeights[band];
    const observed = bandCells[band].total;
    result[band] = { required, observed, coverage: required > 0 ? clamp(observed / required, 0, 1) : 1 };
    return result;
  }, {} as Record<Band, { required: number; observed: number; coverage: number }>);
  const evidenceCoverage = (Object.keys(BAND_LABELS) as Band[]).reduce(
    (sum, band) => sum + schoolBandWeights[band] * evidenceByBand[band].coverage,
    0,
  );
  const advancedGateRequired = schoolBandWeights.advanced >= ADVANCED_SCHOOL_SHARE_GATE;
  const schoolCells = Object.entries(row.group.cells).map(([key, count]) => {
    const [topic, band] = key.split("::") as [string, Band];
    const weight = count / row.n;
    const mastery = (topicMastery as any)[topic]?.bands?.[band]?.mastery ?? 0.5;
    const observed = topicCells[topic]?.[band]?.total ?? 0;
    const required = Math.max(1, EVIDENCE_TARGET_TOTAL * weight);
    const evidence = clamp(observed / required, 0, 1);
    return { topic, band, count, weight, mastery, observed, required, evidence };
  });
  const schoolMastery = schoolCells.reduce((sum, cell) => sum + cell.weight * cell.mastery, 0);
  const schoolEvidence = schoolCells.reduce((sum, cell) => sum + cell.weight * cell.evidence, 0);
  const advancedWeight = schoolCells.filter((cell) => cell.band === "advanced").reduce((sum, cell) => sum + cell.weight, 0);
  const advancedEvidence = advancedWeight > 0
    ? schoolCells.filter((cell) => cell.band === "advanced").reduce((sum, cell) => sum + cell.weight * cell.evidence, 0) / advancedWeight
    : 1;
  const criticalTopics = Object.entries(topicWeights)
    .filter(([, weight]) => weight >= 0.05)
    .map(([topic, weight]) => {
      const cells = schoolCells.filter((cell) => cell.topic === topic);
      const mastery = cells.reduce((sum, cell) => sum + (cell.weight / weight) * cell.mastery, 0);
      const evidence = cells.reduce((sum, cell) => sum + (cell.weight / weight) * cell.evidence, 0);
      const passed = mastery >= 0.55 && evidence >= 0.50;
      return { topic, weight, mastery, evidence, passed };
    })
    .sort((a, b) => Number(a.passed) - Number(b.passed) || b.weight - a.weight);
  const overallEvidencePassedV4 = schoolEvidence >= READY_EVIDENCE_MIN;
  const advancedEvidencePassedV4 = !advancedGateRequired || advancedEvidence >= ADVANCED_EVIDENCE_MIN;
  const criticalTopicsPassed = criticalTopics.every((topic) => topic.passed);
  const readiness = clamp(schoolMastery * 100 * Math.sqrt(schoolEvidence), 0, 100);
  const readinessGatePassed = overallEvidencePassedV4 && advancedEvidencePassedV4 && criticalTopicsPassed;
  const status = readiness >= 85 && readinessGatePassed
    ? { key: "strong_ready", label: "Sẵn sàng cao" }
    : readiness >= 75 && readinessGatePassed
      ? { key: "ready", label: "Sẵn sàng" }
      : readiness >= 75
        ? { key: "evidence_limited", label: "Chưa đủ bằng chứng" }
        : readiness >= 65
          ? { key: "approaching", label: "Gần sẵn sàng" }
          : readiness >= 50
            ? { key: "preparing", label: "Đang chuẩn bị" }
            : { key: "not_ready", label: "Chưa sẵn sàng" };
  const topicGaps = Object.entries(topicWeights).map(([topic, weight]) => ({ topic, weight, mastery: (topicMastery as any)[topic]?.mastery ?? 0.5, gainTo70: Math.max(0, 0.7 - ((topicMastery as any)[topic]?.mastery ?? 0.5)) * weight * ALPHA })).sort((a, b) => b.gainTo70 - a.gainTo70).slice(0, 3);
  const readinessV3 = clamp(fit * Math.sqrt(evidenceCoverage), 0, 100);
  return { school: row.school, name: row.name, n: row.n, examCount: row.examCount, difficultyIndex, topicPoints, cognitivePoints, difficultyPoints, fit, readinessV3, schoolBandWeights, evidenceByBand, evidenceCoverage, schoolCells, schoolMastery, schoolEvidence, advancedEvidence, criticalTopics, criticalTopicsPassed, readiness, readinessGatePassed, advancedGateRequired, overallEvidencePassed: overallEvidencePassedV4, advancedEvidencePassed: advancedEvidencePassedV4, status, previousReadiness: persistedReadiness[row.school] ?? null, topicGaps };
}).sort((a, b) => b.readiness - a.readiness);

const payload = {
  generatedAt: new Date().toISOString(),
  runId: metadata.runId,
  model: metadata.model,
  user: { id: user.id, email: user.email, name: user.name || user.email, attempts: attempts.length, answered, matched, unmatched: answered - matched, correct, accuracy: matched ? correct / matched : 0 },
  config: { version: "v4-mastery-capped", alphaLegacy: ALPHA, betaLegacy: BETA, diffKLegacy: DIFF_K, priorStrength: PRIOR_STRENGTH, priorMastery: PRIOR_MASTERY, bandWeights: BAND_WEIGHTS, evidenceTargetTotal: EVIDENCE_TARGET_TOTAL, readyEvidenceMin: READY_EVIDENCE_MIN, advancedSchoolShareGate: ADVANCED_SCHOOL_SHARE_GATE, advancedEvidenceMin: ADVANCED_EVIDENCE_MIN, readinessFormula: "schoolMastery * sqrt(schoolEvidence)", cognitiveRole: "diagnostic-only", difficultyRole: "descriptive-only" },
  topicMastery,
  cognitiveMastery,
  difficultyMastery,
  schoolReadiness,
  unmatched: [...unmatched.values()].sort((a, b) => b.count - a.count),
};

const safePayload = JSON.stringify(payload).replaceAll("<", "\\u003c");
const slug = email.split("@")[0].replace(/[^a-z0-9]+/gi, "-").toLowerCase();
const outputPath = path.join(runDir, `dashboard-readiness-v4-mastery-capped-${slug}.html`);
const unmatchedInputPath = path.join(runDir, "mika-unmatched-model-input.json");
if (unmatchedInputs.size > 0) {
  writeFileSync(unmatchedInputPath, `${JSON.stringify([...unmatchedInputs.values()], null, 2)}\n`, "utf8");
}
const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Readiness v2 · ${user.name || email}</title><style>
:root{--paper:#f5f6fa;--ink:#18202d;--muted:#6b7587;--line:#dfe4ec;--card:#fff;--purple:#6f4fb2;--purple-soft:#eee9f8;--blue:#3d6fa9;--green:#2f806d;--amber:#a85f22;--rose:#a94f6b;--shadow:0 13px 34px rgba(24,32,45,.08)}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.45}.shell{max-width:1480px;margin:auto;padding:28px 28px 60px}.hero{display:grid;grid-template-columns:1fr auto;gap:22px;padding:30px 32px;border-radius:22px;color:#fff;background:radial-gradient(circle at 88% 0,#d7caff 0,transparent 29%),radial-gradient(circle at 60% 140%,#0b6372 0,transparent 37%),linear-gradient(122deg,#191537,#46347d);box-shadow:var(--shadow)}.eyebrow{margin:0 0 8px;color:#dcd5f4;text-transform:uppercase;letter-spacing:.13em;font-size:11px;font-weight:850}.hero h1{margin:0 0 10px;font-size:clamp(28px,4vw,43px);line-height:1.06;letter-spacing:-.045em}.hero p{max-width:850px;margin:0;color:#ebe8f7}.preview{height:min-content;padding:8px 12px;border:1px solid rgba(255,255,255,.3);border-radius:999px;background:rgba(255,255,255,.12);font-size:12px;font-weight:850;white-space:nowrap}.note{margin:17px 0;padding:13px 16px;border:1px solid #dad4ed;border-left:4px solid var(--purple);border-radius:12px;background:var(--purple-soft);color:#42365f;font-size:12px}.kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.kpi,.panel{background:var(--card);border:1px solid var(--line);box-shadow:0 2px 10px rgba(20,30,47,.025)}.kpi{padding:17px;border-radius:14px}.label{font-size:11px;color:var(--muted);font-weight:800}.value{margin:4px 0;font-size:27px;letter-spacing:-.045em;font-weight:900}.sub{font-size:11px;color:#8993a3}.grid{display:grid;grid-template-columns:1.05fr .95fr;gap:15px;margin-top:15px}.panel{padding:20px;border-radius:16px}.panel h2{margin:0 0 2px;font-size:17px;letter-spacing:-.02em}.caption{margin:0 0 17px;color:var(--muted);font-size:12px}.bars{display:grid;gap:10px}.bar-row{display:grid;grid-template-columns:minmax(125px,1.35fr) 2.2fr 52px;gap:9px;align-items:center;font-size:12px}.bar-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.track{height:12px;border-radius:999px;background:#edf0f5;overflow:hidden}.fill{height:100%;border-radius:inherit}.num{text-align:right;font-weight:850;font-variant-numeric:tabular-nums}.sample{color:var(--muted);font-size:10px}.school-bars .bar-row{grid-template-columns:72px 2.2fr 58px}.school-bars .track{position:relative;height:16px}.fit-marker{position:absolute;top:0;bottom:0;width:2px;background:#1d2840;opacity:.55}.table-panel{margin-top:15px}.scroll{overflow:auto;border:1px solid var(--line);border-radius:12px}.data-table{width:100%;min-width:1280px;border-collapse:collapse;font-size:12px}.data-table th{padding:10px 11px;background:#f8f9fc;text-align:right;text-transform:uppercase;letter-spacing:.055em;font-size:10px;color:#6b7484;white-space:nowrap}.data-table th:first-child,.data-table td:first-child{text-align:left}.data-table td{padding:11px;border-bottom:1px solid #edf0f4;text-align:right;vertical-align:top}.data-table tr:last-child td{border:0}.data-table tr:hover td{background:#fbfbfe}.school b{display:block}.school span{font-size:10px;color:var(--muted)}.positive{color:var(--green);font-weight:850}.negative{color:var(--rose);font-weight:850}.readiness{font-size:17px;color:var(--purple);font-weight:900}.gaps{margin-top:5px;color:var(--muted);font-size:10px;line-height:1.5}.conf,.status{display:inline-flex;padding:4px 8px;border-radius:999px;background:#eef1f6;color:#586477;font-size:10px;font-weight:850;white-space:nowrap}.status.ready,.status.strong_ready{background:#e4f3ed;color:#216d5b}.status.approaching{background:#fff1d9;color:#8e591d}.status.preparing,.status.evidence_limited{background:#f8e8ee;color:#8f415b}.status.not_ready{background:#edf0f4;color:#5f6877}.evidence-detail{display:block;margin-top:3px;color:var(--muted);font-size:10px;white-space:nowrap}.warning{color:var(--rose)}@media(max-width:1050px){.kpis{grid-template-columns:repeat(3,1fr)}.grid{grid-template-columns:1fr}}@media(max-width:680px){.shell{padding:15px 12px 35px}.hero{grid-template-columns:1fr;padding:23px 20px}.preview{justify-self:start}.kpis{grid-template-columns:repeat(2,1fr)}.bar-row{grid-template-columns:110px 1fr 45px}}
</style></head><body><main class="shell"><section class="hero"><div><p class="eyebrow">Monkey5 · Readiness đa chiều</p><h1>${user.name || email}</h1><p>Phân biệt rõ mức phù hợp năng lực (Fit) và mức sẵn sàng đi thi đã được kiểm chứng bằng đủ dữ liệu (Readiness).</p></div><div class="preview">Preview v3 chuẩn hoá · chưa ghi DB</div></section><section class="note"><b>Công thức preview:</b> Fit = 50 + topic×80 + cognitive×60 − độ khó trường×0,60. Readiness = Fit × √(độ phủ bằng chứng). Mẫu chuẩn là 40 câu, phân bổ theo tỉ lệ D1–D2 / D3 / D4–D5 của từng trường. Chỉ gắn nhãn “Sẵn sàng” từ 75% khi độ phủ tổng ≥85% và, với trường có ≥20% câu D4–D5, độ phủ phần phân hoá ≥60%.</section><section class="kpis" id="kpis"></section><section class="grid"><article class="panel"><h2>Readiness đã chuẩn hoá theo trường</h2><p class="caption">Thanh màu là Readiness; vạch đen là Fit trước khi điều chỉnh theo bằng chứng.</p><div id="schoolBars" class="bars school-bars"></div></article><article class="panel"><h2>Mastery theo mức nhận thức</h2><p class="caption">Beta-smoothed, kèm số câu match được trong lịch sử Mika.</p><div id="cognitiveBars" class="bars"></div><h2 style="margin-top:23px">Mastery theo dải độ khó</h2><p class="caption">Cho biết Mika đã chứng minh năng lực ở phần nền tảng, vận dụng và phân hoá đến đâu.</p><div id="difficultyBars" class="bars"></div></article></section><section class="panel table-panel"><h2>Mastery theo 13 chuyên đề mới</h2><p class="caption">Dải chưa làm giữ ở prior 50% cho Fit, nhưng Readiness sẽ giảm nếu thiếu bằng chứng ở dải mà trường yêu cầu.</p><div id="topicBars" class="bars"></div></section><section class="panel table-panel"><h2>Phân rã Fit và Readiness theo trường</h2><p class="caption">“Độ khó trường v2” là đặc tính của đề trường, không phải điểm của Mika. Mốc 50 là trung bình toàn bộ 849 câu đã đánh giá.</p><div class="scroll"><table class="data-table"><thead><tr><th>Trường</th><th>V1 đang lưu</th><th>Độ khó trường v2</th><th>Fit</th><th>Độ phủ bằng chứng</th><th>D4–D5</th><th>Readiness</th><th>Trạng thái</th><th>Ưu tiên cải thiện</th></tr></thead><tbody id="schoolRows"></tbody></table></div></section><section class="note" id="coverageNote"></section></main><script>
const DATA=${safePayload};const $=id=>document.getElementById(id);const fmt=(v,d=1)=>Number(v).toFixed(d);const percent=v=>fmt(v*100,1)+'%';const topicMeta=${JSON.stringify(TOPICS)};const cognitiveLabels=${JSON.stringify(COGNITIVE)};const bandLabels=${JSON.stringify(BAND_LABELS)};const signed=v=>(v>=0?'+':'')+fmt(v,1);const masteryBar=(name,mastery,total,color='#6f4fb2')=>'<div class="bar-row"><span class="bar-name" title="'+name+'">'+name+' <span class="sample">n='+total+'</span></span><div class="track"><div class="fill" style="width:'+(mastery*100)+'%;background:'+color+'"></div></div><span class="num">'+percent(mastery)+'</span></div>';
function render(){const u=DATA.user;const coverage=u.answered?u.matched/u.answered:0;const best=DATA.schoolReadiness[0];const cards=[['Math attempts',u.attempts,'đã submit'],['Câu trả lời',u.answered,'trong lịch sử'],['Match taxonomy',u.matched,percent(coverage)+' coverage'],['Độ chính xác',percent(u.accuracy),u.correct+'/'+u.matched+' câu match'],['Readiness cao nhất',fmt(best.readiness,1)+'%',best.school.toUpperCase()+' · '+best.status.label]];$('kpis').innerHTML=cards.map(([l,v,s])=>'<article class="kpi"><div class="label">'+l+'</div><div class="value">'+v+'</div><div class="sub">'+s+'</div></article>').join('');$('schoolBars').innerHTML=DATA.schoolReadiness.map(r=>'<div class="bar-row"><span class="bar-name"><b>'+r.school.toUpperCase()+'</b></span><div class="track"><div class="fill" style="width:'+r.readiness+'%;background:'+(r.readinessGatePassed?'#2f806d':'#a85f22')+'"></div><i class="fit-marker" style="left:'+r.fit+'%" title="Fit '+fmt(r.fit,1)+'%"></i></div><span class="num">'+fmt(r.readiness,1)+'%</span></div>').join('');$('cognitiveBars').innerHTML=Object.entries(DATA.cognitiveMastery).map(([k,v])=>masteryBar(cognitiveLabels[k],v.mastery,v.total,'#3d6fa9')).join('');$('difficultyBars').innerHTML=Object.entries(DATA.difficultyMastery).map(([k,v])=>masteryBar(bandLabels[k],v.mastery,v.total,k==='advanced'?'#a94f6b':k==='application'?'#6f4fb2':'#2f806d')).join('');$('topicBars').innerHTML=Object.entries(DATA.topicMastery).sort((a,b)=>b[1].mastery-a[1].mastery).map(([k,v])=>masteryBar(topicMeta[k]?.label||k,v.mastery,v.sampleSize,topicMeta[k]?.color||'#6f4fb2')).join('');$('schoolRows').innerHTML=DATA.schoolReadiness.map(r=>'<tr><td class="school"><b>'+r.school.toUpperCase()+' · '+r.name+'</b><span>'+r.n+' câu / '+r.examCount+' đề</span></td><td>'+(r.previousReadiness==null?'—':r.previousReadiness+'%')+'</td><td><b>'+fmt(r.difficultyIndex,1)+'</b><span class="evidence-detail">50 = trung bình</span></td><td><b>'+fmt(r.fit,1)+'%</b><span class="evidence-detail">trước evidence</span></td><td><b>'+percent(r.evidenceCoverage)+'</b><span class="evidence-detail">yêu cầu ≥85%</span></td><td><b>'+r.evidenceByBand.advanced.observed+' / '+fmt(r.evidenceByBand.advanced.required,1)+' câu</b><span class="evidence-detail">'+percent(r.evidenceByBand.advanced.coverage)+(r.advancedGateRequired?' · gate ≥60%':' · không gate')+'</span></td><td class="readiness">'+fmt(r.readiness,1)+'%</td><td><span class="status '+r.status.key+'">'+r.status.label+'</span></td><td class="gaps">'+r.topicGaps.filter(g=>g.gainTo70>0.05).map(g=>(topicMeta[g.topic]?.label||g.topic)+' (+'+fmt(g.gainTo70,1)+')').join('<br>')+'</td></tr>').join('');const ams=DATA.schoolReadiness.find(r=>r.school==='ams');$('coverageNote').innerHTML='<b>Ví dụ Amsterdam:</b> Fit '+fmt(ams.fit,1)+'% × √'+percent(ams.evidenceCoverage)+' = Readiness '+fmt(ams.readiness,1)+'%. Mika có '+ams.evidenceByBand.advanced.observed+'/'+fmt(ams.evidenceByBand.advanced.required,1)+' câu D4–D5 cần thiết ('+percent(ams.evidenceByBand.advanced.coverage)+' độ phủ phần phân hoá), nên chưa thể coi là sẵn sàng thi AMS. <br><b>Coverage dữ liệu:</b> '+u.matched+'/'+u.answered+' câu trả lời được nối với assessment 5.6 Sol.'+(u.unmatched?' <span class="warning">Có '+u.unmatched+' câu chưa match và đã bị loại.</span>':' Không có câu bị loại.');}render();
</script></body></html>`;

const htmlV4 = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Readiness v4 · ${user.name || email}</title><style>
:root{--paper:#f4f6f9;--ink:#17202d;--muted:#6c7687;--line:#dfe4ec;--card:#fff;--purple:#6750a4;--purple-soft:#eeeaf8;--blue:#386da5;--green:#287764;--amber:#a75e20;--rose:#a44864;--shadow:0 13px 34px rgba(24,32,45,.08)}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.45}.shell{max-width:1480px;margin:auto;padding:28px 28px 60px}.hero{display:grid;grid-template-columns:1fr auto;gap:22px;padding:30px 32px;border-radius:22px;color:#fff;background:radial-gradient(circle at 88% 0,#d7caff 0,transparent 29%),radial-gradient(circle at 60% 140%,#0b6372 0,transparent 37%),linear-gradient(122deg,#191537,#46347d);box-shadow:var(--shadow)}.eyebrow{margin:0 0 8px;color:#dcd5f4;text-transform:uppercase;letter-spacing:.13em;font-size:11px;font-weight:850}.hero h1{margin:0 0 10px;font-size:clamp(28px,4vw,43px);line-height:1.06;letter-spacing:-.045em}.hero p{max-width:880px;margin:0;color:#ebe8f7}.preview{height:min-content;padding:8px 12px;border:1px solid rgba(255,255,255,.3);border-radius:999px;background:rgba(255,255,255,.12);font-size:12px;font-weight:850;white-space:nowrap}.note{margin:17px 0;padding:13px 16px;border:1px solid #dad4ed;border-left:4px solid var(--purple);border-radius:12px;background:var(--purple-soft);color:#42365f;font-size:12px}.kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.kpi,.panel,.method-card{background:var(--card);border:1px solid var(--line);box-shadow:0 2px 10px rgba(20,30,47,.025)}.kpi{padding:17px;border-radius:14px}.label{font-size:11px;color:var(--muted);font-weight:800}.value{margin:4px 0;font-size:27px;letter-spacing:-.045em;font-weight:900}.sub{font-size:11px;color:#8993a3}.grid{display:grid;grid-template-columns:1.05fr .95fr;gap:15px;margin-top:15px}.panel{padding:20px;border-radius:16px}.panel h2{margin:0 0 2px;font-size:17px;letter-spacing:-.02em}.caption{margin:0 0 17px;color:var(--muted);font-size:12px}.bars{display:grid;gap:10px}.bar-row{display:grid;grid-template-columns:minmax(155px,1.35fr) 2.2fr 55px;gap:9px;align-items:center;font-size:12px}.bar-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.track{height:12px;border-radius:999px;background:#edf0f5;overflow:hidden}.fill{height:100%;border-radius:inherit}.num{text-align:right;font-weight:850;font-variant-numeric:tabular-nums}.sample{color:var(--muted);font-size:10px}.school-bars .bar-row{grid-template-columns:72px 2.2fr 58px}.school-bars .track{position:relative;height:16px}.mastery-marker{position:absolute;top:0;bottom:0;width:3px;background:#17202d;opacity:.65}.method{margin-top:15px}.method-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-top:15px}.method-card{padding:16px;border-radius:14px}.method-step{color:var(--purple);font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.09em}.method-card h3{margin:5px 0 8px;font-size:14px}.method-card p{margin:0;color:var(--muted);font-size:11px}.formula{display:block;margin:9px 0;padding:9px 10px;border-radius:9px;background:#f1f3f7;color:#2d3750;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px}.rules{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}.rule{padding:10px;border-radius:10px;background:#f8f9fb;color:#596476;font-size:11px}.rule b{display:block;color:var(--ink);margin-bottom:2px}.table-panel{margin-top:15px}.scroll{overflow:auto;border:1px solid var(--line);border-radius:12px}.data-table{width:100%;min-width:1340px;border-collapse:collapse;font-size:12px}.data-table th{padding:10px 11px;background:#f8f9fc;text-align:right;text-transform:uppercase;letter-spacing:.055em;font-size:10px;color:#6b7484;white-space:nowrap}.data-table th:first-child,.data-table td:first-child{text-align:left}.data-table td{padding:11px;border-bottom:1px solid #edf0f4;text-align:right;vertical-align:top}.data-table tr:last-child td{border:0}.data-table tr:hover td{background:#fbfbfe}.school b{display:block}.school span{font-size:10px;color:var(--muted)}.readiness{font-size:17px;color:var(--purple);font-weight:900}.gaps{color:var(--muted);font-size:10px;line-height:1.5;text-align:left!important}.status{display:inline-flex;padding:4px 8px;border-radius:999px;background:#eef1f6;color:#586477;font-size:10px;font-weight:850;white-space:nowrap}.status.ready,.status.strong_ready{background:#e4f3ed;color:#216d5b}.status.approaching{background:#fff1d9;color:#8e591d}.status.preparing,.status.evidence_limited{background:#f8e8ee;color:#8f415b}.status.not_ready{background:#edf0f4;color:#5f6877}.evidence-detail{display:block;margin-top:3px;color:var(--muted);font-size:10px;white-space:nowrap}@media(max-width:1100px){.kpis{grid-template-columns:repeat(3,1fr)}.grid{grid-template-columns:1fr}.method-grid,.rules{grid-template-columns:repeat(2,1fr)}}@media(max-width:680px){.shell{padding:15px 12px 35px}.hero{grid-template-columns:1fr;padding:23px 20px}.preview{justify-self:start}.kpis{grid-template-columns:repeat(2,1fr)}.bar-row{grid-template-columns:125px 1fr 45px}.method-grid,.rules{grid-template-columns:1fr}}
</style></head><body><main class="shell"><section class="hero"><div><p class="eyebrow">Monkey5 · Readiness dựa trên mastery</p><h1>${user.name || email}</h1><p>Readiness v4 lấy năng lực theo đúng cấu trúc đề trường làm trần. Thiếu kiến thức hoặc chưa có đủ bằng chứng chỉ có thể làm điểm giảm, không thể tạo điểm thưởng.</p></div><div class="preview">Preview v4 · chưa ghi DB</div></section><section class="note"><b>Nguyên tắc kiểm soát:</b> Readiness ≤ School Mastery. Cognitive mastery chỉ dùng để chẩn đoán; Difficulty Index v2 chỉ mô tả trường. Không còn cộng ALPHA/BETA/DIFF_K vào điểm readiness.</section><section class="kpis" id="kpis"></section><section class="grid"><article class="panel"><h2>Readiness theo trường</h2><p class="caption">Thanh màu là Readiness v4; vạch đen là School Mastery — trần tối đa của điểm.</p><div id="schoolBars" class="bars school-bars"></div></article><article class="panel"><h2>Mastery theo mức nhận thức</h2><p class="caption">Chỉ dùng để chẩn đoán và phát hiện khoảng trống, không cộng điểm lần hai.</p><div id="cognitiveBars" class="bars"></div><h2 style="margin-top:23px">Mastery theo dải độ khó</h2><p class="caption">D4–D5 hiện chỉ có 3 quan sát, vì vậy chưa đủ để kết luận năng lực phân hoá.</p><div id="difficultyBars" class="bars"></div></article></section><section class="panel table-panel"><h2>Mastery theo 13 chuyên đề</h2><p class="caption">50% khi n=0 chỉ là prior nội bộ; giao diện ghi “chưa kiểm chứng”, không coi đó là năng lực đã đạt.</p><div id="topicBars" class="bars"></div></section><section class="panel method"><h2>Phương pháp luận và cách tính v4</h2><p class="caption">Tất cả trọng số trường được suy ra từ 849 câu đề chính thức đã đánh giá bằng GPT‑5.6 Sol.</p><div class="method-grid"><article class="method-card"><span class="method-step">Bước 1</span><h3>Mastery từng ô</h3><p>Mỗi ô là chuyên đề × D1–D2 / D3 / D4–D5.</p><code class="formula">p = (đúng + 2) / (đã làm + 4)</code><p>n=0 được ghi là chưa kiểm chứng.</p></article><article class="method-card"><span class="method-step">Bước 2</span><h3>Blueprint của trường</h3><p>Trọng số phản ánh chính xác trường hỏi gì và ở dải nào.</p><code class="formula">w = số câu trong ô / tổng câu trường</code><p>Tổng mọi w của một trường bằng 1.</p></article><article class="method-card"><span class="method-step">Bước 3</span><h3>Evidence đa chiều</h3><p>Mẫu chuẩn 40 câu được phân bổ xuống từng ô.</p><code class="formula">e = min(1, n / max(1, 40×w))</code><p>Làm nhiều ở mảng khác không bù được ô còn trống.</p></article><article class="method-card"><span class="method-step">Bước 4</span><h3>Readiness có trần</h3><p>Mastery và evidence đều theo blueprint của trường.</p><code class="formula">R = M_trường × √E_trường</code><p>Do √E ≤ 1 nên R luôn ≤ M_trường.</p></article></div><div class="rules"><div class="rule"><b>Điểm số</b>Readiness phải đạt từ 75%.</div><div class="rule"><b>Evidence tổng</b>Phải đạt tối thiểu 85%.</div><div class="rule"><b>Phần phân hoá</b>Trường có ≥20% D4–D5 cần evidence dải này ≥60%.</div><div class="rule"><b>Chuyên đề trọng yếu</b>Trọng số ≥5% cần mastery ≥55% và evidence ≥50%.</div></div></section><section class="panel table-panel"><h2>Phân rã School Mastery và Readiness</h2><p class="caption">V3 được giữ trong bảng để đối chiếu. Độ khó trường v2 không còn trực tiếp cộng hoặc trừ điểm học sinh.</p><div class="scroll"><table class="data-table"><thead><tr><th>Trường</th><th>Độ khó trường v2</th><th>Readiness v3</th><th>School Mastery</th><th>Evidence đa chiều</th><th>Evidence D4–D5</th><th>Readiness v4</th><th>Trạng thái</th><th>Gate chưa đạt</th></tr></thead><tbody id="schoolRows"></tbody></table></div></section><section class="note" id="coverageNote"></section></main><script>
const DATA=${safePayload};const $=id=>document.getElementById(id);const fmt=(v,d=1)=>Number(v).toFixed(d);const percent=v=>fmt(v*100,1)+'%';const topicMeta=${JSON.stringify(TOPICS)};const cognitiveLabels=${JSON.stringify(COGNITIVE)};const bandLabels=${JSON.stringify(BAND_LABELS)};const masteryBar=(name,mastery,total,color='#6750a4',state='')=>'<div class="bar-row"><span class="bar-name" title="'+name+'">'+name+' <span class="sample">n='+total+(state?' · '+state:'')+'</span></span><div class="track"><div class="fill" style="width:'+(mastery*100)+'%;background:'+color+'"></div></div><span class="num">'+(total===0?'—':percent(mastery))+'</span></div>';
function render(){const u=DATA.user;const coverage=u.answered?u.matched/u.answered:0;const best=DATA.schoolReadiness[0];const ams=DATA.schoolReadiness.find(r=>r.school==='ams');const cards=[['Câu đã đánh giá',u.matched,percent(coverage)+' coverage'],['Độ chính xác',percent(u.accuracy),u.correct+'/'+u.matched+' câu'],['Mastery cao nhất',percent(Math.max(...Object.values(DATA.topicMastery).map(v=>v.mastery))),'mastery tổng quát'],['Readiness cao nhất',fmt(best.readiness,1)+'%',best.school.toUpperCase()+' · '+best.status.label],['Amsterdam',fmt(ams.readiness,1)+'%','Mastery '+percent(ams.schoolMastery)]];$('kpis').innerHTML=cards.map(([l,v,s])=>'<article class="kpi"><div class="label">'+l+'</div><div class="value">'+v+'</div><div class="sub">'+s+'</div></article>').join('');$('schoolBars').innerHTML=DATA.schoolReadiness.map(r=>'<div class="bar-row"><span class="bar-name"><b>'+r.school.toUpperCase()+'</b></span><div class="track"><div class="fill" style="width:'+r.readiness+'%;background:'+(r.readinessGatePassed?'#287764':'#a75e20')+'"></div><i class="mastery-marker" style="left:'+(r.schoolMastery*100)+'%" title="School Mastery '+percent(r.schoolMastery)+'"></i></div><span class="num">'+fmt(r.readiness,1)+'%</span></div>').join('');$('cognitiveBars').innerHTML=Object.entries(DATA.cognitiveMastery).map(([k,v])=>masteryBar(cognitiveLabels[k],v.mastery,v.total,'#386da5',v.total===0?'chưa kiểm chứng':v.total<5?'bằng chứng thấp':'')).join('');$('difficultyBars').innerHTML=Object.entries(DATA.difficultyMastery).map(([k,v])=>masteryBar(bandLabels[k],v.mastery,v.total,k==='advanced'?'#a44864':k==='application'?'#6750a4':'#287764',v.total===0?'chưa kiểm chứng':v.total<5?'bằng chứng thấp':'')).join('');$('topicBars').innerHTML=Object.entries(DATA.topicMastery).sort((a,b)=>b[1].mastery-a[1].mastery).map(([k,v])=>masteryBar(topicMeta[k]?.label||k,v.mastery,v.sampleSize,topicMeta[k]?.color||'#6750a4',v.sampleSize===0?'chưa kiểm chứng':v.sampleSize<5?'bằng chứng thấp':'')).join('');$('schoolRows').innerHTML=DATA.schoolReadiness.map(r=>{const failed=r.criticalTopics.filter(t=>!t.passed);const gates=[];if(!r.overallEvidencePassed)gates.push('Evidence tổng '+percent(r.schoolEvidence)+' < 85%');if(!r.advancedEvidencePassed)gates.push('Evidence D4–D5 '+percent(r.advancedEvidence)+' < 60%');failed.forEach(t=>gates.push((topicMeta[t.topic]?.label||t.topic)+': M '+percent(t.mastery)+', E '+percent(t.evidence)));return '<tr><td class="school"><b>'+r.school.toUpperCase()+' · '+r.name+'</b><span>'+r.n+' câu / '+r.examCount+' đề</span></td><td><b>'+fmt(r.difficultyIndex,1)+'</b><span class="evidence-detail">chỉ mô tả trường</span></td><td>'+fmt(r.readinessV3,1)+'%</td><td><b>'+percent(r.schoolMastery)+'</b><span class="evidence-detail">trần readiness</span></td><td><b>'+percent(r.schoolEvidence)+'</b><span class="evidence-detail">gate ≥85%</span></td><td><b>'+percent(r.advancedEvidence)+'</b><span class="evidence-detail">'+(r.advancedGateRequired?'gate ≥60%':'không bắt buộc')+'</span></td><td class="readiness">'+fmt(r.readiness,1)+'%</td><td><span class="status '+r.status.key+'">'+r.status.label+'</span></td><td class="gaps">'+(gates.join('<br>')||'Đã qua các gate')+'</td></tr>'}).join('');$('coverageNote').innerHTML='<b>Amsterdam:</b> School Mastery '+percent(ams.schoolMastery)+' × √'+percent(ams.schoolEvidence)+' = Readiness '+fmt(ams.readiness,1)+'%. V3 là '+fmt(ams.readinessV3,1)+'%. Các ô chuyển động chưa có câu nào và nhiều ô hình học/D4–D5 còn thiếu evidence, nên không còn bị che bởi 133 câu nền tảng ở các mảng khác.<br><b>Nguồn:</b> '+u.matched+'/'+u.answered+' câu trả lời của Mika được nối với assessment GPT‑5.6 Sol; không ghi thay đổi vào DB.';}render();
</script></body></html>`;

const tabStyles = `<style>.tabbar{display:flex;gap:6px;margin:17px 0;padding:5px;width:max-content;max-width:100%;border:1px solid var(--line);border-radius:13px;background:#fff}.tab-button{appearance:none;border:0;border-radius:9px;padding:9px 14px;background:transparent;color:var(--muted);font:inherit;font-size:12px;font-weight:850;cursor:pointer}.tab-button[aria-selected="true"]{background:var(--purple);color:#fff}.glossary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.term{padding:14px;border:1px solid var(--line);border-radius:12px;background:#fbfcfe}.term dt{font-size:12px;font-weight:900}.term dd{margin:5px 0 0;color:var(--muted);font-size:11px}.example-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.example{padding:16px;border:1px solid var(--line);border-radius:13px;background:#fbfcfe}.example h3{margin:0 0 7px;font-size:14px}.example p{margin:5px 0;color:var(--muted);font-size:11px}.calc{display:block;margin:9px 0;padding:10px;border-left:3px solid var(--purple);background:#f1f0f7;font:11px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:normal}.method-section{margin-top:15px}[hidden]{display:none!important}@media(max-width:900px){.glossary,.example-grid{grid-template-columns:1fr}}</style>`;
const tabNav = `<nav class="tabbar" aria-label="Nội dung dashboard"><button type="button" class="tab-button" data-tab="results" aria-selected="true">Kết quả Mika</button><button type="button" class="tab-button" data-tab="method">Thuật ngữ &amp; cách tính</button></nav>`;
const terminologySheet = `<section class="panel method-section" data-sheet="method" hidden><h2>Thuật ngữ</h2><p class="caption">Các khái niệm được dùng xuyên suốt dashboard.</p><dl class="glossary"><div class="term"><dt>Mastery từng ô</dt><dd>Ước lượng năng lực của Mika tại một chuyên đề × dải độ khó cụ thể.</dd></div><div class="term"><dt>Prior 50%</dt><dd>Giá trị trung lập dùng cho phép tính khi chưa có dữ liệu; không đồng nghĩa Mika đã biết 50%.</dd></div><div class="term"><dt>Blueprint trường</dt><dd>Phân bố câu hỏi chính thức của trường theo chuyên đề và D1–D5.</dd></div><div class="term"><dt>School Mastery</dt><dd>Mastery của Mika sau khi áp trọng số blueprint trường; là trần của Readiness.</dd></div><div class="term"><dt>Evidence</dt><dd>Mức độ Mika đã làm đủ số câu cần thiết tại đúng các ô mà trường yêu cầu.</dd></div><div class="term"><dt>Readiness</dt><dd>School Mastery sau khi giảm theo phần evidence còn thiếu; không phải xác suất đỗ đã hiệu chỉnh.</dd></div><div class="term"><dt>Chuyên đề trọng yếu</dt><dd>Chuyên đề chiếm từ 5% cấu trúc đề trường và phải vượt gate riêng.</dd></div><div class="term"><dt>Gate</dt><dd>Điều kiện bắt buộc để được gắn nhãn “Sẵn sàng”, ngoài điểm Readiness ≥75%.</dd></div><div class="term"><dt>Cognitive mastery</dt><dd>Chẩn đoán mức cơ bản/vận dụng/nâng cao; không cộng thêm vào Readiness để tránh đếm hai lần.</dd></div><div class="term"><dt>Difficulty Index v2</dt><dd>Đặc tính độ khó của trường, mốc 50 là trung bình; không trực tiếp cộng/trừ điểm Mika.</dd></div><div class="term"><dt>M theo blueprint</dt><dd>Mastery của cùng một chuyên đề có thể khác theo trường vì tỷ lệ D1–D5 khác nhau.</dd></div><div class="term"><dt>E theo blueprint</dt><dd>Evidence có thể khác theo trường vì số câu cần chứng minh tại từng ô khác nhau.</dd></div></dl></section><section class="panel method-section" data-sheet="method" hidden><h2>Ví dụ tính bằng dữ liệu Mika</h2><p class="caption">Các phép tính dưới đây được dựng trực tiếp từ payload của dashboard này.</p><div class="example-grid" id="workedExamples"></div></section>`;
const tabScript = `<script>(function(){const fmt=v=>Number(v).toFixed(1);const pct=v=>fmt(v*100)+'%';const topicMeta=${JSON.stringify(TOPICS)};const bySchool=id=>DATA.schoolReadiness.find(row=>row.school===id);const ntl=bySchool('ntl'),arc=bySchool('arc'),ams=bySchool('ams');const critical=(row,topic)=>row.criticalTopics.find(item=>item.topic===topic);const ntlPlane=critical(ntl,'plane_geometry'),arcPlane=critical(arc,'plane_geometry');document.getElementById('workedExamples').innerHTML='<article class="example"><h3>1. Mastery một ô</h3><p>Mika làm đúng 2/2 câu Hình phẳng D1–D2.</p><code class="calc">p = (2 + 2) / (2 + 4) = 66,7%</code><p>D3 và D4–D5 chưa có quan sát: prior nội bộ là 50%, nhưng evidence bằng 0%.</p></article><article class="example"><h3>2. Hình phẳng: NTL và ARC</h3><p>NTL dùng 2/6 câu nền tảng, 1/6 D3 và 3/6 D4–D5 trong nhóm Hình phẳng.</p><code class="calc">NTL: M = '+pct(ntlPlane.mastery)+' · E = '+pct(ntlPlane.evidence)+'</code><p>ARC chỉ có 2/9 câu nền tảng; 7/9 còn lại nằm ở D3–D5 mà Mika chưa chứng minh.</p><code class="calc">ARC: M = '+pct(arcPlane.mastery)+' · E = '+pct(arcPlane.evidence)+'</code></article><article class="example"><h3>3. Evidence của một ô</h3><p>Yêu cầu của ô được phân bổ từ mẫu chuẩn 40 câu theo trọng số trường.</p><code class="calc">required = max(1, 40 × w)<br>evidence = min(1, n / required)</code><p>Vì tính theo từng ô, 58 câu Phân số nền tảng không thể bù cho Chuyển động có n=0.</p></article><article class="example"><h3>4. Readiness Amsterdam</h3><p>School Mastery là trần; evidence chỉ làm điểm giảm.</p><code class="calc">R = '+pct(ams.schoolMastery)+' × √'+pct(ams.schoolEvidence)+' = '+fmt(ams.readiness)+'%</code><p>V3 là '+fmt(ams.readinessV3)+'%; v4 giảm vì kiểm tra evidence tới từng chuyên đề × dải độ khó.</p></article><article class="example"><h3>5. Khi nào được gọi là Sẵn sàng?</h3><code class="calc">R ≥ 75%<br>E tổng ≥ 85%<br>E D4–D5 ≥ 60% nếu trường có ≥20% D4–D5<br>M ≥55% và E ≥50% tại từng chuyên đề trọng yếu</code><p>Nếu điểm đạt nhưng thiếu một gate, trạng thái vẫn là “Chưa đủ bằng chứng”.</p></article><article class="example"><h3>6. Công thức tổng quát</h3><code class="calc">M_trường = Σ(w × p)<br>E_trường = Σ(w × e)<br>Readiness = M_trường × √E_trường</code><p>Do √E luôn ≤1 nên Readiness không thể vượt School Mastery.</p></article>';const buttons=[...document.querySelectorAll('[data-tab]')];const show=tab=>{document.querySelectorAll('.results-section').forEach(el=>el.hidden=tab!=='results');document.querySelectorAll('.method-section').forEach(el=>el.hidden=tab!=='method');buttons.forEach(button=>button.setAttribute('aria-selected',String(button.dataset.tab===tab)));};buttons.forEach(button=>button.addEventListener('click',()=>show(button.dataset.tab)));})();</script>`;
const htmlV4WithTabs = htmlV4
  .replace("</style></head>", `</style>${tabStyles}</head>`)
  .replace("</section><section class=\"kpis\" id=\"kpis\">", `</section>${tabNav}<section class="kpis results-section" id="kpis">`)
  .replace("<section class=\"grid\">", "<section class=\"grid results-section\">")
  .replace("<section class=\"panel table-panel\"><h2>Mastery theo 13 chuyên đề", "<section class=\"panel table-panel results-section\"><h2>Mastery theo 13 chuyên đề")
  .replace("<section class=\"panel method\">", "<section class=\"panel method method-section\" data-sheet=\"method\" hidden>")
  .replace("<section class=\"panel table-panel\"><h2>Phân rã School Mastery", `${terminologySheet}<section class="panel table-panel results-section"><h2>Phân rã School Mastery`)
  .replace("<section class=\"note\" id=\"coverageNote\">", "<section class=\"note results-section\" id=\"coverageNote\">")
  .replace("</body></html>", `${tabScript}</body></html>`);
void html; // Keep the generated v3 template available in this preview-only script for audit comparison.
writeFileSync(outputPath, htmlV4WithTabs, "utf8");
await prisma.$disconnect();
console.log(JSON.stringify({ output: outputPath, unmatchedInput: unmatchedInputs.size ? unmatchedInputPath : null, user: payload.user, bestSchool: schoolReadiness[0], unmatchedUniqueQuestions: unmatched.size }, null, 2));
}

void main().catch(async (error) => {
  await prisma.$disconnect();
  console.error(error);
  process.exitCode = 1;
});
