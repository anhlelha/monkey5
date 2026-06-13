"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import type { FlaggedQ, FigureQ } from "./qa-constants";
import { updateQuestion } from "./actions";
import { Card, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { ExamFigure } from "@/components/ExamFigure";

const LS_KEY = "qa-approved-figures";
const LS_KEY_ACK = "qa-acknowledged-issues";

function loadApproved(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveApproved(set: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...set]));
  } catch {}
}

function loadAcknowledged(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LS_KEY_ACK);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveAcknowledged(set: Set<string>) {
  try {
    localStorage.setItem(LS_KEY_ACK, JSON.stringify([...set]));
  } catch {}
}

// ─── Issue badge config ───────────────────────────────────────────────────────

const ISSUE_CONFIG: Record<string, { label: string; tone: string; icon: string }> = {
  FIGURE_MISSING: { label: "Hình thiếu",  tone: "amber", icon: "🖼️" },
  NO_ANSWER:      { label: "Chưa có đáp", tone: "solid", icon: "❌" },
  SHORT_STEM:     { label: "Stem ngắn",   tone: "cg",    icon: "⚡" },
};

const SCHOOL_COLORS: Record<string, string> = {
  cg: "var(--cg)", tx: "var(--tx)", ltv: "var(--ltv)", ntt: "var(--ntt)",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  flagged: FlaggedQ[];
  figures: FigureQ[];
}

// ─── Main QA panel ───────────────────────────────────────────────────────────

export function QAPanel({ flagged: initialFlagged, figures }: Props) {
  const [activeTab, setActiveTab] = useState<"issues" | "figures">("issues");
  const [flagged, setFlagged] = useState(initialFlagged);
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [issueFilter, setIssueFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Figures tab filters
  const [figSchoolFilter, setFigSchoolFilter] = useState("all");
  const [figImplFilter, setFigImplFilter] = useState<"all" | "yes" | "no">("all");

  // Figure approval state — persisted in localStorage
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [hideApproved, setHideApproved] = useState(false);

  // Issue acknowledgement state (admin reviewed & confirmed not actually an
  // error). Also persisted in localStorage; hidden by default with a toggle to
  // bring them back.
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  useEffect(() => {
    setApproved(loadApproved());
    setAcknowledged(loadAcknowledged());
  }, []);

  // Re-sync local `flagged` state when the server-side prop changes. Without
  // this, Next.js Fast Refresh (or a parent re-render after a save) could keep
  // showing a stale list while the header/tab counts diverge.
  useEffect(() => {
    setFlagged(initialFlagged);
  }, [initialFlagged]);

  const toggleApprove = useCallback((figureId: string) => {
    setApproved((prev) => {
      const next = new Set(prev);
      if (next.has(figureId)) {
        next.delete(figureId);
      } else {
        next.add(figureId);
      }
      saveApproved(next);
      return next;
    });
  }, []);

  const toggleAcknowledge = useCallback((questionId: string) => {
    setAcknowledged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      saveAcknowledged(next);
      return next;
    });
  }, []);

  const onSaved = useCallback((id: string) => {
    setFlagged((prev) => prev.filter((q) => q.id !== id));
    setEditingId(null);
  }, []);

  // Filter in client
  const visible = flagged.filter((q) => {
    if (!showAcknowledged && acknowledged.has(q.id)) return false;
    if (schoolFilter !== "all" && q.school !== schoolFilter) return false;
    if (issueFilter !== "all" && !q.issues.some((i) => i.type === issueFilter)) return false;
    return true;
  });

  const acknowledgedCount = flagged.filter((q) => acknowledged.has(q.id)).length;

  const visibleFigures = figures.filter((f) => {
    if (hideApproved && approved.has(f.figure)) return false;
    if (figSchoolFilter !== "all" && f.school !== figSchoolFilter) return false;
    if (figImplFilter === "yes" && !f.implemented) return false;
    if (figImplFilter === "no" && f.implemented) return false;
    return true;
  });

  const approvedCount = figures.filter((f) => approved.has(f.figure)).length;

  // Per-school / per-status counts for figures (always against full set, not filtered)
  const figSchoolCounts: Record<string, number> = {};
  let figImplementedCount = 0;
  let figUnimplementedCount = 0;
  for (const f of figures) {
    figSchoolCounts[f.school] = (figSchoolCounts[f.school] ?? 0) + 1;
    if (f.implemented) figImplementedCount += 1;
    else figUnimplementedCount += 1;
  }

  // Summary stats — count ACTIVE issues only (exclude acknowledged) so the
  // chips/tab reflect "what still needs review". The "Hiện cả câu đã xác nhận
  // OK (N)" toggle shows the acknowledged count separately.
  const activeFlagged = flagged.filter((q) => !acknowledged.has(q.id));
  const issueTypeCounts: Record<string, number> = {};
  const schoolCounts: Record<string, number> = {};
  for (const q of activeFlagged) {
    schoolCounts[q.school] = (schoolCounts[q.school] ?? 0) + 1;
    for (const i of q.issues) {
      issueTypeCounts[i.type] = (issueTypeCounts[i.type] ?? 0) + 1;
    }
  }

  return (
    <div>
      {/* Tab switcher */}
      <div className="admin-tabs" style={{ marginBottom: 20 }}>
        <button
          className={"tab " + (activeTab === "issues" ? "active" : "")}
          onClick={() => setActiveTab("issues")}
        >
          ⚠️ Lỗi phát hiện · {activeFlagged.length}
          {acknowledgedCount > 0 && (
            <span style={{ marginLeft: 6, fontSize: 11, color: "var(--ink-muted)", fontWeight: 400 }}>
              (+{acknowledgedCount} OK)
            </span>
          )}
        </button>
        <button
          className={"tab " + (activeTab === "figures" ? "active" : "")}
          onClick={() => setActiveTab("figures")}
        >
          🖼️ Review hình · {figures.length}
        </button>
      </div>

      {/* ── ISSUES TAB ── */}
      {activeTab === "issues" && (
        <div>
          {/* Info note */}
          <div
            style={{
              fontSize: 13, color: "var(--ink-muted)",
              padding: "8px 12px", marginBottom: 16,
              background: "var(--surface-2)", borderRadius: 8,
              borderLeft: "3px solid var(--accent)",
            }}
          >
            Watermark và Toán thô được <b>tự động sửa</b> trong pipeline seed. Danh sách này chỉ gồm các vấn đề cần review bằng mắt.
          </div>

          {/* Filters */}
          <div className="row" style={{ gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4, fontSize: 11 }}>Trường</div>
              <div className="chip-group">
                <button className={"chip " + (schoolFilter === "all" ? "active" : "")} onClick={() => setSchoolFilter("all")}>
                  Tất cả · {activeFlagged.length}
                </button>
                {Object.entries(schoolCounts).sort().map(([school, count]) => (
                  <button key={school} className={"chip " + (schoolFilter === school ? "active" : "")} onClick={() => setSchoolFilter(school)}>
                    {school.toUpperCase()} · {count}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4, fontSize: 11 }}>Loại lỗi</div>
              <div className="chip-group">
                <button className={"chip " + (issueFilter === "all" ? "active" : "")} onClick={() => setIssueFilter("all")}>
                  Tất cả
                </button>
                {Object.entries(issueTypeCounts).map(([type, count]) => {
                  const cfg = ISSUE_CONFIG[type] ?? { label: type, tone: "", icon: "•" };
                  return (
                    <button key={type} className={"chip " + (issueFilter === type ? "active " + cfg.tone : "")} onClick={() => setIssueFilter(type)}>
                      {cfg.icon} {cfg.label} · {count}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Acknowledged toggle */}
          {acknowledgedCount > 0 && (
            <div className="row" style={{ gap: 8, marginBottom: 12, alignItems: "center" }}>
              <label className="row" style={{ gap: 6, fontSize: 12, color: "var(--ink-muted)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showAcknowledged}
                  onChange={(e) => setShowAcknowledged(e.target.checked)}
                />
                Hiện cả câu đã xác nhận OK ({acknowledgedCount})
              </label>
            </div>
          )}

          {/* Question list */}
          {visible.length === 0 ? (
            <Card>
              <div className="empty" style={{ padding: "40px 0" }}>
                {acknowledgedCount > 0 && !showAcknowledged
                  ? `✅ Không còn câu nào cần review (đã xác nhận ${acknowledgedCount} câu OK).`
                  : "✅ Không còn câu nào bị flag."}
              </div>
            </Card>
          ) : (
            <div className="col" style={{ gap: 10 }}>
              {visible.map((q) =>
                editingId === q.id ? (
                  <EditCard key={q.id} q={q} onSaved={onSaved} onCancel={() => setEditingId(null)} />
                ) : (
                  <FlagCard
                    key={q.id}
                    q={q}
                    isAcknowledged={acknowledged.has(q.id)}
                    onAcknowledge={() => toggleAcknowledge(q.id)}
                    onEdit={() => setEditingId(q.id)}
                  />
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* ── FIGURES TAB ── */}
      {activeTab === "figures" && (
        <div>
          {/* Info */}
          <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: "0 0 12px" }}>
            Tất cả {figures.length} câu có hình. <b>🟢 Đã implement</b> = SVG có trong code. <b>🔴 Chưa implement</b> = hình sẽ hiện trống/đen trên bài thi.
          </p>

          {/* Filters */}
          <div className="row" style={{ gap: 12, marginBottom: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4, fontSize: 11 }}>Trường</div>
              <div className="chip-group">
                <button
                  className={"chip " + (figSchoolFilter === "all" ? "active" : "")}
                  onClick={() => setFigSchoolFilter("all")}
                  type="button"
                >
                  Tất cả · {figures.length}
                </button>
                {Object.entries(figSchoolCounts).sort().map(([school, count]) => (
                  <button
                    key={school}
                    className={"chip " + (figSchoolFilter === school ? "active" : "")}
                    onClick={() => setFigSchoolFilter(school)}
                    type="button"
                  >
                    {school.toUpperCase()} · {count}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4, fontSize: 11 }}>Trạng thái</div>
              <div className="chip-group">
                <button
                  className={"chip " + (figImplFilter === "all" ? "active" : "")}
                  onClick={() => setFigImplFilter("all")}
                  type="button"
                >
                  Tất cả
                </button>
                <button
                  className={"chip " + (figImplFilter === "yes" ? "active" : "")}
                  onClick={() => setFigImplFilter("yes")}
                  type="button"
                >
                  🟢 Đã implement · {figImplementedCount}
                </button>
                <button
                  className={"chip " + (figImplFilter === "no" ? "active" : "")}
                  onClick={() => setFigImplFilter("no")}
                  type="button"
                >
                  🔴 Chưa · {figUnimplementedCount}
                </button>
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <div className="eyebrow" style={{ marginBottom: 4, fontSize: 11, visibility: "hidden" }}>·</div>
              <div className="row" style={{ gap: 8, alignItems: "center" }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  {visibleFigures.length} / {figures.length} hình
                </span>
                {approvedCount > 0 && (
                  <button
                    className={"chip " + (hideApproved ? "active" : "")}
                    onClick={() => setHideApproved((v) => !v)}
                    type="button"
                  >
                    <Icon name="check" size={11} />
                    {hideApproved ? `Hiện lại ${approvedCount} đã OK` : `Ẩn ${approvedCount} đã xác nhận`}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="col" style={{ gap: 12 }}>
            {visibleFigures.map((fig) => (
              <FigureCard
                key={fig.id}
                fig={fig}
                isApproved={approved.has(fig.figure)}
                onToggleApprove={() => toggleApprove(fig.figure)}
              />
            ))}
            {visibleFigures.length === 0 && (
              <Card>
                <div className="empty" style={{ padding: "40px 0" }}>
                  {figures.length === 0
                    ? "✅ Không có câu nào có hình."
                    : "Không có hình nào khớp bộ lọc."}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Figure card ──────────────────────────────────────────────────────────────

function FigureCard({
  fig,
  isApproved,
  onToggleApprove,
}: {
  fig: FigureQ;
  isApproved: boolean;
  onToggleApprove: () => void;
}) {
  return (
    <Card
      style={{
        opacity: isApproved ? 0.7 : 1,
        transition: "opacity 0.2s",
        border: isApproved ? "1px solid var(--success)" : undefined,
      }}
    >
      <div className="row" style={{ gap: 14, alignItems: "flex-start" }}>
        {/* Meta */}
        <div style={{ minWidth: 100 }}>
          <div
            style={{
              padding: "4px 10px", borderRadius: 8, marginBottom: 8,
              background: SCHOOL_COLORS[fig.school] ?? "var(--surface-2)",
              color: "white", fontSize: 11, fontWeight: 700, textAlign: "center",
            }}
          >
            {fig.school.toUpperCase()} · C{fig.num}
          </div>
          <div className="mono muted" style={{ fontSize: 11, marginBottom: 4 }}>{fig.examId}</div>
          <div style={{ fontSize: 11, marginBottom: 4 }}>{fig.year}</div>
          <div
            style={{
              fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
              background: fig.implemented ? "oklch(0.95 0.08 145)" : "oklch(0.95 0.08 15)",
              color: fig.implemented ? "oklch(0.35 0.15 145)" : "oklch(0.45 0.2 15)",
            }}
          >
            {fig.implemented ? "🟢 OK" : "🔴 Chưa có"}
          </div>
          <div className="mono muted" style={{ fontSize: 10, marginTop: 6, wordBreak: "break-all" }}>
            {fig.figure}
          </div>
        </div>

        {/* Stem preview */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: "var(--ink)", marginBottom: 12, lineHeight: 1.6 }}>
            {fig.stem}
          </p>

          {/* Approve button */}
          <button
            onClick={onToggleApprove}
            className="btn sm"
            style={{
              background: isApproved ? "var(--success-soft)" : undefined,
              color: isApproved ? "var(--success)" : undefined,
              borderColor: isApproved ? "var(--success)" : undefined,
              fontWeight: isApproved ? 600 : undefined,
              transition: "all 0.15s",
            }}
          >
            <Icon name="check" size={12} stroke={isApproved ? 2.5 : 1.5} />
            {isApproved ? "Đã xác nhận OK" : "Xác nhận hình OK"}
          </button>
        </div>

        {/* Figure render */}
        <div
          style={{
            minWidth: 160, maxWidth: 220,
            border: "1px solid var(--border)",
            borderRadius: 10, padding: 8,
            background: "var(--surface)",
          }}
        >
          {fig.implemented ? (
            <ExamFigure figure={fig.figure} />
          ) : (
            <div
              style={{
                width: 160, height: 120, display: "grid", placeItems: "center",
                background: "oklch(0.95 0.03 15)", borderRadius: 8,
                fontSize: 12, color: "var(--ink-muted)", textAlign: "center",
              }}
            >
              🔴 Chưa implement<br />
              <span className="mono" style={{ fontSize: 10, marginTop: 4 }}>{fig.figure}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Flag card (read view) ────────────────────────────────────────────────────

function FlagCard({
  q,
  isAcknowledged,
  onAcknowledge,
  onEdit,
}: {
  q: FlaggedQ;
  isAcknowledged: boolean;
  onAcknowledge: () => void;
  onEdit: () => void;
}) {
  return (
    <Card style={isAcknowledged ? { opacity: 0.55 } : undefined}>
      <div className="row between" style={{ alignItems: "flex-start", gap: 12 }}>
        <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
          <div
            style={{
              minWidth: 48, height: 48, borderRadius: 10,
              background: SCHOOL_COLORS[q.school] ?? "var(--surface-2)",
              color: "white", display: "grid", placeItems: "center",
              fontWeight: 700, fontSize: 11, fontFamily: "var(--font-mono)",
              textAlign: "center", lineHeight: 1.3,
            }}
          >
            {q.school.toUpperCase()}<br />C{q.num}
          </div>
          <div style={{ flex: 1 }}>
            <div className="row" style={{ gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
              <span className="mono" style={{ fontSize: 12, color: "var(--ink-muted)" }}>{q.examId}</span>
              <span className="muted" style={{ fontSize: 12 }}>· {q.year} · {q.type}</span>
              {q.issues.map((issue, i) => {
                const cfg = ISSUE_CONFIG[issue.type] ?? { label: issue.type, tone: "", icon: "•" };
                return <Pill key={i} tone={cfg.tone}>{cfg.icon} {cfg.label}</Pill>;
              })}
              {isAcknowledged && <Pill tone="solid">✓ Đã xác nhận OK</Pill>}
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--ink)", wordBreak: "break-word" }}>
              {q.stem.slice(0, 200)}{q.stem.length > 200 ? "…" : ""}
            </p>
            {q.issues.map((issue, i) => (
              <div key={i} className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                {ISSUE_CONFIG[issue.type]?.icon} {issue.detail}
              </div>
            ))}
          </div>
        </div>
        <div className="col" style={{ gap: 6, flexShrink: 0, alignItems: "stretch" }}>
          <button
            className={"btn sm " + (isAcknowledged ? "" : "ghost")}
            onClick={onAcknowledge}
            title={isAcknowledged ? "Bỏ đánh dấu — đưa lại danh sách review" : "Xác nhận đã xem, không phải lỗi"}
          >
            {isAcknowledged ? "↩ Bỏ xác nhận" : "✓ OK"}
          </button>
          <button className="btn sm primary" onClick={onEdit}>
            <Icon name="pencil" size={12} /> Sửa
          </button>
        </div>
      </div>
    </Card>
  );
}

// ─── Edit card ────────────────────────────────────────────────────────────────

function EditCard({ q, onSaved, onCancel }: { q: FlaggedQ; onSaved: (id: string) => void; onCancel: () => void }) {
  const [stem, setStem] = useState(q.stem);
  const [correct, setCorrect] = useState(q.correct ?? "");
  const [figure, setFigure] = useState(q.figure ?? "");
  const [modelAnswer, setModelAnswer] = useState(q.modelAnswer ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateQuestion({
          questionId: q.id,
          stem,
          correct: correct || undefined,
          figure: figure || null,
          modelAnswer: modelAnswer || undefined,
        });
        onSaved(q.id);
      } catch (e) {
        setError(String(e));
      }
    });
  };

  return (
    <Card style={{ border: "2px solid var(--accent)", background: "var(--surface-2)" }}>
      <div className="row between" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 8 }}>
          <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{q.examId} · C{q.num}</span>
          {q.issues.map((issue, i) => {
            const cfg = ISSUE_CONFIG[issue.type] ?? { label: issue.type, tone: "", icon: "•" };
            return <Pill key={i} tone={cfg.tone}>{cfg.icon} {cfg.label}</Pill>;
          })}
        </div>
        <button className="btn sm ghost" onClick={onCancel}>Huỷ</button>
      </div>

      <div className="field" style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" }}>Nội dung câu hỏi (stem)</label>
        <textarea
          className="input"
          rows={4}
          value={stem}
          onChange={(e) => setStem(e.target.value)}
          style={{ fontFamily: "var(--font-mono)", fontSize: 12, resize: "vertical", width: "100%" }}
        />
      </div>

      <div className="grid cols-2" style={{ gap: 12, marginBottom: 12 }}>
        <div className="field">
          <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" }}>Đáp án đúng</label>
          <input className="input mono" value={correct} onChange={(e) => setCorrect(e.target.value)} placeholder={q.type === "mcq" ? "A / B / C / D" : "Số hoặc text"} />
        </div>
        <div className="field">
          <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" }}>Figure ID (trống = không có hình)</label>
          <input className="input mono" value={figure} onChange={(e) => setFigure(e.target.value)} placeholder="vd: tx-2025-c15" />
        </div>
      </div>

      <div className="field" style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" }}>Lời giải chi tiết</label>
        <textarea
          className="input"
          rows={3}
          value={modelAnswer}
          onChange={(e) => setModelAnswer(e.target.value)}
          style={{ fontFamily: "var(--font-mono)", fontSize: 12, resize: "vertical", width: "100%" }}
        />
      </div>

      {error && <div style={{ color: "var(--error)", fontSize: 12, marginBottom: 8 }}>{error}</div>}

      <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
        <button className="btn sm ghost" onClick={onCancel} disabled={isPending}>Huỷ</button>
        <button className="btn sm primary" onClick={handleSave} disabled={isPending}>
          {isPending ? "Đang lưu…" : "✓ Lưu"}
        </button>
      </div>
    </Card>
  );
}
