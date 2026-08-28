"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseTopicSetId } from "@/lib/spawn-exam";
import { recomputeAttemptScore } from "@/lib/grading/essay-attempt";
import { isLLMGradingEnabled } from "@/lib/llm-settings";
import { computeMastery } from "@/lib/mastery";
import { ensureSchoolProfilesFresh, getAllSchoolProfiles } from "@/lib/school-profiles";
import { computeAllReadiness } from "@/lib/readiness";
import { getReadinessV4Flags } from "@/lib/readiness-v4/feature-flags";

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
  const practiceSet = await prisma.practiceSet.findUnique({
    where: { examId },
    select: { userId: true, analyticalTopic: true },
  });
  if (practiceSet && practiceSet.userId !== userId && session.user.role !== "admin") {
    throw new Error("Unauthorized practice set");
  }

  // Persist the raw attempt first; recomputeAttemptScore reads answers back and
  // sets earned/total/score (rule-based for mcq/fill, AI for essays).
  const attempt = await prisma.attempt.create({
    data: {
      userId,
      examId,
      answers: JSON.stringify(answers),
      durationSec,
      submitted: true,
    },
  });

  // Score the attempt. AI-grade essays only when configured; on any failure,
  // fall back to rule-based scoring so the submission never breaks.
  let correctCount = 0;
  try {
    const gradeEssays = await isLLMGradingEnabled();
    const summary = await recomputeAttemptScore(attempt.id, { gradeEssays });
    correctCount = summary.correctCount;
  } catch (err) {
    console.error("[submitExam] scoring failed, falling back to rule-based:", err);
    const summary = await recomputeAttemptScore(attempt.id, { gradeEssays: false }).catch(
      () => null,
    );
    correctCount = summary?.correctCount ?? 0;
  }

  // Topic-set spawns also write a TopicSession row (drives "Lịch sử luyện tập"
  // and the user-progress sub-title on the topic detail page).
  const topicSet = practiceSet ? null : parseTopicSetId(examId);
  if (practiceSet?.analyticalTopic) {
    revalidatePath(`/topics/${practiceSet.analyticalTopic}`);
    revalidatePath("/topics");
  } else if (topicSet) {
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

  // Legacy JSON remains the rollback source during the migration window. Once
  // its explicit persistence flag is disabled, submissions stop mutating it.
  const readinessFlags = await getReadinessV4Flags().catch(() => ({ persistLegacyEnabled: true }));
  if (readinessFlags.persistLegacyEnabled) {
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
  }

  // Readiness v4 is additive and best-effort. The feature flags default off;
  // when shadow/compute is enabled this only enqueues a DB-backed job and never
  // makes a successful Attempt submission wait for the v4 worker.
  try {
    const { enqueueAttemptRecompute } = await import("@/lib/readiness-v4/job-service");
    await enqueueAttemptRecompute({ userId, attemptId: attempt.id });
  } catch (err) {
    console.error("[submitExam] readiness v4 enqueue failed:", err);
  }

  revalidatePath("/home");
  revalidatePath("/library");
  revalidatePath("/english");
  revalidatePath("/english/library");
  revalidatePath("/english/topics");

  return { attemptId: attempt.id };
}

interface RegradeArgs {
  examId: string;
  attemptId: string;
}

/**
 * Admin-only: re-run AI grading on every essay question of an attempt and
 * refresh its earned/score. Used from the results page's admin view.
 */
export async function regradeEssays({ examId, attemptId }: RegradeArgs) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") throw new Error("Unauthorized");

  const { getResolvedLLMSettings } = await import("@/lib/llm-settings");
  const settings = await getResolvedLLMSettings();
  if (!settings) {
    throw new Error("AI chấm bài chưa được bật hoặc thiếu API key (xem tab 'Setup AI LLMs').");
  }
  const summary = await recomputeAttemptScore(attemptId, { gradeEssays: true, settings });
  revalidatePath(`/exam/${examId}/results/${attemptId}`);
  return { ok: true, ...summary };
}
