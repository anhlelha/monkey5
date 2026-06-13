import fs from 'fs';

const data = JSON.parse(fs.readFileSync('de_thi_lop6_4truong.json', 'utf8'));
const problems = data.problems || [];
const cgProblems = problems.filter((p: any) => p.school_code === 'CG');

console.log('--- EVALUATING CẦU GIẤY EXAM DATA ---');
console.log('Total problems found:', cgProblems.length);

const byYear: Record<string, any[]> = {};
cgProblems.forEach((p: any) => {
  if (!byYear[p.year]) {
    byYear[p.year] = [];
  }
  byYear[p.year].push(p);
});

Object.keys(byYear).sort().forEach(year => {
  const list = byYear[year];
  console.log(`\nYear: ${year} (${list.length} questions)`);
  
  // Sort by question_code or id to see sequencing
  list.sort((a, b) => a.id.localeCompare(b.id));
  
  const codes = list.map(p => `${p.question_code} (${p.format_code}, ${p.grade_code}, Topic: ${p.category_name})`);
  console.log('Questions:', codes.join(' | '));
  
  // Check if content_full is missing for any
  const missingContent = list.filter(p => !p.content_full);
  if (missingContent.length > 0) {
    console.log(`  WARNING: Missing content_full for ${missingContent.length} questions:`, missingContent.map(p => p.id));
  } else {
    console.log('  All questions have full content.');
  }
});
