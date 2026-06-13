"use client";

import { Fragment, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Pill, KindBadge } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { Question } from "@/components/Question";
import { hms } from "@/lib/fmt";
import { getExamSectionHeader } from "@/lib/exam";
import type { AnswerValue, ExamMeta, ExamQuestion } from "@/lib/exam";

import { submitExam } from "./actions";

interface Props {
  exam: ExamMeta;
  school: { short: string; tone: string };
  questions: ExamQuestion[];
  topics: { id: string; short: string; color: string }[];
}

const isAnswered = (q: ExamQuestion, a: AnswerValue): boolean => {
  if (a === undefined || a === null) return false;
  if (typeof a === "string") return a.trim() !== "";
  return Boolean(a.text?.trim()) || (a.drawings?.length ?? 0) > 0;
};

export function ExamRunner({ exam, school, questions, topics }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(exam.minutes * 60);
  const [paused, setPaused] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (paused || submitted) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [paused, submitted]);

  const doSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    const duration = exam.minutes * 60 - secondsLeft;
    startTransition(async () => {
      try {
        const { attemptId } = await submitExam({
          examId: exam.id,
          answers: answers as Record<string, unknown>,
          durationSec: duration,
        });
        router.push(`/exam/${exam.id}/results/${attemptId}`);
      } catch {
        setSubmitted(false);
      }
    });
  };

  useEffect(() => {
    if (secondsLeft === 0) doSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const totalQs = questions.length;
  const answered = questions.filter((q) => isAnswered(q, answers[q.id])).length;
  const progress = (answered / totalQs) * 100;
  const timerTone = secondsLeft < 300 ? "danger" : secondsLeft < 600 ? "warn" : "";

  return (
    <div className="exam-shell">
      <div className="exam-topbar">
        <button className="btn ghost" onClick={() => setShowExit(true)}>
          <Icon name="back" /> Thoát phòng thi
        </button>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <div className="row" style={{ gap: 8 }}>
            <span className={"pill " + school.tone} style={{ fontWeight: 600 }}>
              <span className="dot" />{school.short}
            </span>
            <KindBadge kind={exam.kind} compact />
            <b style={{ fontSize: 14, letterSpacing: "-0.005em" }}>{exam.title}</b>
            <span className="muted" style={{ fontSize: 12.5 }}>· {exam.year}</span>
          </div>
          <span className="muted" style={{ fontSize: 11.5 }}>
            {answered}/{totalQs} câu đã trả lời ·
            {Object.values(flags).filter(Boolean).length > 0 && (
              <span> {Object.values(flags).filter(Boolean).length} câu đánh dấu ·</span>
            )}
            <span> {exam.minutes} phút làm bài</span>
          </span>
        </div>
        <div className="spacer" />
        <div className="row" style={{ gap: 8 }}>
          <button
            className="icon-btn"
            onClick={() => setPaused((p) => !p)}
            title={paused ? "Tiếp tục" : "Tạm dừng"}
          >
            <Icon name={paused ? "bolt" : "pause"} />
          </button>
          <div className={"exam-timer " + timerTone}>{hms(secondsLeft)}</div>
          <button className="btn primary" onClick={() => setShowConfirm(true)} disabled={pending}>
            Nộp bài <Icon name="check" stroke={2.5} />
          </button>
        </div>
      </div>

      <div
        style={{ height: 3, background: "var(--border-soft)", position: "sticky", top: 64, zIndex: 9 }}
      >
        <div style={{ height: "100%", width: progress + "%", background: "var(--accent)", transition: "width 0.3s" }} />
      </div>

      <div className="exam-body">
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
          <h1 style={{ fontSize: 22, margin: "0 0 6px", letterSpacing: "-0.02em" }}>{exam.title}</h1>
          <div className="muted" style={{ fontSize: 13.5 }}>{exam.intro}</div>
          <div
            style={{
              marginTop: 14,
              padding: 10,
              background: "var(--warn-soft)",
              borderRadius: 8,
              fontSize: 12.5,
              color: "oklch(0.4 0.1 70)",
              border: "1px solid oklch(0.92 0.06 80)",
            }}
          >
            <Icon name="lock" size={12} /> <b>Chế độ tập trung:</b> Trong khi làm bài, con không thể hỏi AI. AI tutor sẽ mở sau khi nộp bài.
          </div>
        </div>

        {questions.map((q) => {
          const sectionHeader = getExamSectionHeader(exam.sections, q.num);
          return (
            <Fragment key={q.id}>
              {sectionHeader && (
                <div
                  style={{
                    margin: "32px 0 16px",
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
              <Question
                q={q}
                topics={topics}
                value={answers[q.id]}
                onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                flagged={!!flags[q.id]}
                onFlag={() => setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))}
              />
            </Fragment>
          );
        })}


        <div
          style={{
            marginTop: 32,
            padding: 24,
            background: "var(--surface-2)",
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <h3 style={{ margin: "0 0 6px" }}>Đã xong hết các câu hỏi</h3>
          <p className="muted" style={{ margin: "0 0 16px", fontSize: 13.5 }}>
            Con đã trả lời <b>{answered}/{totalQs}</b> câu. Kiểm tra lại các câu đánh dấu trước khi nộp.
          </p>
          <button className="btn primary lg" onClick={() => setShowConfirm(true)} disabled={pending}>
            Nộp bài và xem kết quả <Icon name="arrow" />
          </button>
        </div>
      </div>

      <div className="exam-rail">
        <h6>Bản đồ câu hỏi</h6>
        <div className="q-grid">
          {questions.map((q) => (
            <button
              key={q.id}
              className={
                (isAnswered(q, answers[q.id]) ? "answered " : "") +
                (flags[q.id] ? "flagged" : "")
              }
              title={`Câu ${q.num}${flags[q.id] ? " — đánh dấu" : ""}`}
              onClick={() => {
                const el = document.getElementById(`q-${q.id}`);
                if (el) window.scrollTo({ top: el.offsetTop - 90, behavior: "smooth" });
              }}
            >
              {q.num}
            </button>
          ))}
        </div>
        <div className="hr" />
        <div style={{ fontSize: 11.5, color: "var(--ink-muted)", lineHeight: 1.5 }}>
          <div className="row" style={{ gap: 6, marginBottom: 4 }}>
            <span style={{ width: 10, height: 10, background: "var(--accent)", borderRadius: 2 }} /> Đã trả lời
          </div>
          <div className="row" style={{ gap: 6, marginBottom: 4 }}>
            <span style={{ width: 10, height: 10, background: "var(--warn)", borderRadius: 2 }} /> Đánh dấu xem lại
          </div>
          <div className="row" style={{ gap: 6 }}>
            <span style={{ width: 10, height: 10, background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 2 }} /> Chưa làm
          </div>
        </div>
      </div>

      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Nộp bài?"
        actions={
          <Fragment>
            <button className="btn" onClick={() => setShowConfirm(false)}>
              Quay lại làm tiếp
            </button>
            <button className="btn primary" onClick={doSubmit} disabled={pending}>
              {pending ? "Đang nộp…" : "Nộp bài"}
            </button>
          </Fragment>
        }
      >
        Con đã trả lời <b>{answered}/{totalQs}</b> câu.
        {totalQs - answered > 0 && (
          <span>
            {" "}Còn <b style={{ color: "var(--warn)" }}>{totalQs - answered} câu chưa làm</b> — nếu nộp bây giờ những câu đó sẽ tính là sai.
          </span>
        )}
        <br />
        <br />
        Sau khi nộp, con sẽ xem được điểm số, lời giải chi tiết, và <b>được hỏi AI</b> về từng câu.
      </Modal>

      <Modal
        open={showExit}
        onClose={() => setShowExit(false)}
        title="Thoát phòng thi?"
        actions={
          <Fragment>
            <button className="btn" onClick={() => setShowExit(false)}>Ở lại làm tiếp</button>
            <button className="btn danger" onClick={() => router.push("/home")}>
              Thoát (không lưu)
            </button>
          </Fragment>
        }
      >
        Nếu thoát bây giờ, các câu trả lời của con sẽ không được lưu lại.
      </Modal>
    </div>
  );
}
