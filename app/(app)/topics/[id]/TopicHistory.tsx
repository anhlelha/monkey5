import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Bar, Card } from "@/components/ui";
import type { TopicSessionItem } from "@/lib/user-data";

const levelColor = (level: string): string => {
  if (level === "L4") return "var(--success)";
  if (level === "L5") return "var(--cg)";
  if (level === "NC") return "var(--ntt)";
  return "var(--accent)";
};

interface Props {
  sessions: TopicSessionItem[];
  topicName: string;
}

export function TopicHistory({ sessions, topicName }: Props) {
  return (
    <>
      <div className="row between" style={{ marginTop: 32, marginBottom: 10 }}>
        <div className="section-title" style={{ margin: 0 }}>Lịch sử luyện tập</div>
        {sessions.length > 0 && (
          <span className="muted" style={{ fontSize: 12 }}>
            {sessions.length} bài gần đây
          </span>
        )}
      </div>
      {sessions.length === 0 ? (
        <Card>
          <div className="empty">
            Con chưa luyện bài nào trong chuyên đề này.
            <br />
            Bấm một mức ở trên để bắt đầu — sẽ có ngay câu hỏi đầu tiên.
          </div>
        </Card>
      ) : (
        <div className="col" style={{ gap: 8 }}>
          {sessions.map((h) => {
            const pct = h.qcount > 0 ? Math.round((h.score / h.qcount) * 100) : 0;
            const tone = pct >= 70 ? "" : pct >= 50 ? "ltv" : "ntt";
            return (
              <div
                key={h.id}
                className="exam-row"
                style={{ gridTemplateColumns: "auto 1fr auto auto auto" }}
              >
                <div className="badge" style={{ background: levelColor(h.level) }}>
                  {h.level}
                </div>
                <div>
                  <div className="title">
                    {topicName} · Mức {h.level}
                  </div>
                  <div className="meta">
                    {h.qcount} câu · làm xong {h.when_full}
                  </div>
                </div>
                <div className="stat" style={{ minWidth: 90 }}>
                  <Bar value={pct} tone={tone} />
                </div>
                <div className="stat">
                  <b
                    className="mono"
                    style={{
                      fontSize: 14,
                      color: pct >= 70 ? "var(--success)" : "var(--ink)",
                    }}
                  >
                    {h.score}/{h.qcount}
                  </b>
                </div>
                {h.examId && h.attemptId ? (
                  <Link
                    href={`/exam/${h.examId}/results/${h.attemptId}`}
                    className="btn sm ghost"
                  >
                    Xem giải <Icon name="chevR" size={11} />
                  </Link>
                ) : (
                  <span className="btn sm ghost" style={{ opacity: 0.5, pointerEvents: "none" }}>
                    Xem giải <Icon name="chevR" size={11} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
