"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createTargetedPracticeSet,
  isValidPracticeQuestionCount,
  PracticeV4EmptyError,
  PracticeV4LimitError,
  type PracticeSourceFilter,
} from "@/lib/readiness-v4/practice-service";
import { DIFFICULTY_BANDS, type DifficultyBand } from "@/lib/readiness-v4/types";
import { getMathAnalyticalTopic } from "@/lib/readiness-v4/analytical-topics";

const SOURCES = new Set<PracticeSourceFilter>(["all", "official", "supplement"]);

export async function createPracticeSetAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const topic = String(formData.get("topic") ?? "");
  const band = String(formData.get("band") ?? "") as DifficultyBand;
  const sourceFilter = String(formData.get("sourceFilter") ?? "all") as PracticeSourceFilter;
  const targetSchool = String(formData.get("targetSchool") ?? "") || null;
  const questionCount = Number(formData.get("questionCount"));
  const idempotencyKey = String(formData.get("idempotencyKey") ?? "");
  if (
    !getMathAnalyticalTopic(topic) ||
    !DIFFICULTY_BANDS.includes(band) ||
    !SOURCES.has(sourceFilter) ||
    !isValidPracticeQuestionCount(questionCount)
  ) {
    redirect("/topics?error=invalid-target");
  }
  if (!idempotencyKey || idempotencyKey.length > 120) {
    redirect(`/topics/${topic}?error=invalid-request`);
  }

  let examId: string;
  try {
    const created = await createTargetedPracticeSet({
      userId: session.user.id,
      topic,
      band,
      sourceFilter,
      questionCount,
      idempotencyKey,
      targetSchool,
    });
    examId = created.examId;
  } catch (error) {
    const params = new URLSearchParams({ band });
    if (targetSchool) params.set("school", targetSchool);
    if (error instanceof PracticeV4LimitError) params.set("error", "limit");
    else if (error instanceof PracticeV4EmptyError) params.set("error", "empty");
    else throw error;
    redirect(`/topics/${topic}?${params.toString()}`);
  }

  revalidatePath("/topics");
  revalidatePath(`/topics/${topic}`);
  redirect(`/exam/${examId}`);
}
