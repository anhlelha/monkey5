import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TOPICS, SCHOOLS } from "@/lib/static";
import { getRecentActivityFeed } from "@/lib/user-data";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { Bar, Card, Pill } from "@/components/ui";
import { hydrateUser } from "@/lib/user-data";
import { getEffectiveReadinessV4 } from "@/lib/readiness-v4/read-service";
import { ReadinessUserSummary } from "@/components/readiness/ReadinessUserSummary";

const levelColor = (level: string): string => {
  if (level === "L4") return "var(--success)";
  if (level === "L5") return "var(--cg)";
  if (level === "NC") return "var(--ntt)";
  return "var(--accent)";
};

interface Props {
  searchParams: Promise<{ subject?: string }>;
}

export default async function RecentResults({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { subject: subjectParam } = await searchParams;
  const subject: "math" | "english" | "vietnamese" =
    subjectParam === "vietnamese" ? "vietnamese" : subjectParam === "english" ? "english" : "math";
  const homeHref = subject === "vietnamese" ? "/vietnamese" : subject === "english" ? "/english" : "/home";
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);
  const readinessViews = subject === "math"
    ? await (async () => {
        const { getEffectiveReadiness } = await import("@/lib/readiness");
        const legacy = await getEffectiveReadiness(user.id, user.readiness, SCHOOLS.map((school) => school.id));
        return getEffectiveReadinessV4(user.id, SCHOOLS.map((school) => school.id), legacy);
      })()
    : {};

  const [items, topicRows] = await Promise.all([
    getRecentActivityFeed(session.user.id, 25, subject),
    prisma.topic.findMany({ orderBy: { position: "asc" } }),
  ]);
  const TOPICS = topicRows.length > 0 ? topicRows : DEFAULT_TOPICS;

  return (
    <div className="main">
      <TopBar crumbs={[{ label: "Trang chính", href: homeHref }, "Kết quả gần đây"]} />
      <div className="content">
        <div className="page-head">
          <div>
            <h2>Kết quả gần đây</h2>
            <p>Bấm vào một bài để xem lại đáp án và hỏi AI từng câu.</p>
          </div>
        </div>

        {subject === "math" && Object.keys(readinessViews).length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <ReadinessUserSummary
              schools={SCHOOLS.map((school) => ({
                id: school.id,
                short: school.short,
                name: school.name,
                tone: school.tone,
                minutes: school.minutes,
              }))}
              readiness={readinessViews}
              targetIds={user.targets}
              title="Readiness theo trường"
              subtitle="Điểm bài làm bên dưới là kết quả của từng bài; Readiness V4 là chỉ số sẵn sàng theo trường và có Evidence riêng."
            />
          </div>
        )}

        {items.length === 0 ? (
          <Card>
            <div className="empty">
              Con chưa làm đề nào.
              <div style={{ marginTop: 12 }}>
                <Link href={`${homeHref === "/home" ? "" : homeHref}/library`} className="btn primary">
                  <Icon name="library" /> Chọn đề mẫu
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <div className="col" style={{ gap: 10 }}>
            {items.map((it) => {
              if (it.kind === "exam") {
                const s = SCHOOLS.find((x) => x.id === it.schoolId);
                return (
                  <Link
                    key={it.id}
                    href={`/exam/${it.examId}/results/${it.attemptId}`}
                    className="exam-row"
                  >
                    <div
                      className={"badge " + (s?.tone ?? "")}
                      style={s ? undefined : { background: "var(--accent)" }}
                    >
                      {s?.short ?? "MIX"}
                    </div>
                    <div>
                      <div className="row" style={{ gap: 8, alignItems: "center" }}>
                        <span className="title">{it.examTitle ?? it.examYear}</span>
                        <Pill tone={it.score >= 70 ? "green" : it.score >= 50 ? "amber" : "red"}>
                          {it.score}%
                        </Pill>
                      </div>
                      <div className="meta">
                        {it.qcount} câu · {it.minutes} phút ·{" "}
                        {new Date(it.createdAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                    <div style={{ width: 140 }}>
                      <Bar value={it.score} tone={it.score >= 70 ? "" : it.score >= 50 ? "ltv" : "ntt"} />
                    </div>
                    <div className="stat">
                      <div className="eyebrow" style={{ fontSize: 10 }}>Điểm</div>
                      <b className="mono">{it.earned}/{it.total}</b>
                    </div>
                    <button className="btn sm ghost">
                      Xem <Icon name="chevR" size={11} />
                    </button>
                  </Link>
                );
              }

              // Topic session row
              const topic = TOPICS.find((t) => t.id === it.topic);
              const topicName = topic?.name ?? it.topic;
              const tone = it.score >= 70 ? "" : it.score >= 50 ? "ltv" : "ntt";
              const canView = Boolean(it.examId && it.attemptId);
              const href = canView
                ? `/exam/${it.examId}/results/${it.attemptId}`
                : `/topics/${it.topic}`;

              return (
                <Link key={it.id} href={href} className="exam-row">
                  <div className="badge" style={{ background: levelColor(it.level) }}>
                    {it.level}
                  </div>
                  <div>
                    <div className="row" style={{ gap: 8, alignItems: "center" }}>
                      <span className="title">Luyện chuyên đề · {topicName}</span>
                      <Pill tone={it.score >= 70 ? "green" : it.score >= 50 ? "amber" : "red"}>
                        {it.score}%
                      </Pill>
                    </div>
                    <div className="meta">
                      Mức {it.level} · {it.qcount} câu ·{" "}
                      {new Date(it.createdAt).toLocaleString("vi-VN")}
                      {!canView && " · không còn chi tiết bài làm"}
                    </div>
                  </div>
                  <div style={{ width: 140 }}>
                    <Bar value={it.score} tone={tone} />
                  </div>
                  <div className="stat">
                    <div className="eyebrow" style={{ fontSize: 10 }}>Đúng</div>
                    <b className="mono">{it.correctCount}/{it.qcount}</b>
                  </div>
                  <button className="btn sm ghost">
                    {canView ? "Xem" : "Mở chuyên đề"} <Icon name="chevR" size={11} />
                  </button>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
