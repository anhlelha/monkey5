import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hydrateUser } from "@/lib/user-data";
import { DEFAULT_TOPICS } from "@/lib/static";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { Bar, Pill } from "@/components/ui";

export default async function TopicsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);

  const topics = (await prisma.topic.findMany({ orderBy: { position: "asc" } })) ?? [];
  const TOPICS = topics.length > 0 ? topics : DEFAULT_TOPICS;

  const setCounts = await prisma.customSet.groupBy({
    by: ["topic"],
    _count: { _all: true },
  });
  const setMap = new Map<string, number>();
  setCounts.forEach((r) => setMap.set(r.topic, r._count._all));

  return (
    <div className="main">
      <TopBar crumbs={[{ label: "Trang chính", href: "/home" }, "Luyện chuyên đề"]} />
      <div className="content">
        <div className="page-head">
          <div>
            <h2>Luyện theo 10 chuyên đề</h2>
            <p>
              Mỗi chuyên đề có bộ bài tập tăng dần độ khó (Lớp 4 → Lớp 5 → Nâng cao). Sau mỗi bộ, con
              có thể hỏi AI lời giải.
            </p>
          </div>
        </div>

        <div className="grid cols-4" style={{ gap: 14 }}>
          {TOPICS.map((t) => {
            const v = user.topicMastery[t.id] ?? 0;
            const pct = Math.round(v * 100);
            const setCount = setMap.get(t.id) ?? 4;
            return (
              <Link key={t.id} href={`/topics/${t.id}`} className="topic-card">
                <div className="row between">
                  <div
                    className="ico"
                    style={{
                      background: `color-mix(in oklch, ${t.color}, white 86%)`,
                      color: t.color,
                      fontWeight: 700,
                    }}
                  >
                    {t.ico}
                  </div>
                  <Pill tone={pct >= 70 ? "green" : pct >= 55 ? "amber" : "red"}>{pct}%</Pill>
                </div>
                <div className="name">{t.name}</div>
                <Bar value={pct} tone={pct >= 70 ? "" : pct >= 55 ? "ltv" : "ntt"} />
                <div className="row between">
                  <span className="stat">{setCount} bộ bài</span>
                  <span
                    className="row"
                    style={{ gap: 4, fontSize: 12, color: "var(--accent-ink)", fontWeight: 600 }}
                  >
                    Mở <Icon name="chevR" size={11} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
