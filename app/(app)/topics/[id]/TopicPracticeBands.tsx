"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "@/components/Icon";
import { Bar, Pill } from "@/components/ui";
import { createPracticeSetAction } from "../actions";
import {
  PRACTICE_BANDS,
  type PracticeBandState,
  type PracticeSourceFilter,
} from "@/lib/readiness-v4/practice-service";
import type { DifficultyBand } from "@/lib/readiness-v4/types";

interface Props {
  topicId: string;
  states: PracticeBandState[];
  targetSchool: string | null;
  targetSchoolName: string | null;
  requestNonce: string;
  selectedBand?: DifficultyBand | null;
  error?: string | null;
  remaining: number;
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn primary" disabled={disabled || pending}>
      {pending ? "Đang tạo bài…" : <><span>Bắt đầu</span><Icon name="arrow" size={14} /></>}
    </button>
  );
}

function countForSource(state: PracticeBandState, source: PracticeSourceFilter): number {
  if (source === "official") return state.availability.official;
  if (source === "supplement") return state.availability.supplement;
  return state.availability.total;
}

function unseenForSource(state: PracticeBandState, source: PracticeSourceFilter): number {
  if (source === "official") return state.availability.unseenOfficial;
  if (source === "supplement") return state.availability.unseenSupplement;
  return state.availability.unseen;
}

const errorCopy: Record<string, string> = {
  limit: "Bạn đã hết lượt luyện ở gói hiện tại.",
  empty: "Chưa có câu hỏi V4 hợp lệ cho lựa chọn này. Hãy thử nguồn khác hoặc dải khác.",
  "invalid-request": "Yêu cầu tạo bài không còn hiệu lực. Hãy thử lại.",
};

export function TopicPracticeBands({
  topicId,
  states,
  targetSchool,
  targetSchoolName,
  requestNonce,
  selectedBand,
  error,
  remaining,
}: Props) {
  const [sourceFilter, setSourceFilter] = useState<PracticeSourceFilter>("all");
  const exhausted = Number.isFinite(remaining) && remaining <= 0;

  return (
    <>
      <div className="row between" style={{ marginTop: 28, marginBottom: 12, alignItems: "end" }}>
        <div>
          <div className="section-title" style={{ margin: 0 }}>Chọn dải luyện V4</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Mỗi bài chỉ lấy đúng analytical topic và dải D1–D5 đã chọn.
          </div>
        </div>
        {targetSchoolName && <Pill tone="green">Theo mục tiêu {targetSchoolName}</Pill>}
      </div>

      <div className="row" style={{ gap: 4, padding: 4, border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg-soft)", width: "fit-content", marginBottom: 14 }}>
        {([
          ["all", "Tất cả", "sparkle"],
          ["official", "Câu chính thức", "library"],
          ["supplement", "Câu bổ trợ", "plus"],
        ] as const).map(([value, label, icon]) => (
          <button
            key={value}
            type="button"
            onClick={() => setSourceFilter(value)}
            className="btn sm ghost"
            aria-pressed={sourceFilter === value}
            style={{
              background: sourceFilter === value ? "var(--bg)" : "transparent",
              boxShadow: sourceFilter === value ? "0 1px 3px rgba(0,0,0,.09)" : "none",
              borderColor: "transparent",
            }}
          >
            <Icon name={icon} size={12} /> {label}
          </button>
        ))}
      </div>

      <p className="muted" style={{ margin: "0 0 14px", fontSize: 12.5 }}>
        Hệ thống ưu tiên câu chưa làm. Khi câu mới không đủ, bài sẽ ghi rõ số câu ôn lại.
        {Number.isFinite(remaining) ? <> Còn <b className="mono">{remaining}</b> lượt.</> : <> Không giới hạn lượt luyện.</>}
      </p>

      {error && errorCopy[error] && (
        <div style={{ padding: "10px 14px", borderRadius: 8, background: "color-mix(in oklch, var(--warn), white 82%)", fontSize: 13, marginBottom: 12 }}>
          {errorCopy[error]}
        </div>
      )}

      <div className="grid cols-3" style={{ gap: 12 }}>
        {PRACTICE_BANDS.map((band) => {
          const state = states.find((candidate) => candidate.band === band.id)!;
          const available = countForSource(state, sourceFilter);
          const unseen = unseenForSource(state, sourceFilter);
          const requested = band.qcount;
          const selected = Math.min(requested, available);
          const repeats = Math.max(0, selected - unseen);
          const locked = exhausted || available === 0;
          const masteryPct = state.mastery === null ? null : Math.round(state.mastery * 100);
          const evidencePct = state.evidence === null ? null : Math.round(state.evidence * 100);
          const highlighted = selectedBand === band.id;
          return (
            <form
              key={band.id}
              action={createPracticeSetAction}
              className="topic-card"
              style={{
                padding: 16,
                opacity: locked ? 0.58 : 1,
                outline: highlighted ? `2px solid ${band.tone}` : "none",
                outlineOffset: 2,
              }}
            >
              <input type="hidden" name="topic" value={topicId} />
              <input type="hidden" name="band" value={band.id} />
              <input type="hidden" name="sourceFilter" value={sourceFilter} />
              <input type="hidden" name="targetSchool" value={targetSchool ?? ""} />
              <input type="hidden" name="idempotencyKey" value={`${requestNonce}:${band.id}:${sourceFilter}`} />

              <div className="row between" style={{ alignItems: "start" }}>
                <div className="row" style={{ gap: 10 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, display: "grid", placeItems: "center", color: band.tone, background: `color-mix(in oklch, ${band.tone}, white 84%)`, fontWeight: 750, fontSize: 12 }}>
                    {band.shortLabel}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{band.label}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{band.description}</div>
                  </div>
                </div>
                {masteryPct === null ? <Pill>Chưa xác minh</Pill> : <Pill tone={masteryPct >= 70 ? "green" : masteryPct >= 55 ? "amber" : "red"}>{masteryPct}%</Pill>}
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="row between" style={{ fontSize: 11.5, marginBottom: 5 }}>
                  <span className="muted">Evidence{targetSchoolName ? ` cho ${targetSchoolName}` : ""}</span>
                  <span className="mono">
                    {state.required === null ? `${state.total} câu` : `${state.total}/${Math.ceil(state.required)} câu`}
                  </span>
                </div>
                <Bar value={evidencePct ?? 0} tone={evidencePct !== null && evidencePct >= 85 ? "" : "ltv"} />
              </div>

              <div className="row between" style={{ marginTop: 14, fontSize: 11.5 }}>
                <span><b>~{selected}</b> câu · {band.minutes} phút</span>
                {available === 0 ? (
                  <span className="muted">Chưa có ngân hàng</span>
                ) : repeats > 0 ? (
                  <span style={{ color: "var(--warn)" }}>{unseen} mới · {repeats} ôn lại</span>
                ) : (
                  <span style={{ color: "var(--success)" }}>{Math.min(unseen, selected)} câu mới</span>
                )}
              </div>

              <div style={{ marginTop: 14 }}>
                <SubmitButton disabled={locked} />
              </div>
            </form>
          );
        })}
      </div>
    </>
  );
}
