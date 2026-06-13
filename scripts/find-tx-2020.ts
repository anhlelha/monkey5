import fs from "fs";

const content = fs.readFileSync("ref_exam/TX_exam_text.txt", "utf8");
const lines = content.split("\n");

console.log("=== Searching 2020-2021 in TX ===");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("2020 - 2021") || lines[i].includes("2020-2021")) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
    console.log(lines.slice(i, i + 35).map((l, idx) => `  ${i + 1 + idx}: ${l}`).join("\n"));
  }
}
