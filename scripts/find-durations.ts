import fs from "fs";

function findDurations(file: string) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  console.log(`\n=== Durations in ${file} ===`);
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes("thời gian làm bài")) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  });
}

findDurations("ref_exam/LTV_exam_text.txt");
findDurations("ref_exam/TX_exam_text.txt");
findDurations("ref_exam/NTT_exam_text.txt");
