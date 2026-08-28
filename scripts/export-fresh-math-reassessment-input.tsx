import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";

import { ExamFigure } from "../components/ExamFigure";

type DbQuestion = {
  questionId: string;
  examId: string;
  school: string;
  year: string;
  examTitle: string;
  examMinutes: number;
  examQuestionCount: number;
  questionNo: number;
  systemTopic: string;
  systemGrade: string;
  questionType: string;
  points: number;
  stem: string;
  optionsJson: string;
  correct: string | null;
  modelAnswer: string | null;
  unit: string | null;
  placeholder: string | null;
  figureKey: string | null;
  source: string | null;
};

const ROOT = path.resolve(import.meta.dirname, "..");
const outputArgIndex = process.argv.indexOf("--output-dir");
if (outputArgIndex < 0 || !process.argv[outputArgIndex + 1]) {
  throw new Error("Usage: pnpm tsx scripts/export-fresh-math-reassessment-input.tsx --output-dir <fresh-directory> [--model <model-id>]");
}
const modelArgIndex = process.argv.indexOf("--model");
const MODEL = modelArgIndex >= 0 && process.argv[modelArgIndex + 1]
  ? process.argv[modelArgIndex + 1]
  : "gpt-5.4";
const OUTPUT_DIR = path.resolve(ROOT, process.argv[outputArgIndex + 1]);
const SOURCE_DIR = path.join(OUTPUT_DIR, "figures", "source");
const PNG_DIR = path.join(OUTPUT_DIR, "figures", "png");
const DB_PATH = path.join(ROOT, "prisma", "dev.db");

mkdirSync(SOURCE_DIR, { recursive: true });
mkdirSync(PNG_DIR, { recursive: true });

const sql = `
SELECT
  q.id AS questionId,
  q.examId AS examId,
  e.school AS school,
  e.year AS year,
  e.title AS examTitle,
  e.minutes AS examMinutes,
  e.qcount AS examQuestionCount,
  q.num AS questionNo,
  q.topic AS systemTopic,
  q.grade AS systemGrade,
  q.type AS questionType,
  q.points AS points,
  q.stem AS stem,
  q.options AS optionsJson,
  q.correct AS correct,
  q.modelAnswer AS modelAnswer,
  q.unit AS unit,
  q.placeholder AS placeholder,
  q.figure AS figureKey,
  q.source AS source
FROM Question q
JOIN Exam e ON e.id = q.examId
WHERE e.kind = 'official'
  AND e.subject = 'math'
  AND e.active = 1
  AND q.active = 1
ORDER BY e.school, e.year, q.num, q.id;
`;

const raw = execFileSync("sqlite3", ["-json", DB_PATH, sql], { encoding: "utf8" });
const questions = JSON.parse(raw) as DbQuestion[];

function sha256(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function parseOptions(rawOptions: string): { valid: boolean; value: unknown } {
  try {
    return { valid: true, value: JSON.parse(rawOptions || "[]") };
  } catch {
    return { valid: false, value: null };
  }
}

function normalizeSvg(svg: string): string {
  let namespaceSeen = false;
  return svg
    .replace(/^<svg\b/, '<svg xmlns="http://www.w3.org/2000/svg"')
    .replace(/\s+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, (namespace) => {
      if (namespaceSeen) return "";
      namespaceSeen = true;
      return namespace;
    })
    .replace(/var\(--ink-muted\)/g, "#667085")
    .replace(/var\(--ink\)/g, "#1f2937")
    .replace(/var\(--surface-3\)/g, "#e5e7eb")
    .replace(/var\(--surface-2\)/g, "#f3f4f6")
    .replace(/var\(--surface\)/g, "#ffffff")
    .replace(/var\(--border-strong\)/g, "#6b7280")
    .replace(/var\(--border-soft\)/g, "#d1d5db")
    .replace(/oklch\([^)]*\)/g, "#dbe4ef");
}

function decodeHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function tableMarkupToSvg(markup: string): string | null {
  const rowMatches = [...markup.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  if (!rowMatches.length) return null;
  const rows = rowMatches.map((row) => [...row[1].matchAll(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((cell) => ({ header: cell[1].toLowerCase() === "th", text: decodeHtml(cell[2]) })));
  const columnCount = Math.max(...rows.map((row) => row.length));
  if (!columnCount) return null;
  const cellWidth = 160;
  const cellHeight = 48;
  const padding = 12;
  const width = columnCount * cellWidth + padding * 2;
  const height = rows.length * cellHeight + padding * 2;
  const cells = rows.flatMap((row, rowIndex) => row.map((cell, columnIndex) => {
    const x = padding + columnIndex * cellWidth;
    const y = padding + rowIndex * cellHeight;
    return `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${cell.header ? "#e7eef8" : "#ffffff"}" stroke="#64748b"/>` +
      `<text x="${x + cellWidth / 2}" y="${y + cellHeight / 2 + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="${cell.header ? "700" : "400"}" fill="#172033">${escapeXml(cell.text)}</text>`;
  })).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff"/>${cells}</svg>`;
}

async function main() {
const completeManifest: Array<Record<string, unknown>> = [];
const modelInputManifest: Array<Record<string, unknown>> = [];
const sourceLabels: Array<Record<string, unknown>> = [];
const assetFailures: Array<Record<string, unknown>> = [];
let svgCount = 0;
let tableCount = 0;
let imageCount = 0;

for (const question of questions) {
  let figureAssetKind: "svg" | "html_table_svg" | "image" | "missing_renderer" | "missing_visual_asset" | null = null;
  let sourceAsset: string | null = null;
  let pngAsset: string | null = null;
  if (question.figureKey) {
    const markup = renderToStaticMarkup(<ExamFigure figure={question.figureKey} />);
    const svgMatch = markup.match(/<svg[\s\S]*?<\/svg>/i);
    const imageMatch = markup.match(/<img[^>]+src="([^"]+)"/i);
    const baseName = question.figureKey;
    try {
      if (svgMatch) {
        const svgPath = path.join(SOURCE_DIR, `${baseName}.svg`);
        writeFileSync(svgPath, normalizeSvg(svgMatch[0]), "utf8");
        const pngPath = path.join(PNG_DIR, `${baseName}.png`);
        await sharp(svgPath, { density: 192 }).flatten({ background: "#ffffff" }).png().toFile(pngPath);
        figureAssetKind = "svg";
        sourceAsset = path.relative(OUTPUT_DIR, svgPath);
        pngAsset = path.relative(OUTPUT_DIR, pngPath);
        svgCount += 1;
      } else if (imageMatch) {
        const imagePath = path.join(ROOT, "public", imageMatch[1].replace(/^\//, ""));
        if (!existsSync(imagePath)) throw new Error(`Static image not found: ${imagePath}`);
        const sourcePath = path.join(SOURCE_DIR, path.basename(imagePath));
        writeFileSync(sourcePath, readFileSync(imagePath));
        const pngPath = path.join(PNG_DIR, `${baseName}.png`);
        await sharp(imagePath).flatten({ background: "#ffffff" }).png().toFile(pngPath);
        figureAssetKind = "image";
        sourceAsset = path.relative(OUTPUT_DIR, sourcePath);
        pngAsset = path.relative(OUTPUT_DIR, pngPath);
        imageCount += 1;
      } else {
        const tableSvg = tableMarkupToSvg(markup);
        if (!tableSvg) {
          figureAssetKind = "missing_renderer";
          throw new Error(`No SVG, image or supported table renderer for ${question.figureKey}`);
        }
        const svgPath = path.join(SOURCE_DIR, `${baseName}.svg`);
        writeFileSync(svgPath, tableSvg, "utf8");
        const pngPath = path.join(PNG_DIR, `${baseName}.png`);
        await sharp(svgPath, { density: 192 }).flatten({ background: "#ffffff" }).png().toFile(pngPath);
        figureAssetKind = "html_table_svg";
        sourceAsset = path.relative(OUTPUT_DIR, svgPath);
        pngAsset = path.relative(OUTPUT_DIR, pngPath);
        tableCount += 1;
      }
    } catch (error) {
      if (figureAssetKind !== "missing_renderer") figureAssetKind = "missing_visual_asset";
      assetFailures.push({ questionId: question.questionId, figureKey: question.figureKey, error: String(error) });
    }
  }
  const options = parseOptions(question.optionsJson);
  const common = {
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
    optionsRawJson: question.optionsJson,
    optionsParsed: options.value,
    optionsJsonValid: options.valid,
    correct: question.correct,
    modelAnswer: question.modelAnswer,
    unit: question.unit,
    placeholder: question.placeholder,
    figureKey: question.figureKey,
    hasFigure: Boolean(question.figureKey),
    figureAssetKind,
    sourceAsset,
    pngAsset,
    source: question.source,
  };
  completeManifest.push({ ...common, systemTopic: question.systemTopic, systemGrade: question.systemGrade });
  modelInputManifest.push(common);
  sourceLabels.push({ questionId: question.questionId, systemTopic: question.systemTopic, systemGrade: question.systemGrade });
}

const runMetadata = {
  runId: path.basename(OUTPUT_DIR),
  createdAt: new Date().toISOString(),
  runKind: "fresh_independent_math_multimodal_reassessment",
  promptVersion: "INSTRUCTION-TAI-DANH-GIA-TOAN-DA-PHUONG-THUC-v2.0",
  taxonomyVersion: "math-topic-taxonomy-v1",
  provider: "ChatGPT app bundled Codex runtime (authenticated session)",
  model: MODEL,
  databasePath: DB_PATH,
  databaseSha256: sha256(DB_PATH),
  gitHead: execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(),
  inputManifest: path.join(OUTPUT_DIR, "model-input-manifest.json"),
  completeManifest: path.join(OUTPUT_DIR, "questions-with-figures.json"),
  sourceLabelsPath: path.join(OUTPUT_DIR, "source-labels-sealed.json"),
  totalQuestions: questions.length,
  totalExams: new Set(questions.map((question) => question.examId)).size,
  totalSchools: new Set(questions.map((question) => question.school)).size,
  figureKeys: questions.filter((question) => question.figureKey).length,
  renderedAssets: svgCount + tableCount + imageCount,
  assetKinds: { svg: svgCount, htmlTableSvg: tableCount, image: imageCount },
  assetFailures,
  transport: "Local PNG supplied with codex exec --image; no prior assessment artifact or remote URL is used.",
  concurrency: { maxWorkers: 3, textBatchSize: 8 },
  isolation: {
    priorAssessmentArtifactsRead: false,
    systemTopicIncludedInModelInput: false,
    systemGradeIncludedInModelInput: false,
    sourceLabelsJoinStage: "after_pass_a_and_pass_b_complete",
  },
};

// This is the first run artifact written, before either model pass starts.
writeFileSync(path.join(OUTPUT_DIR, "run-metadata.json"), JSON.stringify(runMetadata, null, 2) + "\n", "utf8");
writeFileSync(path.join(OUTPUT_DIR, "model-input-manifest.json"), JSON.stringify(modelInputManifest, null, 2) + "\n", "utf8");
writeFileSync(path.join(OUTPUT_DIR, "questions-with-figures.json"), JSON.stringify(completeManifest, null, 2) + "\n", "utf8");
writeFileSync(path.join(OUTPUT_DIR, "source-labels-sealed.json"), JSON.stringify(sourceLabels, null, 2) + "\n", "utf8");
writeFileSync(path.join(OUTPUT_DIR, "export-summary.json"), JSON.stringify({
  totalQuestions: questions.length,
  figureKeys: questions.filter((question) => question.figureKey).length,
  renderedAssets: svgCount + tableCount + imageCount,
  svg: svgCount,
  htmlTableSvg: tableCount,
  image: imageCount,
  failures: assetFailures,
}, null, 2) + "\n", "utf8");

console.log(JSON.stringify({ outputDir: OUTPUT_DIR, ...runMetadata }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
