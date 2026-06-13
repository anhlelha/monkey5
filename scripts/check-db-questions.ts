import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
    take: 5
  });
  console.log("RECENT EXAMS:");
  for (const e of exams) {
    console.log(`- ID: ${e.id}, Title: ${e.title}, Year: ${e.year}`);
    const qs = await prisma.question.findMany({
      where: { examId: e.id },
      orderBy: { num: "asc" }
    });
    for (const q of qs) {
      if (q.num >= 9) {
        console.log(`  Q${q.num} (${q.id}): ${JSON.stringify(q.stem)}`);
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
