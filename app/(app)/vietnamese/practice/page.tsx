import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { spawnVietnameseTopicSet, TopicSetEmptyError } from "@/lib/spawn-exam";
import { vietnameseTopicById } from "@/lib/subjects";

interface Props {
  searchParams: Promise<{ topic?: string }>;
}

// Clicking a vietnamese topic card lands here; we spawn a practice set then
// redirect into the exam runner. Mirrors the english /practice spawn flow.
export default async function VietnamesePracticePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { topic } = await searchParams;
  if (!topic || !vietnameseTopicById(topic)) redirect("/vietnamese/topics");

  let newId: string | null = null;
  try {
    newId = await spawnVietnameseTopicSet(topic!, session.user.id);
  } catch (e) {
    if (e instanceof TopicSetEmptyError) redirect(`/vietnamese/topics?empty=${topic}`);
    throw e;
  }
  redirect(`/exam/${newId}`);
}
