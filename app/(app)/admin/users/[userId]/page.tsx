import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  hydrateUser,
  getUserActivityStats,
  getUserActivityForAdmin,
  type AdminActivityFilter,
} from "@/lib/user-data";
import { DEFAULT_TOPICS } from "@/lib/static";
import { getActiveSchools } from "@/lib/schools";
import { TopBar } from "@/components/TopBar";
import { UserDetailPanel } from "./UserDetailPanel";

interface Props {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ filter?: string; page?: string }>;
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
  const { filter: rawFilter, page: rawPage } = await searchParams;
  const filter = parseFilter(rawFilter);
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);

  const targetRaw = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetRaw) notFound();
  const targetUser = hydrateUser(targetRaw);

  const [summaryMap, activity, topicRows, schools] = await Promise.all([
    getUserActivityStats([userId]),
    getUserActivityForAdmin(userId, filter, page, PAGE_SIZE),
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
          activity={activity}
          filter={filter}
          isSelf={session.user.id === userId}
        />
      </div>
    </div>
  );
}
