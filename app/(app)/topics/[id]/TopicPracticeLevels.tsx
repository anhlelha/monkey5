"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";

interface Level {
  id: string;
  label: string;
  sub: string;
  q: number;
  mins: number;
  tone: string;
  stubId: string;
}

interface Props {
  topicId: string;
  levels: Level[];
  remaining: number;
  limitReached?: boolean;
}

export function TopicPracticeLevels({ topicId, levels, remaining, limitReached }: Props) {
  const [sourceFilter, setSourceFilter] = useState<"all" | "official" | "supplement">("all");
  
  // Stable random suffix per filter selection to avoid URL updates on simple re-renders
  const rand = useMemo(() => Math.random().toString(36).slice(-4), [sourceFilter]);

  const exhausted = Number.isFinite(remaining) && remaining <= 0;

  const cardInner = (L: Level, disabled: boolean) => (
    <>
      <div className="row between">
        <div className="row" style={{ gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: `color-mix(in oklch, ${L.tone}, white 84%)`,
              color: L.tone,
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {L.id}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{L.label}</div>
            <div className="muted" style={{ fontSize: 11.5 }}>{L.sub}</div>
          </div>
        </div>
        {!disabled && <Icon name="arrow" />}
      </div>
      <div className="row between" style={{ marginTop: 4, fontSize: 11.5, color: "var(--ink-muted)" }}>
        <span>~{L.q} câu</span>
        <span>{L.mins} phút</span>
        <span className="row" style={{ gap: 4 }}>
          {disabled ? (
            <span style={{ color: "var(--warn)" }}>Hết lượt</span>
          ) : (
            <>
              <Icon name="sparkle" size={11} />
              Câu mới mỗi lần
            </>
          )}
        </span>
      </div>
    </>
  );

  const filterStub = sourceFilter === "all" ? "all" : sourceFilter === "official" ? "off" : "sup";

  return (
    <>
      <div className="section-title" style={{ marginTop: 28, marginBottom: 12 }}>Luyện bài mới</div>
      
      {/* Source Selector Tab Bar */}
      <div 
        style={{
          display: "inline-flex",
          background: "var(--bg-soft, #f4f4f5)",
          padding: 4,
          borderRadius: 10,
          gap: 4,
          marginBottom: 16,
          border: "1px solid var(--border, #e4e4e7)"
        }}
      >
        <button
          type="button"
          onClick={() => setSourceFilter("all")}
          style={{
            padding: "6px 14px",
            borderRadius: 7,
            border: "none",
            background: sourceFilter === "all" ? "var(--bg, #ffffff)" : "transparent",
            color: sourceFilter === "all" ? "var(--ink, #18181b)" : "var(--ink-muted, #71717a)",
            fontWeight: sourceFilter === "all" ? 600 : 500,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: sourceFilter === "all" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="sparkle" size={12} />
          Tất cả
        </button>
        <button
          type="button"
          onClick={() => setSourceFilter("official")}
          style={{
            padding: "6px 14px",
            borderRadius: 7,
            border: "none",
            background: sourceFilter === "official" ? "var(--bg, #ffffff)" : "transparent",
            color: sourceFilter === "official" ? "var(--ink, #18181b)" : "var(--ink-muted, #71717a)",
            fontWeight: sourceFilter === "official" ? 600 : 500,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: sourceFilter === "official" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="library" size={12} />
          Câu hỏi chính thức
        </button>
        <button
          type="button"
          onClick={() => setSourceFilter("supplement")}
          style={{
            padding: "6px 14px",
            borderRadius: 7,
            border: "none",
            background: sourceFilter === "supplement" ? "var(--bg, #ffffff)" : "transparent",
            color: sourceFilter === "supplement" ? "var(--ink, #18181b)" : "var(--ink-muted, #71717a)",
            fontWeight: sourceFilter === "supplement" ? 600 : 500,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: sourceFilter === "supplement" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="plus" size={12} />
          Câu hỏi bổ trợ
        </button>
      </div>

      <p className="muted" style={{ margin: "0 0 6px", fontSize: 12.5 }}>
        Mỗi lần bấm, Khỉ con đẩy ra một bài mới từ ngân hàng câu hỏi — không trùng bài cũ.
      </p>
      <p className="muted" style={{ margin: "0 0 14px", fontSize: 12.5 }}>
        {Number.isFinite(remaining) ? (
          <>Còn <b className="mono" style={{ color: "var(--ink)" }}>{remaining}</b> lượt luyện</>
        ) : (
          <>Không giới hạn lượt luyện</>
        )}
      </p>
      {limitReached && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "color-mix(in oklch, var(--warn), white 82%)",
            color: "var(--ink)",
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          Bạn đã hết lượt luyện ở gói hiện tại — nâng cấp để luyện thêm.
        </div>
      )}
      <div className="grid cols-2" style={{ gap: 10 }}>
        {levels.map((L) => {
          const stubId = `set-${topicId}-${L.id.toLowerCase()}-${filterStub}-${rand}`;
          return exhausted ? (
            <div
              key={L.id}
              className="topic-card"
              style={{ padding: 16, opacity: 0.55, cursor: "default" }}
            >
              {cardInner(L, true)}
            </div>
          ) : (
            <Link
              key={L.id}
              href={`/exam/${stubId}`}
              className="topic-card"
              style={{ padding: 16 }}
            >
              {cardInner(L, false)}
            </Link>
          );
        })}
      </div>
    </>
  );
}
