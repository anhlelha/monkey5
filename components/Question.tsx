"use client";

import { Icon } from "./Icon";
import { Pill } from "./ui";
import { MathInput } from "./MathInput";
import { MathText } from "./MathText";
import { ExamFigure } from "./ExamFigure";
import type { ExamQuestion, AnswerValue } from "@/lib/exam";
import { gradeAnswer } from "@/lib/grading";

interface TopicLite {
  id: string;
  short: string;
  color: string;
}

interface Props {
  q: ExamQuestion;
  topics: TopicLite[];
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  flagged?: boolean;
  onFlag?: () => void;
  readOnly?: boolean;
  hidePassage?: boolean;
}

const essayValue = (v: AnswerValue): { text: string; drawings: string[] } => {
  if (v && typeof v === "object") return { text: v.text ?? "", drawings: v.drawings ?? [] };
  return { text: (v as string) ?? "", drawings: [] };
};

export function Question({ q, topics, value, onChange, flagged, onFlag, readOnly, hidePassage }: Props) {
  const topic = topics.find((t) => t.id === q.topic) ?? { id: q.topic, short: q.topic, color: "var(--ink-muted)" };
  const v = typeof value === "string" ? value : "";

  // Lazy-grade in review mode so the badge/coloring matches what the server scored.
  const fillCorrect = readOnly && q.type === "fill"
    ? gradeAnswer({ type: "fill", correct: q.correct, answerSchema: q.answerSchema ?? null }, v).correct
    : false;
  const essayText = (() => {
    if (value && typeof value === "object") return value.text ?? "";
    return (value as string) ?? "";
  })();
  const essayCorrect = readOnly && q.type === "essay"
    ? gradeAnswer({ type: "essay", correct: q.correct, answerSchema: q.answerSchema ?? null }, essayText).correct
    : false;

  return (
    <div className="question" id={`q-${q.id}`}>
      <div className="q-num">Câu {q.num}.</div>
      <div className="q-body">
        {q.passage && !hidePassage && (
          <div className="q-passage">
            {q.passage.title && <div className="q-passage-title">{q.passage.title}</div>}
            <div className="q-passage-body">
              {q.passage.body.split(/\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        )}

        <div className="q-stem"><MathText text={q.stem} /></div>

        {q.figure && <ExamFigure figure={q.figure} />}

        <div className="q-tags">
          <Pill style={{ borderColor: topic.color }}>
            <span className="dot" style={{ background: topic.color }} />{topic.short}
          </Pill>
          <Pill tone={q.grade === "NC" ? "red" : q.grade === "L4+5" ? "amber" : ""}>{q.grade}</Pill>
          {q.source && (
            <Pill tone={q.source.startsWith("Trích đề") ? "cg" : ""}>
              <Icon name="school" size={11} /> {q.source}
            </Pill>
          )}
          {q.type === "essay" && <Pill tone="solid">Tự luận · {q.points}đ</Pill>}
          {!readOnly && onFlag && (
            <button
              className="chip"
              style={{
                padding: "2px 9px",
                fontSize: 11.5,
                background: flagged ? "var(--warn)" : undefined,
                borderColor: flagged ? "var(--warn)" : undefined,
                color: flagged ? "white" : undefined,
              }}
              onClick={onFlag}
            >
              <Icon name="flag" size={11} /> {flagged ? "Đã đánh dấu" : "Đánh dấu xem lại"}
            </button>
          )}
        </div>

        {q.type === "fill" && (
          <div className="q-answer">
            <label>Đáp án</label>
            <div className="q-input-row">
              <input
                className="input"
                type="text"
                placeholder={q.placeholder ?? ""}
                value={v}
                readOnly={readOnly}
                onChange={(e) => onChange(e.target.value)}
                style={
                  readOnly
                    ? {
                        background: fillCorrect ? "var(--success-soft)" : "var(--danger-soft)",
                        color: fillCorrect ? "var(--success)" : "var(--danger)",
                        borderColor: fillCorrect ? "var(--success)" : "var(--danger)",
                      }
                    : undefined
                }
              />
              {q.unit && <span className="unit">{q.unit}</span>}
              {readOnly && !fillCorrect && (
                <span style={{ fontSize: 13, color: "var(--ink-muted)", marginLeft: 6 }}>
                  Đáp án đúng: <b className="mono" style={{ color: "var(--success)" }}>{q.correct}</b> {q.unit}
                </span>
              )}
              {readOnly && fillCorrect && (
                <Pill tone="green">
                  <Icon name="check" size={11} stroke={3} /> Đúng
                </Pill>
              )}
            </div>
          </div>
        )}

        {q.type === "mcq" && (
          <div className="mcq-list">
            {q.options.map((o) => {
              const sel = v === o.id;
              const isCorrect = readOnly && o.id === q.correct;
              const isWrong = readOnly && sel && o.id !== q.correct;
              return (
                <div
                  key={o.id}
                  className={
                    "mcq-opt" +
                    (sel && !readOnly ? " selected" : "") +
                    (isCorrect ? " correct" : "") +
                    (isWrong ? " wrong" : "")
                  }
                  onClick={() => !readOnly && onChange(o.id)}
                >
                  <div className="marker">{o.id}</div>
                  <span style={{ flex: 1 }}><MathText text={o.text} /></span>
                  {isCorrect && <Icon name="check" size={14} stroke={2.5} />}
                  {isWrong && <Icon name="x" size={14} stroke={2.5} />}
                </div>
              );
            })}
          </div>
        )}

        {q.type === "essay" && (() => {
          const isWriting = q.subject === "english" || q.subject === "vietnamese";
          const wordCount = essayText.trim() === "" ? 0 : essayText.trim().split(/\s+/).length;
          return (
            <div className="q-answer q-essay">
              <label>{isWriting ? "Viết đoạn văn của con" : "Trình bày lời giải chi tiết"}</label>
              <MathInput
                value={essayValue(value)}
                drawings={essayValue(value).drawings}
                onChange={(next) => onChange(typeof next === "string" ? { text: next, drawings: essayValue(value).drawings } : next)}
                onDrawingsChange={(d) => onChange({ text: essayValue(value).text, drawings: d })}
                placeholder={q.placeholder ?? ""}
                readOnly={readOnly}
                rows={8}
              />
              {isWriting && (
                <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 4 }}>
                  Số từ: <b>{wordCount}</b>
                </div>
              )}
              {readOnly && !isWriting && q.modelAnswer && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 12,
                    background: "var(--surface-2)",
                    borderRadius: 8,
                    borderLeft: "3px solid " + (essayCorrect ? "var(--success)" : "var(--danger)"),
                    fontSize: 13,
                  }}
                >
                  <div className="eyebrow" style={{ marginBottom: 4 }}>Đáp số đúng</div>
                  <b className="mono">{q.modelAnswer}</b>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
