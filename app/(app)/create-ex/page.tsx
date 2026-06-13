import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hydrateUser } from "@/lib/user-data";
import { DEFAULT_TOPICS, SCHOOLS } from "@/lib/static";
import { CreateExerciseWizard } from "./CreateExerciseWizard";

interface Props {
  searchParams: Promise<{ topic?: string }>;
}

export default async function CreateExercisePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);
  if (user.role !== "admin") redirect("/home");

  const { topic } = await searchParams;
  const topics = (await prisma.topic.findMany({ orderBy: { position: "asc" } })) ?? [];
  const TOPICS = topics.length > 0 ? topics : [...DEFAULT_TOPICS].map((t, i) => ({ ...t, position: i }));
  const setCounts = await prisma.customSet.groupBy({ by: ["topic"], _count: { _all: true } });
  const countsMap = Object.fromEntries(setCounts.map((r) => [r.topic, r._count._all]));

  return (
    <CreateExerciseWizard
      initialTopic={topic ?? null}
      topics={TOPICS.map((t) => ({
        id: t.id,
        name: t.name,
        short: t.short,
        ico: t.ico,
        color: t.color,
        setCount: countsMap[t.id] ?? 0,
      }))}
      schools={SCHOOLS.map((s) => ({ id: s.id, short: s.short, tone: s.tone }))}
    />
  );
}
