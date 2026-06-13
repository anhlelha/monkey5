import { prisma } from "../lib/prisma";

async function main() {
  const qs = await prisma.question.findMany({
    where: { examId: "cg-2019" },
    orderBy: { num: "asc" },
    select: { id: true, num: true, type: true }
  });
  console.log("cg-2019 questions order:");
  qs.forEach(q => {
    console.log(`  Question ${q.num}: ID = ${q.id}, Type = ${q.type}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
