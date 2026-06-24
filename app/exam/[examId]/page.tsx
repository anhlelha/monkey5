import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SCHOOLS, MIX_SCHOOL, DEFAULT_TOPICS } from "@/lib/static";
import { spawnReferenceExam, spawnTopicSetExam, TopicSetLimitError, TopicSetEmptyError } from "@/lib/spawn-exam";
import { ExamRunner } from "./ExamRunner";
import type { ExamQuestion } from "@/lib/exam";

interface Props {
  params: Promise<{ examId: string }>;
}

const parseOptions = (raw: string): { id: string; text: string }[] => {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

export default async function ExamPage({ params }: Props) {
  const { examId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const sessionUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { disabled: true, role: true },
  });
  if (sessionUser?.disabled) redirect("/signin?disabled=1");

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: { orderBy: { num: "asc" } } },
  });

  // Library reference CTAs and topic level CTAs ship URLs that don't exist in
  // the DB until clicked — spawn on demand and redirect to the real id.
  if (!exam) {
    if (examId.startsWith("ref-")) {
      const schoolId = examId.split("-")[1] ?? "mix";
      const newId = await spawnReferenceExam(schoolId);
      redirect(`/exam/${newId}`);
    }
    if (examId.startsWith("set-")) {
      const parts = examId.split("-");
      const topicId = parts[1];
      const level = parts[2];
      let sourceFilter: "official" | "supplement" | "all" = "all";

      if (parts[3] === "off") {
        sourceFilter = "official";
      } else if (parts[3] === "sup") {
        sourceFilter = "supplement";
      } else if (parts[3] === "all") {
        sourceFilter = "all";
      }

      if (topicId && level) {
        let newId: string;
        try {
          newId = await spawnTopicSetExam(topicId, level, session.user.id, sourceFilter);
        } catch (e) {
          if (e instanceof TopicSetLimitError) {
            redirect(`/topics/${topicId}?limit=reached`);
          }
          if (e instanceof TopicSetEmptyError) {
            redirect(`/topics/${topicId}?empty=${level.toLowerCase()}`);
          }
          throw e;
        }
        redirect(`/exam/${newId}`);
      }
    }
    notFound();
  }

  // Private remedial sets ("Bài thầy giao") are visible only to their owner —
  // plus admins, who can preview exactly what the student sees.
  if (
    exam.ownerUserId &&
    exam.ownerUserId !== session.user.id &&
    sessionUser?.role !== "admin"
  ) {
    notFound();
  }

  const questions: ExamQuestion[] = exam.questions.map((q) => ({
    id: q.id,
    num: q.num,
    type: q.type as ExamQuestion["type"],
    topic: q.topic,
    grade: q.grade,
    points: q.points,
    stem: q.stem,
    unit: q.unit,
    placeholder: q.placeholder,
    correct: q.correct,
    options: parseOptions(q.options),
    modelAnswer: q.modelAnswer,
    figure: q.figure,
    source: q.source,
    answerSchema: q.answerSchema,
  }));

  let parsedSections = [];
  try {
    parsedSections = JSON.parse(exam.sections || "[]");
  } catch {}

  const school = SCHOOLS.find((s) => s.id === exam.school) ?? MIX_SCHOOL;
  const topics = (await prisma.topic.findMany({ orderBy: { position: "asc" } })) ?? [];
  const TOPICS = (topics.length > 0 ? topics : DEFAULT_TOPICS).map((t) => ({
    id: t.id,
    short: t.short,
    color: t.color,
  }));

  return (
    <ExamRunner
      exam={{
        id: exam.id,
        school: exam.school,
        kind: exam.kind as "official" | "reference" | "mixed",
        title: exam.title ?? `Đề thi · ${exam.year}`,
        year: exam.year,
        intro: exam.intro ?? "Học sinh làm bài và điền đáp án vào ô trả lời.",
        minutes: exam.minutes,
        sections: parsedSections,
      }}
      school={{ short: school.short, tone: school.tone }}
      questions={questions}
      topics={TOPICS}
    />
  );
}
