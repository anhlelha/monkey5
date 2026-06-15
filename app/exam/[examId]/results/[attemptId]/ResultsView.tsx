"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { Bar, Card, Donut, KindBadge, Pill } from "@/components/ui";
import { MathText } from "@/components/MathText";
import { ExamFigure } from "@/components/ExamFigure";
import { AITutor } from "./AITutor";
import { getExamSectionHeader } from "@/lib/exam";
import type { ExamQuestion } from "@/lib/exam";
import { gradeAnswer } from "@/lib/grading";


interface Props {
  examMeta: {
    id: string;
    kind: "official" | "reference" | "mixed";
    title: string;
    year: string;
    minutes: number;
    sections?: any[];
  };
  school: { short: string; tone: string };
  questions: ExamQuestion[];
  answers: Record<string, unknown>;
  attempt: { earned: number; total: number; score: number; durationSec: number };
  topics: { id: string; name: string; short: string; color: string }[];
  targetSchools: { id: string; short: string; name: string; tone: string; current: number }[];
  adminView?: { ownerName: string } | null;
}

interface Graded {
  q: ExamQuestion;
  answer: string;
  correct: boolean;
  empty: boolean;
  earned: number;
}

const flatAnswer = (a: unknown): string => {
  if (a === undefined || a === null) return "";
  if (typeof a === "string") return a;
  if (typeof a === "object" && a !== null && "text" in a) return String((a as { text: string }).text ?? "");
  return "";
};

export function ResultsView({
  examMeta,
  school,
  questions,
  answers,
  attempt,
  topics,
  targetSchools,
  adminView = null,
}: Props) {
  const router = useRouter();
  const [tutorQ, setTutorQ] = useState<ExamQuestion | null>(null);
  const isAdminView = Boolean(adminView);

  const graded: Graded[] = questions.map((q) => {
    const a = flatAnswer(answers[q.id]);
    const empty = a === "";
    const correct = !empty && gradeAnswer({
      type: q.type,
      correct: q.correct,
      answerSchema: q.answerSchema ?? null,
    }, a).correct;
    return { q, answer: a, correct, empty, earned: correct ? q.points : 0 };
  });

  const correctCount = graded.filter((g) => g.correct).length;
  const wrongCount = graded.filter((g) => !g.correct && !g.empty).length;
  const skipCount = graded.filter((g) => g.empty).length;
  const score10 = ((attempt.earned / Math.max(1, attempt.total)) * 10).toFixed(1);
  const scorePct = attempt.score;

  const byTopic = new Map<string, { correct: number; total: number; points: number; max: number }>();
  graded.forEach((g) => {
    const tid = g.q.topic;
    const slot = byTopic.get(tid) ?? { correct: 0, total: 0, points: 0, max: 0 };
    slot.total += 1;
    slot.max += g.q.points;
    if (g.correct) {
      slot.correct += 1;
      slot.points += g.q.points;
    }
    byTopic.set(tid, slot);
  });

  return (
    <div className="main">
      <TopBar
        crumbs={
          isAdminView
            ? [
                { label: "Quản trị", href: "/admin?tab=overview" },
                { label: "Tài khoản", href: "/admin?tab=users" },
                `Bài làm của ${adminView?.ownerName ?? "học sinh"}`,
              ]
            : [
                { label: "Trang chính", href: "/home" },
                { label: "Đề thi mẫu", href: "/library" },
                "Kết quả",
              ]
        }
        actions={
          isAdminView ? (
            <Link href="/admin?tab=users" className="btn">
              <Icon name="chevR" size={12} /> Trở lại danh sách
            </Link>
          ) : (
            <Fragment>
              <button className="btn" onClick={() => router.push(`/exam/${examMeta.id}`)}>
                <Icon name="refresh" /> Làm lại đề này
              </button>
              <Link href="/library" className="btn">
                <Icon name="library" /> Chọn đề khác
              </Link>
            </Fragment>
          )
        }
      />
      {isAdminView && (
        <div
          style={{
            padding: "8px 14px",
            background: "var(--surface-2)",
            borderBottom: "1px solid var(--border)",
            fontSize: 12.5,
          }}
        >
          <b>Chế độ admin:</b> đang xem bài làm của{" "}
          <b>{adminView?.ownerName}</b> · tính năng &quot;Hỏi AI&quot; bị tắt.
        </div>
      )}
      <div className="content">
        <div className="score-hero" style={{ marginBottom: 24 }}>
          <Donut
            value={attempt.earned}
            max={Math.max(1, attempt.total)}
            size={140}
            color="var(--accent)"
            label={score10}
            subLabel="/ 10"
          />
          <div className="score-summary" style={{ flex: 1 }}>
            <div className="row" style={{ gap: 10, marginBottom: 4 }}>
              <Pill tone={school.tone}>
                <span className="dot" />{school.short}
              </Pill>
              <KindBadge kind={examMeta.kind} compact />
              <span className="eyebrow">{examMeta.year}</span>
            </div>
            <h2>
              Điểm tổng:{" "}
              <span className="mono" style={{ color: "var(--accent-ink)" }}>{score10}/10</span>
            </h2>
            <p>
              {examMeta.title} · {scorePct}% —{" "}
              {scorePct >= 80
                ? "Xuất sắc, con đã sẵn sàng!"
                : scorePct >= 65
                  ? "Khá tốt, còn vài chỗ cần luyện."
                  : scorePct >= 50
                    ? "Tạm ổn, mình cùng xem lại các câu sai nhé."
                    : "Cố lên! Khỉ con sẽ giúp con hiểu từng câu."}
            </p>
            <div className="score-stats">
              <div className="stat">
                <div className="k">Đúng</div>
                <div className="v" style={{ color: "var(--success)" }}>
                  {correctCount}
                  <small style={{ fontSize: 13, color: "var(--ink-muted)" }}>/{questions.length}</small>
                </div>
              </div>
              <div className="stat">
                <div className="k">Sai</div>
                <div className="v" style={{ color: "var(--danger)" }}>{wrongCount}</div>
              </div>
              <div className="stat">
                <div className="k">Bỏ trống</div>
                <div className="v" style={{ color: "var(--ink-muted)" }}>{skipCount}</div>
              </div>
              <div className="stat">
                <div className="k">Thời gian dùng</div>
                <div className="v">
                  {Math.round(attempt.durationSec / 60)}
                  <small style={{ fontSize: 13, color: "var(--ink-muted)" }}>/{examMeta.minutes}p</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid cols-2" style={{ gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <Card title="Phân tích theo chuyên đề" sub="Điểm số con đạt được trong từng nhóm">
            <div className="col" style={{ gap: 12 }}>
              {Array.from(byTopic.entries()).map(([tid, st]) => {
                const t = topics.find((x) => x.id === tid) ?? { id: tid, name: tid, short: tid, color: "var(--ink-muted)" };
                const pct = st.max > 0 ? (st.points / st.max) * 100 : 0;
                return (
                  <div key={tid}>
                    <div className="row between" style={{ marginBottom: 4 }}>
                      <span className="row" style={{ gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 2, background: t.color }} />
                        <b style={{ fontSize: 13 }}>{t.name}</b>
                        <span className="muted" style={{ fontSize: 11.5 }}>
                          {st.correct}/{st.total} câu
                        </span>
                      </span>
                      <b
                        className="mono"
                        style={{
                          fontSize: 13,
                          color: pct >= 70 ? "var(--success)" : pct >= 50 ? "var(--ink)" : "var(--danger)",
                        }}
                      >
                        {Math.round(pct)}%
                      </b>
                    </div>
                    <Bar value={pct} tone={pct >= 70 ? "" : pct >= 50 ? "ltv" : "ntt"} />
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Mức độ sẵn sàng hiện tại" sub="Cập nhật sau khi nộp bài">
            <div className="col" style={{ gap: 14 }}>
              {targetSchools.map((s) => (
                <div key={s.id}>
                  <div className="row between" style={{ marginBottom: 4 }}>
                    <span className="row" style={{ gap: 8 }}>
                      <span className={"pill " + s.tone}>{s.short}</span>
                      <span style={{ fontSize: 13 }}>{s.name}</span>
                    </span>
                    <span className="mono" style={{ fontSize: 13 }}>
                      <b style={{ color: s.current >= 70 ? "var(--success)" : s.current >= 50 ? "var(--ink)" : "var(--danger)" }}>
                        {s.current}%
                      </b>
                    </span>
                  </div>
                  <Bar value={s.current} tone={s.tone} tall />
                </div>
              ))}
              <div
                style={{
                  marginTop: 4,
                  padding: 12,
                  background: "var(--accent-soft)",
                  borderRadius: 8,
                  fontSize: 12.5,
                  color: "var(--accent-ink)",
                }}
              >
                <b><Icon name="sparkle" size={12} /> Gợi ý của Khỉ con:</b> Xem chi tiết phân tích chuyên đề cần cải thiện trên trang chính.
              </div>
            </div>
          </Card>
        </div>

        <div className="row between" style={{ margin: "8px 0 16px" }}>
          <h3 style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>Xem lại từng câu</h3>
          <div className="row" style={{ gap: 8 }}>
            <Pill tone="green">{correctCount} đúng</Pill>
            <Pill tone="red">{wrongCount} sai</Pill>
            <Pill>{skipCount} bỏ</Pill>
          </div>
        </div>

        <div className="col" style={{ gap: 10 }}>
          {graded.map((g) => {
            const t = topics.find((x) => x.id === g.q.topic) ?? { id: g.q.topic, name: g.q.topic, short: g.q.topic, color: "var(--ink-muted)" };
            const klass = g.empty ? "skip" : g.correct ? "ok" : "no";
            const sectionHeader = getExamSectionHeader(examMeta.sections, g.q.num);
            return (
              <Fragment key={g.q.id}>
                {sectionHeader && (
                  <div
                    style={{
                      margin: "24px 0 12px",
                      padding: "12px 16px",
                      background: "var(--surface-3)",
                      borderLeft: "4px solid var(--accent)",
                      borderRadius: "0 8px 8px 0",
                      fontWeight: 600,
                      fontSize: 14.5,
                      letterSpacing: "-0.01em",
                      color: "var(--ink)",
                    }}
                  >
                    {sectionHeader}
                  </div>
                )}
                <div className={"review-q " + klass}>
                  <div className="num">Câu {g.q.num}.</div>
                  <div>
                    <div className="stem">
                      <div style={{ marginBottom: 6 }}><MathText text={g.q.stem} /></div>
                      {g.q.figure && <ExamFigure figure={g.q.figure} />}
                      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                        <Pill>
                          <span className="dot" style={{ background: t.color }} />{t.short}
                        </Pill>
                        <Pill tone={g.q.grade === "NC" ? "red" : ""}>{g.q.grade}</Pill>
                        <span style={{ fontSize: 13 }}>
                          Trả lời:{" "}
                          {g.empty ? (
                            <span className="muted">bỏ trống</span>
                          ) : (
                            <span className={"ans " + (g.correct ? "ok" : "no")}>{g.answer}</span>
                          )}
                          {!g.correct && !g.empty && (
                            <span> · đúng: <span className="ans ok">{g.q.correct}</span></span>
                          )}
                          {g.empty && <span> · đúng: <span className="ans ok">{g.q.correct}</span></span>}
                        </span>
                      </div>
                    </div>
                    {g.q.modelAnswer && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: "12px 14px",
                          background: "var(--surface-2)",
                          borderRadius: 8,
                          fontSize: 13,
                          borderLeft: "3px solid var(--accent)",
                          color: "var(--ink)",
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--accent)" }}>
                          Lời giải chi tiết:
                        </div>
                        <div style={{ lineHeight: 1.6 }} className="solution-text">
                          <MathText text={g.q.modelAnswer} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="actions">
                    {isAdminView ? null : !g.correct ? (
                      <button className="btn sm primary" onClick={() => setTutorQ(g.q)}>
                        <Icon name="sparkle" size={12} /> Hỏi AI
                      </button>
                    ) : (
                      <button className="btn sm ghost" onClick={() => setTutorQ(g.q)}>
                        <Icon name="eye" size={12} /> Xem giải
                      </button>
                    )}
                  </div>
                </div>
              </Fragment>
            );
          })}

        </div>
      </div>

      {tutorQ && !isAdminView && (
        <AITutor
          question={tutorQ}
          topicShort={(topics.find((t) => t.id === tutorQ.topic) ?? { short: tutorQ.topic }).short}
          studentAnswer={flatAnswer(answers[tutorQ.id])}
          onClose={() => setTutorQ(null)}
        />
      )}
    </div>
  );
}
