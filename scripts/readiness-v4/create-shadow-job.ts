import { prisma } from "../../lib/prisma";
import { createShadowBackfillJob } from "../../lib/readiness-v4/job-service";
import { getShadowMathPolicy } from "../../lib/readiness-v4/policy-repository";

async function main(): Promise<void> {
  const requester = await prisma.user.findFirstOrThrow({
    where: { role: "admin", disabled: false },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const { row } = await getShadowMathPolicy();
  console.log(JSON.stringify(await createShadowBackfillJob({
    policyVersionId: row.id,
    requestedByUserId: requester.id,
  }), null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
