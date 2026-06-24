import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { effectivePlan, getPlanConfig } from "@/lib/plan-config";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const userId = session.user.id;

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, plan: true },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const plan = effectivePlan(dbUser);
  const limit = (await getPlanConfig(plan)).referenceExamLimit;

  // Count how many this user already has
  const claimedCount = await prisma.userReferenceExam.count({
    where: { userId },
  });

  if (claimedCount >= limit) {
    return NextResponse.json(
      { error: "limit_reached", claimed: claimedCount, limit: limit === Infinity ? -1 : limit },
      { status: 403 }
    );
  }

  // Find an admin-curated reference exam the user hasn't claimed yet
  const alreadyClaimed = await prisma.userReferenceExam.findMany({
    where: { userId },
    select: { examId: true },
  });
  const claimedIds = alreadyClaimed.map((r) => r.examId);

  const nextExam = await prisma.exam.findFirst({
    where: {
      kind: "reference",
      generated: false,
      ownerUserId: null, // never hand out a private remedial set from the shared pool
      id: { notIn: claimedIds.length > 0 ? claimedIds : ["__none__"] },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!nextExam) {
    return NextResponse.json({ error: "no_more_exams" }, { status: 200 });
  }

  // Claim it
  const claimed = await prisma.userReferenceExam.create({
    data: { userId, examId: nextExam.id },
  });

  return NextResponse.json({
    success: true,
    exam: {
      id: nextExam.id,
      school: nextExam.school,
      kind: nextExam.kind,
      year: nextExam.year,
      qcount: nextExam.qcount,
      minutes: nextExam.minutes,
      basedOn: nextExam.basedOn,
      note: nextExam.note,
      mixRatio: nextExam.mixRatio,
      addedAt: claimed.addedAt,
    },
    claimedCount: claimedCount + 1,
    limit: limit === Infinity ? -1 : limit,
  });
}
