export type ActivityTopicTaxonomy = "analytical-v4" | "legacy";

export interface ActivityTopicContext {
  topicIds: string[];
  taxonomy: ActivityTopicTaxonomy;
}

export function isPrivateMathPracticeExam(exam: {
  subject: string;
  ownerUserId: string | null;
}): boolean {
  return exam.subject === "math" && Boolean(exam.ownerUserId);
}

export function resolvePrivatePracticeTopicContext(
  questions: Array<{ id: string; topic: string }>,
  effectiveV4: Record<string, { topicPrimary: string }>,
): ActivityTopicContext {
  const hasCompleteV4Coverage = questions.length > 0
    && questions.every((question) => Boolean(effectiveV4[question.id]));
  if (hasCompleteV4Coverage) {
    const v4TopicIds = unique(
      questions.map((question) => effectiveV4[question.id].topicPrimary),
    );
    return { topicIds: v4TopicIds, taxonomy: "analytical-v4" };
  }

  return {
    topicIds: unique(questions.map((question) => question.topic).filter(Boolean)),
    taxonomy: "legacy",
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
