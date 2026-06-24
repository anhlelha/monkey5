import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getExamHistory, hydrateUser } from "@/lib/user-data";
import { SCHOOLS, MIX_SCHOOL } from "@/lib/static";
import { LibraryView } from "./LibraryView";
import { effectivePlan, getPlanConfig } from "@/lib/plan-config";

interface Props {
  searchParams: Promise<{ school?: string; kind?: string }>;
}

export default async function LibraryPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);

  // Ensure readiness is filled for new users before rendering the school
  // grid (otherwise every card would render at 50% via fallback).
  const { getEffectiveReadiness } = await import("@/lib/readiness");
  const readiness = await getEffectiveReadiness(
    user.id,
    user.readiness,
    SCHOOLS.map((s) => s.id),
  );

  const sp = await searchParams;

  const plan = effectivePlan(dbUser);
  const planLimit = (await getPlanConfig(plan)).referenceExamLimit;

  // Public catalog only — private remedial sets (ownerUserId set) live at
  // /luyen-rieng, never in the school library grid.
  const exams = await prisma.exam.findMany({
    where: { ownerUserId: null },
    orderBy: [{ kind: "asc" }, { year: "desc" }],
  });

  // Attempt counts per exam for this user (drives "X lần làm · cao nhất Y%" on each row).
  const attempts = await prisma.attempt.groupBy({
    by: ["examId"],
    where: { userId: user.id, submitted: true },
    _count: { _all: true },
    _max: { score: true },
  });
  const attemptMap = new Map<string, { count: number; best: number | null }>();
  for (const a of attempts) {
    attemptMap.set(a.examId, { count: a._count._all, best: a._max.score });
  }

  const enriched = exams.map((e) => {
    const a = attemptMap.get(e.id);
    return {
      id: e.id,
      school: e.school,
      kind: e.kind as "official" | "reference" | "mixed",
      year: e.year,
      qcount: e.qcount,
      minutes: e.minutes,
      basedOn: e.basedOn,
      note: e.note,
      mixRatio: e.mixRatio,
      attempts: a?.count ?? 0,
      bestScore: a?.best ?? null,
    };
  });

  // Claimed reference exams for this user
  const claimedRefs = await prisma.userReferenceExam.findMany({
    where: { userId: user.id },
    include: { exam: true },
    orderBy: { addedAt: "asc" },
  });
  const claimedExams = claimedRefs.map((r) => {
    const a = attemptMap.get(r.examId);
    return {
      id: r.exam.id,
      school: r.exam.school,
      kind: r.exam.kind as "official" | "reference" | "mixed",
      year: r.exam.year,
      qcount: r.exam.qcount,
      minutes: r.exam.minutes,
      basedOn: r.exam.basedOn,
      note: r.exam.note,
      mixRatio: r.exam.mixRatio,
      attempts: a?.count ?? 0,
      bestScore: a?.best ?? null,
      addedAt: r.addedAt.toISOString(),
    };
  });

  // User activity — drives the "Con đã làm X · Y" caption and the reference history list.
  const history = await getExamHistory(user.id);
  const referenceHistory = history.filter((h) => h.kind === "reference");
  const userDoneOfficial = history.filter((h) => h.kind === "official").length;
  const userDoneReference = referenceHistory.length;

  return (
    <LibraryView
      exams={enriched}
      schools={SCHOOLS.map((s) => ({
        id: s.id,
        short: s.short,
        name: s.name,
        full: s.full,
        color: s.color,
        tone: s.tone,
        minutes: s.minutes,
        style: s.style,
        desc: s.desc,
      }))}
      mixSchool={{
        id: MIX_SCHOOL.id,
        short: MIX_SCHOOL.short,
        name: MIX_SCHOOL.name,
        full: MIX_SCHOOL.full,
        tone: MIX_SCHOOL.tone,
        color: MIX_SCHOOL.color,
        minutes: MIX_SCHOOL.minutes,
        style: MIX_SCHOOL.style,
        desc: MIX_SCHOOL.desc,
      }}
      readiness={readiness}
      referenceHistory={referenceHistory}
      userDoneOfficial={userDoneOfficial}
      userDoneReference={userDoneReference}
      initialSchool={sp.school ?? "all"}
      initialKind={sp.kind ?? "official"}
      userPlan={plan}
      planLimit={planLimit}
      claimedExams={claimedExams}
    />
  );
}
