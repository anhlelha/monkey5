import fs from "fs";
import path from "path";

// Normalizes PUA math symbol characters from Word conversion to standard ones
function normalizeText(text: string): string {
  return text
    .replace(/\uf03d/g, "=")
    .replace(/\uf02d/g, "-")
    .replace(/\uf02b/g, "+")
    .replace(/\uf0b4/g, "×")
    .replace(/\uf0d7/g, "×")
    .replace(/\uf028/g, "(")
    .replace(/\uf029/g, ")")
    .replace(/\uf03c/g, "<")
    .replace(/\uf03e/g, ">")
    .replace(/\uf03a/g, ":")
    .replace(/\uf02f/g, "/")
    .replace(/\uf0b8/g, "÷")
    .replace(/\u00d7/g, "×") // standard multiplication sign
    .replace(/\u00f7/g, "÷") // standard division sign
    .replace(/\u2013/g, "-") // en dash
    .replace(/\u2014/g, "-") // em dash
    .replace(/\u2212/g, "-"); // minus sign
}

function cleanLine(line: string): string {
  return normalizeText(line.trim().replace(/\r/g, ""));
}

interface Question {
  id: string;
  num: number;
  type: "fill" | "mcq" | "essay";
  stem: string;
  options: { id: string; text: string }[];
  correct: string;
  explanation: string;
  unit?: string;
}

// Vietnamese units
const UNITS = ["lần", "tuổi", "m", "cm", "m2", "cm2", "học sinh", "viên", "quả", "đồng", "bộ", "kg", "ha", "chai", "quyển", "xe", "cm3", "dm", "dm3", "thẻ", "trang", "mét vải", "con gà", "con vịt", "bóng", "giờ", "phút", "vòng", "lọ", "thùng"];
const UNITS_RE = new RegExp(`^\\d+(?:[.,]\\d+)?\\s*(?:${UNITS.join("|")})\\.?$`, "i");

function cleanAnswer(ans: string): { correct: string; unit?: string } {
  ans = ans.trim().replace(/\.$/, ""); // remove trailing period
  
  // Extract unit if matches
  const match = ans.match(/^([-+]?\d+(?:[.,]\d+)?)\s*(lần|tuổi|m|cm|m2|cm2|học sinh|viên|quả|đồng|bộ|kg|ha|chai|quyển|xe|cm3|dm|dm3|thẻ|trang|mét vải|con gà|con vịt|bóng|giờ|phút|vòng|lọ|thùng)\.?$/i);
  if (match) {
    return {
      correct: match[1],
      unit: match[2].toLowerCase()
    };
  }
  
  return { correct: ans };
}

function parseSchoolExams(filePath: string, schoolCode: string): Record<string, Question[]> {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n").map(cleanLine);
  
  let solutionsStartLine = 1200;
  if (schoolCode === "TX") solutionsStartLine = 750;
  
  const exams: Record<string, Question[]> = {};
  
  let currentYear = "";
  let blockLines: string[] = [];
  let currentQNum = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect year
    const yearMatch = line.match(/(?:Năm học|NĂM HỌC|Khảo sát|Khảo sát)\s*[:\-–]?\s*(\d{4})\s*[-–]\s*(\d{4})/i);
    const isMcqOption = line.match(/^[A-D]\./i);
    if (yearMatch && i >= solutionsStartLine && line.length < 50 && !isMcqOption) {
      // Process previous question in block
      if (currentQNum > 0 && blockLines.length > 0) {
        if (!exams[currentYear]) exams[currentYear] = [];
        exams[currentYear].push(processBlock(currentYear, currentQNum, blockLines, schoolCode));
      }
      
      currentYear = `${yearMatch[1]}-${yearMatch[2].substring(2)}`;
      currentQNum = 0;
      blockLines = [];
      continue;
    }
    
    if (!currentYear) continue;
    
    const cleanLineForQ = line.replace(/^[-–—_\s]+/, "");
    const qMatch = cleanLineForQ.match(/^(Câu|Bài)\s*(\d+)(?:\s*\([^)]+\))?[\.\:]/i);
    
    if (qMatch) {
      if (currentQNum > 0 && blockLines.length > 0) {
        if (!exams[currentYear]) exams[currentYear] = [];
        exams[currentYear].push(processBlock(currentYear, currentQNum, blockLines, schoolCode));
      }
      currentQNum = parseInt(qMatch[2]);
      blockLines = [cleanLineForQ];
    } else if (currentQNum > 0) {
      blockLines.push(line);
    }
  }
  
  // Process last question
  if (currentQNum > 0 && blockLines.length > 0) {
    if (!exams[currentYear]) exams[currentYear] = [];
    exams[currentYear].push(processBlock(currentYear, currentQNum, blockLines, schoolCode));
  }
  
  return exams;
}

function processBlock(year: string, num: number, blockLines: string[], schoolCode: string): Question {
  const qId = `${schoolCode}-${year}-${blockLines[0].startsWith("Bài") ? "B" : "C"}${num}`;
  
  let stem = "";
  let correct = "";
  let unit: string | undefined = undefined;
  let options: { id: string; text: string }[] = [];
  let type: "fill" | "mcq" | "essay" = "fill";
  
  // 1. Check if it's MCQ from stem lines
  const optionLines: { id: string; text: string; lineIndex: number }[] = [];
  blockLines.forEach((line, idx) => {
    const optMatch = line.match(/^([A-D])\.\s*(.*)/i);
    if (optMatch) {
      optionLines.push({
        id: optMatch[1].toUpperCase(),
        text: optMatch[2].trim(),
        lineIndex: idx
      });
    }
  });
  
  if (optionLines.length >= 2) {
    type = "mcq";
    const uniqueOpts = new Map<string, string>();
    optionLines.forEach(o => {
      uniqueOpts.set(o.id, o.text);
    });
    options = Array.from(uniqueOpts.entries()).map(([id, text]) => ({ id, text })).sort((a, b) => a.id.localeCompare(b.id));
  }
  
  // 2. Find divider indices
  let dividerIdx = -1;
  blockLines.forEach((line, idx) => {
    if (line.match(/^(Lời giải|Hướng dẫn)[\.\:]?$/i)) {
      dividerIdx = idx;
    }
  });
  
  // 3. Find correct answer line
  let answerLine = "";
  let answerLineIndex = -1;
  
  for (let i = 0; i < blockLines.length; i++) {
    const line = blockLines[i];
    const selectMatch = line.match(/^(?:Chọn|Đáp án|Chọn đáp án)\s*([A-D])(?:[\.\s]|$)/i);
    if (selectMatch) {
      correct = selectMatch[1].toUpperCase();
      answerLineIndex = i;
      break;
    }
    
    const dsMatch = line.match(/^Đáp số\s*[:\-–]?\s*(.*)/i);
    if (dsMatch) {
      answerLine = dsMatch[1].trim();
      answerLineIndex = i;
      break;
    }
  }
  
  // If not found yet, check short lines around the divider
  if (!correct && !answerLine) {
    const ANSWER_PATTERNS = [
      /^-?\d+(?:[.,]\d+)?$/,                             // 2019 or 42,0134
      /^-?\d+(?:[.,]\d+)?\s*%$/,                         // 52,5% or 25%
      /^-?\d+\/\d+$/,                                    // 1/32 or 6/11
      /^(?:Thứ\s+[a-zà-ỹ]+)$/i,                          // Thứ năm
      /^(?:Có|Không|Đúng|Sai)$/i,                        // Yes/No
      /^[A-D]$/i,                                        // A, B, C, D
      /^[A-D]\.$/i,                                      // A., B., C., D.
      new RegExp(`^-?\\d+(?:[.,]\\d+)?\\s*(?:${UNITS.join("|")})\\.?$`, "i"), // 4 lần, 5 tuổi, etc.
      /^[xy]\s*=\s*-?\d+(?:[.,]\d+)?$/i,                 // x = 21, y = 1/32
      /^(?:a\s*=\s*\d+,\s*b\s*=\s*\d+.*)$/i               // a = 1, b = 5 hoặc ...
    ];

    if (dividerIdx !== -1) {
      // Check first non-empty line before divider
      let prevIdx = dividerIdx - 1;
      while (prevIdx >= 0 && blockLines[prevIdx].trim() === "") {
        prevIdx--;
      }
      if (prevIdx >= 0) {
        const lineBefore = blockLines[prevIdx].trim();
        if (lineBefore.length < 35 && !lineBefore.includes("Câu ") && !lineBefore.includes("Bài ") && !lineBefore.match(/^[A-D]\./)) {
          const isMatch = ANSWER_PATTERNS.some(p => p.test(lineBefore));
          if (isMatch || lineBefore.length < 15) {
            answerLine = lineBefore;
            answerLineIndex = prevIdx;
          }
        }
      }
      
      // If still not found, check first non-empty line after divider
      if (!answerLine) {
        let nextIdx = dividerIdx + 1;
        while (nextIdx < blockLines.length && blockLines[nextIdx].trim() === "") {
          nextIdx++;
        }
        if (nextIdx < blockLines.length) {
          const lineAfter = blockLines[nextIdx].trim();
          if (lineAfter.length < 35 && !lineAfter.match(/^[A-D]\./)) {
            const isMatch = ANSWER_PATTERNS.some(p => p.test(lineAfter));
            if (isMatch || lineAfter.length < 15) {
              answerLine = lineAfter;
              answerLineIndex = nextIdx;
            }
          }
        }
      }
      
      if (!answerLine) {
        for (let i = 0; i < blockLines.length; i++) {
          const line = blockLines[i];
          if (i !== dividerIdx && line.length > 0 && line.length < 25 && !line.includes("Câu ") && !line.includes("Bài ") && !line.match(/^[A-D]\./) && !line.includes("mathexpress")) {
            const isMatch = ANSWER_PATTERNS.some(p => p.test(line));
            if (isMatch) {
              answerLine = line;
              answerLineIndex = i;
              break;
            }
          }
        }
      }
    } else {
      for (let i = 1; i < blockLines.length; i++) {
        const line = blockLines[i];
        if (line.length > 0 && line.length < 25 && !line.includes("Câu ") && !line.includes("Bài ") && !line.match(/^[A-D]\./)) {
          const isMatch = ANSWER_PATTERNS.some(p => p.test(line));
          if (isMatch) {
            answerLine = line;
            answerLineIndex = i;
            break;
          }
        }
      }
    }
  }
  
  if (!correct && answerLine) {
    const cleaned = cleanAnswer(answerLine);
    correct = cleaned.correct;
    unit = cleaned.unit;
  }
  
  const stemLines: string[] = [];
  const explanationLines: string[] = [];
  
  blockLines.forEach((line, idx) => {
    if (idx === answerLineIndex) return;
    if (idx === dividerIdx) return;
    
    if (line.includes("mathexpress.vn") || line.includes("1900 633551") || line.includes("facebook.com") || line.match(/^\d+$/)) {
      return;
    }
    
    if (dividerIdx !== -1) {
      if (idx < dividerIdx) {
        if (type === "mcq" && line.match(/^[A-D]\./i)) return;
        stemLines.push(line);
      } else {
        explanationLines.push(line);
      }
    } else {
      if (answerLineIndex !== -1) {
        if (idx < answerLineIndex) {
          if (type === "mcq" && line.match(/^[A-D]\./i)) return;
          stemLines.push(line);
        } else {
          explanationLines.push(line);
        }
      } else {
        if (type === "mcq" && line.match(/^[A-D]\./i)) return;
        stemLines.push(line);
      }
    }
  });
  
  let cleanStem = stemLines.join(" ").trim();
  cleanStem = cleanStem.replace(/^(Câu|Bài)\s*\d+(?:\s*\([^)]+\))?[\.\:\s]*/i, "");
  
  const isEssay = blockLines[0].startsWith("Bài");
  if (isEssay) {
    type = "essay";
  }
  
  return {
    id: qId,
    num: num,
    type: type,
    stem: cleanStem,
    options: options,
    correct: correct,
    explanation: explanationLines.join("\n").trim(),
    unit: unit
  };
}

const outputPath = "/Users/anhlh48/.gemini/antigravity-ide/brain/97d27547-8a7b-44a6-85f6-4041ad9b5fc3/scratch/smart_parsed_exams.json";

const schools = [
  { file: "ref_exam/TX_exam_text.txt", code: "TX" },
  { file: "ref_exam/LTV_exam_text.txt", code: "LTV" },
  { file: "ref_exam/NTT_exam_text.txt", code: "NTT" }
];

const allData: Record<string, Record<string, Question[]>> = {};

schools.forEach(s => {
  allData[s.code] = parseSchoolExams(s.file, s.code);
});

fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2), "utf8");
console.log(`Saved smart parsed data to ${outputPath}`);
