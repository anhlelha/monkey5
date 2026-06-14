"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseTopicSetId } from "@/lib/spawn-exam";
import { gradeAnswer } from "@/lib/grading";
import { computeMastery } from "@/lib/mastery";
import { ensureSchoolProfilesFresh, getAllSchoolProfiles } from "@/lib/school-profiles";
import { computeAllReadiness } from "@/lib/readiness";

interface SubmitArgs {
  examId: string;
  answers: Record<string, unknown>;
  durationSec: number;
}

export async function submitExam({ examId, answers, durationSec }: SubmitArgs) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: true },
  });
  if (!exam) throw new Error("Exam not found");

  let earned = 0;
  let total = 0;
  let correctCount = 0;
  for (const q of exam.questions) {
    total += q.points;
    const a = answers[q.id] as
      | string
      | { text?: string; drawings?: string[] }
      | null
      | undefined;
    const result = gradeAnswer(
      {
        type: q.type as "fill" | "mcq" | "essay",
        correct: q.correct,
        answerSchema: q.answerSchema,
      },
      a,
    );
    if (result.correct) {
      earned += q.points;
      correctCount += 1;
    }
  }
  const score = total > 0 ? Math.round((earned / total) * 100) : 0;

  const attempt = await prisma.attempt.create({
    data: {
      userId,
      examId,
      answers: JSON.stringify(answers),
      earned,
      total,
      score,
      durationSec,
      submitted: true,
    },
  });

  // Topic-set spawns also write a TopicSession row (drives "Lịch sử luyện tập"
  // and the user-progress sub-title on the topic detail page).
  const topicSet = parseTopicSetId(examId);
  if (topicSet) {
    await prisma.topicSession.create({
      data: {
        userId,
        topic: topicSet.topic,
        level: topicSet.level,
        qcount: exam.questions.length,
        score: correctCount,
        setId: examId,
      },
    });
    revalidatePath(`/topics/${topicSet.topic}`);
  }

  // Recompute mastery + readiness — hash-based ensureFresh detects new exams.
  try {
    await ensureSchoolProfilesFresh();
    const profiles = await getAllSchoolProfiles();
    const mastery = await computeMastery(userId);
    const readiness = computeAllReadiness(mastery.topicMastery, mastery.levelMastery, profiles);
    await prisma.user.update({
      where: { id: userId },
      data: {
        topicMastery: JSON.stringify(mastery.topicMastery),
        readiness: JSON.stringify(readiness),
      },
    });
  } catch (err) {
    // Don't fail the submission if readiness compute fails — log and continue.
    console.error("[submitExam] readiness recompute failed:", err);
  }

  revalidatePath("/home");
  revalidatePath("/library");

  return { attemptId: attempt.id };
}
