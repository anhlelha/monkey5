import fs from "fs";

const content = fs.readFileSync("ref_exam/LTV_exam_text.txt", "utf8");
const lines = content.split("\n");

console.log("=== Searching LTV 2024-25 Q20 ===");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("Câu 20") && i > 5100) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
    console.log(lines.slice(i, i + 35).map((l, idx) => `  ${i + 1 + idx}: ${l}`).join("\n"));
  }
}
