import fs from 'fs';

const data = JSON.parse(fs.readFileSync('de_thi_lop6_4truong.json', 'utf8'));
const problems = data.problems || [];
const cgProblems = problems.filter((p: any) => p.school_code === 'CG');

// Sort by year and question_code sequence
cgProblems.sort((a: any, b: any) => {
  if (a.year !== b.year) return a.year.localeCompare(b.year);
  return a.id.localeCompare(b.id);
});

let md = '# Cầu Giấy School Questions\n\n';
cgProblems.forEach((p: any) => {
  md += `## Question: ${p.id}\n`;
  md += `- **Format**: ${p.format_name} (${p.format_code})\n`;
  md += `- **Grade**: ${p.grade_name} (${p.grade_code})\n`;
  md += `- **Category**: ${p.category_name}\n`;
  md += `- **Summary**: ${p.content_summary}\n`;
  md += `- **Content**:\n  > ${p.content_full}\n\n`;
});

fs.writeFileSync('/Users/anhlh48/.gemini/antigravity-ide/brain/97d27547-8a7b-44a6-85f6-4041ad9b5fc3/scratch/cg-questions.md', md, 'utf8');
console.log('Saved 70 questions to scratch/cg-questions.md');
