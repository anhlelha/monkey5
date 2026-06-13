"use client";

import { useEffect } from "react";
import { Pill } from "@/components/ui";
import { MathText } from "@/components/MathText";
import type { QuestionDetail } from "./actions";

const SOURCE_LABELS: Record<string, string> = {
  official: "Chính thức",
  mock: "Thi thử",
};

const SOURCE_TONES: Record<string, string> = {
  official: "solid",
  mock: "amber",
};

const TYPE_LABELS: Record<string, string> = {
  fill: "Điền số",
  mcq: "Trắc nghiệm",
  essay: "Tự luận",
};

interface Props {
  detail: QuestionDetail;
  onClose: () => void;
}

export function QuestionDetailModal({ detail, onClose }: Props) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const examLabel = [
    detail.examSchool,
    detail.examYear,
  ]
    .filter(Boolean)
    .join(" · ");

  const isUrlOrPath = (val: string) =>
    val.startsWith("http") || val.startsWith("/") || val.includes(".");

  return (
    <div
      className="tutor-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          margin: "auto",
          width: 640,
          maxWidth: "94vw",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--surface)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-3)",
          padding: 24,
          alignSelf: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="row between"
          style={{ marginBottom: 16, alignItems: "flex-start", gap: 12 }}
        >
          <div className="col" style={{ gap: 6 }}>
            <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
              <Pill tone={SOURCE_TONES[detail.source]}>
                {SOURCE_LABELS[detail.source]}
              </Pill>
              {examLabel && (
                <span className="muted" style={{ fontSize: 12, alignSelf: "center" }}>
                  {examLabel}
                </span>
              )}
            </div>
            <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
              <span className="muted" style={{ fontSize: 12 }}>
                Câu {detail.num}
              </span>
              <span className="muted" style={{ fontSize: 12 }}>·</span>
              <span className="muted" style={{ fontSize: 12 }}>
                {TYPE_LABELS[detail.type] ?? detail.type}
              </span>
              <span className="muted" style={{ fontSize: 12 }}>·</span>
              <span className="muted" style={{ fontSize: 12 }}>
                Mức: <b>{detail.grade}</b>
              </span>
              {detail.topic && (
                <>
                  <span className="muted" style={{ fontSize: 12 }}>·</span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    Chuyên đề: <b>{detail.topic}</b>
                  </span>
                </>
              )}
              {detail.points !== 1 && (
                <>
                  <span className="muted" style={{ fontSize: 12 }}>·</span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {detail.points} điểm
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            className="btn sm ghost"
            onClick={onClose}
            style={{ flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Stem */}
        <div
          style={{
            borderTop: "1px solid var(--border-soft)",
            paddingTop: 14,
            marginBottom: 16,
          }}
        >
          <div
            className="eyebrow"
            style={{ marginBottom: 8, fontSize: 11, color: "var(--ink-muted)" }}
          >
            NỘI DUNG CÂU HỎI
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.65 }}>
            <MathText text={detail.stem} />
          </div>
        </div>

        {/* Figure */}
        {detail.figure && (
          <div style={{ marginBottom: 16 }}>
            <div
              className="eyebrow"
              style={{ marginBottom: 8, fontSize: 11, color: "var(--ink-muted)" }}
            >
              HÌNH VẼ
            </div>
            {isUrlOrPath(detail.figure) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={detail.figure}
                alt="Hình minh họa"
                style={{
                  maxWidth: "100%",
                  borderRadius: "var(--r-sm)",
                  border: "1px solid var(--border)",
                }}
              />
            ) : (
              <code
                style={{
                  fontSize: 12,
                  background: "var(--surface-2)",
                  padding: "4px 8px",
                  borderRadius: "var(--r-xs)",
                  display: "inline-block",
                }}
              >
                {detail.figure}
              </code>
            )}
          </div>
        )}

        {/* MCQ options */}
        {detail.type === "mcq" && detail.options.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div
              className="eyebrow"
              style={{ marginBottom: 8, fontSize: 11, color: "var(--ink-muted)" }}
            >
              CÁC LỰA CHỌN
            </div>
            <div className="col" style={{ gap: 6 }}>
              {detail.options.map((opt) => {
                const isCorrect = opt.id === detail.correct;
                return (
                  <div
                    key={opt.id}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      padding: "8px 10px",
                      borderRadius: "var(--r-sm)",
                      background: isCorrect
                        ? "var(--success-soft)"
                        : "var(--surface-2)",
                      border: isCorrect
                        ? "1px solid var(--success)"
                        : "1px solid var(--border-soft)",
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: isCorrect ? "var(--success)" : "var(--ink-muted)",
                        minWidth: 20,
                        marginTop: 1,
                      }}
                    >
                      {opt.id}.
                    </span>
                    <span style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                      <MathText text={opt.text} />
                    </span>
                    {isCorrect && (
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 11,
                          color: "var(--success)",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        ✓ Đúng
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Answer */}
        {detail.correct && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              background: "var(--success-soft)",
              border: "1px solid var(--success)",
              borderRadius: "var(--r-sm)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--success)",
                marginBottom: 4,
                letterSpacing: "0.05em",
              }}
            >
              ĐÁP ÁN
            </div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              <MathText text={detail.correct} />
            </span>
          </div>
        )}

        {/* Model answer / solution */}
        {detail.modelAnswer && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--ink-muted)",
                marginBottom: 6,
                letterSpacing: "0.05em",
              }}
            >
              LỜI GIẢI
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.65 }}>
              <MathText text={detail.modelAnswer} />
            </div>
          </div>
        )}

        {/* Footer close button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button className="btn ghost" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
