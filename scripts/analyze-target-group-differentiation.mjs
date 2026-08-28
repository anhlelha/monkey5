import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const manifest = read('.analysis/math-vision-input/questions-with-figures.json');
const cognitive = read('.reports/du-lieu-tai-danh-gia-toan-da-phuong-thuc.json');
const taxonomy = read('.analysis/topic-taxonomy-v1/topic-taxonomy-v1-assessments.json');

const sourceById = new Map(manifest.map((x) => [x.questionId, x]));
const taxonomyById = new Map(taxonomy.map((x) => [x.questionId, x]));
const rows = cognitive.map((x) => {
  const source = sourceById.get(x.questionId);
  const topic = taxonomyById.get(x.questionId);
  if (!source || !topic) throw new Error(`Missing join for ${x.questionId}`);
  return { school: source.school, primary: topic.topicPrimary, difficulty: x.difficulty, cognitive: x.cognitiveLevel, visual: Boolean(topic.usedVisual), tags: topic.contextTags || [] };
});

const groups = {
  jan: { label: 'NSHN + NSHM + ARC', schools: ['nshn', 'nshm', 'arc'] },
  may: { label: 'Các trường còn lại', schools: ['ams', 'cg', 'ltv', 'nksp', 'nn', 'ntl', 'ntt', 'tx'] },
};

const count = (items, fn) => {
  const out = {};
  for (const item of items) {
    const values = fn(item);
    for (const value of Array.isArray(values) ? values : [values]) out[value] = (out[value] || 0) + 1;
  }
  return out;
};
const share = (counts, n) => Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, Number((value / n).toFixed(4))]));
const totalVariation = (a, b) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return Number((0.5 * [...keys].reduce((sum, key) => sum + Math.abs((a[key] || 0) - (b[key] || 0)), 0)).toFixed(4));
};
const mean = (items, fn) => Number((items.reduce((sum, item) => sum + fn(item), 0) / items.length).toFixed(3));
const sort = (counts) => Object.entries(counts).map(([id, value]) => ({ id, count: value })).sort((a, b) => b.count - a.count);

function profile(items) {
  const n = items.length;
  const primaryCounts = count(items, (x) => x.primary);
  const difficultyCounts = count(items, (x) => `D${x.difficulty}`);
  const cognitiveCounts = count(items, (x) => x.cognitive);
  const tagCounts = count(items, (x) => x.tags);
  return {
    n,
    averageDifficulty: mean(items, (x) => x.difficulty),
    d3plus: items.filter((x) => x.difficulty >= 3).length,
    d3plusRate: Number((items.filter((x) => x.difficulty >= 3).length / n).toFixed(4)),
    d4plus: items.filter((x) => x.difficulty >= 4).length,
    d4plusRate: Number((items.filter((x) => x.difficulty >= 4).length / n).toFixed(4)),
    advanced: items.filter((x) => ['nang_cao', 'chuyen_sau'].includes(x.cognitive)).length,
    advancedRate: Number((items.filter((x) => ['nang_cao', 'chuyen_sau'].includes(x.cognitive)).length / n).toFixed(4)),
    visual: items.filter((x) => x.visual).length,
    visualRate: Number((items.filter((x) => x.visual).length / n).toFixed(4)),
    diagramRequired: tagCounts.rep_diagram_required || 0,
    diagramRequiredRate: Number(((tagCounts.rep_diagram_required || 0) / n).toFixed(4)),
    primaryCounts: sort(primaryCounts),
    primaryShares: share(primaryCounts, n),
    difficultyCounts: sort(difficultyCounts),
    difficultyShares: share(difficultyCounts, n),
    cognitiveCounts: sort(cognitiveCounts),
    cognitiveShares: share(cognitiveCounts, n),
    tagCounts: sort(tagCounts),
  };
}

const output = { scope: { n: rows.length, groups }, groups: {}, pairwiseSchoolDistances: [] };
for (const [id, group] of Object.entries(groups)) {
  const items = rows.filter((x) => group.schools.includes(x.school));
  const bySchool = Object.fromEntries(group.schools.map((school) => [school, profile(items.filter((x) => x.school === school))]));
  output.groups[id] = { ...group, profile: profile(items), bySchool };
}

const jan = output.groups.jan.profile;
const may = output.groups.may.profile;
output.groupDifferences = {
  primaryTotalVariation: totalVariation(jan.primaryShares, may.primaryShares),
  difficultyTotalVariation: totalVariation(jan.difficultyShares, may.difficultyShares),
  cognitiveTotalVariation: totalVariation(jan.cognitiveShares, may.cognitiveShares),
  primaryOverlapCoefficient: Number((1 - totalVariation(jan.primaryShares, may.primaryShares)).toFixed(4)),
  differenceSummary: {
    d3plusRateDelta: Number((jan.d3plusRate - may.d3plusRate).toFixed(4)),
    d4plusRateDelta: Number((jan.d4plusRate - may.d4plusRate).toFixed(4)),
    advancedRateDelta: Number((jan.advancedRate - may.advancedRate).toFixed(4)),
    diagramRequiredRateDelta: Number((jan.diagramRequiredRate - may.diagramRequiredRate).toFixed(4)),
    visualRateDelta: Number((jan.visualRate - may.visualRate).toFixed(4)),
  },
};

const allSchools = [...groups.jan.schools, ...groups.may.schools];
for (let i = 0; i < allSchools.length; i += 1) {
  for (let j = i + 1; j < allSchools.length; j += 1) {
    const left = output.groups.jan.bySchool[allSchools[i]] || output.groups.may.bySchool[allSchools[i]];
    const right = output.groups.jan.bySchool[allSchools[j]] || output.groups.may.bySchool[allSchools[j]];
    output.pairwiseSchoolDistances.push({
      left: allSchools[i], right: allSchools[j],
      primaryTotalVariation: totalVariation(left.primaryShares, right.primaryShares),
      difficultyTotalVariation: totalVariation(left.difficultyShares, right.difficultyShares),
    });
  }
}
output.pairwiseSchoolDistances.sort((a, b) => b.primaryTotalVariation - a.primaryTotalVariation);

const destination = path.join(root, '.analysis', 'topic-taxonomy-v1', 'target-group-differentiation.json');
fs.writeFileSync(destination, JSON.stringify(output, null, 2), 'utf8');
console.log(JSON.stringify({ destination, groupDifferences: output.groupDifferences, mostDifferentPairs: output.pairwiseSchoolDistances.slice(0, 5) }, null, 2));
