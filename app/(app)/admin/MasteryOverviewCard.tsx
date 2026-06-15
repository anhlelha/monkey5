import { Bar, Card, Pill } from "@/components/ui";
import type { MasteryStats, MasteryTopicStat } from "@/lib/user-data";

interface TopicMeta {
  id: string;
  name: string;
  short: string;
  color: string;
  position: number;
}

interface Props {
  stats: MasteryStats;
  topics: TopicMeta[];
}

const toneFor = (avg: number): "" | "ltv" | "ntt" => {
  if (avg >= 70) return "";
  if (avg >= 50) return "ltv";
  return "ntt";
};

const pillToneFor = (avg: number): "green" | "amber" | "red" => {
  if (avg >= 70) return "green";
  if (avg >= 50) return "amber";
  return "red";
};

const DISTRIBUTION_LABELS = ["Yếu (<25%)", "Trung bình (25–50%)", "Khá (50–75%)", "Giỏi (≥75%)"];

export function MasteryOverviewCard({ stats, topics }: Props) {
  const topicById = new Map(topics.map((t) => [t.id, t]));

  const perTopicSorted: (MasteryTopicStat & { meta: TopicMeta | undefined })[] = stats.perTopic
    .map((p) => ({ ...p, meta: topicById.get(p.topicId) }))
    .sort((a, b) => {
      const pa = a.meta?.position ?? 999;
      const pb = b.meta?.position ?? 999;
      return pa - pb;
    });

  const weakTopics = [...stats.perTopic]
    .filter((p) => p.learnerCount >= 3)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 5);

  const maxBucket = Math.max(1, ...stats.distribution);

  return (
    <div className="col" style={{ gap: 16 }}>
      <Card
        title="Mastery toàn hệ thống"
        sub={`Trung bình của ${stats.activeUsers} HS đã có hoạt động · trên tổng ${stats.totalUsers} tài khoản`}
      >
        <div className="grid cols-4" style={{ gap: 12 }}>
          <div className="school-card" style={{ padding: 14 }}>
            <div className="eyebrow" style={{ fontSize: 10 }}>MASTERY TB</div>
            <div className="pct" style={{ marginTop: 6 }}>
              <span className="num">{stats.globalAvg}</span>
              <span className="sym">%</span>
            </div>
            <Bar value={stats.globalAvg} tone={toneFor(stats.globalAvg)} tall />
            <div className="muted" style={{ marginTop: 6, fontSize: 11.5 }}>
              Theo {stats.activeUsers} HS có hoạt động
            </div>
          </div>
          {DISTRIBUTION_LABELS.map((label, i) => {
            const count = stats.distribution[i];
            const barPct = (count / maxBucket) * 100;
            const tone = i === 0 ? "ntt" : i === 1 ? "ltv" : i === 2 ? "" : "";
            return (
              <div key={label} className="school-card" style={{ padding: 14 }}>
                <div className="eyebrow" style={{ fontSize: 10 }}>{label.toUpperCase()}</div>
                <div className="pct" style={{ marginTop: 6 }}>
                  <span className="num">{count}</span>
                  <span className="sym" style={{ fontSize: 14 }}>HS</span>
                </div>
                <Bar value={barPct} tone={tone} tall />
                <div className="muted" style={{ marginTop: 6, fontSize: 11.5 }}>
                  {stats.activeUsers > 0
                    ? `${Math.round((count / stats.activeUsers) * 100)}% tổng số HS hoạt động`
                    : "Chưa có dữ liệu"}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid cols-2" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="Mastery theo chuyên đề" sub="Trung bình tính trên HS đã luyện chuyên đề tương ứng">
          {perTopicSorted.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>Chưa có HS nào có dữ liệu mastery.</div>
          ) : (
            <div className="col" style={{ gap: 10 }}>
              {perTopicSorted.map((p) => {
                const name = p.meta?.name ?? p.topicId;
                const color = p.meta?.color ?? "var(--ink-muted)";
                return (
                  <div key={p.topicId}>
                    <div className="row between" style={{ marginBottom: 3 }}>
                      <span className="row" style={{ gap: 8, fontSize: 13 }}>
                        <span style={{ width: 8, height: 8, background: color, borderRadius: 2 }} />
                        {name}
                        <span className="muted" style={{ fontSize: 11.5 }}>
                          {p.learnerCount} HS
                        </span>
                      </span>
                      <b
                        className="mono"
                        style={{
                          fontSize: 13,
                          color:
                            p.avg >= 70
                              ? "var(--success)"
                              : p.avg >= 50
                                ? "var(--ink)"
                                : "var(--danger)",
                        }}
                      >
                        {p.avg}%
                      </b>
                    </div>
                    <Bar value={p.avg} tone={toneFor(p.avg)} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card
          title="Chuyên đề cần chú ý"
          sub="Top 5 chuyên đề có mastery TB thấp nhất (lọc ≥3 HS đã luyện)"
        >
          {weakTopics.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>
              Chưa đủ dữ liệu để xác định chuyên đề yếu.
            </div>
          ) : (
            <div className="col" style={{ gap: 12 }}>
              {weakTopics.map((p) => {
                const meta = topicById.get(p.topicId);
                const name = meta?.name ?? p.topicId;
                const color = meta?.color ?? "var(--ink-muted)";
                return (
                  <div
                    key={p.topicId}
                    className="row between"
                    style={{
                      padding: "10px 12px",
                      background: "var(--surface-2)",
                      borderRadius: 8,
                      borderLeft: `3px solid ${color}`,
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div className="row" style={{ gap: 8, alignItems: "center" }}>
                        <b style={{ fontSize: 13 }}>{name}</b>
                        <Pill tone={pillToneFor(p.avg)}>{p.avg}%</Pill>
                      </div>
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                        {p.learnerCount} HS đã luyện · {p.weakCount} HS đang yếu (&lt;50%)
                      </div>
                    </div>
                    <div style={{ width: 110 }}>
                      <Bar value={p.avg} tone="ntt" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
