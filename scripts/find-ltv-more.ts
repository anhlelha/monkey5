import fs from "fs";

function searchFuzzy(file: string, term: string) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  console.log(`\n=== SEARCHING "${term}" in ${file} ===`);
  let found = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(term.toLowerCase())) {
      found++;
      console.log(`Line ${i + 1}: ${lines[i]}`);
      // print 5 lines before and 15 lines after
      const start = Math.max(0, i - 4);
      const end = Math.min(lines.length, i + 15);
      console.log(lines.slice(start, end).map((l, idx) => `  ${start + 1 + idx}: ${l}`).join("\n"));
      if (found >= 3) break; // limit results
    }
  }
  if (found === 0) console.log("No matches found.");
}

searchFuzzy("ref_exam/LTV_exam_text.txt", "khối gỗ");
searchFuzzy("ref_exam/LTV_exam_text.txt", "6,72");
searchFuzzy("ref_exam/LTV_exam_text.txt", "tô đậm");
searchFuzzy("ref_exam/NTT_exam_text.txt", "giao thông");
searchFuzzy("ref_exam/NTT_exam_text.txt", "biểu tượng");
