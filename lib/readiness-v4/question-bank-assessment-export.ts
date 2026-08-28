import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";

import { ExamFigure } from "../../components/ExamFigure";
import { prisma } from "../prisma";
import { questionContentHash, stableHash } from "./hashing";
import { getMathQuestionBankAssessmentCoverage, type QuestionBankAssessmentState } from "./assessment-coverage-service";
import { MATH_TAXONOMY_VERSION } from "./types";

const EXPORTABLE_STATES = new Set<QuestionBankAssessmentState>(["missing", "stale", "conflict"]);
const TEXT_BATCH_SIZE = 8;

const TOPICS = [
  "num_div", "frac_decimal", "ratio_percent", "sequence_pattern", "plane_geometry", "solid_geometry",
  "measurement", "time_calendar", "motion", "work_rate", "data_probability", "counting_combinatorics",
  "logic_strategy",
] as const;
const CONTEXT_TAGS = ["ctx_age", "ctx_map_scale", "ctx_finance_commerce", "rep_diagram_required", "cross_domain"] as const;

const PASS_A_ITEM_SCHEMA = {
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

const PASS_B_ITEM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["questionId", "topicPrimary", "topicSecondary", "contextTags", "topicConfidence", "topicRationale", "figureRead"],
  properties: {
    questionId: { type: "string" },
    topicPrimary: { type: "string", enum: TOPICS },
    topicSecondary: { type: "array", maxItems: 2, items: { type: "string", enum: TOPICS } },
    contextTags: { type: "array", maxItems: 5, items: { type: "string", enum: CONTEXT_TAGS } },
    topicConfidence: { type: "integer", minimum: 0, maximum: 100 },
    topicRationale: { type: "string" },
    figureRead: { type: "string" },
  },
};

function wrappedSchema(item: object): object {
  return {
    type: "object",
    additionalProperties: false,
    required: ["assessments"],
    properties: { assessments: { type: "array", items: item } },
  };
}

function parseJson(value: string | null): unknown {
  if (value === null) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
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
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function tableMarkupToSvg(markup: string): string | null {
  const rowMatches = [...markup.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  if (rowMatches.length === 0) return null;
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

async function renderFigure(figureKey: string, outputDir: string): Promise<{ sourceAsset: string; pngAsset: string; kind: string }> {
  const sourceDir = path.join(outputDir, "figures", "source");
  const pngDir = path.join(outputDir, "figures", "png");
  fs.mkdirSync(sourceDir, { recursive: true });
  fs.mkdirSync(pngDir, { recursive: true });
  const markup = renderToStaticMarkup(React.createElement(ExamFigure, { figure: figureKey }));
  const svgMatch = markup.match(/<svg[\s\S]*?<\/svg>/i);
  const imageMatch = markup.match(/<img[^>]+src="([^"]+)"/i);
  const pngPath = path.join(pngDir, `${figureKey}.png`);
  if (svgMatch) {
    const svgPath = path.join(sourceDir, `${figureKey}.svg`);
    fs.writeFileSync(svgPath, normalizeSvg(svgMatch[0]), "utf8");
    await sharp(svgPath, { density: 192 }).flatten({ background: "#ffffff" }).png().toFile(pngPath);
    return { sourceAsset: path.relative(outputDir, svgPath), pngAsset: path.relative(outputDir, pngPath), kind: "svg" };
  }
  if (imageMatch) {
    const imagePath = path.join(process.cwd(), "public", imageMatch[1].replace(/^\//, ""));
    if (!fs.existsSync(imagePath)) throw new Error(`Static image not found: ${imagePath}`);
    const sourcePath = path.join(sourceDir, path.basename(imagePath));
    fs.copyFileSync(imagePath, sourcePath);
    await sharp(imagePath).flatten({ background: "#ffffff" }).png().toFile(pngPath);
    return { sourceAsset: path.relative(outputDir, sourcePath), pngAsset: path.relative(outputDir, pngPath), kind: "image" };
  }
  const tableSvg = tableMarkupToSvg(markup);
  if (!tableSvg) throw new Error(`No supported renderer for figure ${figureKey}`);
  const svgPath = path.join(sourceDir, `${figureKey}.svg`);
  fs.writeFileSync(svgPath, tableSvg, "utf8");
  await sharp(svgPath, { density: 192 }).flatten({ background: "#ffffff" }).png().toFile(pngPath);
  return { sourceAsset: path.relative(outputDir, svgPath), pngAsset: path.relative(outputDir, pngPath), kind: "html_table_svg" };
}

function timestamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export interface QuestionBankAssessmentExportOptions {
  outputDir?: string;
  model?: string;
  states?: QuestionBankAssessmentState[];
}

export interface QuestionBankAssessmentExportResult {
  outputDir: string;
  runId: string;
  totalQuestions: number;
  byState: Record<string, number>;
  visualQuestions: number;
  assetFailures: Array<{ questionId: string; figureKey: string; error: string }>;
  inputHash: string;
}

export async function exportQuestionBankAssessmentInput(options: QuestionBankAssessmentExportOptions = {}): Promise<QuestionBankAssessmentExportResult> {
  const coverage = await getMathQuestionBankAssessmentCoverage();
  const selectedStates = new Set(options.states ?? [...EXPORTABLE_STATES]);
  const selected = coverage.items.filter((item) => selectedStates.has(item.state));
  const questionIds = selected.map((item) => item.questionId).sort();
  const outputDir = path.resolve(options.outputDir ?? path.join(process.cwd(), `.analysis/math-question-bank-v4-${timestamp()}`));
  const runId = path.basename(outputDir);
  if (fs.existsSync(outputDir) && fs.readdirSync(outputDir).length > 0) {
    throw new Error(`Output directory must be new or empty: ${outputDir}`);
  }
  fs.mkdirSync(path.join(outputDir, "schemas"), { recursive: true });
  fs.mkdirSync(path.join(outputDir, "batches"), { recursive: true });

  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    include: { exam: { select: { id: true, kind: true, title: true, school: true, year: true, generated: true } } },
    orderBy: { id: "asc" },
  });
  const stateById = new Map(selected.map((item) => [item.questionId, item]));
  const manifest: Array<Record<string, unknown>> = [];
  const qaManifest: Array<Record<string, unknown>> = [];
  const sourceLabels: Array<Record<string, unknown>> = [];
  const assetFailures: Array<{ questionId: string; figureKey: string; error: string }> = [];

  for (const question of questions) {
    const assessmentState = stateById.get(question.id);
    let figureAsset: { sourceAsset: string; pngAsset: string; kind: string } | null = null;
    if (question.figure) {
      try {
        figureAsset = await renderFigure(question.figure, outputDir);
      } catch (error) {
        assetFailures.push({ questionId: question.id, figureKey: question.figure, error: String(error) });
      }
    }
    const modelInput = {
      questionId: question.id,
      questionType: question.type,
      questionNo: question.num,
      points: question.points,
      stem: question.stem,
      options: parseJson(question.options),
      correct: question.correct,
      answerSchema: parseJson(question.answerSchema),
      modelAnswer: question.modelAnswer,
      unit: question.unit,
      placeholder: question.placeholder,
      hasFigure: Boolean(question.figure),
      figureKey: question.figure,
      pngAsset: figureAsset?.pngAsset ?? null,
      questionContentHash: questionContentHash(question),
    };
    manifest.push(modelInput);
    qaManifest.push({
      ...modelInput,
      assessmentState: assessmentState?.state ?? "missing",
      sourceCategory: assessmentState?.source ?? "supplement",
      sourceExamId: question.exam?.id ?? null,
      sourceExamKind: question.exam?.kind ?? null,
      sourceExamTitle: question.exam?.title ?? null,
      figureAssetKind: figureAsset?.kind ?? null,
      sourceAsset: figureAsset?.sourceAsset ?? null,
    });
    sourceLabels.push({
      questionId: question.id,
      assessmentState: assessmentState?.state ?? "missing",
      sourceCategory: assessmentState?.source ?? "supplement",
      examId: question.exam?.id ?? null,
      examKind: question.exam?.kind ?? null,
      school: question.exam?.school ?? null,
      year: question.exam?.year ?? null,
    });
  }

  const generatedQuestions = await prisma.question.findMany({
    where: { subject: "math", sourceQuestionId: { not: null }, exam: { generated: true } },
    select: {
      id: true, sourceQuestionId: true, subject: true, type: true, stem: true, options: true, correct: true,
      answerSchema: true, points: true, figure: true,
    },
    orderBy: { id: "asc" },
  });
  const canonicalIds = [...new Set(generatedQuestions.map((row) => row.sourceQuestionId).filter((id): id is string => Boolean(id)))];
  const canonicalQuestions = canonicalIds.length > 0
    ? await prisma.question.findMany({
        where: { id: { in: canonicalIds } },
        select: { id: true, subject: true, type: true, stem: true, options: true, correct: true, answerSchema: true, points: true, figure: true },
      })
    : [];
  const canonicalById = new Map(canonicalQuestions.map((row) => [row.id, row]));
  const directGeneratedAssessmentCounts = generatedQuestions.length > 0
    ? await prisma.questionAssessment.groupBy({
        by: ["questionId"],
        where: { questionId: { in: generatedQuestions.map((row) => row.id) }, taxonomyVersion: MATH_TAXONOMY_VERSION },
        _count: true,
      })
    : [];
  const directCountById = new Map(directGeneratedAssessmentCounts.map((row) => [row.questionId, row._count]));
  const generatedReconciliation = generatedQuestions.filter((clone) => (directCountById.get(clone.id) ?? 0) > 0).map((clone) => {
    const source = clone.sourceQuestionId ? canonicalById.get(clone.sourceQuestionId) : undefined;
    return {
      cloneQuestionId: clone.id,
      canonicalQuestionId: clone.sourceQuestionId,
      canonicalExists: Boolean(source),
      hashCompatible: source ? questionContentHash(clone) === questionContentHash(source) : false,
      directAssessmentCount: directCountById.get(clone.id) ?? 0,
      exportedForAssessment: false,
    };
  });

  const textQuestions = manifest.filter((row) => row.hasFigure === false);
  const visualQuestions = manifest.filter((row) => row.hasFigure === true);
  const batches: Array<{ id: string; kind: "text" | "visual"; questionIds: string[]; inputFile: string }> = [];
  for (let index = 0; index < textQuestions.length; index += TEXT_BATCH_SIZE) {
    const batch = textQuestions.slice(index, index + TEXT_BATCH_SIZE);
    const id = `text-${String(index / TEXT_BATCH_SIZE + 1).padStart(3, "0")}`;
    const inputFile = `batches/${id}.json`;
    fs.writeFileSync(path.join(outputDir, inputFile), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
    batches.push({ id, kind: "text", questionIds: batch.map((row) => String(row.questionId)), inputFile });
  }
  for (let index = 0; index < visualQuestions.length; index += 1) {
    const batch = [visualQuestions[index]];
    const id = `visual-${String(index + 1).padStart(3, "0")}`;
    const inputFile = `batches/${id}.json`;
    fs.writeFileSync(path.join(outputDir, inputFile), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
    batches.push({ id, kind: "visual", questionIds: batch.map((row) => String(row.questionId)), inputFile });
  }

  const inputHash = stableHash(manifest);
  const byState = Object.fromEntries([...selectedStates].map((state) => [state, selected.filter((item) => item.state === state).length]));
  const metadata = {
    runId,
    createdAt: new Date().toISOString(),
    runKind: "question_bank_v4_missing_assessment",
    taxonomyVersion: MATH_TAXONOMY_VERSION,
    promptVersion: "INSTRUCTION-TAI-DANH-GIA-TOAN-DA-PHUONG-THUC-v2.0",
    model: options.model ?? "configured-at-assessment-time",
    modelInputSha256: inputHash,
    totalQuestions: manifest.length,
    states: byState,
    visualQuestions: visualQuestions.length,
    assetFailures,
    batches,
    isolation: {
      canonicalActiveMathOnly: true,
      generatedClonesIncluded: false,
      legacyTopicIncludedInModelInput: false,
      legacyGradeIncludedInModelInput: false,
      sourceLabelsIncludedInModelInput: false,
      userPiiIncluded: false,
    },
  };
  fs.writeFileSync(path.join(outputDir, "model-input-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(outputDir, "questions-with-figures.json"), `${JSON.stringify(qaManifest, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(outputDir, "source-labels-sealed.json"), `${JSON.stringify(sourceLabels, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(outputDir, "generated-clone-reconciliation.json"), `${JSON.stringify(generatedReconciliation, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(outputDir, "schemas/pass-a-item.schema.json"), `${JSON.stringify(PASS_A_ITEM_SCHEMA, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(outputDir, "schemas/pass-a-batch.schema.json"), `${JSON.stringify(wrappedSchema(PASS_A_ITEM_SCHEMA), null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(outputDir, "schemas/pass-b-item.schema.json"), `${JSON.stringify(PASS_B_ITEM_SCHEMA, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(outputDir, "schemas/pass-b-batch.schema.json"), `${JSON.stringify(wrappedSchema(PASS_B_ITEM_SCHEMA), null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(outputDir, "run-metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(outputDir, "export-summary.json"), `${JSON.stringify({
    totalQuestions: manifest.length,
    byState,
    visualQuestions: visualQuestions.length,
    textQuestions: textQuestions.length,
    assetFailures,
    inputHash,
    generatedCloneRows: generatedReconciliation.length,
    directGeneratedAssessmentRows: generatedReconciliation.reduce((sum, row) => sum + row.directAssessmentCount, 0),
  }, null, 2)}\n`, "utf8");

  return { outputDir, runId, totalQuestions: manifest.length, byState, visualQuestions: visualQuestions.length, assetFailures, inputHash };
}
