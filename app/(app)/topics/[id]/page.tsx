import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hydrateUser } from "@/lib/user-data";
import { effectivePlan, remainingTopicSets } from "@/lib/plan-config";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { Bar, Card, Pill } from "@/components/ui";
import {
  getMathAnalyticalTopic,
  MATH_ANALYTICAL_TOPIC_IDS,
  MATH_ANALYTICAL_TOPICS,
} from "@/lib/readiness-v4/analytical-topics";
import {
  getPracticeBandStates,
  getPracticeHistory,
  PRACTICE_BANDS,
} from "@/lib/readiness-v4/practice-service";
import type { DifficultyBand } from "@/lib/readiness-v4/types";
import { TopicPracticeBands } from "./TopicPracticeBands";
import { TopicHistory } from "./TopicHistory";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ band?: string; school?: string; error?: string }>;
}

function validBand(value?: string): DifficultyBand | null {
  return PRACTICE_BANDS.some((band) => band.id === value) ? value as DifficultyBand : null;
}

export default async function TopicDetail({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");

  if (!MATH_ANALYTICAL_TOPIC_IDS.has(id)) {
    const legacyMapping = await prisma.contentTaxonomyMapping.findFirst({
      where: {
        subject: "math",
        taxonomyVersion: "math-topic-taxonomy-v1",
        contentTopic: id,
        enabled: true,
      },
      orderBy: [{ priority: "desc" }, { taxonomyTopic: "asc" }],
    });
    if (legacyMapping) redirect(`/topics/${legacyMapping.taxonomyTopic}`);
    // "Toán tuổi" was a standalone legacy content bucket but is intentionally
    // distributed across V4 taxonomy; ratio/percent is its dominant assessment.
    if (id === "tuoi") redirect("/topics/ratio_percent");
    notFound();
  }

  const topic = getMathAnalyticalTopic(id);
  if (!topic) notFound();
  const user = hydrateUser(dbUser);
  const requestedSchool = query.school && user.targets.includes(query.school) ? query.school : null;
  const targetSchool = requestedSchool ?? user.targets[0] ?? null;
  const school = targetSchool
    ? await prisma.school.findUnique({ where: { id: targetSchool } })
    : null;
  const [states, history, remaining] = await Promise.all([
    getPracticeBandStates(user.id, id, targetSchool),
    getPracticeHistory(user.id, id),
    remainingTopicSets(user.id, effectivePlan({ role: dbUser.role, plan: dbUser.plan })),
  ]);

  const totalEvidence = states.reduce((sum, state) => sum + state.total, 0);
  const totalCorrect = states.reduce((sum, state) => sum + state.correct, 0);
  const aggregateMastery = totalEvidence > 0 ? Math.round((totalCorrect / totalEvidence) * 100) : null;
  const selectedBand = validBand(query.band);
  const currentIndex = MATH_ANALYTICAL_TOPICS.findIndex((candidate) => candidate.id === id);
  const previous = currentIndex > 0 ? MATH_ANALYTICAL_TOPICS[currentIndex - 1] : null;
  const next = currentIndex < MATH_ANALYTICAL_TOPICS.length - 1 ? MATH_ANALYTICAL_TOPICS[currentIndex + 1] : null;

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
        <div className="row between" style={{ gap: 20, alignItems: "start" }}>
          <div className="row" style={{ gap: 12 }}>
            <div style={{ width: 54, height: 54, borderRadius: 13, background: `color-mix(in oklch, ${topic.color}, white 86%)`, color: topic.color, display: "grid", placeItems: "center", fontSize: topic.icon.length > 2 ? 17 : 24, fontWeight: 750 }}>
              {topic.icon}
            </div>
            <div>
              <div className="row" style={{ gap: 8, marginBottom: 2 }}>
                <Pill>Taxonomy V4</Pill>
                <span className="muted" style={{ fontSize: 12 }}>{currentIndex + 1}/13</span>
              </div>
              <h2 style={{ margin: 0 }}>{topic.name}</h2>
              <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                {totalEvidence > 0
                  ? <>Đã có <b>{totalEvidence}</b> câu evidence trong chuyên đề này.</>
                  : <>Chưa có evidence V4. Bắt đầu từ dải phù hợp bên dưới.</>}
              </p>
            </div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            {previous && <Link href={`/topics/${previous.id}`} className="btn sm ghost"><Icon name="chevL" size={12} /> {previous.short}</Link>}
            {next && <Link href={`/topics/${next.id}`} className="btn sm ghost">{next.short} <Icon name="chevR" size={12} /></Link>}
          </div>
        </div>

        <div className="grid cols-3" style={{ gap: 12, marginTop: 22 }}>
          <Card>
            <div className="eyebrow">Mastery quan sát</div>
            <div style={{ fontSize: 28, fontWeight: 750, marginTop: 6, color: aggregateMastery === null ? "var(--ink-muted)" : topic.color }}>
              {aggregateMastery === null ? "—" : `${aggregateMastery}%`}
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>Accuracy thô của evidence; từng band dùng posterior Mastery V4 riêng.</div>
          </Card>
          <Card>
            <div className="eyebrow">Evidence V4</div>
            <div style={{ fontSize: 28, fontWeight: 750, marginTop: 6 }}>{totalEvidence} câu</div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>Tách riêng theo Nền tảng, Vận dụng và Phân hóa.</div>
          </Card>
          <Card>
            <div className="eyebrow">Ngân hàng khả dụng</div>
            <div style={{ fontSize: 28, fontWeight: 750, marginTop: 6 }}>
              {states.reduce((sum, state) => sum + state.availability.total, 0)} câu
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>Chỉ tính câu có assessment current/inherited hợp lệ.</div>
          </Card>
        </div>

        <TopicPracticeBands
          topicId={id}
          states={states}
          targetSchool={targetSchool}
          targetSchoolName={school?.short ?? null}
          requestNonce={randomUUID()}
          selectedBand={selectedBand}
          error={query.error ?? null}
          remaining={remaining}
        />

        <div className="grid cols-2" style={{ gap: 16, marginTop: 24 }}>
          <Card title="Ba dải của Readiness V4" sub="Grade lớp học không còn được dùng thay cho độ khó">
            <div className="col" style={{ gap: 10 }}>
              {PRACTICE_BANDS.map((band) => {
                const state = states.find((candidate) => candidate.band === band.id)!;
                const pct = state.mastery === null ? null : Math.round(state.mastery * 100);
                return (
                  <div key={band.id}>
                    <div className="row between" style={{ marginBottom: 5, fontSize: 12.5 }}>
                      <span><b>{band.label}</b> · {band.shortLabel}</span>
                      <span className="mono muted">{pct === null ? "Chưa xác minh" : `${pct}%`}</span>
                    </div>
                    <Bar value={pct ?? 0} tone={pct !== null && pct >= 70 ? "" : "ltv"} />
                  </div>
                );
              })}
            </div>
          </Card>
          <Card title="Nguồn câu hỏi" sub="Nguồn không làm thay đổi taxonomy hoặc dải khó">
            <div className="col" style={{ gap: 10, fontSize: 12.5 }}>
              <div className="row between"><span>Câu từ đề chính thức</span><b>{states.reduce((sum, state) => sum + state.availability.official, 0)}</b></div>
              <div className="row between"><span>Câu bổ trợ đã assessment</span><b>{states.reduce((sum, state) => sum + state.availability.supplement, 0)}</b></div>
              <div className="row between"><span>Câu mới chưa làm</span><b>{states.reduce((sum, state) => sum + state.availability.unseen, 0)}</b></div>
              <div className="muted" style={{ fontSize: 11.5, paddingTop: 4 }}>
                Câu thiếu assessment, stale hoặc conflict không được đưa vào bài luyện V4.
              </div>
            </div>
          </Card>
        </div>

        <TopicHistory sessions={history} topicName={topic.name} />
      </div>
    </div>
  );
}
