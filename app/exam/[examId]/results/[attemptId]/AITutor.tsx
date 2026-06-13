"use client";

import { Icon } from "@/components/Icon";
import type { ExamQuestion } from "@/lib/exam";

interface Props {
  question: ExamQuestion;
  topicShort: string;
  studentAnswer: string;
  onClose: () => void;
}

export function AITutor({ question, topicShort, studentAnswer, onClose }: Props) {
  const isStudentWrong =
    studentAnswer !== "" && studentAnswer !== question.correct;

  return (
    <div
      className="tutor-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="tutor-panel">
        <div className="tutor-head">
          <div className="ai-mark">AI</div>
          <div style={{ flex: 1 }}>
            <h4>Khỉ con — Trợ giảng Socratic</h4>
            <div className="sub">Hướng dẫn từng bước · không cho đáp án ngay</div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        <div className="tutor-body">
          <div className="tutor-q-ref">
            <div className="lbl">
              Câu {question.num} · {topicShort}
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>{question.stem}</div>
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-muted)" }}>
              {isStudentWrong ? (
                <span>
                  Bài làm của con:{" "}
                  <span className="mono" style={{ color: "var(--danger)" }}>
                    {studentAnswer}
                  </span>
                </span>
              ) : studentAnswer === "" ? (
                <span>Con để trống câu này.</span>
              ) : (
                <span>Con đã làm đúng!</span>
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 14,
              background: "var(--surface-sunk)",
              borderRadius: 10,
              fontSize: 13,
              color: "var(--ink-muted)",
              border: "1px solid var(--border-soft)",
              textAlign: "center",
            }}
          >
            <Icon name="sparkle" size={14} />{" "}
            <b style={{ color: "var(--ink)" }}>Trợ giảng AI sắp ra mắt.</b>
            <div style={{ marginTop: 6 }}>
              Tính năng đối thoại Socratic đang được kết nối với mô hình AI.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
