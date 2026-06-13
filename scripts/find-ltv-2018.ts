import fs from "fs";

const content = fs.readFileSync("ref_exam/LTV_exam_text.txt", "utf8");
const lines = content.split("\n");

console.log("=== LTV-2018-19-C2 (lỗ hình vuông) ===");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("lỗ hình vuông") || lines[i].includes("khối gỗ")) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
    console.log(lines.slice(Math.max(0, i - 1), i + 8).map((l, idx) => `  ${Math.max(0, i - 1) + 1 + idx}: ${l}`).join("\n"));
  }
}

console.log("=== LTV-2018-19-C5 (x + 3,5) ===");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("6,72")) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
    console.log(lines.slice(Math.max(0, i - 1), i + 8).map((l, idx) => `  ${Math.max(0, i - 1) + 1 + idx}: ${l}`).join("\n"));
  }
}
