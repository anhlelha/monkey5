import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ExamFigure } from "../components/ExamFigure";

type DbQuestion = {
  questionId: string;
  examId: string;
  school: string;
  year: string;
  minutes: number;
  num: number;
  topic: string;
  systemGrade: string;
  type: string;
  points: number;
  stem: string;
  options: string;
  correct: string | null;
  modelAnswer: string | null;
  unit: string | null;
  placeholder: string | null;
  figure: string | null;
};

const ROOT = path.resolve(import.meta.dirname, "..");
const OUTPUT_DIR = path.join(ROOT, ".analysis", "math-vision-input");
const ASSET_DIR = path.join(OUTPUT_DIR, "figures");
const DB_PATH = path.join(ROOT, "prisma", "dev.db");

mkdirSync(ASSET_DIR, { recursive: true });

const sql = `
  SELECT
    q.id AS questionId,
    e.id AS examId,
    e.school,
    e.year,
    e.minutes,
    q.num,
    q.topic,
    q.grade AS systemGrade,
    q.type,
    q.points,
    q.stem,
    q.options,
    q.correct,
    q.modelAnswer,
    q.unit,
    q.placeholder,
    q.figure
  FROM Question q
  JOIN Exam e ON e.id = q.examId
  WHERE e.kind = 'official'
    AND e.subject = 'math'
    AND e.active = 1
    AND q.active = 1
  ORDER BY e.school, e.year, q.num, q.id;
`;

const raw = execFileSync("sqlite3", ["-json", DB_PATH, sql], { encoding: "utf-8" });
const questions = JSON.parse(raw) as DbQuestion[];

function normalizeSvg(svg: string): string {
  return svg
    .replace(/^<svg\b/, '<svg xmlns="http://www.w3.org/2000/svg"')
    .replace(/var\(--ink-muted\)/g, "#667085")
    .replace(/var\(--ink\)/g, "#1f2937")
    .replace(/var\(--surface-3\)/g, "#e5e7eb")
    .replace(/var\(--surface-2\)/g, "#f3f4f6")
    .replace(/var\(--surface\)/g, "#ffffff")
    .replace(/var\(--border-strong\)/g, "#6b7280")
    .replace(/var\(--border-soft\)/g, "#d1d5db")
    .replace(/oklch\(0\.7 0\.12 220 \/ 0\.25\)/g, "#b6d9ec")
    .replace(/oklch\(0\.75 0\.16 45\)/g, "#f5c28f")
    .replace(/oklch\(0\.75 0\.16 220\)/g, "#9ed7f3")
    .replace(/oklch\(0\.75 0\.22 330\)/g, "#f3acc7")
    .replace(/oklch\(0\.78 0\.18 130 \/ 0\.55\)/g, "#b7e3a9")
    .replace(/oklch\(0\.78 0\.18 130 \/ 0\.6\)/g, "#b7e3a9")
    .replace(/oklch\(0\.78 0\.14 340 \/ 0\.45\)/g, "#e9c4dc")
    .replace(/oklch\(0\.85 0\.04 40 \/ 0\.25\)/g, "#f3eadc")
    .replace(/oklch\(0\.85 0\.04 40\)/g, "#f3eadc");
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
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Convert a simple server-rendered HTML table into a self-contained visual asset. */
function tableMarkupToSvg(markup: string): string | null {
  const rowMatches = [...markup.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  if (!rowMatches.length) return null;
  const rows = rowMatches.map((row) => [...row[1].matchAll(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((cell) => ({ header: cell[1].toLowerCase() === "th", text: decodeHtml(cell[2]) })));
  const columnCount = Math.max(...rows.map((row) => row.length));
  if (!columnCount) return null;

  const cellWidth = 132;
  const cellHeight = 38;
  const padding = 10;
  const width = columnCount * cellWidth + padding * 2;
  const height = rows.length * cellHeight + padding * 2;
  const cells = rows.flatMap((row, rowIndex) => row.map((cell, columnIndex) => {
    const x = padding + columnIndex * cellWidth;
    const y = padding + rowIndex * cellHeight;
    const fill = cell.header ? "#e7eef8" : "#ffffff";
    const weight = cell.header ? "700" : "400";
    return `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${fill}" stroke="#64748b"/>` +
      `<text x="${x + cellWidth / 2}" y="${y + cellHeight / 2 + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="${weight}" fill="#172033">${escapeXml(cell.text)}</text>`;
  })).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff"/>${cells}</svg>`;
}

const manifest: Array<Record<string, unknown>> = [];
let renderedSvg = 0;
let renderedHtmlTable = 0;
let copiedImage = 0;
let missingRenderer = 0;

for (const question of questions) {
  let asset: string | null = null;
  let assetKind: "svg" | "html_table_svg" | "image" | "missing_renderer" | null = null;
  if (question.figure) {
    const markup = renderToStaticMarkup(<ExamFigure figure={question.figure} />);
    const svgMatch = markup.match(/<svg[\s\S]*?<\/svg>/i);
    const imageMatch = markup.match(/<img[^>]+src="([^"]+)"/i);
    if (svgMatch) {
      asset = `${question.figure}.svg`;
      writeFileSync(path.join(ASSET_DIR, asset), normalizeSvg(svgMatch[0]), "utf-8");
      assetKind = "svg";
      renderedSvg += 1;
    } else if (imageMatch) {
      const source = path.join(ROOT, "public", imageMatch[1].replace(/^\//, ""));
      if (!existsSync(source)) throw new Error(`Image asset not found: ${source}`);
      asset = path.basename(source);
      copyFileSync(source, path.join(ASSET_DIR, asset));
      assetKind = "image";
      copiedImage += 1;
    } else {
      const tableSvg = tableMarkupToSvg(markup);
      if (tableSvg) {
        asset = `${question.figure}.svg`;
        writeFileSync(path.join(ASSET_DIR, asset), tableSvg, "utf-8");
        assetKind = "html_table_svg";
        renderedHtmlTable += 1;
      } else {
        assetKind = "missing_renderer";
        missingRenderer += 1;
      }
    }
  }
  manifest.push({
    ...question,
    figureAsset: asset,
    figureAssetKind: assetKind,
  });
}

writeFileSync(path.join(OUTPUT_DIR, "questions-with-figures.json"), JSON.stringify(manifest, null, 2) + "\n", "utf-8");
writeFileSync(path.join(OUTPUT_DIR, "export-summary.json"), JSON.stringify({
  totalQuestions: questions.length,
  withFigureKey: questions.filter((question) => question.figure).length,
  renderedSvg,
  renderedHtmlTable,
  copiedImage,
  missingRenderer,
}, null, 2) + "\n", "utf-8");

console.log(JSON.stringify({
  output: OUTPUT_DIR,
  totalQuestions: questions.length,
  withFigureKey: questions.filter((question) => question.figure).length,
  renderedSvg,
  renderedHtmlTable,
  copiedImage,
  missingRenderer,
}, null, 2));
