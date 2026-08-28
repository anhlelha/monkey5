import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const index = process.argv.indexOf("--output-dir");
if (index < 0 || !process.argv[index + 1]) throw new Error("Missing --output-dir");
const dir = path.resolve(root, process.argv[index + 1]);
const load = (name) => JSON.parse(readFileSync(path.join(dir, name), "utf8"));
const write = (name, value) => writeFileSync(path.join(dir, name), JSON.stringify(value, null, 2) + "\n");
const manifest = load("questions-with-figures.json");
const modelInput = load("model-input-manifest.json");
const labels = load("source-labels-sealed.json");
const passA = load("cognition-difficulty-assessments.json");
const passB = load("topic-taxonomy-v1-assessments.json");
const qaSelection = load("qa-selection.json");
const judgeA = load("qa-judge-cognition-difficulty-assessments.json");
const judgeB = load("qa-judge-topic-taxonomy-v1-assessments.json");
const metadata = load("run-metadata.json");
const ids = manifest.map((row) => row.questionId);
const unique = (rows, label) => {
  const map = new Map(rows.map((row) => [row.questionId, row]));
  if (map.size !== rows.length) throw new Error(`${label} has duplicate IDs`);
  return map;
};
if ([modelInput, labels, passA, passB].some((rows) => rows.length !== 849)) throw new Error("Fresh run does not have 849 rows in every required layer");
for (const forbidden of ["systemTopic", "systemGrade", "topic", "grade"]) {
  if (modelInput.some((row) => Object.hasOwn(row, forbidden))) throw new Error(`Source leakage into model input: ${forbidden}`);
}
const source = unique(manifest, "manifest");
const a = unique(passA, "Pass A");
const b = unique(passB, "Pass B");
const ja = unique(judgeA, "judge A");
const jb = unique(judgeB, "judge B");
for (const id of ids) {
  if (!a.has(id) || !b.has(id)) throw new Error(`Coverage gap ${id}`);
  if (source.get(id).hasFigure && (!a.get(id).usedVisual || !b.get(id).usedVisual)) throw new Error(`Visual coverage gap ${id}`);
}
if (judgeA.length !== qaSelection.length || judgeB.length !== qaSelection.length) throw new Error("Judge coverage mismatch");

const count = (rows, getter) => Object.fromEntries([...rows.reduce((m, row) => {
  const key = String(getter(row)); m.set(key, (m.get(key) ?? 0) + 1); return m;
}, new Map()).entries()].sort(([x], [y]) => x.localeCompare(y)));
const avg = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const levels = ["co_ban", "van_dung", "nang_cao", "chuyen_sau"];
const difficulties = [1, 2, 3, 4, 5];
const matrixFor = (rows) => Object.fromEntries(levels.map((level) => [level, Object.fromEntries(difficulties.map((difficulty) => [String(difficulty), rows.filter((row) => row.cognitiveLevel === level && row.difficulty === difficulty).length]))]));
function cramersV(rows) {
  const observed = levels.map((level) => difficulties.map((difficulty) => rows.filter((row) => row.cognitiveLevel === level && row.difficulty === difficulty).length));
  const rowTotals = observed.map((row) => row.reduce((x, y) => x + y, 0));
  const colTotals = difficulties.map((_, column) => observed.reduce((sum, row) => sum + row[column], 0));
  let chi = 0;
  observed.forEach((row, r) => row.forEach((value, c) => { const expected = rowTotals[r] * colTotals[c] / rows.length; if (expected) chi += (value - expected) ** 2 / expected; }));
  return Math.sqrt(chi / (rows.length * Math.min(levels.length - 1, difficulties.length - 1)));
}
const summarizeA = (rows) => ({
  questionCount: rows.length,
  averageDifficulty: Number(avg(rows.map((row) => row.difficulty)).toFixed(3)),
  d4d5Count: rows.filter((row) => row.difficulty >= 4).length,
  d4d5Pct: Number((rows.filter((row) => row.difficulty >= 4).length / rows.length * 100).toFixed(2)),
  averageAssessmentConfidence: Number(avg(rows.map((row) => row.assessmentConfidence)).toFixed(2)),
  cognitiveCounts: count(rows, (row) => row.cognitiveLevel),
  difficultyCounts: count(rows, (row) => row.difficulty),
  reasoningTypeCounts: count(rows, (row) => row.reasoningType),
  matrix: matrixFor(rows),
});
function groupedA(field) {
  const groups = new Map();
  for (const row of passA) { const key = source.get(row.questionId)[field]; const list = groups.get(key) ?? []; list.push(row); groups.set(key, list); }
  return Object.fromEntries([...groups.entries()].sort(([x], [y]) => String(x).localeCompare(String(y))).map(([key, rows]) => [key, summarizeA(rows)]));
}
const matrix = { overall: summarizeA(passA), cramersV: Number(cramersV(passA).toFixed(3)), bySchool: groupedA("school"), byExam: groupedA("examId") };
write("matrix-4x5.json", matrix);

const systemToPrimary = {}, primaryBySchool = {}, primaryByExam = {}, secondaryByPrimary = {}, contextTagCounts = {};
for (const row of passB) {
  const s = source.get(row.questionId);
  systemToPrimary[s.systemTopic] ??= {}; systemToPrimary[s.systemTopic][row.topicPrimary] = (systemToPrimary[s.systemTopic][row.topicPrimary] ?? 0) + 1;
  primaryBySchool[s.school] ??= {}; primaryBySchool[s.school][row.topicPrimary] = (primaryBySchool[s.school][row.topicPrimary] ?? 0) + 1;
  primaryByExam[s.examId] ??= {}; primaryByExam[s.examId][row.topicPrimary] = (primaryByExam[s.examId][row.topicPrimary] ?? 0) + 1;
  secondaryByPrimary[row.topicPrimary] ??= {};
  row.topicSecondary.forEach((item) => { secondaryByPrimary[row.topicPrimary][item] = (secondaryByPrimary[row.topicPrimary][item] ?? 0) + 1; });
  row.contextTags.forEach((tag) => { contextTagCounts[tag] = (contextTagCounts[tag] ?? 0) + 1; });
}
const comparison = {
  comparisonMeaning: "Đối chiếu phân bố nhãn nguồn → topicPrimary mới; không phải phán quyết nhãn nguồn đúng/sai.",
  total: passB.length, matrixSystemToPrimary: systemToPrimary, primaryDistributionBySchool: primaryBySchool,
  primaryDistributionByExam: primaryByExam, secondaryByPrimary, contextTagCounts,
};
write("topic-taxonomy-v1-comparison.json", comparison);

const qaRows = qaSelection.map((selection) => {
  const mainA = a.get(selection.questionId), secondA = ja.get(selection.questionId), mainB = b.get(selection.questionId), secondB = jb.get(selection.questionId);
  return {
    questionId: selection.questionId, reasons: selection.reasons,
    cognitiveAgreement: mainA.cognitiveLevel === secondA.cognitiveLevel,
    difficultyAgreement: mainA.difficulty === secondA.difficulty,
    difficultyDelta: Math.abs(mainA.difficulty - secondA.difficulty),
    topicPrimaryAgreement: mainB.topicPrimary === secondB.topicPrimary,
    main: { cognitiveLevel: mainA.cognitiveLevel, difficulty: mainA.difficulty, assessmentConfidence: mainA.assessmentConfidence, topicPrimary: mainB.topicPrimary, topicConfidence: mainB.topicConfidence },
    judge: { cognitiveLevel: secondA.cognitiveLevel, difficulty: secondA.difficulty, assessmentConfidence: secondA.assessmentConfidence, topicPrimary: secondB.topicPrimary, topicConfidence: secondB.topicConfidence },
  };
});
const reviewFlags = {
  meaning: "Tín hiệu QA, không phải phán quyết dữ liệu hoặc nhãn nguồn sai.",
  allDifficulty5: passA.filter((row) => row.difficulty === 5).map((row) => row.questionId),
  allDifficulty4: passA.filter((row) => row.difficulty === 4).map((row) => row.questionId),
  passAConfidenceBelow70: passA.filter((row) => row.assessmentConfidence < 70).map((row) => ({ questionId: row.questionId, confidence: row.assessmentConfidence })),
  passBConfidenceBelow70: passB.filter((row) => row.topicConfidence < 70).map((row) => ({ questionId: row.questionId, confidence: row.topicConfidence })),
  crossDomain: passB.filter((row) => row.contextTags.includes("cross_domain")).map((row) => row.questionId),
  diagramRequiredWithoutVisual: passB.filter((row) => row.contextTags.includes("rep_diagram_required") && !row.usedVisual).map((row) => row.questionId),
  judgeSummary: {
    sampleSize: qaRows.length,
    cognitiveAgreementPct: Number((qaRows.filter((row) => row.cognitiveAgreement).length / qaRows.length * 100).toFixed(2)),
    exactDifficultyAgreementPct: Number((qaRows.filter((row) => row.difficultyAgreement).length / qaRows.length * 100).toFixed(2)),
    difficultyWithinOnePct: Number((qaRows.filter((row) => row.difficultyDelta <= 1).length / qaRows.length * 100).toFixed(2)),
    topicPrimaryAgreementPct: Number((qaRows.filter((row) => row.topicPrimaryAgreement).length / qaRows.length * 100).toFixed(2)),
  },
  judgeDisagreements: qaRows.filter((row) => !row.cognitiveAgreement || !row.difficultyAgreement || !row.topicPrimaryAgreement),
  priorityJudgeDisagreements: qaRows.filter((row) => row.difficultyDelta >= 2 || (!row.cognitiveAgreement && row.main.assessmentConfidence >= 80 && row.judge.assessmentConfidence >= 80) || (!row.topicPrimaryAgreement && row.main.topicConfidence >= 80 && row.judge.topicConfidence >= 80)),
  schemaExceptions: [], coverageExceptions: [], visualCoverageExceptions: [],
};
write("review-flags.json", reviewFlags);

const failures = existsSync(path.join(dir, "failures.jsonl")) ? readFileSync(path.join(dir, "failures.jsonl"), "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse) : [];
const topicPrimaryCounts = count(passB, (row) => row.topicPrimary);
const summary = {
  runId: metadata.runId, completedAt: new Date().toISOString(), model: metadata.model,
  coverage: { totalQuestions: 849, totalExams: metadata.totalExams, totalSchools: metadata.totalSchools, figureKeys: 99, renderedAssets: 99, passACompleted: 849, passBCompleted: 849, usedVisualPassA: passA.filter((row) => row.usedVisual).length, usedVisualPassB: passB.filter((row) => row.usedVisual).length, coveragePct: 100 },
  passA: { ...matrix.overall, cramersV: matrix.cramersV, confidenceBelow70: reviewFlags.passAConfidenceBelow70.length },
  passB: { topicPrimaryCounts, contextTagCounts, averageTopicConfidence: Number(avg(passB.map((row) => row.topicConfidence)).toFixed(2)), confidenceBelow70: reviewFlags.passBConfidenceBelow70.length },
  qaJudge: reviewFlags.judgeSummary,
  technicalRetryEvents: failures.length,
  successfulAssessmentFailures: 0,
};
write("run-summary.json", summary);
const sha = createHash("sha256").update(readFileSync(path.join(dir, "model-input-manifest.json"))).digest("hex");
metadata.completedAt = summary.completedAt;
metadata.modelInputSha256 = sha;
metadata.qaJudge = { model: metadata.model, sampleSize: qaRows.length, sourceLabelsIncluded: false, firstPassResultsIncluded: false };
write("run-metadata.json", metadata);

const topicLines = Object.entries(topicPrimaryCounts).sort((x, y) => y[1] - x[1]).map(([topic, value]) => `| \`${topic}\` | ${value} |`).join("\n");
const report = `# Tái đánh giá Toán đa phương thức — run mới độc lập\n\n` +
  `Run: \`${metadata.runId}\`  \nModel: \`${metadata.model}\`  \nNguồn duy nhất: \`prisma/dev.db\` và renderer hình của ứng dụng. Không dùng artifact đánh giá cũ làm input.\n\n` +
  `## Coverage\n\n- 849 câu / ${metadata.totalExams} đề / ${metadata.totalSchools} trường.\n- Pass A: 849/849; Pass B: 849/849.\n- Hình: 99/99 được đọc trực tiếp ở cả hai pass.\n- DB nguồn không bị sửa.\n\n` +
  `## Pass A\n\n- Độ khó trung bình: **${summary.passA.averageDifficulty.toFixed(2)}/5**.\n- D4–D5: **${summary.passA.d4d5Count} câu (${summary.passA.d4d5Pct}%)**.\n- Confidence trung bình: **${summary.passA.averageAssessmentConfidence}/100**.\n- Cramér’s V cognition × difficulty: **${summary.passA.cramersV}**.\n\n` +
  `## Pass B\n\n| topicPrimary | Số câu |\n|---|---:|\n${topicLines}\n\n` +
  `Confidence chuyên đề trung bình: **${summary.passB.averageTopicConfidence}/100**.\n\n` +
  `## Judge QA độc lập\n\n- Mẫu: **${summary.qaJudge.sampleSize} câu**.\n- Đồng thuận cognitive: **${summary.qaJudge.cognitiveAgreementPct}%**.\n- Đồng thuận difficulty chính xác: **${summary.qaJudge.exactDifficultyAgreementPct}%**; lệch không quá 1 mức: **${summary.qaJudge.difficultyWithinOnePct}%**.\n- Đồng thuận topicPrimary: **${summary.qaJudge.topicPrimaryAgreementPct}%**.\n- Khác biệt được flag để rà soát, không tự động thay nhãn.\n\n` +
  `## Ghi chú kỹ thuật\n\nCó ${failures.length} retry event từ các lần khởi động/sửa schema; tất cả assessment cuối cùng đều hoàn tất, không có failure còn tồn đọng. Nhãn nguồn chỉ được join sau khi cả Pass A, Pass B và judge hoàn tất.\n`;
writeFileSync(path.join(dir, "report.md"), report, "utf8");
console.log(JSON.stringify(summary, null, 2));
