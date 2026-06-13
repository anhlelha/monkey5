import fs from 'fs';

const data = JSON.parse(fs.readFileSync('de_thi_lop6_4truong.json', 'utf8'));

console.log('Top-level keys:', Object.keys(data));
console.log('\nLookup keys:', Object.keys(data.lookups || {}));

if (data.lookups) {
  for (const [key, val] of Object.entries(data.lookups)) {
    if (Array.isArray(val)) {
      console.log(`Lookup - ${key}: Array of length ${val.length}`);
      if (val.length > 0) {
        console.log(`  Sample item keys:`, Object.keys(val[0]));
      }
    } else {
      console.log(`Lookup - ${key}:`, typeof val);
    }
  }
}

// Search for strings that look like "đáp số" or "đáp án" in metadata or lookups
const searchInObj = (obj: any, parentKey = ''): string[] => {
  let results: string[] = [];
  if (!obj) return results;
  
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const fullKey = parentKey ? `${parentKey}.${k}` : k;
      if (typeof v === 'string') {
        if (v.toLowerCase().includes('đáp án') || v.toLowerCase().includes('đáp số') || v.toLowerCase().includes('lời giải') || v.toLowerCase().includes('trắc nghiệm')) {
          results.push(`${fullKey}: ${v.substring(0, 100)}`);
        }
      } else {
        results = results.concat(searchInObj(v, fullKey));
      }
    }
  }
  return results;
};

console.log('\nSearching for answers related text in lookups and metadata:');
const matches = searchInObj({ metadata: data.metadata, lookups: data.lookups });
console.log(matches.slice(0, 20));

// Check if any problem has answer related substrings in content_full
const cgProblems = (data.problems || []).filter((p: any) => p.school_code === 'CG');
const problemsWithAnswers = cgProblems.filter((p: any) => {
  const content = (p.content_full || '').toLowerCase();
  return content.includes('đáp án') || content.includes('đáp số') || content.includes('kết quả');
});
console.log('\nCG Problems containing "đáp án/đáp số/kết quả" in content_full:', problemsWithAnswers.length);
if (problemsWithAnswers.length > 0) {
  console.log('Sample:', problemsWithAnswers[0].id, problemsWithAnswers[0].content_full);
}
