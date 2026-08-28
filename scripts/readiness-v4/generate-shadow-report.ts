import fs from "node:fs";
import path from "node:path";
import { prisma } from "../../lib/prisma";
import { getShadowMathPolicy } from "../../lib/readiness-v4/policy-repository";
import { buildShadowComparison } from "../../lib/readiness-v4/simulator-service";

async function main(): Promise<void> {
  const { row } = await getShadowMathPolicy();
  const report = await buildShadowComparison(row.id);
  const output = path.resolve(process.cwd(), ".reports/readiness-v4-shadow-comparison.json");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ output, ...report.summary }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
