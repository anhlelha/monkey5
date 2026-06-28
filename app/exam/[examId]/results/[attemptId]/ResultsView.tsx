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
import { regradeEssays } from "../../actions";
import { WRITING_CRITERIA_LABELS, VN_WRITING_CRITERIA_LABELS } from "@/lib/llm/providers";

export interface EssayGradeView {
  earned: number;
  points: number;
  fraction: number;
  answerCorrect: boolean;
  methodScore: number;
  guessed: boolean;
  feedback: string;
  provider: string;
  model: string;
  status: "graded" | "error";
  /** "math" | "writing" (english) | "vietnamese" */
  kind?: string;
  /** JSON string of per-criterion scores, e.g. { task: 0.8, ... } */
  criteria?: string;
}

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
  essayGrades: Record<string, EssayGradeView>;
  attemptId: string;
  attempt: { earned: number; total: number; score: number; durationSec: number };
  topics: { id: string; name: string; short: string; color: string }[];
  targetSchools: { id: string; short: string; name: string; tone: string; current: number }[];
  adminView?: { ownerName: string; userId: string } | null;
}

interface Graded {
  q: ExamQuestion;
  answer: string;
  correct: boolean;
  empty: boolean;
  earned: number;
  essay?: EssayGradeView;
}

/** An essay counts as a "correct" question (stats only) at/above this fraction. */
const ESSAY_PASS_FRACTION = 0.5;
/** Round earned points for display (quarter-point granularity). */
const fmtPts = (n: number): string =>
  (Math.round(n * 100) / 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 });

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
  essayGrades,
  attemptId,
  attempt,
  topics,
  targetSchools,
  adminView = null,
}: Props) {
  const router = useRouter();
  const [tutorQ, setTutorQ] = useState<ExamQuestion | null>(null);
  const [regrading, setRegrading] = useState(false);
  const [regradeMsg, setRegradeMsg] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);
  const isAdminView = Boolean(adminView);

  const graded: Graded[] = questions.map((q) => {
    const a = flatAnswer(answers[q.id]);
    const empty = a === "";
    if (q.type === "essay") {
      const eg = essayGrades[q.id];
      const correct = Boolean(eg) && eg.fraction >= ESSAY_PASS_FRACTION;
      return { q, answer: a, correct, empty, earned: eg?.earned ?? 0, essay: eg };
    }
    const correct = !empty && gradeAnswer({
      type: q.type,
      correct: q.correct,
      answerSchema: q.answerSchema ?? null,
    }, a).correct;
    return { q, answer: a, correct, empty, earned: correct ? q.points : 0 };
  });

  const hasEssays = questions.some((q) => q.type === "essay");

  const onRegrade = async () => {
    setRegradeMsg(null);
    setRegrading(true);
    try {
      await regradeEssays({ examId: examMeta.id, attemptId });
      router.refresh();
      setRegradeMsg({ tone: "ok", msg: "Đã chấm lại các câu tự luận bằng AI." });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Không chấm lại được.";
      setRegradeMsg({ tone: "err", msg });
    } finally {
      setRegrading(false);
    }
  };

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
    slot.points += g.earned;
    if (g.correct) slot.correct += 1;
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
                {
                  label: adminView?.ownerName ?? "Chi tiết HS",
                  href: `/admin/users/${adminView?.userId}`,
                },
                "Bài làm",
              ]
            : examMeta.id.startsWith("vn")
            ? [
                { label: "Tiếng Việt", href: "/vietnamese" },
                { label: "Đề thi mẫu", href: "/vietnamese/library" },
                "Kết quả",
              ]
            : examMeta.id.startsWith("en")
            ? [
                { label: "Tiếng Anh", href: "/english" },
                { label: "Đề thi mẫu", href: "/english/library" },
                "Kết quả",
              ]
            : [
                { label: "Trang chính", href: "/home" },
                { label: "Đề thi mẫu", href: "/library" },
                "Kết quả",
              ]
        }
        actions={
          isAdminView ? (
            <Link href={`/admin/users/${adminView?.userId}`} className="btn">
              <Icon name="chevL" size={12} /> Trở lại hồ sơ HS
            </Link>
          ) : (
            <Fragment>
              <button className="btn" onClick={() => router.push(`/exam/${examMeta.id}`)}>
                <Icon name="refresh" /> Làm lại đề này
              </button>
              <Link href={examMeta.id.startsWith("vn") ? "/vietnamese/library" : examMeta.id.startsWith("en") ? "/english/library" : "/library"} className="btn">
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
          <div className="row between" style={{ alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span>
              <b>Chế độ admin:</b> đang xem bài làm của{" "}
              <b>{adminView?.ownerName}</b> · tính năng &quot;Hỏi AI&quot; bị tắt.
            </span>
            {hasEssays && (
              <span className="row" style={{ gap: 8, alignItems: "center" }}>
                {regradeMsg && (
                  <span style={{ color: regradeMsg.tone === "ok" ? "var(--success)" : "var(--danger)", fontSize: 12 }}>
                    {regradeMsg.msg}
                  </span>
                )}
                <button className="btn sm primary" onClick={onRegrade} disabled={regrading}>
                  <Icon name="sparkle" size={12} /> {regrading ? "Đang chấm…" : "Chấm lại tự luận bằng AI"}
                </button>
              </span>
            )}
          </div>
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
                        {g.q.source && (
                          <Pill tone={g.q.source.startsWith("Trích đề") ? "cg" : ""}>
                            <Icon name="school" size={11} /> {g.q.source}
                          </Pill>
                        )}
                        {isAdminView && g.q.sourceQuestionId && (
                          <span
                            className="mono"
                            title="ID câu hỏi trong ngân hàng (truy vết)"
                            style={{
                              fontSize: 11,
                              padding: "2px 6px",
                              border: "1px dashed var(--border)",
                              borderRadius: 4,
                              color: "var(--ink-muted)",
                              background: "var(--surface-2)",
                            }}
                          >
                            {g.q.sourceQuestionId}
                          </span>
                        )}
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
                    {g.q.type === "essay" && (g.essay ? (
                      <div
                        style={{
                          marginTop: 12,
                          padding: "12px 14px",
                          background: "var(--surface-2)",
                          borderRadius: 8,
                          fontSize: 13,
                          borderLeft: `3px solid ${g.essay.status === "error" ? "var(--danger)" : "var(--accent)"}`,
                          color: "var(--ink)",
                        }}
                      >
                        <div className="row between" style={{ marginBottom: 6 }}>
                          <span className="row" style={{ gap: 8, alignItems: "center" }}>
                            <div className="ai-mark">AI</div>
                            <b>AI chấm: {fmtPts(g.essay.earned)}/{g.essay.points} điểm</b>
                          </span>
                          {g.essay.model && (
                            <span className="muted" style={{ fontSize: 11 }}>
                              {g.essay.provider} · {g.essay.model}
                            </span>
                          )}
                        </div>
                        {g.essay.status === "error" ? (
                          <div style={{ color: "var(--danger)" }}>
                            AI chưa chấm được câu này.{g.essay.feedback ? ` ${g.essay.feedback}` : ""}
                          </div>
                        ) : (
                          <>
                            {(() => {
                              const isWritingKind = g.essay.kind === "writing" || g.essay.kind === "vietnamese";
                              if (isWritingKind) {
                                // Per-criterion scores for writing/vietnamese essays
                                let criteriaObj: Record<string, number> = {};
                                try { criteriaObj = JSON.parse(g.essay.criteria ?? "{}"); } catch {}
                                const labels: Record<string, string> =
                                  g.essay.kind === "vietnamese"
                                    ? (VN_WRITING_CRITERIA_LABELS as Record<string, string>)
                                    : (WRITING_CRITERIA_LABELS as Record<string, string>);
                                const criteriaEntries = Object.entries(criteriaObj);
                                return (
                                  <>
                                    {criteriaEntries.length > 0 && (
                                      <div className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                                        {criteriaEntries.map(([key, score]) => {
                                          const pct = Math.round((score as number) * 100);
                                          const tone = pct >= 70 ? "green" : pct >= 40 ? "amber" : "red";
                                          return (
                                            <Pill key={key} tone={tone}>
                                              {labels[key] ?? key}: {pct}%
                                            </Pill>
                                          );
                                        })}
                                      </div>
                                    )}
                                    {g.essay.feedback && (
                                      <div style={{ lineHeight: 1.6 }} className="solution-text">
                                        {g.essay.feedback}
                                      </div>
                                    )}
                                  </>
                                );
                              }
                              // Default math essay rendering
                              return (
                                <>
                                  <div className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                                    <Pill tone={g.essay.answerCorrect ? "green" : "red"}>
                                      {g.essay.answerCorrect ? "Đáp số đúng" : "Đáp số sai"}
                                    </Pill>
                                    <Pill tone={g.essay.methodScore >= 0.7 ? "green" : g.essay.methodScore >= 0.4 ? "amber" : "red"}>
                                      Cách làm {Math.round(g.essay.methodScore * 100)}%
                                    </Pill>
                                    {g.essay.guessed && <Pill tone="amber">Nghi đoán mò ra đáp số</Pill>}
                                  </div>
                                  {g.essay.feedback && (
                                    <div style={{ lineHeight: 1.6 }} className="solution-text">
                                      {g.essay.feedback}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </>
                        )}
                        {g.q.correct && (
                          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                            Đáp số đúng: <b>{g.q.correct}</b>{g.q.unit ? ` ${g.q.unit}` : ""}
                          </div>
                        )}
                      </div>
                    ) : !g.empty ? (
                      <div
                        style={{
                          marginTop: 12,
                          padding: "10px 14px",
                          background: "var(--surface-2)",
                          borderRadius: 8,
                          fontSize: 12.5,
                          color: "var(--ink-muted)",
                        }}
                      >
                        Câu tự luận chưa được AI chấm.{" "}
                        {isAdminView ? 'Bấm "Chấm lại bằng AI" ở đầu trang.' : "Quản trị viên sẽ chấm sau."}
                      </div>
                    ) : null)}

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
