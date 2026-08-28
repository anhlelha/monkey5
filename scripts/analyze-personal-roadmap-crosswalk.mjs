import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const source = read('.analysis/math-vision-input/questions-with-figures.json');
const taxonomy = read('.analysis/topic-taxonomy-v1/topic-taxonomy-v1-assessments.json');
const crosswalk = read('.analysis/curriculum-crosswalk-v1/curriculum-crosswalk-assessments.json');
const cognitive = read('.reports/du-lieu-tai-danh-gia-toan-da-phuong-thuc.json');

const byId = new Map(source.map((row) => [row.questionId, row]));
const taxById = new Map(taxonomy.map((row) => [row.questionId, row]));
const cogById = new Map(cognitive.map((row) => [row.questionId, row]));
const rows = crosswalk.map((row) => ({
  ...row,
  school: byId.get(row.questionId)?.school,
  topicPrimary: taxById.get(row.questionId)?.topicPrimary,
  difficulty: cogById.get(row.questionId)?.difficulty,
  cognitiveLevel: cogById.get(row.questionId)?.cognitiveLevel,
  usedVisual: Boolean(taxById.get(row.questionId)?.usedVisual),
}));

const groups = {
  jan: ['nshn', 'nshm', 'arc'],
  may: ['ams', 'cg', 'ltv', 'nksp', 'nn', 'ntl', 'ntt', 'tx'],
};

function counter(items, fn) {
  const out = {};
  for (const row of items) {
    const id = fn(row);
    out[id] = (out[id] || 0) + 1;
  }
  return Object.entries(out).map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
}
function table(items) {
  return {
    n: items.length,
    band: counter(items, (x) => x.curriculumBand),
    tier: counter(items, (x) => x.readinessTier),
    action: counter(items, (x) => x.januaryAction),
    strand: counter(items, (x) => x.primaryStrand),
    topicPrimary: counter(items, (x) => x.topicPrimary),
    difficulty: counter(items, (x) => `D${x.difficulty}`),
    cognitiveLevel: counter(items, (x) => x.cognitiveLevel),
    visual: { yes: items.filter((x) => x.usedVisual).length, no: items.filter((x) => !x.usedVisual).length },
  };
}

const janRows = rows.filter((row) => groups.jan.includes(row.school));
const mayRows = rows.filter((row) => groups.may.includes(row.school));
const priorities = {
  janFoundation: janRows.filter((x) => x.readinessTier === 'T0_foundation' && x.januaryAction === 'foundation_practice'),
  janPreteach: janRows.filter((x) => x.readinessTier === 'T2_grade5_not_yet_taught' && x.januaryAction === 'selective_preteach'),
  janExtensionAll: janRows.filter((x) => x.readinessTier === 'T3_selective_extension'),
  mayGrade5: mayRows.filter((x) => x.readinessTier === 'T2_grade5_not_yet_taught'),
  mayExtension: mayRows.filter((x) => x.readinessTier === 'T3_selective_extension'),
};

const output = {
  generatedAt: new Date().toISOString(),
  total: rows.length,
  groups: { jan: table(janRows), may: table(mayRows) },
  priorities: Object.fromEntries(Object.entries(priorities).map(([key, items]) => [key, table(items)])),
  januaryBySchool: Object.fromEntries(groups.jan.map((school) => [school, table(janRows.filter((x) => x.school === school))])),
};

const destination = path.join(root, '.analysis', 'curriculum-crosswalk-v1', 'personal-roadmap-priorities.json');
fs.writeFileSync(destination, JSON.stringify(output, null, 2), 'utf8');
console.log(JSON.stringify({ destination, january: output.groups.jan, priorities: output.priorities }, null, 2));
