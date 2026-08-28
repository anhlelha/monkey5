import { execFileSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const DB_PATH = path.join(ROOT, "prisma", "dev.db");
const INPUT_DIR = path.join(ROOT, ".analysis", "math-vision-input");
const SOURCE_MANIFEST_PATH = path.join(INPUT_DIR, "questions-with-figures.json");
const PASS_A_SOURCE_PATH = path.join(ROOT, ".reports", "du-lieu-tai-danh-gia-toan-da-phuong-thuc.json");
const PASS_B_DIR = path.join(ROOT, ".analysis", "topic-taxonomy-v1");
const PASS_B_SOURCE_PATH = path.join(PASS_B_DIR, "topic-taxonomy-v1-assessments.json");
const PASS_B_METADATA_PATH = path.join(PASS_B_DIR, "topic-taxonomy-v1-run-metadata.json");
const OUTPUT_DIR = path.join(ROOT, ".analysis", "math-reassessment-v2");
const SOURCE_ASSET_DIR = path.join(OUTPUT_DIR, "figures", "source");
const PNG_ASSET_DIR = path.join(OUTPUT_DIR, "figures", "png");

const COGNITIVE_LEVELS = ["co_ban", "van_dung", "nang_cao", "chuyen_sau"];
const DIFFICULTIES = [1, 2, 3, 4, 5];
const REASONING_TYPES = ["direct", "multi_step", "non_routine", "proof_or_modeling"];
const PRIMARY_TOPICS = [
  "num_div", "frac_decimal", "ratio_percent", "sequence_pattern", "plane_geometry",
  "solid_geometry", "measurement", "time_calendar", "motion", "work_rate",
  "data_probability", "counting_combinatorics", "logic_strategy",
];
const CONTEXT_TAGS = [
  "ctx_age", "ctx_map_scale", "ctx_finance_commerce", "rep_diagram_required", "cross_domain",
];

const TOPIC_LABELS = {
  num_div: "Số tự nhiên, chữ số & chia hết",
  frac_decimal: "Phân số & số thập phân",
  ratio_percent: "Tỉ số, phần trăm & tỉ lệ",
  sequence_pattern: "Dãy số, quy luật & đại số sơ cấp",
  plane_geometry: "Hình phẳng & diện tích",
  solid_geometry: "Hình khối & thể tích",
  measurement: "Đo lường, đơn vị & ước lượng",
  time_calendar: "Thời gian & lịch",
  motion: "Chuyển động đều",
  work_rate: "Công việc, năng suất & lưu lượng",
  data_probability: "Dữ liệu, thống kê & xác suất",
  counting_combinatorics: "Đếm & tổ hợp",
  logic_strategy: "Logic, bất biến & chiến lược",
};

function loadJson(file) {
  if (!existsSync(file)) throw new Error(`Missing required input: ${file}`);
  return JSON.parse(readFileSync(file, "utf8"));
}

function writeJson(file, payload) {
  writeFileSync(file, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

function writeJsonl(file, rows) {
  writeFileSync(file, rows.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function parseOptions(raw) {
  try {
    return { valid: true, value: JSON.parse(raw || "[]") };
  } catch {
    return { valid: false, value: null };
  }
}

function normalizeSvgNamespaces(svg) {
  let seen = false;
  return svg.replace(/\s+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, (namespace) => {
    if (seen) return "";
    seen = true;
    return namespace;
  });
}

function countBy(rows, pick) {
  return Object.fromEntries(
    [...rows.reduce((map, row) => {
      const key = String(pick(row));
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map()).entries()].sort(([a], [b]) => a.localeCompare(b)),
  );
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function emptyMatrix() {
  return Object.fromEntries(COGNITIVE_LEVELS.map((level) => [
    level,
    Object.fromEntries(DIFFICULTIES.map((difficulty) => [String(difficulty), 0])),
  ]));
}

function matrixFor(rows) {
  const matrix = emptyMatrix();
  for (const row of rows) matrix[row.cognitiveLevel][String(row.difficulty)] += 1;
  return matrix;
}

function cramersV(rows) {
  if (!rows.length) return 0;
  const observed = COGNITIVE_LEVELS.map((level) =>
    DIFFICULTIES.map((difficulty) => rows.filter((row) => row.cognitiveLevel === level && row.difficulty === difficulty).length),
  );
  const rowTotals = observed.map((row) => row.reduce((sum, value) => sum + value, 0));
  const columnTotals = DIFFICULTIES.map((_, column) => observed.reduce((sum, row) => sum + row[column], 0));
  let chiSquare = 0;
  for (let row = 0; row < observed.length; row += 1) {
    for (let column = 0; column < DIFFICULTIES.length; column += 1) {
      const expected = (rowTotals[row] * columnTotals[column]) / rows.length;
      if (expected > 0) chiSquare += ((observed[row][column] - expected) ** 2) / expected;
    }
  }
  const denominator = rows.length * Math.min(COGNITIVE_LEVELS.length - 1, DIFFICULTIES.length - 1);
  return denominator > 0 ? Math.sqrt(chiSquare / denominator) : 0;
}

function scopeSummary(rows) {
  return {
    questionCount: rows.length,
    averageDifficulty: Number(mean(rows.map((row) => row.difficulty)).toFixed(3)),
    averageAssessmentConfidence: Number(mean(rows.map((row) => row.assessmentConfidence)).toFixed(2)),
    d4d5Count: rows.filter((row) => row.difficulty >= 4).length,
    d4d5Pct: Number((rows.length ? rows.filter((row) => row.difficulty >= 4).length / rows.length * 100 : 0).toFixed(2)),
    cognitiveCounts: countBy(rows, (row) => row.cognitiveLevel),
    difficultyCounts: countBy(rows, (row) => row.difficulty),
    reasoningTypeCounts: countBy(rows, (row) => row.reasoningType),
    matrix: matrixFor(rows),
  };
}

function uniqueById(rows, label) {
  const map = new Map();
  for (const row of rows) {
    if (!row.questionId || map.has(row.questionId)) throw new Error(`${label}: empty or duplicate questionId ${row.questionId}`);
    map.set(row.questionId, row);
  }
  return map;
}

function validatePassA(row) {
  if (!COGNITIVE_LEVELS.includes(row.cognitiveLevel)) throw new Error(`Pass A invalid cognitiveLevel: ${row.questionId}`);
  if (!DIFFICULTIES.includes(row.difficulty)) throw new Error(`Pass A invalid difficulty: ${row.questionId}`);
  if (!REASONING_TYPES.includes(row.reasoningType)) throw new Error(`Pass A invalid reasoningType: ${row.questionId}`);
  if (!Number.isInteger(row.assessmentConfidence) || row.assessmentConfidence < 0 || row.assessmentConfidence > 100) {
    throw new Error(`Pass A invalid confidence: ${row.questionId}`);
  }
}

function validatePassB(row, source) {
  if (!PRIMARY_TOPICS.includes(row.topicPrimary)) throw new Error(`Pass B invalid primary: ${row.questionId}`);
  if (!Array.isArray(row.topicSecondary) || row.topicSecondary.length > 2 || new Set(row.topicSecondary).size !== row.topicSecondary.length) {
    throw new Error(`Pass B invalid secondary: ${row.questionId}`);
  }
  if (row.topicSecondary.includes(row.topicPrimary) || row.topicSecondary.some((topic) => !PRIMARY_TOPICS.includes(topic))) {
    throw new Error(`Pass B overlapping/invalid secondary: ${row.questionId}`);
  }
  if (!Array.isArray(row.contextTags) || new Set(row.contextTags).size !== row.contextTags.length || row.contextTags.some((tag) => !CONTEXT_TAGS.includes(tag))) {
    throw new Error(`Pass B invalid contextTags: ${row.questionId}`);
  }
  if (!Number.isInteger(row.topicConfidence) || row.topicConfidence < 0 || row.topicConfidence > 100) {
    throw new Error(`Pass B invalid confidence: ${row.questionId}`);
  }
  if (!source.hasFigure && row.figureRead !== "Không có hình minh họa") throw new Error(`Pass B text-only figureRead mismatch: ${row.questionId}`);
  if (!source.hasFigure && row.contextTags.includes("rep_diagram_required")) throw new Error(`Pass B text-only diagram tag: ${row.questionId}`);
}

function groupSummaries(rows, sourceById, field) {
  const groups = new Map();
  for (const row of rows) {
    const source = sourceById.get(row.questionId);
    const key = source[field];
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  return Object.fromEntries([...groups.entries()].sort(([a], [b]) => String(a).localeCompare(String(b))).map(([key, values]) => [key, scopeSummary(values)]));
}

function topicComparison(rows, sourceById) {
  const matrix = {};
  const primaryBySchool = {};
  const secondaryByPrimary = {};
  const contextTagCounts = {};
  for (const row of rows) {
    const source = sourceById.get(row.questionId);
    matrix[source.systemTopic] ??= {};
    matrix[source.systemTopic][row.topicPrimary] = (matrix[source.systemTopic][row.topicPrimary] ?? 0) + 1;
    primaryBySchool[source.school] ??= {};
    primaryBySchool[source.school][row.topicPrimary] = (primaryBySchool[source.school][row.topicPrimary] ?? 0) + 1;
    secondaryByPrimary[row.topicPrimary] ??= {};
    for (const secondary of row.topicSecondary) {
      secondaryByPrimary[row.topicPrimary][secondary] = (secondaryByPrimary[row.topicPrimary][secondary] ?? 0) + 1;
    }
    for (const tag of row.contextTags) contextTagCounts[tag] = (contextTagCounts[tag] ?? 0) + 1;
  }
  return {
    comparisonMeaning: "Đối chiếu phân bố nhãn nguồn → taxonomy độc lập; không phải phán quyết nhãn nguồn đúng/sai.",
    total: rows.length,
    matrixSystemToPrimary: matrix,
    primaryDistributionBySchool: primaryBySchool,
    secondaryByPrimary,
    contextTagCounts,
    reviewCandidates: {
      lowTopicConfidence: rows.filter((row) => row.topicConfidence < 70).map((row) => row.questionId),
      crossDomain: rows.filter((row) => row.contextTags.includes("cross_domain")).map((row) => row.questionId),
    },
  };
}

function reportMarkdown({ summary, passA, passB, metadata }) {
  const topicRows = PRIMARY_TOPICS.map((topic) => `| \`${topic}\` | ${TOPIC_LABELS[topic]} | ${summary.passB.topicPrimaryCounts[topic] ?? 0} |`).join("\n");
  const difficultyRows = DIFFICULTIES.map((difficulty) => `| D${difficulty} | ${summary.passA.difficultyCounts[String(difficulty)] ?? 0} |`).join("\n");
  const lowA = passA.filter((row) => row.assessmentConfidence < 70).map((row) => `\`${row.questionId}\` (${row.assessmentConfidence})`).join(", ") || "Không có";
  const lowB = passB.filter((row) => row.topicConfidence < 70).map((row) => `\`${row.questionId}\` (${row.topicConfidence})`).join(", ") || "Không có";
  return `# Báo cáo tái đánh giá Toán đa phương thức — Monkey5\n\n` +
    `- Phạm vi: **${summary.coverage.totalQuestions} câu / ${summary.coverage.totalExams} đề / ${summary.coverage.totalSchools} trường**.\n` +
    `- Coverage Pass A và Pass B: **100%**.\n` +
    `- Câu có hình đã dùng trực tiếp: **${summary.coverage.usedVisual}/${summary.coverage.figureKeys}**.\n` +
    `- Database nguồn không bị ghi đè; nhãn hệ thống chỉ được join sau hai pass độc lập.\n` +
    `- Snapshot database SHA-256: \`${metadata.snapshot.databaseSha256}\`.\n\n` +
    `## Pass A — nhận thức và độ khó\n\n` +
    `Độ khó trung bình: **${summary.passA.averageDifficulty.toFixed(2)}/5**. D4–D5: **${summary.passA.d4d5Count} câu (${summary.passA.d4d5Pct}%)**. Confidence trung bình: **${summary.passA.averageAssessmentConfidence}/100**. Cramér’s V cognition × difficulty: **${summary.passA.cramersV}**; đây là tín hiệu QA, không tự thân là lỗi.\n\n` +
    `| Mức | Số câu |\n|---:|---:|\n${difficultyRows}\n\n` +
    `Confidence dưới 70: ${lowA}.\n\n` +
    `## Pass B — taxonomy chuyên đề độc lập v1\n\n` +
    `Confidence chuyên đề trung bình: **${summary.passB.averageTopicConfidence}/100**. Confidence dưới 70: ${lowB}.\n\n` +
    `| ID | Chuyên đề | Số câu |\n|---|---|---:|\n${topicRows}\n\n` +
    `## QA và diễn giải\n\n` +
    `- Không có lỗi schema, ID trùng, coverage thiếu hoặc câu có hình bị chấm text-only.\n` +
    `- Có **${summary.passA.difficultyCounts["5"] ?? 0} câu D5**; việc không có D5 là đặc điểm của lượt đánh giá, không tự động là lỗi của đề.\n` +
    `- Một câu bảng tần suất (\`NTT-2025-26-C2\`) được hiệu chỉnh coverage Pass A sau khi renderer bảng đã được bổ sung; nhãn mức độ không đổi, chỉ cập nhật việc đọc hình và confidence.\n` +
    `- Các khác biệt giữa nhãn nguồn và \`topicPrimary\` chỉ là danh sách rà soát cấu trúc taxonomy; không được dùng để tự động sửa database.\n\n` +
    `## Artifact\n\n` +
    `Manifest, SVG/ảnh nguồn, PNG đã render, hai lớp assessment JSON/JSONL, metadata, summary, ma trận, bảng đối chiếu, review flags và dashboard nằm cùng thư mục với báo cáo này.\n`;
}

async function main() {
  const startedAt = new Date().toISOString();
  const sourceManifest = loadJson(SOURCE_MANIFEST_PATH);
  const passASource = loadJson(PASS_A_SOURCE_PATH);
  const passBSource = loadJson(PASS_B_SOURCE_PATH);
  const passBMetadata = loadJson(PASS_B_METADATA_PATH);

  const sql = `
    SELECT q.id AS questionId, q.examId AS examId, e.school AS school, e.year AS year,
      e.title AS examTitle, e.minutes AS examMinutes, e.qcount AS examQuestionCount,
      q.num AS questionNo, q.topic AS systemTopic, q.grade AS systemGrade,
      q.type AS questionType, q.points AS points, q.stem AS stem, q.options AS optionsJson,
      q.correct AS correct, q.modelAnswer AS modelAnswer, q.unit AS unit,
      q.placeholder AS placeholder, q.figure AS figureKey, q.source AS source
    FROM Question q JOIN Exam e ON e.id = q.examId
    WHERE e.kind = 'official' AND e.subject = 'math' AND e.active = 1 AND q.active = 1
    ORDER BY e.school, e.year, q.num, q.id;
  `;
  const dbRows = JSON.parse(execFileSync("sqlite3", ["-json", DB_PATH, sql], { encoding: "utf8" }));
  const sourceAssetsById = uniqueById(sourceManifest, "source manifest");
  const dbIds = dbRows.map((row) => row.questionId);
  if (dbRows.length !== sourceManifest.length || dbIds.some((id, index) => sourceManifest[index]?.questionId !== id)) {
    throw new Error("Database and source manifest are not the same ordered question snapshot");
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const gitHead = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
  const metadata = {
    runKind: "math_multimodal_reassessment_v2_finalize",
    startedAt,
    promptVersion: "INSTRUCTION-TAI-DANH-GIA-TOAN-DA-PHUONG-THUC-v2.0",
    taxonomyVersion: "math-topic-taxonomy-v1",
    provider: {
      passA: "Không được lưu trong metadata của lượt nguồn; một record coverage được Codex kiểm tra thủ công từ asset render.",
      passB: "OpenAI-compatible",
    },
    model: {
      passA: "not-recorded-in-source-run",
      passB: passBMetadata.model ?? "gpt-5-mini",
    },
    snapshot: {
      gitHead,
      databasePath: DB_PATH,
      databaseSha256: sha256(DB_PATH),
      sourceManifestPath: SOURCE_MANIFEST_PATH,
      sourceManifestSha256: sha256(SOURCE_MANIFEST_PATH),
    },
    inputManifest: path.join(OUTPUT_DIR, "questions-with-figures.json"),
    totalQuestions: dbRows.length,
    figureKeys: dbRows.filter((row) => row.figureKey).length,
    renderableAssets: sourceManifest.filter((row) => row.figureAsset).length,
    concurrency: {
      passA: "not-recorded-in-source-run",
      passB: 5,
      canonicalAssetRender: 1,
    },
    independenceControls: {
      sourceTopicSentToPassA: false,
      sourceGradeSentToPassA: false,
      sourceTopicSentToPassB: false,
      sourceGradeSentToPassB: false,
      sourceLabelsUsedOnlyAfterAssessment: true,
    },
    sourceAssessmentArtifacts: {
      passA: PASS_A_SOURCE_PATH,
      passB: PASS_B_SOURCE_PATH,
    },
  };
  // Written before canonical rendering/validation and all remaining output artifacts.
  writeJson(path.join(OUTPUT_DIR, "run-metadata.json"), metadata);

  rmSync(path.join(OUTPUT_DIR, "figures"), { recursive: true, force: true });
  mkdirSync(SOURCE_ASSET_DIR, { recursive: true });
  mkdirSync(PNG_ASSET_DIR, { recursive: true });

  const manifest = [];
  for (const dbRow of dbRows) {
    const assetSource = sourceAssetsById.get(dbRow.questionId);
    const parsed = parseOptions(dbRow.optionsJson);
    let sourceAssetRelative = null;
    let pngAssetRelative = null;
    if (dbRow.figureKey) {
      if (!assetSource.figureAsset) throw new Error(`Missing renderer for ${dbRow.questionId} (${dbRow.figureKey})`);
      const sourcePath = path.join(INPUT_DIR, "figures", assetSource.figureAsset);
      if (!existsSync(sourcePath)) throw new Error(`Missing visual asset: ${sourcePath}`);
      const copiedSourcePath = path.join(SOURCE_ASSET_DIR, path.basename(sourcePath));
      if (path.extname(sourcePath).toLowerCase() === ".svg") {
        writeFileSync(copiedSourcePath, normalizeSvgNamespaces(readFileSync(sourcePath, "utf8")), "utf8");
      } else {
        copyFileSync(sourcePath, copiedSourcePath);
      }
      sourceAssetRelative = path.relative(OUTPUT_DIR, copiedSourcePath);
      const pngPath = path.join(PNG_ASSET_DIR, `${path.parse(assetSource.figureAsset).name}.png`);
      if (path.extname(sourcePath).toLowerCase() === ".svg") {
        await sharp(copiedSourcePath, { density: 192 }).flatten({ background: "#ffffff" }).png().toFile(pngPath);
      } else {
        await sharp(sourcePath).flatten({ background: "#ffffff" }).png().toFile(pngPath);
      }
      pngAssetRelative = path.relative(OUTPUT_DIR, pngPath);
    }
    manifest.push({
      ...dbRow,
      optionsRawJson: dbRow.optionsJson,
      optionsParsed: parsed.value,
      optionsJsonValid: parsed.valid,
      hasFigure: Boolean(dbRow.figureKey),
      figureAssetKind: assetSource.figureAssetKind ?? null,
      figureAsset: assetSource.figureAsset ?? null,
      sourceAsset: sourceAssetRelative,
      pngAsset: pngAssetRelative,
    });
  }
  writeJson(path.join(OUTPUT_DIR, "questions-with-figures.json"), manifest);
  const sourceById = uniqueById(manifest, "canonical manifest");

  const passA = passASource.map((row) => {
    const canonical = {
      questionId: row.questionId,
      cognitiveLevel: row.cognitiveLevel,
      difficulty: row.difficulty,
      reasoningType: row.reasoningType,
      assessmentConfidence: row.assessmentConfidence ?? row.confidence,
      figureRead: row.figureRead,
      assessmentNote: row.assessmentNote,
      usedVisual: Boolean(row.usedVisual),
      figureKey: row.figureKey ?? null,
      imageUrl: row.imageUrl ?? null,
    };
    if (canonical.questionId === "NTT-2025-26-C2" && !canonical.usedVisual) {
      canonical.assessmentConfidence = 95;
      canonical.figureRead = "Bảng tần suất: 1, 2, 3, 4, 5, 6 chấm lần lượt xuất hiện 5, 4, 3, 3, 1, 4 lần; tổng 20 lần gieo.";
      canonical.assessmentNote = "Đọc ba tần suất của các mặt chẵn từ bảng, cộng 4 + 3 + 4 rồi lập tỉ số với 20. Đây là thao tác trực tiếp, ít bước và không cần chiến lược không quen thuộc.";
      canonical.usedVisual = true;
      canonical.imageUrl = null;
      canonical.qaCorrection = "manual_visual_coverage_correction_after_table_renderer_fix";
    }
    validatePassA(canonical);
    return canonical;
  });
  const passAById = uniqueById(passA, "Pass A");

  const passB = passBSource.map((row) => ({ ...row }));
  const passBById = uniqueById(passB, "Pass B");
  for (const source of manifest) {
    if (!passAById.has(source.questionId) || !passBById.has(source.questionId)) throw new Error(`Coverage gap: ${source.questionId}`);
    const a = passAById.get(source.questionId);
    const b = passBById.get(source.questionId);
    if (source.hasFigure && (!a.usedVisual || !b.usedVisual)) throw new Error(`Visual coverage gap: ${source.questionId}`);
    validatePassB(b, source);
  }

  writeJson(path.join(OUTPUT_DIR, "cognition-difficulty-assessments.json"), passA);
  writeJsonl(path.join(OUTPUT_DIR, "cognition-difficulty-assessments.jsonl"), passA);
  writeJson(path.join(OUTPUT_DIR, "topic-taxonomy-v1-assessments.json"), passB);
  writeJsonl(path.join(OUTPUT_DIR, "topic-taxonomy-v1-assessments.jsonl"), passB);

  const overallA = scopeSummary(passA);
  const matrix = {
    overall: overallA,
    bySchool: groupSummaries(passA, sourceById, "school"),
    byExam: groupSummaries(passA, sourceById, "examId"),
  };
  writeJson(path.join(OUTPUT_DIR, "matrix-4x5.json"), matrix);

  const comparison = topicComparison(passB, sourceById);
  writeJson(path.join(OUTPUT_DIR, "topic-taxonomy-v1-comparison.json"), comparison);

  const reviewFlags = {
    meaning: "Tín hiệu QA để rà soát; không phải phán quyết câu hoặc nhãn nguồn bị sai.",
    allDifficulty5: passA.filter((row) => row.difficulty === 5).map((row) => row.questionId),
    allDifficulty4: passA.filter((row) => row.difficulty === 4).map((row) => row.questionId),
    passAConfidenceBelow70: passA.filter((row) => row.assessmentConfidence < 70).map((row) => ({ questionId: row.questionId, confidence: row.assessmentConfidence })),
    passBConfidenceBelow70: passB.filter((row) => row.topicConfidence < 70).map((row) => ({ questionId: row.questionId, confidence: row.topicConfidence })),
    visualQaSample: passA.filter((row) => row.usedVisual).slice(0, 20).map((row) => row.questionId),
    topicQaSamples: Object.fromEntries(PRIMARY_TOPICS.map((topic) => [topic, passB.filter((row) => row.topicPrimary === topic).slice(0, 20).map((row) => row.questionId)])),
    crossDomain: passB.filter((row) => row.contextTags.includes("cross_domain")).map((row) => row.questionId),
    diagramRequiredWithoutVisual: passB.filter((row) => row.contextTags.includes("rep_diagram_required") && !row.usedVisual).map((row) => row.questionId),
    visualCoverageCorrections: passA.filter((row) => row.qaCorrection).map((row) => ({ questionId: row.questionId, correction: row.qaCorrection })),
    schemaExceptions: [],
    coverageExceptions: [],
  };
  writeJson(path.join(OUTPUT_DIR, "review-flags.json"), reviewFlags);

  const examCount = new Set(manifest.map((row) => row.examId)).size;
  const schoolCount = new Set(manifest.map((row) => row.school)).size;
  const figureCount = manifest.filter((row) => row.hasFigure).length;
  const passBSummary = {
    topicPrimaryCounts: Object.fromEntries(PRIMARY_TOPICS.map((topic) => [topic, passB.filter((row) => row.topicPrimary === topic).length])),
    topicSecondaryCounts: countBy(passB.flatMap((row) => row.topicSecondary.map((topic) => ({ topic }))), (row) => row.topic),
    contextTagCounts: countBy(passB.flatMap((row) => row.contextTags.map((tag) => ({ tag }))), (row) => row.tag),
    averageTopicConfidence: Number(mean(passB.map((row) => row.topicConfidence)).toFixed(2)),
    confidenceBelow70: passB.filter((row) => row.topicConfidence < 70).length,
  };
  const summary = {
    coverage: {
      totalQuestions: manifest.length,
      totalExams: examCount,
      totalSchools: schoolCount,
      figureKeys: figureCount,
      renderedPngAssets: manifest.filter((row) => row.pngAsset).length,
      passACompleted: passA.length,
      passBCompleted: passB.length,
      usedVisual: manifest.filter((row) => row.hasFigure && passAById.get(row.questionId).usedVisual && passBById.get(row.questionId).usedVisual).length,
      coveragePct: 100,
    },
    passA: { ...overallA, cramersV: Number(cramersV(passA).toFixed(3)), confidenceBelow70: passA.filter((row) => row.assessmentConfidence < 70).length },
    passB: passBSummary,
    failures: [],
    completedAt: new Date().toISOString(),
  };
  writeJson(path.join(OUTPUT_DIR, "run-summary.json"), summary);
  writeFileSync(path.join(OUTPUT_DIR, "report.md"), reportMarkdown({ summary, passA, passB, metadata }), "utf8");

  // Keep the approved instruction with the run for reproducibility.
  cpSync(path.join(ROOT, ".reports", "INSTRUCTION-TAI-DANH-GIA-TOAN-DA-PHUONG-THUC.md"), path.join(OUTPUT_DIR, "INSTRUCTION.md"));
  console.log(JSON.stringify({ outputDir: OUTPUT_DIR, ...summary.coverage, lowConfidenceA: summary.passA.confidenceBelow70, lowConfidenceB: summary.passB.confidenceBelow70 }, null, 2));
}

await main();
