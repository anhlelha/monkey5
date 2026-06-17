import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TOPICS } from "@/lib/static";
import { getActiveSchools, MIX_SCHOOL } from "@/lib/schools";
import { hydrateUser } from "@/lib/user-data";
import { ResultsView } from "./ResultsView";
import type { ExamQuestion } from "@/lib/exam";

interface Props {
  params: Promise<{ examId: string; attemptId: string }>;
}

const parseOptions = (raw: string): { id: string; text: string }[] => {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const parseAnswers = (raw: string): Record<string, unknown> => {
  try {
    return JSON.parse(raw) ?? {};
  } catch {
    return {};
  }
};

export default async function ResultsPage({ params }: Props) {
  const { examId, attemptId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.examId !== examId) notFound();

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);
  if (user.disabled) redirect("/signin?disabled=1");

  const isOwner = attempt.userId === session.user.id;
  const isAdminViewing = !isOwner && user.role === "admin";
  if (!isOwner && !isAdminViewing) notFound();

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: { orderBy: { num: "asc" } } },
  });
  if (!exam) notFound();

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
    sourceQuestionId: q.sourceQuestionId,
    answerSchema: q.answerSchema,
  }));

  const answers = parseAnswers(attempt.answers);

  // AI essay grades (one row per essay question), keyed by questionId.
  const essayGradeRows = await prisma.essayGrade.findMany({ where: { attemptId } });
  const essayGrades = Object.fromEntries(
    essayGradeRows.map((g) => [
      g.questionId,
      {
        earned: g.earned,
        points: g.points,
        fraction: g.fraction,
        answerCorrect: g.answerCorrect,
        methodScore: g.methodScore,
        guessed: g.guessed,
        feedback: g.feedback,
        provider: g.provider,
        model: g.model,
        status: g.status as "graded" | "error",
      },
    ]),
  );

  const SCHOOLS = await getActiveSchools();
  const school = SCHOOLS.find((s) => s.id === exam.school) ?? MIX_SCHOOL;

  const topics = (await prisma.topic.findMany({ orderBy: { position: "asc" } })) ?? [];
  const TOPICS = (topics.length > 0 ? topics : DEFAULT_TOPICS).map((t) => ({
    id: t.id,
    name: t.name,
    short: t.short,
    color: t.color,
  }));

  // When admin views another user's attempt, show that user's readiness, not the admin's.
  const contextUser = isAdminViewing
    ? (await prisma.user.findUnique({ where: { id: attempt.userId } })) ?? dbUser
    : dbUser;
  const contextHydrated = hydrateUser(contextUser);

  const targetSchools = SCHOOLS.filter((s) => contextHydrated.targets.includes(s.id)).map((s) => ({
    id: s.id,
    short: s.short,
    name: s.name,
    tone: s.tone,
    current: contextHydrated.readiness[s.id] ?? 50,
  }));

  let parsedSections = [];
  try {
    parsedSections = JSON.parse(exam.sections || "[]");
  } catch {}

  return (
    <ResultsView
      examMeta={{
        id: exam.id,
        kind: exam.kind as "official" | "reference" | "mixed",
        title: exam.title ?? `Đề thi · ${exam.year}`,
        year: exam.year,
        minutes: exam.minutes,
        sections: parsedSections,
      }}
      school={{ short: school.short, tone: school.tone }}
      questions={questions}
      answers={answers}
      essayGrades={essayGrades}
      attemptId={attempt.id}
      attempt={{
        earned: attempt.earned,
        total: attempt.total,
        score: attempt.score,
        durationSec: attempt.durationSec,
      }}
      topics={TOPICS}
      targetSchools={targetSchools}
      adminView={
        isAdminViewing
          ? {
              ownerName: contextHydrated.name ?? contextHydrated.email ?? "học sinh",
              userId: attempt.userId,
            }
          : null
      }
    />
  );
}
