import { PrismaClient } from "@prisma/client";
import fs from "fs";
import { MANUAL_OVERRIDES, CG_ENRICHMENT_MAP } from "./exam-overrides";
import { classifyAnswer } from "../lib/grading/classify";

const prisma = new PrismaClient();

function formatSubQuestions(text: string): string {
  if (!text) return text;
  let result = text;
  
  // Match a), b), c), d) followed by an uppercase letter (including Vietnamese ones)
  result = result.replace(/(?<!\n)[ \t]+\b([a-d]\))\s+([A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĐĂƠƯa-zÀ-ỹ])/g, (match, label, firstChar) => {
    if (/^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĐĂƠƯ]/.test(firstChar)) {
      return `\n\n${label} ${firstChar}`;
    }
    return match;
  });
  
  // Match a., b. followed by an uppercase letter
  result = result.replace(/(?<!\n)[ \t]+\b([a-b]\.)\s+([A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĐĂƠƯa-zÀ-ỹ])/g, (match, label, firstChar) => {
    if (/^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĐĂƠƯ]/.test(firstChar)) {
      return `\n\n${label} ${firstChar}`;
    }
    return match;
  });

  result = result.replace(/\n{3,}/g, "\n\n");
  return result;
}

// Helper to format math equations inside stems and explanations using LaTeX delimiters
function formatMathText(text: string): string {
  if (!text) return text;

  // If the text already contains LaTeX math delimiters ($...$), treat it as
  // pre-formatted (source of truth) and skip auto-wrapping. The auto-wrap rules
  // below cannot reliably tell whether a substring is already inside a math
  // block, so they would insert spurious $ markers (mangling the LaTeX).
  if (text.includes("$")) {
    return formatSubQuestions(text).replace(/[ \t]+/g, " ");
  }

  text = formatSubQuestions(text);

  // Normalize double spaces (preserving newlines)
  text = text.replace(/[ \t]+/g, " ");

  // 1. Subscripts like S_ABC or V_ABCD
  text = text.replace(/\b([SV])_([A-Z]{2,})\b/g, "$$$1_{$2}$");
  
  // 2. Fractions like 1/2, 3/14 (excluding dates like 1/6)
  text = text.replace(/(?<!ngày\s+|tháng\s+)\b(\d+)\/(\d+)\b/gi, "$$\\frac{$1}{$2}$");

  // 3. Ratio like 1:20000 or 4:7 (digits only)
  text = text.replace(/(?<!\$)\b(\d+)\s*:\s*(\d+)\b(?!\$)/g, "$$$1:$2$$");

  // 4. Standalone percentages like 20% or 12,5% (only if not already wrapped in $)
  text = text.replace(/(?<!\$)\b(\d+(?:[.,]\d+)?)\s*%(?!\$)/g, "$$$1\\%$$");

  // 5. Match math equations/expressions (operators: +, -, ×, ÷, =, <, >)
  const equationRegex = /\b[a-zA-Z\d]+(?:[.,][a-zA-Z\d]+)?(?:\s*[+\-×÷=<>\s]*[+\-×÷=<>]\s*[a-zA-Z\d]+(?:[.,][a-zA-Z\d]+)?)+\b/gi;
  
  text = text.replace(equationRegex, (match) => {
    if (!/[0-9+\-×÷=<>]/g.test(match)) return match;
    if (match.startsWith("$") && match.endsWith("$")) return match;
    
    let formatted = match
      .replace(/\b([A-Z]{2,})\b/g, "\\text{$1}")
      .replace(/\b([xyab])\b/g, "$1");
      
    return `$${formatted}$`;
  });

  // 6. Format math variables in simple contexts:
  text = text.replace(/\b(tìm\s+)([xyab])\b/gi, "$1$$$2$$");

  return text;
}

// Strip known watermarks/artifacts from PDF parsing
const WATERMARK_PATTERNS_SEED = [
  /\s*MathExpress\s*Education\s*/gi,
  /\s*Math\s*Express\s*Education\s*/gi,
  /\s*Toán\s*Tuổi\s*Thơ\s*/gi,
  /\s*violympic\s*/gi,
  // Header/footer bleed from PDFs of next exam pages getting captured
  /ĐỀ\s*KIỂM\s*TRA\s*TUYỂN\s*SINH\s*VÀO\s*LỚP\s*\d+\b.*$/gi,
  /ĐỀ\s*THI\s*TUYỂN\s*SINH\s*(?:VÀO\s*)?LỚP\s*\d+\b.*$/gi,
  /TRƯỜNG\s*THCS\s*&?\s*THPT\s*[A-ZÀ-Ỹ\s]+$/gi,
  /Năm\s*học\s*:\s*\d{4}\s*[-–]\s*\d{4}\s*$/gi,
  /Môn\s*:\s*Toán\s*$/gi,
  /Thời\s*gian\s*làm\s*bài\s*:\s*\d+\s*phút\s*$/gi,
  // Per-question point prefix used in NTT 2024-25 ("(0,5 điểm)", "(0,75 điểm)", "(2 điểm)")
  /^\s*\(\s*\d+(?:[,.]\d+)?\s*điểm\s*\)\s*/i,
];

function stripWatermarks(text: string): string {
  if (!text) return text;
  let result = text;
  for (const pat of WATERMARK_PATTERNS_SEED) {
    result = result.replace(pat, " ");
  }
  // Collapse multiple spaces/tabs, but preserve newlines
  result = result.replace(/[ \t]{2,}/g, " ");
  result = result.replace(/\r\n/g, "\n");
  result = result.replace(/\n{3,}/g, "\n\n");
  return result.trim();
}

async function main() {
  console.log("=== Seeding All Exams ===");

  if (!fs.existsSync("official_exams_metadata.json")) {
    console.error("Error: official_exams_metadata.json does not exist. Please run builder script first.");
    process.exit(1);
  }

  // Load Metadata
  const rawMeta = fs.readFileSync("official_exams_metadata.json", "utf8");
  const meta = JSON.parse(rawMeta);
  const exams = meta.exams || [];

  // Load LTV, TX, NTT Stems
  let smartJson;
  if (fs.existsSync("ref_exam/smart_parsed_exams.json")) {
    const rawSmartData = fs.readFileSync("ref_exam/smart_parsed_exams.json", "utf8");
    smartJson = JSON.parse(rawSmartData);
  } else {
    const rawSmartData = fs.readFileSync("/Users/anhlh48/.gemini/antigravity-ide/brain/97d27547-8a7b-44a6-85f6-4041ad9b5fc3/scratch/smart_parsed_exams.json", "utf8");
    smartJson = JSON.parse(rawSmartData);
  }

  // Load CG Stems
  const rawCgData = fs.readFileSync("ref_exam/CG_parsed_questions.json", "utf8");
  const cgJson = JSON.parse(rawCgData);

  const mcqRegex = /^(.*?)\s+A\.\s*(.*?)\s+B\.\s*(.*?)\s+C\.\s*(.*?)\s+D\.\s*(.*)$/;

  for (const examData of exams) {
    console.log(`→ Seeding Exam: ${examData.id} (${examData.year}) - ${examData.questions.length} questions`);

    // 1. Upsert Exam record
    await prisma.exam.upsert({
      where: { id: examData.id },
      create: {
        id: examData.id,
        school: examData.school,
        kind: examData.kind,
        year: examData.year,
        title: examData.title,
        intro: examData.intro,
        minutes: examData.minutes,
        qcount: examData.questions.length,
        generated: false,
        note: examData.note,
        sections: JSON.stringify(examData.sections)
      },
      update: {
        school: examData.school,
        kind: examData.kind,
        year: examData.year,
        title: examData.title,
        intro: examData.intro,
        minutes: examData.minutes,
        qcount: examData.questions.length,
        generated: false,
        note: examData.note,
        sections: JSON.stringify(examData.sections)
      }
    });

    // 2. Clear existing questions for this exam
    await prisma.question.deleteMany({
      where: { examId: examData.id }
    });

    // Determine year mapping keys
    // e.g. "2019-2020" -> "2019-20"
    let shortYear = examData.year;
    if (examData.year.includes("-")) {
      const parts = examData.year.split("-");
      if (parts[0].length === 4 && parts[1].length === 4) {
        shortYear = parts[0].trim() + "-" + parts[1].trim().substring(2);
      }
    }

    // 3. Insert Question records
    for (const q of examData.questions) {
      let stem = "";
      let optionsJson = "[]";
      let modelAnswer = null;
      let qType = q.type;

      // Merge text data dynamically
      if (examData.school === "cg") {
        // Load from CG parsed questions file
        const parsedYear = cgJson[shortYear] || [];
        const parsedQ = parsedYear.find((pq: any) => pq.id === q.id);
        if (parsedQ) {
          stem = parsedQ.stem || "";
          modelAnswer = parsedQ.explanation || null;
          if (parsedQ.options && parsedQ.options.length > 0) {
            optionsJson = JSON.stringify(parsedQ.options);
          }
        }
      } else {
        // Load from LTV, TX, NTT parsed questions file
        const schoolCode = examData.school.toUpperCase();
        const parsedSchool = smartJson[schoolCode] || {};
        const parsedYear = parsedSchool[shortYear] || [];
        
        // Match by exact id first; the parsed JSON re-numbers essays from 1
        // (per-section), but metadata `num` is sequential across the whole exam,
        // so the previous `pq.num === q.num` join silently dropped essay stems.
        const qCodeNum = q.num;
        let parsedQ = parsedYear.find((pq: any) => pq.id === q.id);
        if (!parsedQ) {
          parsedQ = parsedYear.find((pq: any) => pq.num === qCodeNum && pq.id.includes(q.id.split("-").pop()[0]));
        }
        if (!parsedQ && schoolCode === "TX" && shortYear === "2020-21") {
          parsedQ = parsedYear.find((pq: any) => pq.num === qCodeNum);
        }

        if (parsedQ) {
          stem = parsedQ.stem || "";
          modelAnswer = parsedQ.explanation || null;
          if (parsedQ.options && parsedQ.options.length > 0) {
            optionsJson = JSON.stringify(parsedQ.options);
          }
        }
      }

      // Handle MCQ auto-splitting if options are empty
      if (qType === "mcq" && optionsJson === "[]") {
        const match = stem.match(mcqRegex);
        if (match) {
          stem = match[1].trim();
          optionsJson = JSON.stringify([
            { id: "A", text: match[2].trim() },
            { id: "B", text: match[3].trim() },
            { id: "C", text: match[4].trim() },
            { id: "D", text: match[5].trim() }
          ]);
        } else {
          qType = "fill";
        }
      }

      // Clean watermarks
      stem = stripWatermarks(stem);
      if (modelAnswer) modelAnswer = stripWatermarks(modelAnswer);

      // Format LaTeX
      stem = formatMathText(stem);
      if (modelAnswer) modelAnswer = formatMathText(modelAnswer);

      // Apply overrides AFTER auto-cleaning. Override values are pre-formatted
      // (already wrapped in $...$ where needed) and treated as final source of truth.
      const override = CG_ENRICHMENT_MAP[q.id] || MANUAL_OVERRIDES[q.id] || {};
      if (override.stem) {
        stem = override.stem;
      }
      if (override.modelAnswer) {
        modelAnswer = override.modelAnswer;
      }
      // Override options take precedence — handles MCQ from schools without a
      // parsed-JSON source (e.g. NSHN) and any non-standard option counts.
      if (override.options && override.options.length > 0) {
        optionsJson = JSON.stringify(override.options);
        // If the auto-split converted qType to "fill" earlier (because the
        // parsed stem was empty), restore the original mcq type now.
        qType = q.type;
      }

      const isEssay = qType === "essay";

      // Auto-classify fill answers into an AnswerSchema so gradeAnswer can use
      // the numeric / numeric_set / labeled matchers instead of strict string
      // equality. Skip MCQ (already letter-equality) and essay (graded by rubric).
      // Only attach when confidence is high/medium and schema is not "exact"
      // — text answers like "Siêu thị" stay as plain string equality.
      let answerSchemaJson: string | null = null;
      if (qType === "fill" && q.correct) {
        const cls = classifyAnswer(q.correct);
        if (cls.confidence !== "low" && cls.schema.kind !== "exact") {
          answerSchemaJson = JSON.stringify(cls.schema);
        }
      }

      await prisma.question.create({
        data: {
          id: q.id,
          examId: examData.id,
          num: q.num,
          type: qType,
          topic: q.topic,
          grade: q.grade,
          points: q.points,
          stem,
          unit: q.unit,
          placeholder: isEssay ? "Trình bày lời giải..." : "Đáp số...",
          correct: q.correct,
          options: optionsJson,
          modelAnswer,
          figure: q.figure,
          answerSchema: answerSchemaJson,
        }
      });
    }
  }

  console.log("\n✓ Database seeding from metadata completed successfully!");

  // Refresh school profiles so anything driven by them (mức phù hợp / readiness,
  // school-vs-school difficulty spread, library cards) reflects the new exams.
  // Without this, importing a new school or adding exams to an existing school
  // leaves SchoolProfile stale and readiness silently falls back to 50.
  try {
    const { ensureSchoolProfilesFresh } = await import("../lib/school-profiles");
    const result = await ensureSchoolProfilesFresh();
    if (result.rebuilt.length > 0 || result.created.length > 0) {
      console.log(`✓ School profiles refreshed — created: [${result.created.join(", ")}], rebuilt: [${result.rebuilt.join(", ")}]`);
    } else {
      console.log("✓ School profiles already up-to-date.");
    }
  } catch (e) {
    console.warn("⚠ Failed to refresh school profiles (non-fatal):", e);
  }
}

main()
  .catch((e) => {
    console.error("Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
