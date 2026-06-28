import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { spawnEnglishTopicSet, TopicSetEmptyError } from "@/lib/spawn-exam";
import { englishTopicById } from "@/lib/subjects";

interface Props {
  searchParams: Promise<{ topic?: string }>;
}

// Clicking an english topic card lands here; we spawn a practice set then
// redirect into the exam runner. Mirrors the math /exam/set-* spawn flow.
export default async function EnglishPracticePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { topic } = await searchParams;
  if (!topic || !englishTopicById(topic)) redirect("/english/topics");

  let newId: string | null = null;
  try {
    newId = await spawnEnglishTopicSet(topic!, session.user.id);
  } catch (e) {
    if (e instanceof TopicSetEmptyError) redirect(`/english/topics?empty=${topic}`);
    throw e;
  }
  redirect(`/exam/${newId}`);
}
