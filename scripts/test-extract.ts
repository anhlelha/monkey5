import fs from "fs";

// Common Vietnamese units
const UNITS_RE = /(?:lần|tuổi|m|cm|m2|cm2|học sinh|viên|quả|đồng|bộ|kg|ha|chai|quyển|xe|cm3|dm|dm3|thẻ|trang|mét vải|con gà|con vịt|bóng)/i;

// Regex patterns for answers
const ANSWER_PATTERNS = [
  /^-?\d+(?:[.,]\d+)?$/,                             // 2019 or 42,0134
  /^-?\d+(?:[.,]\d+)?\s*%/,,                          // 52,5% or 25%
  /^-?\d+\/\d+$/,                                    // 1/32 or 6/11
  /^(?:Thứ\s+[a-zà-ỹ]+)$/i,                          // Thứ năm
  /^(?:Có|Không|Đúng|Sai)$/i,                        // Yes/No
  /^[A-D]$/i,                                        // A, B, C, D
  /^[A-D]\.$/i,                                      // A., B., C., D.
  new RegExp(`^-?\\d+(?:[.,]\\d+)?\\s*${UNITS_RE.source}`, "i"), // 4 lần, 5 tuổi, 960 bộ, etc.
  /^[xy]\s*=\s*-?\d+(?:[.,]\d+)?$/i,                 // x = 21, y = 1/32
  /^(?:a\s*=\s*\d+,\s*b\s*=\s*\d+.*)$/i               // a = 1, b = 5 hoặc ...
];

function isAnswerCandidate(line: string): boolean {
  line = line.trim();
  if (!line) return false;
  if (line.length > 40) return false;
  if (line.includes("Câu ") || line.includes("Bài ") || line.includes("Lời giải") || line.includes("Hướng dẫn")) return false;
  if (line.includes("mathexpress.vn") || line.includes("1900 633551") || line.includes("facebook.com")) return false;
  if (line.match(/^[A-D]\.\s*(.*)/)) return false; // MCQ options in questions
  
  for (const pattern of ANSWER_PATTERNS) {
    if (pattern && pattern.test(line)) {
      return true;
    }
  }
  
  // A few specific fallback checks for short lines
  if (line.length <= 15) {
    // If it's just 1-3 words/numbers, let's allow it as a candidate
    const words = line.split(/\s+/);
    if (words.length <= 3) {
      return true;
    }
  }
  
  return false;
}

function extractAnswersForSchool(filePath: string, schoolCode: string) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n").map(l => l.trim().replace(/\r/g, ""));
  
  let solutionsStartLine = 1200;
  if (schoolCode === "TX") solutionsStartLine = 750;
  
  console.log(`\n=== Testing ${schoolCode} ===`);
  
  let currentYear = "";
  let currentQNum = 0;
  let qLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Year match
    const yearMatch = line.match(/(?:Năm học|NĂM HỌC|Khảo sát|Khảo sát)\s*[:\-–]?\s*(\d{4})\s*[-–]\s*(\d{4})/i);
    const isMcqOption = line.match(/^[A-D]\./i);
    if (yearMatch && i >= solutionsStartLine && line.length < 50 && !isMcqOption) {
      currentYear = `${yearMatch[1]}-${yearMatch[2].substring(2)}`;
      continue;
    }
    
    if (!currentYear) continue;
    
    const cleanLine = line.replace(/^[-–—_\s]+/, "");
    const qMatch = cleanLine.match(/^(Câu|Bài)\s*(\d+)(?:\s*\([^)]+\))?[\.\:]/i);
    
    if (qMatch) {
      // Print results for the previous question
      if (currentQNum > 0 && qLines.length > 0) {
        processQuestionBlock(currentYear, currentQNum, qLines);
      }
      
      currentQNum = parseInt(qMatch[2]);
      qLines = [cleanLine];
    } else if (currentQNum > 0) {
      qLines.push(line);
    }
  }
  
  // Last question
  if (currentQNum > 0 && qLines.length > 0) {
    processQuestionBlock(currentYear, currentQNum, qLines);
  }
}

function processQuestionBlock(year: string, num: number, blockLines: string[]) {
  // Find candidates
  const candidates: string[] = [];
  let dividerIndex = -1;
  
  for (let i = 0; i < blockLines.length; i++) {
    const line = blockLines[i];
    if (line.match(/^(Lời giải|Hướng dẫn)[\.\:]?$/i)) {
      dividerIndex = i;
    }
    if (isAnswerCandidate(line)) {
      candidates.push(line);
    }
  }
  
  // Decide the best candidate:
  // Usually, the answer line is:
  // 1. Right before Lời giải (if candidates are before dividerIndex)
  // 2. Right after Lời giải (if candidates are after dividerIndex)
  let best = "";
  if (candidates.length > 0) {
    // If there is only one candidate, it's the best
    if (candidates.length === 1) {
      best = candidates[0];
    } else {
      // Find the candidate closest to the divider (index-wise)
      if (dividerIndex !== -1) {
        let minDistance = Infinity;
        for (const c of candidates) {
          const idx = blockLines.indexOf(c);
          const dist = Math.abs(idx - dividerIndex);
          if (dist < minDistance) {
            minDistance = dist;
            best = c;
          }
        }
      } else {
        // Fallback: shortest candidate
        candidates.sort((a, b) => a.length - b.length);
        best = candidates[0];
      }
    }
  }
  
  console.log(`  ${year} Q${num}: Answer = "${best}" (from candidates: [${candidates.join(", ")}])`);
}

extractAnswersForSchool("ref_exam/TX_exam_text.txt", "TX");
extractAnswersForSchool("ref_exam/LTV_exam_text.txt", "LTV");
extractAnswersForSchool("ref_exam/NTT_exam_text.txt", "NTT");
