import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(import.meta.dirname, "..");
const arg = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? path.resolve(ROOT, process.argv[index + 1]) : null;
};
const baselineDir = arg("--baseline");
const candidateDir = arg("--candidate");
if (!baselineDir || !candidateDir) {
  throw new Error("Usage: node scripts/compare-fresh-math-runs.mjs --baseline <run-dir> --candidate <run-dir>");
}

const read = (dir, file) => JSON.parse(readFileSync(path.join(dir, file), "utf8"));
const baselineMeta = read(baselineDir, "run-metadata.json");
const candidateMeta = read(candidateDir, "run-metadata.json");
const baselineA = read(baselineDir, "cognition-difficulty-assessments.json");
const baselineB = read(baselineDir, "topic-taxonomy-v1-assessments.json");
const candidateA = read(candidateDir, "cognition-difficulty-assessments.json");
const candidateB = read(candidateDir, "topic-taxonomy-v1-assessments.json");
const questions = read(candidateDir, "questions-with-figures.json");

for (const rows of [baselineA, baselineB, candidateA, candidateB]) {
  if (rows.length !== 849 || new Set(rows.map((row) => row.questionId)).size !== 849) {
    throw new Error("Both runs must contain 849 unique questions in both passes");
  }
}

const map = (rows) => new Map(rows.map((row) => [row.questionId, row]));
const bA = map(baselineA), bB = map(baselineB), cA = map(candidateA), cB = map(candidateB), qMap = map(questions);
const count = (rows, key) => Object.fromEntries([...new Set(rows.map((row) => row[key]))].sort().map((value) => [value, rows.filter((row) => row[key] === value).length]));
const pct = (value) => Number((value / 849 * 100).toFixed(2));

const rows = candidateA.map((candidate) => {
  const questionId = candidate.questionId;
  const baseline = bA.get(questionId);
  const baselineTopic = bB.get(questionId);
  const candidateTopic = cB.get(questionId);
  const question = qMap.get(questionId);
  const difficultyDelta = candidate.difficulty - baseline.difficulty;
  return {
    questionId,
    examId: question.examId,
    school: question.school,
    year: question.year,
    questionNo: question.questionNo,
    hasFigure: question.hasFigure,
    baseline: {
      cognitiveLevel: baseline.cognitiveLevel,
      difficulty: baseline.difficulty,
      reasoningType: baseline.reasoningType,
      topicPrimary: baselineTopic.topicPrimary,
      assessmentConfidence: baseline.assessmentConfidence,
      topicConfidence: baselineTopic.topicConfidence,
    },
    candidate: {
      cognitiveLevel: candidate.cognitiveLevel,
      difficulty: candidate.difficulty,
      reasoningType: candidate.reasoningType,
      topicPrimary: candidateTopic.topicPrimary,
      assessmentConfidence: candidate.assessmentConfidence,
      topicConfidence: candidateTopic.topicConfidence,
    },
    changes: {
      cognitive: baseline.cognitiveLevel !== candidate.cognitiveLevel,
      difficulty: baseline.difficulty !== candidate.difficulty,
      difficultyDelta,
      reasoningType: baseline.reasoningType !== candidate.reasoningType,
      topicPrimary: baselineTopic.topicPrimary !== candidateTopic.topicPrimary,
    },
  };
});

const same = (key) => rows.filter((row) => !row.changes[key]).length;
const exactDifficulty = rows.filter((row) => !row.changes.difficulty).length;
const withinOneDifficulty = rows.filter((row) => Math.abs(row.changes.difficultyDelta) <= 1).length;
const changedAny = rows.filter((row) => Object.entries(row.changes).some(([key, value]) => key !== "difficultyDelta" && value));
const priorityReview = rows.filter((row) =>
  Math.abs(row.changes.difficultyDelta) >= 2 ||
  (row.changes.cognitive && row.baseline.assessmentConfidence >= 80 && row.candidate.assessmentConfidence >= 80) ||
  (row.changes.topicPrimary && row.baseline.topicConfidence >= 80 && row.candidate.topicConfidence >= 80)
);
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

const comparison = {
  createdAt: new Date().toISOString(),
  baseline: { runId: baselineMeta.runId, model: baselineMeta.model, directory: baselineDir },
  candidate: { runId: candidateMeta.runId, model: candidateMeta.model, directory: candidateDir },
  inputComparable: {
    databaseSha256Matches: baselineMeta.databaseSha256 === candidateMeta.databaseSha256,
    totalQuestionsMatches: baselineMeta.totalQuestions === candidateMeta.totalQuestions,
  },
  agreement: {
    cognitive: { count: same("cognitive"), pct: pct(same("cognitive")) },
    difficultyExact: { count: exactDifficulty, pct: pct(exactDifficulty) },
    difficultyWithinOne: { count: withinOneDifficulty, pct: pct(withinOneDifficulty) },
    reasoningType: { count: same("reasoningType"), pct: pct(same("reasoningType")) },
    topicPrimary: { count: same("topicPrimary"), pct: pct(same("topicPrimary")) },
  },
  difficultyShift: {
    meanCandidateMinusBaseline: Number(mean(rows.map((row) => row.changes.difficultyDelta)).toFixed(3)),
    meanAbsoluteDelta: Number(mean(rows.map((row) => Math.abs(row.changes.difficultyDelta))).toFixed(3)),
    candidateHigher: rows.filter((row) => row.changes.difficultyDelta > 0).length,
    candidateLower: rows.filter((row) => row.changes.difficultyDelta < 0).length,
    unchanged: exactDifficulty,
  },
  distributions: {
    baseline: { cognitive: count(baselineA, "cognitiveLevel"), difficulty: count(baselineA, "difficulty"), topicPrimary: count(baselineB, "topicPrimary") },
    candidate: { cognitive: count(candidateA, "cognitiveLevel"), difficulty: count(candidateA, "difficulty"), topicPrimary: count(candidateB, "topicPrimary") },
  },
  changedAnyCount: changedAny.length,
  priorityReviewCount: priorityReview.length,
  changedRows: changedAny,
  priorityReview,
};

writeFileSync(path.join(candidateDir, "model-comparison-gpt54-vs-gpt56sol.json"), `${JSON.stringify(comparison, null, 2)}\n`);
const md = `# Đối chiếu run ${baselineMeta.model} và ${candidateMeta.model}\n\n` +
  `Hai run dùng cùng DB hash: **${comparison.inputComparable.databaseSha256Matches ? "có" : "không"}**. Kết quả cũ chỉ được đọc ở bước đối chiếu này, sau khi run ${candidateMeta.model} hoàn tất.\n\n` +
  `| Chỉ số | Đồng thuận |\n|---|---:|\n` +
  `| Cognitive level | ${comparison.agreement.cognitive.count}/849 (${comparison.agreement.cognitive.pct}%) |\n` +
  `| Difficulty chính xác | ${comparison.agreement.difficultyExact.count}/849 (${comparison.agreement.difficultyExact.pct}%) |\n` +
  `| Difficulty lệch không quá 1 | ${comparison.agreement.difficultyWithinOne.count}/849 (${comparison.agreement.difficultyWithinOne.pct}%) |\n` +
  `| Reasoning type | ${comparison.agreement.reasoningType.count}/849 (${comparison.agreement.reasoningType.pct}%) |\n` +
  `| Topic primary | ${comparison.agreement.topicPrimary.count}/849 (${comparison.agreement.topicPrimary.pct}%) |\n\n` +
  `Độ khó ${candidateMeta.model} trừ ${baselineMeta.model}: trung bình **${comparison.difficultyShift.meanCandidateMinusBaseline}**; ${comparison.difficultyShift.candidateHigher} câu cao hơn, ${comparison.difficultyShift.candidateLower} câu thấp hơn, ${comparison.difficultyShift.unchanged} câu không đổi.\n\n` +
  `Có **${comparison.changedAnyCount}** câu thay đổi ít nhất một trường và **${comparison.priorityReviewCount}** câu được ưu tiên rà soát. Chi tiết đầy đủ nằm trong file JSON cùng tên.\n`;
writeFileSync(path.join(candidateDir, "model-comparison-gpt54-vs-gpt56sol.md"), md);
console.log(JSON.stringify({ outputDir: candidateDir, ...comparison.agreement, difficultyShift: comparison.difficultyShift, changedAnyCount: comparison.changedAnyCount, priorityReviewCount: comparison.priorityReviewCount }, null, 2));
