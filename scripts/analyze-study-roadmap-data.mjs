import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const manifest = readJson('.analysis/math-vision-input/questions-with-figures.json');
const cognitive = readJson('.reports/du-lieu-tai-danh-gia-toan-da-phuong-thuc.json');
const taxonomy = readJson('.analysis/topic-taxonomy-v1/topic-taxonomy-v1-assessments.json');

const manifestById = new Map(manifest.map((row) => [row.questionId, row]));
const taxonomyById = new Map(taxonomy.map((row) => [row.questionId, row]));
const rows = cognitive.map((row) => {
  const input = manifestById.get(row.questionId);
  const topic = taxonomyById.get(row.questionId);
  if (!input || !topic) throw new Error(`Missing join for ${row.questionId}`);
  return {
    id: row.questionId,
    school: input.school,
    year: input.year,
    primary: topic.topicPrimary,
    secondary: topic.topicSecondary || [],
    tags: topic.contextTags || [],
    topicConfidence: topic.topicConfidence,
    visual: Boolean(topic.usedVisual),
    cognitive: row.cognitiveLevel,
    difficulty: row.difficulty,
  };
});

const groups = {
  phaseJan: { label: 'Mục tiêu tháng 1/2027: NSHN, NSHM, ARC', schools: ['nshn', 'nshm', 'arc'] },
  phaseMay: { label: 'Mục tiêu tháng 5/2027: các trường còn lại', schools: ['ams', 'cg', 'ltv', 'nksp', 'nn', 'ntl', 'ntt', 'tx'] },
};

const countBy = (items, selector) => {
  const output = {};
  for (const item of items) {
    const value = selector(item);
    if (Array.isArray(value)) for (const entry of value) output[entry] = (output[entry] || 0) + 1;
    else output[value] = (output[value] || 0) + 1;
  }
  return output;
};
const mean = (items, selector) => items.length ? Number((items.reduce((sum, item) => sum + selector(item), 0) / items.length).toFixed(3)) : 0;
const sortCounts = (counts) => Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([id, count]) => ({ id, count }));

function profile(items) {
  const topicStats = {};
  for (const item of items) {
    const stat = topicStats[item.primary] || (topicStats[item.primary] = { count: 0, difficultySum: 0, d3plus: 0, d4plus: 0, cognitive: {}, visual: 0 });
    stat.count += 1;
    stat.difficultySum += item.difficulty;
    if (item.difficulty >= 3) stat.d3plus += 1;
    if (item.difficulty >= 4) stat.d4plus += 1;
    stat.cognitive[item.cognitive] = (stat.cognitive[item.cognitive] || 0) + 1;
    if (item.visual) stat.visual += 1;
  }
  const topics = Object.entries(topicStats).map(([id, stat]) => ({
    id,
    count: stat.count,
    sharePct: Number((stat.count / items.length * 100).toFixed(1)),
    averageDifficulty: Number((stat.difficultySum / stat.count).toFixed(2)),
    d3plus: stat.d3plus,
    d3plusPct: Number((stat.d3plus / stat.count * 100).toFixed(1)),
    d4plus: stat.d4plus,
    visual: stat.visual,
    cognitive: stat.cognitive,
  })).sort((a, b) => b.count - a.count || b.d3plus - a.d3plus);

  return {
    questions: items.length,
    averageDifficulty: mean(items, (item) => item.difficulty),
    d3plus: items.filter((item) => item.difficulty >= 3).length,
    d4plus: items.filter((item) => item.difficulty >= 4).length,
    advanced: items.filter((item) => ['nang_cao', 'chuyen_sau'].includes(item.cognitive)).length,
    visual: items.filter((item) => item.visual).length,
    averageTopicConfidence: mean(items, (item) => item.topicConfidence),
    primaryCounts: sortCounts(countBy(items, (item) => item.primary)),
    secondaryCounts: sortCounts(countBy(items, (item) => item.secondary)),
    contextCounts: sortCounts(countBy(items, (item) => item.tags)),
    difficultyCounts: sortCounts(countBy(items, (item) => `D${item.difficulty}`)),
    cognitiveCounts: sortCounts(countBy(items, (item) => item.cognitive)),
    topics,
  };
}

const output = {
  generatedAt: new Date().toISOString(),
  scope: { questions: rows.length, taxonomyVersion: 'math-topic-taxonomy-v1' },
  groups: Object.fromEntries(Object.entries(groups).map(([id, group]) => {
    const subset = rows.filter((row) => group.schools.includes(row.school));
    return [id, { ...group, profile: profile(subset), bySchool: Object.fromEntries(group.schools.map((school) => [school, profile(subset.filter((row) => row.school === school))])) }];
  })),
  all: profile(rows),
};

const destination = path.join(root, '.analysis/topic-taxonomy-v1/study-roadmap-profile.json');
fs.writeFileSync(destination, JSON.stringify(output, null, 2), 'utf8');
console.log(JSON.stringify({ destination, groups: Object.fromEntries(Object.entries(output.groups).map(([id, group]) => [id, group.profile.questions])) }, null, 2));
