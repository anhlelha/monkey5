import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SCHOOLS } from "@/lib/static";
import { computeMastery } from "@/lib/mastery";
import { getAllSchoolProfiles } from "@/lib/school-profiles";
import { computeAllReadiness } from "@/lib/readiness";
import { EnglishLibraryView } from "./EnglishLibraryView";

export default async function EnglishLibraryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");

  const [exams, attempts, mastery, profiles] = await Promise.all([
    prisma.exam.findMany({
      where: { subject: "english", ownerUserId: null, kind: "official" },
      orderBy: [{ school: "asc" }, { year: "desc" }, { id: "asc" }],
    }),
    prisma.attempt.groupBy({
      by: ["examId"],
      where: { userId: session.user.id, submitted: true },
      _count: { _all: true },
      _max: { score: true },
    }),
    computeMastery(session.user.id, "english"),
    getAllSchoolProfiles("english"),
  ]);

  const attemptMap = new Map(attempts.map((a) => [a.examId, { count: a._count._all, best: a._max.score }]));
  const readiness = computeAllReadiness(mastery.topicMastery, mastery.levelMastery, profiles);

  const enriched = exams.map((e) => {
    const a = attemptMap.get(e.id);
    return {
      id: e.id,
      school: e.school,
      year: e.year,
      title: e.title,
      qcount: e.qcount,
      minutes: e.minutes,
      attempts: a?.count ?? 0,
      bestScore: a?.best ?? null,
    };
  });

  // Only schools that actually have english exams (keeps the chip row honest).
  const schoolIds = new Set(exams.map((e) => e.school));
  const schools = SCHOOLS.filter((s) => schoolIds.has(s.id)).map((s) => ({
    id: s.id,
    short: s.short,
    name: s.name,
    full: s.full,
    color: s.color,
    tone: s.tone,
    minutes: s.minutes,
    style: s.style,
  }));

  const userDone = enriched.filter((e) => e.attempts > 0).length;

  return <EnglishLibraryView exams={enriched} schools={schools} readiness={readiness} userDone={userDone} />;
}
