import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Pill } from "@/components/ui";

export interface ChooserLevel {
  level: string;
  label: string;
  sub: string;
  tone: string;
  qcount: number;
  minutes: number;
  available: number;
  href: string;
}

interface Props {
  subjectName: string;   // "Tiếng Anh" | "Tiếng Việt"
  topicName: string;
  levels: ChooserLevel[];
}

export function PracticeLevelChooser({ subjectName, topicName, levels }: Props) {
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Chọn mức luyện — {topicName}</h2>
          <p style={{ color: "var(--ink-muted)" }}>
            {subjectName} · chọn mức độ phù hợp để bắt đầu một phiên luyện.
          </p>
        </div>
      </div>

      <div className="grid cols-3" style={{ gap: 14 }}>
        {levels.map((lvl) =>
          lvl.available > 0 ? (
            <Link key={lvl.level} href={lvl.href} className="topic-card">
              <div className="row between" style={{ marginBottom: 6 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: 15,
                    color: lvl.tone,
                  }}
                >
                  {lvl.level}
                </span>
              </div>
              <div className="name">{lvl.label}</div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>
                {lvl.sub}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ink-muted)",
                  marginTop: 8,
                }}
              >
                {lvl.qcount} câu · {lvl.minutes} phút
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-muted)",
                  marginTop: 2,
                }}
              >
                {lvl.available} câu trong ngân hàng
              </div>
              <div
                className="row"
                style={{
                  justifyContent: "flex-end",
                  gap: 4,
                  fontSize: 12,
                  color: "var(--accent-ink)",
                  fontWeight: 600,
                  marginTop: 6,
                }}
              >
                Bắt đầu <Icon name="chevR" size={11} />
              </div>
            </Link>
          ) : (
            <div
              key={lvl.level}
              className="topic-card"
              style={{ opacity: 0.55, cursor: "not-allowed" }}
            >
              <div className="row between" style={{ marginBottom: 6 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: 15,
                    color: lvl.tone,
                  }}
                >
                  {lvl.level}
                </span>
                <Pill tone="red">Khoá</Pill>
              </div>
              <div className="name">{lvl.label}</div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>
                {lvl.sub}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ink-muted)",
                  marginTop: 8,
                }}
              >
                {lvl.qcount} câu · {lvl.minutes} phút
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ink-muted)",
                  marginTop: 6,
                }}
              >
                Chưa có câu hỏi
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
