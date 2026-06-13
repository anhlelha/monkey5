import fs from "fs";

const data = JSON.parse(fs.readFileSync("/Users/anhlh48/.gemini/antigravity-ide/brain/97d27547-8a7b-44a6-85f6-4041ad9b5fc3/scratch/smart_parsed_exams.json", "utf8"));

for (const [school, exams] of Object.entries(data)) {
  console.log(`\n=== SCHOOL: ${school} ===`);
  let totalQs = 0;
  let missingCorrect = 0;
  
  for (const [year, qs] of Object.entries(exams as any)) {
    (qs as any[]).forEach((q: any) => {
      totalQs++;
      if (!q.correct) {
        missingCorrect++;
        console.log(`  [${year}] Q${q.num} (${q.type}): ID=${q.id} - Missing Correct Answer. Stem prefix: "${q.stem.substring(0, 80)}..."`);
      }
    });
  }
  console.log(`Total questions for ${school}: ${totalQs}, Missing correct: ${missingCorrect} (${((totalQs - missingCorrect)/totalQs*100).toFixed(1)}% complete)`);
}
