import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  hydrateUser,
  getUserActivityStats,
  getAttemptsForAdmin,
  getTopicSessionsForAdmin,
} from "@/lib/user-data";
import { DEFAULT_TOPICS } from "@/lib/static";
import { getActiveSchools } from "@/lib/schools";
import { TopBar } from "@/components/TopBar";
import { UserDetailPanel } from "./UserDetailPanel";

interface Props {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ tab?: string; page?: string }>;
}

const PAGE_SIZE = 20;

export default async function AdminUserDetail({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const adminUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!adminUser) redirect("/signin");
  const hydratedAdmin = hydrateUser(adminUser);
  if (hydratedAdmin.role !== "admin") redirect("/home");

  const { userId } = await params;
  const { tab: rawTab, page: rawPage } = await searchParams;
  const activeTab: "exams" | "topics" = rawTab === "topics" ? "topics" : "exams";
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);

  const targetRaw = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetRaw) notFound();
  const targetUser = hydrateUser(targetRaw);

  const [summaryMap, attempts, topicSessions, topicRows, schools] = await Promise.all([
    getUserActivityStats([userId]),
    getAttemptsForAdmin(userId, activeTab === "exams" ? page : 1, PAGE_SIZE),
    getTopicSessionsForAdmin(userId, activeTab === "topics" ? page : 1, PAGE_SIZE),
    prisma.topic.findMany({ orderBy: { position: "asc" } }),
    getActiveSchools(),
  ]);

  const summary = summaryMap.get(userId) ?? {
    attemptCount: 0,
    topicSessionCount: 0,
    avgScore: null,
    lastActiveAt: null,
  };

  const TOPICS = (topicRows.length > 0 ? topicRows : DEFAULT_TOPICS).map((t) => ({
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
          attempts={attempts}
          topicSessions={topicSessions}
          activeTab={activeTab}
          isSelf={session.user.id === userId}
        />
      </div>
    </div>
  );
}
