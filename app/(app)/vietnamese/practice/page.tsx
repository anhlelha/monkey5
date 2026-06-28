import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { spawnVietnameseTopicSet, TopicSetEmptyError } from "@/lib/spawn-exam";
import { vietnameseTopicById } from "@/lib/subjects";
import { getLevelConfigs } from "@/lib/plan-config";
import { TopBar } from "@/components/TopBar";
import { PracticeLevelChooser, type ChooserLevel } from "@/components/PracticeLevelChooser";

interface Props {
  searchParams: Promise<{ topic?: string; level?: string }>;
}

// Clicking a vietnamese topic card lands here.
// - If ?level= is provided: spawn a practice set and redirect to the exam runner.
// - If ?level= is absent: show the level-chooser grid so the student can pick.
export default async function VietnamesePracticePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { topic, level } = await searchParams;

  const topicObj = topic ? vietnameseTopicById(topic) : null;
  if (!topic || !topicObj) redirect("/vietnamese/topics");

  // ── Level provided → spawn + redirect ──────────────────────────────────────
  if (level) {
    try {
      const newId = await spawnVietnameseTopicSet(topic, level, session.user.id);
      redirect(`/exam/${newId}`);
    } catch (e) {
      if (e instanceof TopicSetEmptyError) redirect(`/vietnamese/topics?empty=${topic}`);
      throw e;
    }
  }

  // ── No level → render chooser ───────────────────────────────────────────────
  const levelCfgs = await getLevelConfigs("vietnamese");

  // Count available questions per grade for this topic in the official bank.
  const qs = await prisma.question.findMany({
    where: {
      active: true,
      topic,
      subject: "vietnamese",
      examId: { not: null },
      exam: { kind: "official", subject: "vietnamese" },
    },
    select: { grade: true },
  });

  const availFor = (grades: string[]) =>
    qs.filter((x) => grades.includes(x.grade ?? "")).length;

  const levels: ChooserLevel[] = levelCfgs.map((cfg) => ({
    level: cfg.level,
    label: cfg.label,
    sub: cfg.sub,
    tone: cfg.tone,
    qcount: cfg.qcount,
    minutes: cfg.minutes,
    available: availFor(cfg.grades),
    href: `/vietnamese/practice?topic=${topic}&level=${cfg.level}`,
  }));

  return (
    <div className="main">
      <TopBar
        crumbs={[
          { label: "Tiếng Việt", href: "/vietnamese" },
          { label: "Luyện chuyên đề", href: "/vietnamese/topics" },
          topicObj.name,
        ]}
      />
      <div className="content">
        <PracticeLevelChooser
          subjectName="Tiếng Việt"
          topicName={topicObj.name}
          levels={levels}
        />
      </div>
    </div>
  );
}
