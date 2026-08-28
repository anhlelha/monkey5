import { prisma } from "../../lib/prisma";
import { runRecomputeUntilIdle } from "../../lib/readiness-v4/job-service";

const POLL_MS = 5_000;

const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function main(): Promise<void> {
  const poll = process.argv.includes("--poll");
  do {
    const processed = await runRecomputeUntilIdle();
    if (!poll || processed > 0) {
      const jobs = await prisma.readinessRecomputeJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          totalItems: true,
          processedItems: true,
          successItems: true,
          failedItems: true,
        },
      });
      console.log(JSON.stringify({ processed, jobs }, null, 2));
    }
    if (poll) await wait(POLL_MS);
  } while (poll);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
