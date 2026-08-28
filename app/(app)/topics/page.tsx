import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hydrateUser } from "@/lib/user-data";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { Bar, Card, Pill } from "@/components/ui";
import { MATH_ANALYTICAL_TOPICS, getMathAnalyticalTopic } from "@/lib/readiness-v4/analytical-topics";
import { getEffectiveAnalyticalMasteryV4 } from "@/lib/readiness-v4/content-mastery-service";
import {
  getPracticeAvailabilityCatalog,
  getUserPracticeRecommendations,
  PRACTICE_BANDS,
} from "@/lib/readiness-v4/practice-service";
import type { RecommendationReasonCode } from "@/lib/readiness-v4/recommendation-engine";

interface Props {
  searchParams: Promise<{ school?: string }>;
}

const REASON_COPY: Record<RecommendationReasonCode, string> = {
  UNVERIFIED_CELL: "Chưa có evidence tại ô trường này yêu cầu",
  LOW_CELL_EVIDENCE: "Cần thêm câu đúng chuyên đề và dải khó",
  CONFIRMED_CELL_WEAKNESS: "Điểm yếu đã được xác nhận bằng evidence",
  ADVANCED_EVIDENCE_GAP: "Thiếu evidence ở nhóm bài phân hóa",
};

function masteryTone(score: number | null): "green" | "amber" | "red" | "" {
  if (score === null) return "";
  if (score >= 0.7) return "green";
  if (score >= 0.55) return "amber";
  return "red";
}

export default async function TopicsPage({ searchParams }: Props) {
  const [session, query] = await Promise.all([auth(), searchParams]);
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);
  const selectedSchool = query.school && user.targets.includes(query.school)
    ? query.school
    : user.targets[0] ?? null;
  const [masteryViews, availability, recommendations, targetSchools] = await Promise.all([
    getEffectiveAnalyticalMasteryV4(user.id, MATH_ANALYTICAL_TOPICS.map((topic) => topic.id)),
    getPracticeAvailabilityCatalog(user.id),
    getUserPracticeRecommendations(user.id, selectedSchool, 3),
    user.targets.length
      ? prisma.school.findMany({ where: { id: { in: user.targets }, active: true }, orderBy: { position: "asc" } })
      : [],
  ]);
  const selectedSchoolMeta = targetSchools.find((school) => school.id === selectedSchool) ?? null;

  return (
    <div className="main">
      <TopBar crumbs={[{ label: "Trang chính", href: "/home" }, "Luyện chuyên đề V4"]} />
      <div className="content">
        <div className="page-head">
          <div>
            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
              <Pill tone="green">Readiness V4</Pill>
              <Pill>13 analytical topic</Pill>
            </div>
            <h2>Luyện đúng ô năng lực cần cải thiện</h2>
            <p>Chọn chính xác chuyên đề và dải D1–D5. Grade L4/L5/NC không còn được dùng thay cho độ khó.</p>
          </div>
        </div>

        {targetSchools.length > 0 && (
          <div className="row" style={{ gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
            <span className="muted" style={{ fontSize: 12.5 }}>Đề xuất theo trường:</span>
            {targetSchools.map((school) => (
              <Link
                key={school.id}
                href={`/topics?school=${school.id}`}
                className={`btn sm ${selectedSchool === school.id ? "primary" : "ghost"}`}
              >
                {school.short}
              </Link>
            ))}
          </div>
        )}

        {recommendations.length > 0 ? (
          <Card
            title={`Ưu tiên tiếp theo${selectedSchoolMeta ? ` cho ${selectedSchoolMeta.name}` : ""}`}
            sub="Xếp theo tác động blueprint, khoảng trống Mastery/Evidence và gate V4"
            style={{ marginBottom: 26 }}
          >
            <div className="grid cols-3" style={{ gap: 12 }}>
              {recommendations.map((recommendation, index) => {
                const topic = getMathAnalyticalTopic(recommendation.topic);
                const band = PRACTICE_BANDS.find((candidate) => candidate.id === recommendation.band);
                if (!topic || !band || !recommendation.deepLink) return null;
                const cellAvailability = availability[`${topic.id}::${band.id}`];
                return (
                  <Link key={`${recommendation.topic}:${recommendation.band}`} href={recommendation.deepLink} className="topic-card" style={{ padding: 16 }}>
                    <div className="row between">
                      <div className="row" style={{ gap: 9 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: `color-mix(in oklch, ${topic.color}, white 84%)`, color: topic.color, display: "grid", placeItems: "center", fontWeight: 750 }}>
                          {topic.icon}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13.5 }}>{topic.name}</div>
                          <div className="muted" style={{ fontSize: 11.5 }}>{band.label} · {band.shortLabel}</div>
                        </div>
                      </div>
                      <Pill tone="amber">#{index + 1}</Pill>
                    </div>
                    <p className="muted" style={{ fontSize: 11.5, minHeight: 34, margin: "12px 0" }}>
                      {REASON_COPY[recommendation.reasonCode]}
                    </p>
                    <div className="row between" style={{ fontSize: 11.5 }}>
                      <span>{cellAvailability?.unseen ?? 0} câu mới</span>
                      <span style={{ color: "var(--accent-ink)", fontWeight: 650 }}>
                        {(cellAvailability?.total ?? 0) > 0 ? "Luyện ngay" : "Chưa có ngân hàng"} <Icon name="chevR" size={11} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        ) : (
          <Card title="Chưa có đề xuất theo trường" style={{ marginBottom: 26 }}>
            <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
              Chọn một trong 13 chuyên đề bên dưới. Khi có snapshot Readiness hiện hành, hệ thống sẽ ưu tiên đúng topic × band theo blueprint trường mục tiêu.
            </p>
          </Card>
        )}

        <div className="row between" style={{ marginBottom: 12 }}>
          <div>
            <div className="section-title" style={{ margin: 0 }}>Tự chọn trong 13 chuyên đề</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Mỗi trang chuyên đề có ba dải Nền tảng, Vận dụng và Phân hóa.</div>
          </div>
        </div>
        <div className="grid cols-4" style={{ gap: 14 }}>
          {MATH_ANALYTICAL_TOPICS.map((topic) => {
            const view = masteryViews[topic.id];
            const pct = typeof view?.score === "number" ? Math.round(view.score * 100) : null;
            const totalAvailable = PRACTICE_BANDS.reduce((sum, band) => sum + (availability[`${topic.id}::${band.id}`]?.total ?? 0), 0);
            const unseen = PRACTICE_BANDS.reduce((sum, band) => sum + (availability[`${topic.id}::${band.id}`]?.unseen ?? 0), 0);
            const tone = masteryTone(view?.score ?? null);
            const params = selectedSchool ? `?school=${selectedSchool}` : "";
            return (
              <Link key={topic.id} href={`/topics/${topic.id}${params}`} className="topic-card">
                <div className="row between">
                  <div className="ico" style={{ background: `color-mix(in oklch, ${topic.color}, white 86%)`, color: topic.color, fontWeight: 750, fontSize: topic.icon.length > 2 ? 12 : 17 }}>
                    {topic.icon}
                  </div>
                  {pct === null ? <Pill>Chưa xác minh</Pill> : <Pill tone={tone}>{pct}%</Pill>}
                </div>
                <div className="name">{topic.name}</div>
                <Bar value={pct ?? 0} tone={tone === "amber" ? "ltv" : tone === "red" ? "ntt" : ""} />
                <div className="row between">
                  <span className="stat">{totalAvailable} câu · {unseen} mới</span>
                  <span className="row" style={{ gap: 4, fontSize: 12, color: "var(--accent-ink)", fontWeight: 650 }}>
                    Chọn dải <Icon name="chevR" size={11} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <Card title="Mô phỏng đề trường" sub="Một mode riêng, không phải dải độ khó thứ tư" style={{ marginTop: 26 }}>
          <div className="row between" style={{ gap: 18 }}>
            <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>
              Đề mô phỏng tiếp tục nằm trong Thư viện đề. Bản school-blueprint V4 sẽ trộn câu theo profile version của từng trường, không trộn L4/L5/NC trong một content topic.
            </p>
            <Link href="/library" className="btn ghost">Mở thư viện <Icon name="chevR" size={12} /></Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
