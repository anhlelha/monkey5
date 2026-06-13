import fs from 'fs';

const data = JSON.parse(fs.readFileSync('de_thi_lop6_4truong.json', 'utf8'));
const problems = data.problems || [];
const cgMCQ = problems.filter((p: any) => p.school_code === 'CG' && p.format_code === 'TN');

console.log(`Found ${cgMCQ.length} MCQ questions for CG.`);

const mcqRegex = /^(.*?)\s+A\.\s+(.*?)\s+B\.\s+(.*?)\s+C\.\s+(.*?)\s+D\.\s+(.*)$/;

cgMCQ.forEach((p: any) => {
  const stem = p.content_full || '';
  const match = stem.match(mcqRegex);
  if (match) {
    console.log(`\nSUCCESS for ${p.id}:`);
    console.log(`  Clean Stem: ${match[1].trim()}`);
    console.log(`  A: ${match[2].trim()}`);
    console.log(`  B: ${match[3].trim()}`);
    console.log(`  C: ${match[4].trim()}`);
    console.log(`  D: ${match[5].trim()}`);
  } else {
    console.log(`\nFAILED to parse for ${p.id}:`);
    console.log(`  Original: ${stem}`);
  }
});
