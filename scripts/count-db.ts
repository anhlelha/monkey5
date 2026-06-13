import { prisma } from "../lib/prisma";

async function main() {
  const userCount = await prisma.user.count();
  const examCount = await prisma.exam.count();
  const questionCount = await prisma.question.count();
  const attemptCount = await prisma.attempt.count();
  const customSetCount = await prisma.customSet.count();
  const topicCount = await prisma.topic.count();

  console.log('Database summary:');
  console.log('Users:', userCount);
  console.log('Exams:', examCount);
  console.log('Questions:', questionCount);
  console.log('Attempts:', attemptCount);
  console.log('CustomSets:', customSetCount);
  console.log('Topics:', topicCount);

  if (examCount > 0) {
    const exams = await prisma.exam.findMany({ take: 5 });
    console.log('Sample exams in DB:', JSON.stringify(exams, null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
