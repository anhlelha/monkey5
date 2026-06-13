import fs from "fs";
import path from "path";

const scratchDir = "/Users/anhlh48/.gemini/antigravity-ide/brain/97d27547-8a7b-44a6-85f6-4041ad9b5fc3/scratch";
const outFile = path.join(scratchDir, "missing_questions_context.txt");

let out = "";

function searchContext(file: string, query: string, nLines = 25) {
  if (!fs.existsSync(file)) {
    out += `File not found: ${file}\n\n`;
    return;
  }
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  
  out += `========================================================================\n`;
  out += `Query: "${query}" in ${file}\n`;
  out += `========================================================================\n`;
  let foundCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(query.toLowerCase())) {
      foundCount++;
      out += `Match ${foundCount} at line ${i + 1}:\n`;
      out += lines.slice(Math.max(0, i - 2), i + nLines).map((l, idx) => `${i - 1 + idx}: ${l}`).join("\n") + "\n\n";
    }
  }
  if (foundCount === 0) {
    out += "Not found.\n\n";
  }
}

const ltvQueries = [
  "Cho ba hình tròn", // 2011-12 Q15
  "khối đồng hình lập phương", // 2013-14 Q5
  "diện tích hình tròn có bán kính 10m", // 2013-14 Q14
  "tăng chiều dài của nó", // 2013-14 Q19
  "khởi hành từ Thanh Hóa", // 2014-15 Q9
  "Xếp các hình lập phương nhỏ cạnh 1cm", // 2014-15 Q19
  "đục một lỗ hình vuông", // 2018-19 Q2
  "x + 3,5", // 2018-19 Q5
  "Biết AB = 0,6", // 2020-21 Q15
  "Một trường bán trú dự trữ gạo", // 2021-22 Q9
  "dài 2 m, rộng", // 2022-23 Q10
  "bánh Pizza có đường kính", // 2022-23 Q13
  "Dùng 7 que diêm", // 2023-24 Q19
  "trung bình cộng bằng 27", // 2024-25 Q6
  "Mua 3m vải", // 2024-25 Q9
  "An trả lời 15 câu hỏi", // 2025-26 Q3
  "bể nước hình hộp" // 2025-26 Q9 (let's check LTV)
];

const nttQueries = [
  "đoàn từ thiện", // 2018-19 Q5
  "Nam gặp biểu tượng", // 2019-20 Q1
  "quạt điện giá 1800000", // 2022-23 Q7
  "hàng đơn vị ít hơn" // 2025-26 Q9
];

out += "=== LTV MISSING QUESTIONS CONTEXT ===\n\n";
ltvQueries.forEach(q => searchContext("ref_exam/LTV_exam_text.txt", q));

out += "\n=== NTT MISSING QUESTIONS CONTEXT ===\n\n";
nttQueries.forEach(q => searchContext("ref_exam/NTT_exam_text.txt", q));

fs.writeFileSync(outFile, out, "utf8");
console.log(`Context written to ${outFile}`);
