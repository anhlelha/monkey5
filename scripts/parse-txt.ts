import fs from "fs";
import path from "path";

// A utility to clean up text lines
function cleanLine(line: string): string {
  return line.trim().replace(/\r/g, "");
}

interface ParsedQuestion {
  num: number;
  stem: string;
  options: string[];
  correct: string;
  explanation: string;
}

interface ParsedExam {
  year: string;
  questions: ParsedQuestion[];
}

function parseFile(filePath: string, schoolCode: string): ParsedExam[] {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n").map(cleanLine);
  
  const exams: ParsedExam[] = [];
  let currentExam: ParsedExam | null = null;
  let currentQ: ParsedQuestion | null = null;
  
  let solutionsStartLine = 1200;
  if (schoolCode === "TX") {
    solutionsStartLine = 750;
  }
  
  console.log(`Parsing ${schoolCode} from line ${solutionsStartLine}...`);
  
  let state: "stem" | "answer" | "explanation" = "stem";
  let explanationLines: string[] = [];
  let stemLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect exam headers (Năm học: YYYY - YYYY or NĂM HỌC: YYYY - YYYY) on short lines
    const yearMatch = line.match(/(?:Năm học|NĂM HỌC|Khảo sát|Khảo sát)\s*[:\-–]?\s*(\d{4})\s*[-–]\s*(\d{4})/i);
    const isMcqOption = line.match(/^[A-D]\./i);
    if (yearMatch && i >= solutionsStartLine && line.length < 50 && !isMcqOption) {
      const startYear = yearMatch[1];
      const endYear = yearMatch[2];
      const displayYear = `${startYear}-${endYear.substring(2)}`; // e.g. "2019-20"
      
      // Save current question if any
      if (currentQ) {
        if (state === "explanation") {
          currentQ.explanation = explanationLines.join("\n").trim();
        } else if (state === "stem") {
          currentQ.stem = stemLines.join("\n").trim();
        }
        currentExam?.questions.push(currentQ);
        currentQ = null;
      }
      
      // Save current exam
      if (currentExam) {
        exams.push(currentExam);
      }
      
      currentExam = {
        year: displayYear,
        questions: []
      };
      
      console.log(`  Found exam: ${schoolCode} ${displayYear}`);
      state = "stem";
      stemLines = [];
      explanationLines = [];
      continue;
    }
    
    if (!currentExam) continue;
    
    // Clean leading divider dashes/spaces from line before checking for Câu/Bài
    const cleanLineForQ = line.replace(/^[-–—_\s]+/, "");
    // Match Câu/Bài X. or Câu/Bài X (Y điểm).
    const qMatch = cleanLineForQ.match(/^(Câu|Bài)\s*(\d+)(?:\s*\([^)]+\))?[\.\:]/i);
    if (qMatch) {
      const qNum = parseInt(qMatch[2]);
      
      // Save current question
      if (currentQ) {
        if (state === "explanation") {
          currentQ.explanation = explanationLines.join("\n").trim();
        } else if (state === "stem") {
          currentQ.stem = stemLines.join("\n").trim();
        }
        currentExam.questions.push(currentQ);
      }
      
      currentQ = {
        num: qNum,
        stem: cleanLineForQ, // use the cleaned line
        options: [],
        correct: "",
        explanation: ""
      };
      
      state = "stem";
      stemLines = [cleanLineForQ];
      explanationLines = [];
      continue;
    }
    
    if (!currentQ) continue;
    
    // Detect solution header (Lời giải or Hướng dẫn)
    const solMatch = line.match(/^(Lời giải|Hướng dẫn)[\.\:]?$/i);
    if (solMatch) {
      state = "explanation";
      explanationLines = [];
      
      // The stem lines collected so far contain the stem and potentially the correct answer at the end.
      const cleanStemLines = stemLines.filter(l => l !== "");
      if (cleanStemLines.length > 1) {
        const lastLine = cleanStemLines[cleanStemLines.length - 1];
        if (lastLine.length < 50 && !lastLine.match(/^(A|B|C|D)\./) && !lastLine.includes("Câu ") && !lastLine.includes("Bài ")) {
          currentQ.correct = lastLine;
          // Remove from stem
          const idx = stemLines.lastIndexOf(lastLine);
          if (idx !== -1) {
            stemLines.splice(idx, 1);
          }
        }
      }
      
      currentQ.stem = stemLines.join("\n").trim();
      continue;
    }
    
    // Add to appropriate buffer based on state
    if (state === "stem") {
      const optMatch = line.match(/^([A-D])\.\s*(.*)/);
      if (optMatch) {
        currentQ.options.push(line);
      }
      stemLines.push(line);
    } else if (state === "explanation") {
      // Skip advertisement lines
      if (line.includes("mathexpress.vn") || line.includes("1900 633551") || line.match(/^\d+$/)) {
        continue;
      }
      explanationLines.push(line);
    }
  }
  
  // Save last question
  if (currentQ) {
    if (state === "explanation") {
      currentQ.explanation = explanationLines.join("\n").trim();
    } else if (state === "stem") {
      currentQ.stem = stemLines.join("\n").trim();
    }
    currentExam?.questions.push(currentQ);
  }
  if (currentExam) {
    exams.push(currentExam);
  }
  
  return exams;
}

// Run parser on the files
const schools = [
  { file: "ref_exam/TX_exam_text.txt", code: "TX" },
  { file: "ref_exam/LTV_exam_text.txt", code: "LTV" },
  { file: "ref_exam/NTT_exam_text.txt", code: "NTT" }
];

const allData: Record<string, ParsedExam[]> = {};

schools.forEach(s => {
  try {
    allData[s.code] = parseFile(s.file, s.code);
  } catch (e) {
    console.error(`Error parsing ${s.code}:`, e);
  }
});

// Save to scratch JSON
const outputPath = "/Users/anhlh48/.gemini/antigravity-ide/brain/97d27547-8a7b-44a6-85f6-4041ad9b5fc3/scratch/parsed_exams.json";
fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2), "utf8");
console.log(`Saved parsed data to ${outputPath}`);
