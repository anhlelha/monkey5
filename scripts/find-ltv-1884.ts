import fs from "fs";

const content = fs.readFileSync("ref_exam/LTV_exam_text.txt", "utf8");
const lines = content.split("\n");

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("18,84")) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
    console.log(lines.slice(Math.max(0, i - 2), i + 10).map((l, idx) => `  ${Math.max(0, i - 2) + 1 + idx}: ${l}`).join("\n"));
  }
}
