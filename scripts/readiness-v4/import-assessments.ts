import fs from "node:fs";
import path from "node:path";
import { prisma } from "../../lib/prisma";
import { questionContentHash, stableHash } from "../../lib/readiness-v4/hashing";
import { MATH_ANALYTICAL_TOPICS } from "../../lib/readiness-v4/analytical-topics";
import { enqueueAssessmentRecompute } from "../../lib/readiness-v4/job-service";
import {
  assertExportedContentUnchanged,
  sameImmutableAssessment,
  validateAssessmentArtifactCoverage,
} from "../../lib/readiness-v4/assessment-artifact-contract";

interface TopicAssessment {
  questionId: string;
  topicPrimary: string;
  topicSecondary: string[];
  topicConfidence: number;
  model: string;
  assessedAt: string;
}

interface DifficultyAssessment {
  questionId: string;
  cognitiveLevel: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  reasoningType: string;
  assessmentConfidence: number;
  model: string;
  assessedAt: string;
}

interface RunMetadata {
  runId: string;
  taxonomyVersion: string;
  model: string;
  modelInputSha256: string;
  totalQuestions: number;
}

interface ManifestQuestion {
  questionId: string;
  questionContentHash?: string;
}

interface ReconciliationReport {
  runId: string;
  taxonomyVersion: string;
  apply: boolean;
  expected: number;
  imported: string[];
  unchanged: string[];
  missing: string[];
  conflicts: Array<{ questionId: string; reason: string }>;
  invalid: Array<{ questionId: string; reason: string }>;
}

const DEFAULT_ARTIFACT = path.resolve(
  process.cwd(),
  ".analysis/math-reassessment-fresh-gpt56sol-20260824T120947Z",
);

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function readJsonIfExists<T>(file: string, fallback: T): T {
  return fs.existsSync(file) ? readJson<T>(file) : fallback;
}

async function main(): Promise<void> {
  const artifact = path.resolve(option("--artifact") ?? DEFAULT_ARTIFACT);
  const apply = process.argv.includes("--apply");
  const approve = process.argv.includes("--approve");
  const supplementalMika = process.argv.includes("--supplemental-mika");
  const skipQa = process.argv.includes("--skip-qa");
  const approvedByUserId = option("--approved-by");
  if (approve && !approvedByUserId) throw new Error("--approve requires --approved-by <internal-user-id>");

  const baseMetadata = readJson<RunMetadata>(path.join(artifact, "run-metadata.json"));
  const topicFile = option("--topic-file") ?? (supplementalMika
    ? "mika-unmatched-topic-taxonomy-v1-assessments.json"
    : "topic-taxonomy-v1-assessments.json");
  const difficultyFile = option("--difficulty-file") ?? (supplementalMika
    ? "mika-unmatched-cognition-difficulty-assessments.json"
    : "cognition-difficulty-assessments.json");
  const firstTopics = readJson<TopicAssessment[]>(path.join(artifact, topicFile));
  const firstDifficulty = readJson<DifficultyAssessment[]>(path.join(artifact, difficultyFile));
  const judgedTopics = supplementalMika || skipQa
    ? []
    : readJsonIfExists<TopicAssessment[]>(path.join(artifact, option("--qa-topic-file") ?? "qa-judge-topic-taxonomy-v1-assessments.json"), []);
  const judgedDifficulty = supplementalMika || skipQa
    ? []
    : readJsonIfExists<DifficultyAssessment[]>(path.join(artifact, option("--qa-difficulty-file") ?? "qa-judge-cognition-difficulty-assessments.json"), []);
  const metadata: RunMetadata = supplementalMika
    ? {
        ...baseMetadata,
        runId: `${baseMetadata.runId}-mika-unmatched`,
        totalQuestions: firstTopics.length,
        modelInputSha256: stableHash(readJson(path.join(artifact, "mika-unmatched-model-input.json"))),
      }
    : baseMetadata;

  validateAssessmentArtifactCoverage(
    supplementalMika
      ? readJson<ManifestQuestion[]>(path.join(artifact, "mika-unmatched-model-input.json")).map((row) => row.questionId)
      : readJsonIfExists<ManifestQuestion[]>(path.join(artifact, "model-input-manifest.json"), []).map((row) => row.questionId),
    firstTopics,
    firstDifficulty,
  );

  // Decision 3A: the reviewed QA judge result replaces first-pass values only
  // for questions selected for QA; every other assessment stays first-pass.
  const topicByQuestion = new Map(firstTopics.map((row) => [row.questionId, row]));
  const difficultyByQuestion = new Map(firstDifficulty.map((row) => [row.questionId, row]));
  for (const row of judgedTopics) topicByQuestion.set(row.questionId, row);
  for (const row of judgedDifficulty) difficultyByQuestion.set(row.questionId, row);

  const questionIds = [...new Set([...topicByQuestion.keys(), ...difficultyByQuestion.keys()])].sort();
  const modelManifest = supplementalMika
    ? readJson<ManifestQuestion[]>(path.join(artifact, "mika-unmatched-model-input.json"))
    : readJsonIfExists<ManifestQuestion[]>(path.join(artifact, "model-input-manifest.json"), []);
  const manifestHashByQuestion = new Map(modelManifest.map((row) => [row.questionId, row.questionContentHash]));
  const allowedTopics = new Set(MATH_ANALYTICAL_TOPICS.map((topic) => topic.id));
  const allowedCognitiveLevels = new Set(["co_ban", "van_dung", "nang_cao", "chuyen_sau"]);
  const allowedReasoningTypes = new Set(["direct", "multi_step", "non_routine", "proof_or_modeling"]);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      subject: true,
      type: true,
      stem: true,
      options: true,
      correct: true,
      answerSchema: true,
      points: true,
      figure: true,
    },
  });
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const existingRows = await prisma.questionAssessment.findMany({
    where: { sourceRunId: metadata.runId, taxonomyVersion: metadata.taxonomyVersion },
  });
  const existingByQuestion = new Map(existingRows.map((row) => [row.questionId, row]));

  const report: ReconciliationReport = {
    runId: metadata.runId,
    taxonomyVersion: metadata.taxonomyVersion,
    apply,
    expected: metadata.totalQuestions,
    imported: [],
    unchanged: [],
    missing: [],
    conflicts: [],
    invalid: [],
  };
  const creates: Array<Parameters<typeof prisma.questionAssessment.create>[0]["data"]> = [];

  for (const questionId of questionIds) {
    const question = questionById.get(questionId);
    const topic = topicByQuestion.get(questionId);
    const difficulty = difficultyByQuestion.get(questionId);
    if (!question) {
      report.missing.push(questionId);
      continue;
    }
    if (!topic || !difficulty) {
      report.invalid.push({ questionId, reason: !topic ? "MISSING_TOPIC" : "MISSING_DIFFICULTY" });
      continue;
    }
    if (question.subject !== "math" || difficulty.difficulty < 1 || difficulty.difficulty > 5) {
      report.invalid.push({ questionId, reason: "INVALID_SUBJECT_OR_DIFFICULTY" });
      continue;
    }
    if (!allowedTopics.has(topic.topicPrimary) || topic.topicSecondary.some((value) => !allowedTopics.has(value))) {
      report.invalid.push({ questionId, reason: "INVALID_TOPIC" });
      continue;
    }
    if (
      !allowedCognitiveLevels.has(difficulty.cognitiveLevel) ||
      !allowedReasoningTypes.has(difficulty.reasoningType) ||
      !Number.isFinite(topic.topicConfidence) || topic.topicConfidence < 0 || topic.topicConfidence > 100 ||
      !Number.isFinite(difficulty.assessmentConfidence) || difficulty.assessmentConfidence < 0 || difficulty.assessmentConfidence > 100
    ) {
      report.invalid.push({ questionId, reason: "INVALID_ASSESSMENT_ENUM_OR_CONFIDENCE" });
      continue;
    }
    const currentContentHash = questionContentHash(question);
    const exportedContentHash = manifestHashByQuestion.get(questionId);
    try {
      assertExportedContentUnchanged(exportedContentHash, currentContentHash);
    } catch {
      report.conflicts.push({ questionId, reason: "CONTENT_HASH_CHANGED_SINCE_EXPORT" });
      continue;
    }
    const candidate = {
      questionId,
      subject: "math",
      taxonomyVersion: metadata.taxonomyVersion,
      topicPrimary: topic.topicPrimary,
      topicSecondaryJson: JSON.stringify(topic.topicSecondary ?? []),
      difficultyBand: difficulty.difficulty,
      cognitiveLevel: difficulty.cognitiveLevel,
      reasoningType: difficulty.reasoningType,
      confidence: Math.min(topic.topicConfidence, difficulty.assessmentConfidence),
      model: metadata.model,
      sourceRunId: metadata.runId,
      questionContentHash: currentContentHash,
      assessedAt: new Date(
        new Date(topic.assessedAt).getTime() >= new Date(difficulty.assessedAt).getTime()
          ? topic.assessedAt
          : difficulty.assessedAt,
      ),
    };
    const existing = existingByQuestion.get(questionId);
    if (existing) {
      if (sameImmutableAssessment(existing, candidate)) report.unchanged.push(questionId);
      else report.conflicts.push({ questionId, reason: "IMMUTABLE_ASSESSMENT_DIFFERS" });
      continue;
    }
    creates.push(candidate);
  }

  if (questionIds.length !== metadata.totalQuestions) {
    report.invalid.push({ questionId: "*", reason: `MANIFEST_COUNT_${questionIds.length}_EXPECTED_${metadata.totalQuestions}` });
  }

  if (apply && report.missing.length === 0 && report.invalid.length === 0 && report.conflicts.length === 0) {
    await prisma.assessmentRun.upsert({
      where: { id: metadata.runId },
      create: {
        id: metadata.runId,
        subject: "math",
        taxonomyVersion: metadata.taxonomyVersion,
        model: metadata.model,
        status: approve ? "approved" : "draft",
        artifactPath: path.relative(process.cwd(), artifact),
        inputHash: metadata.modelInputSha256,
        metadataJson: JSON.stringify(metadata),
        approvedByUserId: approvedByUserId,
        approvedAt: approve ? new Date() : null,
      },
      update: {},
    });
    for (let index = 0; index < creates.length; index += 100) {
      const chunk = creates.slice(index, index + 100);
      await prisma.$transaction(chunk.map((data) => prisma.questionAssessment.create({ data })));
    }
    report.imported.push(...creates.map((row) => row.questionId));
    if (approve && creates.length > 0) {
      await enqueueAssessmentRecompute({
        assessmentRunId: metadata.runId,
        questionIds: creates.map((row) => row.questionId),
        requestedByUserId: approvedByUserId!,
      });
    }
  }

  const reportDir = path.resolve(process.cwd(), ".reports");
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `readiness-v4-assessment-import-${metadata.runId}.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(JSON.stringify({
    reportPath,
    apply,
    expected: report.expected,
    candidates: creates.length,
    imported: report.imported.length,
    unchanged: report.unchanged.length,
    missing: report.missing.length,
    conflicts: report.conflicts.length,
    invalid: report.invalid.length,
  }, null, 2));

  if (report.missing.length || report.conflicts.length || report.invalid.length) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
