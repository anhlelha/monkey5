import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTopicSessions, hydrateUser } from "@/lib/user-data";
import { DEFAULT_TOPICS, SCHOOLS } from "@/lib/static";
import { BASELINE_MASTERY } from "@/lib/mastery";
import { effectivePlan, getLevelConfigs, remainingTopicSets } from "@/lib/plan-config";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { Bar, Card } from "@/components/ui";
import { TopicPracticeLevels } from "./TopicPracticeLevels";
import { TopicHistory } from "./TopicHistory";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ limit?: string }>;
}

const randStub = () => Math.random().toString(36).slice(-4);

// Counts of active official-exam questions for this topic, grouped by school.
// Drives the "Tần suất trong đề thật" card on the right rail.
async function getOfficialQuestionCountsBySchool(
  topicId: string,
): Promise<Record<string, number>> {
  const officialExams = await prisma.exam.findMany({
    where: { kind: "official" },
    select: { id: true, school: true },
  });
  const examSchool = new Map<string, string>();
  for (const e of officialExams) examSchool.set(e.id, e.school);

  const rows = await prisma.question.groupBy({
    by: ["examId"],
    where: {
      topic: topicId,
      active: true,
      examId: { in: officialExams.map((e) => e.id) },
    },
    _count: { _all: true },
  });

  const bySchool: Record<string, number> = {};
  for (const r of rows) {
    if (!r.examId) continue;
    const school = examSchool.get(r.examId);
    if (!school) continue;
    bySchool[school] = (bySchool[school] ?? 0) + r._count._all;
  }
  return bySchool;
}

export default async function TopicDetail({ params, searchParams }: Props) {
  const { id } = await params;
  const { limit } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);

  const topics = (await prisma.topic.findMany({ orderBy: { position: "asc" } })) ?? [];
  const TOPICS = topics.length > 0 ? topics : DEFAULT_TOPICS;
  const topic = TOPICS.find((t) => t.id === id);
  if (!topic) notFound();

  const [sessions, schoolCounts] = await Promise.all([
    getTopicSessions(user.id, id),
    getOfficialQuestionCountsBySchool(id),
  ]);
  const totalQs = sessions.reduce((s, x) => s + x.qcount, 0);
  const totalCorrect = sessions.reduce((s, x) => s + x.score, 0);
  const accuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : null;

  const v = user.topicMastery[id] ?? BASELINE_MASTERY;
  const pct = Math.round(v * 100);
  const maxCount = Math.max(1, ...Object.values(schoolCounts));

  // Build levels from DB config; fall back to defaults if DB is empty.
  const levelCfgs = await getLevelConfigs();

  // Per-level question availability for THIS topic, matching spawnTopicSetExam's
  // source rules exactly. A level with 0 questions for the active source is
  // locked in the UI instead of silently falling back to harder grades.
  const topicQs = await prisma.question.findMany({
    where: { active: true, topic: id },
    select: {
      grade: true,
      examId: true,
      exam: { select: { kind: true, generated: true } },
    },
  });
  const countAvail = (grades: string[]) => {
    let official = 0;
    let supplement = 0;
    for (const q of topicQs) {
      if (!grades.includes(q.grade ?? "")) continue;
      const isSup = q.examId == null;
      const isOff =
        q.examId != null && q.exam?.kind === "official" && q.exam?.generated === false;
      if (isSup) supplement += 1;
      if (isOff) official += 1;
    }
    return { all: official + supplement, official, supplement };
  };

  const levels = levelCfgs.map((c) => ({
    id: c.level,
    label: c.label,
    sub: c.sub,
    q: c.qcount,
    mins: c.minutes,
    tone: c.tone,
    stubId: `set-${id}-${c.level.toLowerCase()}-${randStub()}`,
    avail: countAvail(c.grades),
  }));

  const remaining = await remainingTopicSets(user.id, effectivePlan({ role: dbUser.role, plan: dbUser.plan }));

  return (
    <div className="main">
      <TopBar
        crumbs={[
          { label: "Trang chính", href: "/home" },
          { label: "Luyện chuyên đề", href: "/topics" },
          topic.short,
        ]}
        actions={
          <Link href="/topics" className="btn ghost">
            <Icon name="back" /> Tất cả chuyên đề
          </Link>
        }
      />
      <div className="content">
        <div className="grid cols-2" style={{ gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "stretch" }}>
          <div>
            <div className="row" style={{ gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: `color-mix(in oklch, ${topic.color}, white 86%)`,
                  color: topic.color,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {topic.ico}
              </div>
              <div>
                <h2 style={{ margin: 0, letterSpacing: "-0.02em" }}>{topic.name}</h2>
                <p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>
                  {sessions.length > 0 && accuracy !== null ? (
                    <>
                      Con đã luyện <b className="mono" style={{ color: "var(--ink)" }}>{sessions.length}</b> bài ·{" "}
                      <b className="mono" style={{ color: "var(--ink)" }}>{totalQs}</b> câu · đúng{" "}
                      <b
                        className="mono"
                        style={{ color: accuracy >= 70 ? "var(--success)" : "var(--ink)" }}
                      >
                        {accuracy}%
                      </b>
                    </>
                  ) : (
                    <>Con chưa luyện chuyên đề này. Bắt đầu một bài mới nhé!</>
                  )}
                </p>
              </div>
            </div>

            <TopicPracticeLevels topicId={id} levels={levels} remaining={remaining} limitReached={limit === "reached"} />

            <TopicHistory sessions={sessions} topicName={topic.name} />
          </div>

          <div className="col" style={{ gap: 16 }}>
            <Card>
              <div className="eyebrow">Năng lực hiện tại</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
                <span className="mono" style={{ fontSize: 36, fontWeight: 700, color: topic.color }}>
                  {pct}
                </span>
                <span className="muted" style={{ fontSize: 14 }}>%</span>
              </div>
              <Bar value={pct} tone={pct >= 70 ? "" : "ntt"} tall />
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                Tính từ <b style={{ color: "var(--ink)" }}>{totalQs}</b> câu con đã trả lời trong chuyên đề này.
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Khoảng cách đến mục tiêu:{" "}
                <b style={{ color: 70 - pct > 0 ? "var(--warn)" : "var(--success)" }}>
                  {Math.max(0, 70 - pct)}%
                </b>
              </div>
            </Card>

            <Card title="Tần suất trong đề thật" sub="Số câu thuộc chuyên đề này trong các đề chính thức">
              <div className="col" style={{ gap: 10 }}>
                {SCHOOLS.map((school) => {
                  const count = schoolCounts[school.id] ?? 0;
                  return (
                    <div key={school.id}>
                      <div className="row between" style={{ marginBottom: 4 }}>
                        <span className="row" style={{ gap: 6, fontSize: 13 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: school.color }} />
                          {school.short}
                        </span>
                        <b className="mono" style={{ fontSize: 13 }}>{count} câu</b>
                      </div>
                      <Bar value={count} max={maxCount} tone={school.tone} />
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
