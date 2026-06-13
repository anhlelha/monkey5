import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Seeding Supplemental Questions ===");

  const jsonPath = path.join(__dirname, "supplemental-questions.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: ${jsonPath} does not exist. Please generate it first.`);
    process.exit(1);
  }

  // Load supplemental questions
  const rawData = fs.readFileSync(jsonPath, "utf8");
  const questions = JSON.parse(rawData);

  console.log(`Loaded ${questions.length} questions from JSON.`);

  // Clear existing supplemental questions
  console.log("Clearing existing questions starting with ID 'supp-'...");
  const deleteResult = await prisma.question.deleteMany({
    where: {
      id: {
        startsWith: "supp-",
      },
    },
  });
  console.log(`Deleted ${deleteResult.count} existing supplemental questions.`);

  // Insert questions
  console.log("Inserting new questions...");
  let successCount = 0;
  for (const q of questions) {
    await prisma.question.create({
      data: {
        id: q.id,
        examId: null, // Standalone question for practice pool
        num: q.num,
        type: q.type,
        topic: q.topic,
        grade: q.grade,
        points: q.points ?? 1,
        stem: q.stem,
        unit: q.unit || null,
        placeholder: q.placeholder || (q.type === "essay" ? "Trình bày lời giải..." : "Đáp số..."),
        correct: q.correct || null,
        options: JSON.stringify(q.options || []),
        modelAnswer: q.modelAnswer || null,
        figure: q.figure || null,
        source: q.source || "Bổ trợ hệ thống",
        active: q.active ?? true,
      },
    });
    successCount++;
  }

  console.log(`✓ Successfully seeded ${successCount} questions into the DB.`);
}

main()
  .catch((e) => {
    console.error("Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
