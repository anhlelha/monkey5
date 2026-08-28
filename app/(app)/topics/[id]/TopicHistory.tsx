import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Bar, Card } from "@/components/ui";
import { PRACTICE_BANDS, type PracticeHistoryItem } from "@/lib/readiness-v4/practice-service";

interface Props {
  sessions: PracticeHistoryItem[];
  topicName: string;
}

export function TopicHistory({ sessions, topicName }: Props) {
  return (
    <>
      <div className="row between" style={{ marginTop: 32, marginBottom: 10 }}>
        <div className="section-title" style={{ margin: 0 }}>Lịch sử luyện tập V4</div>
        {sessions.length > 0 && (
          <span className="muted" style={{ fontSize: 12 }}>
            {sessions.length} bài gần đây
          </span>
        )}
      </div>
      {sessions.length === 0 ? (
        <Card>
          <div className="empty">
            Con chưa hoàn thành bài luyện V4 nào trong chuyên đề này.
            <br />
            Chọn một dải ở trên để bắt đầu.
          </div>
        </Card>
      ) : (
        <div className="col" style={{ gap: 8 }}>
          {sessions.map((h) => {
            const band = PRACTICE_BANDS.find((candidate) => candidate.id === h.band)!;
            const pct = h.scorePct;
            const tone = pct >= 70 ? "" : pct >= 50 ? "ltv" : "ntt";
            return (
              <div
                key={h.id}
                className="exam-row"
                style={{ gridTemplateColumns: "auto 1fr auto auto" }}
              >
                <div className="badge" style={{ background: band.tone }}>
                  {band.shortLabel}
                </div>
                <div>
                  <div className="title">
                    {topicName} · {band.label}
                  </div>
                  <div className="meta">
                    {h.qcount} câu · {h.unseenCount} câu mới · {h.createdAt.toLocaleDateString("vi-VN")}
                  </div>
                </div>
                <div className="stat" style={{ minWidth: 120 }}>
                  <div className="row between" style={{ marginBottom: 4 }}>
                    <span className="muted" style={{ fontSize: 11 }}>Điểm bài</span>
                    <b className="mono">{pct}%</b>
                  </div>
                  <Bar value={pct} tone={tone} />
                </div>
                <Link href={`/exam/${h.examId}/results/${h.attemptId}`} className="btn sm ghost">
                  Xem giải <Icon name="chevR" size={11} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
