import fs from "fs";

const data = JSON.parse(fs.readFileSync("de_thi_lop6_4truong.json", "utf8"));
const problems = data.problems || [];

console.log("Total problems:", problems.length);

const schools: Record<string, Record<string, any[]>> = {};

problems.forEach((p: any) => {
  const s = p.school_code || "UNKNOWN";
  if (!schools[s]) {
    schools[s] = {};
  }
  const y = p.year || "UNKNOWN";
  if (!schools[s][y]) {
    schools[s][y] = [];
  }
  schools[s][y].push(p);
});

for (const [school, years] of Object.entries(schools)) {
  console.log(`\nSchool: ${school}`);
  let total = 0;
  Object.keys(years).sort().forEach(year => {
    const list = years[year];
    total += list.length;
    console.log(`  Year ${year}: ${list.length} questions`);
  });
  console.log(`  Total for ${school}: ${total} questions`);
}
