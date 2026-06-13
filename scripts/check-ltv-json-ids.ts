import fs from "fs";

const data = JSON.parse(fs.readFileSync("de_thi_lop6_4truong.json", "utf8"));
const problems = data.problems || [];

const schools = ["TX", "LTV", "NTT"];
schools.forEach(school => {
  console.log(`\n=== Sample IDs for ${school} ===`);
  const list = problems.filter((p: any) => p.school_code === school);
  console.log("Count:", list.length);
  if (list.length > 0) {
    console.log("Sample items (first 5):");
    list.slice(0, 5).forEach((p: any) => {
      console.log(`  id: ${p.id}, question_code: ${p.question_code}, format_code: ${p.format_code}, category: ${p.category_name}`);
    });
  }
});
