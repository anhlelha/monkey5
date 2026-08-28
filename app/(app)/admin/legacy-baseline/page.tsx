import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hydrateUser, getMasteryStats } from "@/lib/user-data";
import { DEFAULT_TOPICS } from "@/lib/static";
import { Card } from "@/components/ui";
import { TopBar } from "@/components/TopBar";
import { MasteryOverviewCard } from "../MasteryOverviewCard";

export default async function LegacyBaselinePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");

  const user = hydrateUser(dbUser);
  if (user.role !== "admin") redirect("/home");

  const [stats, topics] = await Promise.all([
    getMasteryStats(),
    prisma.topic.findMany({ where: { subject: "math" }, orderBy: { position: "asc" } }),
  ]);

  const topicRows = topics.length > 0
    ? topics
    : [...DEFAULT_TOPICS].map((topic, position) => ({ ...topic, position }));

  return (
    <div className="main">
      <TopBar
        crumbs={[{ label: "Quản trị", href: "/admin?tab=overview" }, "Legacy baseline"]}
        actions={<Link className="btn" href="/admin?tab=overview">Quay lại Dashboard V4</Link>}
      />
      <div className="content">
        <div className="page-head">
          <div>
            <h2>Legacy baseline</h2>
            <p>Chỉ dùng để đối chiếu rollback; không phải Readiness V4 và không được dùng làm status hiện hành.</p>
          </div>
        </div>
        <Card title="Mastery legacy — baseline rollback" sub="Các bucket Yếu / Trung bình / Khá / Giỏi và Mastery TB là số liệu cũ, được giữ riêng ngoài Dashboard V4.">
          <MasteryOverviewCard
            stats={stats}
            topics={topicRows.map((topic) => ({
              id: topic.id,
              name: topic.name,
              short: topic.short,
              color: topic.color,
              position: topic.position ?? 0,
            }))}
          />
        </Card>
      </div>
    </div>
  );
}
