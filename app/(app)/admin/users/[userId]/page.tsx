import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  hydrateUser,
  getUserActivityStats,
  getUserActivityForAdmin,
  getUserActivitySeries,
  type AdminActivityFilter,
} from "@/lib/user-data";
import { computeMastery } from "@/lib/mastery";
import { getEffectiveReadiness } from "@/lib/readiness";
import { DEFAULT_TOPICS } from "@/lib/static";
import { isSubject, type Subject } from "@/lib/subjects";
import { getActiveSchools } from "@/lib/schools";
import { TopBar } from "@/components/TopBar";
import { UserDetailPanel } from "./UserDetailPanel";

interface Props {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ filter?: string; page?: string; subject?: string }>;
}

const PAGE_SIZE = 20;

const parseFilter = (raw: string | undefined): AdminActivityFilter => {
  if (raw === "exam" || raw === "topic") return raw;
  return "all";
};

export default async function AdminUserDetail({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const adminUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!adminUser) redirect("/signin");
  const hydratedAdmin = hydrateUser(adminUser);
  if (hydratedAdmin.role !== "admin") redirect("/home");

  const { userId } = await params;
  const { filter: rawFilter, page: rawPage, subject: rawSubject } = await searchParams;
  const filter = parseFilter(rawFilter);
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const subject: Subject = isSubject(rawSubject) ? rawSubject : "math";

  const targetRaw = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetRaw) notFound();
  const targetUser = hydrateUser(targetRaw);

  const [summaryMap, activity, topicRows, schools, mastery, readiness, activitySeries] =
    await Promise.all([
      getUserActivityStats([userId], subject),
      getUserActivityForAdmin(userId, filter, page, PAGE_SIZE, subject),
      prisma.topic.findMany({ where: { subject }, orderBy: { position: "asc" } }),
      getActiveSchools(),
      computeMastery(userId, subject),
      getEffectiveReadiness(userId, targetUser.readiness, targetUser.targets, subject),
      getUserActivitySeries(userId, subject),
    ]);

  const summary = summaryMap.get(userId) ?? {
    attemptCount: 0,
    topicSessionCount: 0,
    avgScore: null,
    lastActiveAt: null,
  };

  // Topics are seeded per subject; fall back to the static math list only for math.
  const topicSource =
    topicRows.length > 0 ? topicRows : subject === "math" ? DEFAULT_TOPICS : [];
  const TOPICS = topicSource.map((t) => ({
    id: t.id,
    name: t.name,
    short: t.short,
    color: t.color,
  }));

  const schoolMeta = schools.map((s) => ({
    id: s.id,
    short: s.short,
    name: s.name,
    full: s.full,
    tone: s.tone,
  }));

  return (
    <div className="main">
      <TopBar
        crumbs={[
          { label: "Quản trị", href: "/admin?tab=overview" },
          { label: "Tài khoản", href: "/admin?tab=users" },
          targetUser.name ?? targetUser.email ?? "Chi tiết",
        ]}
      />
      <div className="content">
        <UserDetailPanel
          user={targetUser}
          summary={summary}
          topics={TOPICS}
          schools={schoolMeta}
          activity={activity}
          filter={filter}
          isSelf={session.user.id === userId}
          subject={subject}
          topicMastery={mastery.topicMastery}
          readiness={readiness}
          activitySeries={activitySeries}
        />
      </div>
    </div>
  );
}
