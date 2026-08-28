import path from "node:path";

import { prisma } from "../../lib/prisma";
import { exportQuestionBankAssessmentInput } from "../../lib/readiness-v4/question-bank-assessment-export";

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  const output = option("--output-dir");
  const result = await exportQuestionBankAssessmentInput({
    outputDir: output ? path.resolve(output) : undefined,
    model: option("--model"),
  });
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
