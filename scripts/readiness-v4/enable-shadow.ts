import { prisma } from "../../lib/prisma";
import { setReadinessV4Flags } from "../../lib/readiness-v4/feature-flags";

async function main(): Promise<void> {
  const flags = await setReadinessV4Flags({
    computeEnabled: true,
    shadowEnabled: true,
    readEnabled: false,
    persistLegacyEnabled: true,
  });
  console.log(JSON.stringify(flags, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
