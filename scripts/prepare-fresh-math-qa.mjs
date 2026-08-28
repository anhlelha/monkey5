import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const index = process.argv.indexOf("--output-dir");
if (index < 0 || !process.argv[index + 1]) throw new Error("Missing --output-dir");
const dir = path.resolve(root, process.argv[index + 1]);
const input = JSON.parse(readFileSync(path.join(dir, "model-input-manifest.json"), "utf8"));
const passA = JSON.parse(readFileSync(path.join(dir, "cognition-difficulty-assessments.json"), "utf8"));
const passB = JSON.parse(readFileSync(path.join(dir, "topic-taxonomy-v1-assessments.json"), "utf8"));
const metadata = JSON.parse(readFileSync(path.join(dir, "run-metadata.json"), "utf8"));
const expected = Number(metadata.totalQuestions);
if (!Number.isInteger(expected) || expected < 1) throw new Error("Invalid totalQuestions in run metadata");
if (input.length !== expected || passA.length !== expected || passB.length !== expected) throw new Error("Both fresh passes must have 100% coverage before QA selection");

const a = new Map(passA.map((row) => [row.questionId, row]));
const b = new Map(passB.map((row) => [row.questionId, row]));
const reasons = new Map();
function add(id, reason) {
  const set = reasons.get(id) ?? new Set();
  set.add(reason);
  reasons.set(id, set);
}
for (const row of passA) {
  if (row.difficulty === 5) add(row.questionId, "all_d5");
  if (row.assessmentConfidence < 70) add(row.questionId, "pass_a_confidence_below_70");
}
for (const row of passB) {
  if (row.topicConfidence < 70) add(row.questionId, "pass_b_confidence_below_70");
  if (row.contextTags.includes("cross_domain")) add(row.questionId, "all_cross_domain");
  if (row.contextTags.includes("rep_diagram_required") && !row.usedVisual) add(row.questionId, "diagram_required_without_visual");
}
passA.filter((row) => row.difficulty === 4).slice(0, 20).forEach((row) => add(row.questionId, "d4_sample_20"));
passA.filter((row) => row.usedVisual).slice(0, 20).forEach((row) => add(row.questionId, "visual_sample_20"));
for (const topic of [...new Set(passB.map((row) => row.topicPrimary))].sort()) {
  passB.filter((row) => row.topicPrimary === topic).slice(0, 20).forEach((row) => add(row.questionId, `topic_sample_${topic}`));
}
const selectedInput = input.filter((row) => reasons.has(row.questionId));
const selection = selectedInput.map((row) => ({
  questionId: row.questionId,
  reasons: [...reasons.get(row.questionId)],
  firstPassA: a.get(row.questionId),
  firstPassB: b.get(row.questionId),
}));
writeFileSync(path.join(dir, "qa-model-input-manifest.json"), JSON.stringify(selectedInput, null, 2) + "\n");
writeFileSync(path.join(dir, "qa-selection.json"), JSON.stringify(selection, null, 2) + "\n");
console.log(JSON.stringify({ selectedQuestions: selectedInput.length, visual: selectedInput.filter((row) => row.hasFigure).length, textOnly: selectedInput.filter((row) => !row.hasFigure).length }, null, 2));
