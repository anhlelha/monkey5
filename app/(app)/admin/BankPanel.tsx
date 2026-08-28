"use client";

import { useState, useTransition } from "react";
import { Card, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import {
  getBankQuestions,
  toggleQuestionActive,
  getQuestionDetail,
  exportMissingMathAssessmentInput,
  type BankStats,
  type BankRow,
  type BankFilters,
  type QuestionDetail,
} from "./actions";
import { QuestionDetailModal } from "./QuestionDetailModal";
import { DEFAULT_TOPICS } from "@/lib/static";

interface TopicOption {
  id: string;
  name: string;
  short: string;
}

interface Props {
  stats: BankStats;
  initialPage: { rows: BankRow[]; total: number; page: number; pageSize: number };
  topics: TopicOption[];
  subject?: "math" | "english" | "vietnamese";
}

const SOURCE_LABELS: Record<string, string> = {
  official: "Chính thức",
  mock: "Thi thử",
  supplement: "Bổ trợ",
  private: "Riêng",
};

const SOURCE_TONES: Record<string, string> = {
  official: "solid",
  mock: "amber",
  supplement: "green",
  private: "accent",
};

const GRADE_OPTIONS = [
  { value: "", label: "Tất cả mức" },
  { value: "L4", label: "Lớp 4 (L4)" },
  { value: "L5", label: "Lớp 5 (L5)" },
  { value: "NC", label: "Nâng cao (NC)" },
  { value: "L4+5", label: "L4+5" },
];

export function BankPanel({ stats, initialPage, topics, subject = "math" }: Props) {
  const [rows, setRows] = useState<BankRow[]>(initialPage.rows);
  const [total, setTotal] = useState(initialPage.total);
  const [page, setPage] = useState(initialPage.page);

  const [source, setSource] = useState<BankFilters["source"]>("all");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [q, setQ] = useState("");
  const [assessmentState, setAssessmentState] = useState<NonNullable<BankFilters["assessmentState"]>>("all");

  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [selectedDetail, setSelectedDetail] = useState<QuestionDetail | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<string | null>(null);

  const pageSize = initialPage.pageSize;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const topicName = (id: string) => {
    const t = topics.find((x) => x.id === id) ?? DEFAULT_TOPICS.find((x) => x.id === id);
    return t?.short ?? id;
  };

  function fetchPage(filters: BankFilters) {
    startTransition(async () => {
      const result = await getBankQuestions({ ...filters, subject });
      setRows(result.rows);
      setTotal(result.total);
      setPage(result.page);
    });
  }

  function applyFilters(overrides: Partial<BankFilters> = {}) {
    const merged: BankFilters = {
      source: source ?? "all",
      topic: topic || undefined,
      grade: grade || undefined,
      q: q || undefined,
      assessmentState,
      page: 1,
      ...overrides,
    };
    fetchPage(merged);
  }

  function handleToggle(id: string) {
    setTogglingId(id);
    startTransition(async () => {
      try {
        const result = await toggleQuestionActive(id);
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, active: result.active } : r))
        );
      } finally {
        setTogglingId(null);
      }
    });
  }

  function handleRowClick(id: string) {
    setLoadingDetailId(id);
    startTransition(async () => {
      try {
        const detail = await getQuestionDetail(id);
        setSelectedDetail(detail);
      } finally {
        setLoadingDetailId(null);
      }
    });
  }

  function goToPage(p: number) {
    const merged: BankFilters = {
      source: source ?? "all",
      topic: topic || undefined,
      grade: grade || undefined,
      q: q || undefined,
      assessmentState,
      page: p,
    };
    fetchPage(merged);
  }

  return (
    <div className="col" style={{ gap: 20 }}>
      {/* ── Stat cards ── */}
      <div className="grid cols-5">
        {[
          { k: "Chính thức", v: stats.official, tone: "solid" },
          { k: "Thi thử", v: stats.mock, tone: "amber" },
          { k: "Bổ trợ", v: stats.supplement, tone: "green" },
          { k: "Riêng", v: stats.private, tone: "accent" },
          { k: "Đang bật / tắt", v: `${stats.totalActive} / ${stats.totalInactive}`, tone: "" },
        ].map((s) => (
          <Card key={s.k} tight>
            <div className="eyebrow">{s.k}</div>
            <div className="kpi" style={{ fontSize: 24, marginTop: 6 }}>
              <Pill tone={s.tone}>{s.v}</Pill>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Per-topic breakdown ── */}
      {subject === "math" && stats.v4Assessment && (
        <Card
          title="Assessment V4 · taxonomy phân tích"
          sub={`${stats.v4Assessment.taxonomyVersion} · topic/D1–D5/confidence/hash của câu canonical; không tính generated clone`}
        >
          <div className="grid cols-5" style={{ gap: 10 }}>
            {[
              ["Tổng", stats.v4Assessment.total.total, ""],
              ["Current", stats.v4Assessment.total.current, "green"],
              ["Inherited", stats.v4Assessment.total.inherited, "accent"],
              ["Stale / conflict", stats.v4Assessment.total.stale + stats.v4Assessment.total.conflict, "red"],
              ["Missing", stats.v4Assessment.total.missing, "amber"],
            ].map(([label, value, tone]) => (
              <div key={String(label)} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 10 }}>
                <div className="eyebrow" style={{ fontSize: 9 }}>{label}</div>
                <div style={{ marginTop: 5 }}><Pill tone={String(tone)}><b>{value}</b></Pill></div>
              </div>
            ))}
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {Object.entries(stats.v4Assessment.bySource).map(([sourceId, value]) => (
              <Pill key={sourceId}>
                {SOURCE_LABELS[sourceId] ?? sourceId}: <b style={{ marginLeft: 4 }}>{value.current + value.inherited}/{value.total}</b>
              </Pill>
            ))}
          </div>
          <div className="row" style={{ gap: 10, flexWrap: "wrap", marginTop: 14, alignItems: "center" }}>
            <button
              type="button"
              className="btn secondary"
              disabled={isPending || stats.v4Assessment.total.missing + stats.v4Assessment.total.stale + stats.v4Assessment.total.conflict === 0}
              onClick={() => {
                setExportResult(null);
                startTransition(async () => {
                  try {
                    const result = await exportMissingMathAssessmentInput();
                    setExportResult(`${result.totalQuestions} câu · ${result.artifactPath}`);
                  } catch (error) {
                    setExportResult(error instanceof Error ? error.message : "Không thể tạo artifact");
                  }
                });
              }}
            >
              <Icon name="download" size={15} /> {isPending ? "Đang xuất…" : "Xuất input cần đánh giá"}
            </button>
            <span className="muted" style={{ fontSize: 12 }}>
              Chỉ tạo artifact để review; không gọi AI và không tự approve.
            </span>
          </div>
          {exportResult && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: "var(--surface-2)", fontSize: 12, overflowWrap: "anywhere" }}>
              {exportResult}
            </div>
          )}
        </Card>
      )}

      {/* ── Per-topic breakdown ── */}
      {Object.keys(stats.byTopic).length > 0 && (
        <Card title="Phân bố content topic" sub="Topic nội dung dùng cho kho/luyện tập; không phải analytical taxonomy V4">
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {Object.entries(stats.byTopic)
              .sort(([, a], [, b]) => b - a)
              .map(([tid, count]) => (
                <Pill key={tid}>
                  {topicName(tid)}: <b style={{ marginLeft: 3 }}>{count}</b>
                </Pill>
              ))}
          </div>
        </Card>
      )}

      {/* ── Filter bar ── */}
              <Card title="Ngân hàng câu hỏi" sub={`${total.toLocaleString("vi-VN")} câu · content topic và Assessment V4 hiển thị tách biệt`}>

        <div className="row" style={{ gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <select
            className="input"
            style={{ width: 160 }}
            value={source ?? "all"}
            onChange={(e) => {
              const v = e.target.value as BankFilters["source"];
              setSource(v);
              applyFilters({ source: v, page: 1 });
            }}
          >
            <option value="all">Tất cả nguồn</option>
            <option value="official">Chính thức</option>
            <option value="mock">Thi thử</option>
            <option value="supplement">Bổ trợ</option>
            <option value="private">Riêng</option>
          </select>

          {subject === "math" && (
            <select
              className="input"
              style={{ width: 170 }}
              value={assessmentState}
              onChange={(e) => {
                const value = e.target.value as NonNullable<BankFilters["assessmentState"]>;
                setAssessmentState(value);
                applyFilters({ assessmentState: value, page: 1 });
              }}
            >
              <option value="all">Tất cả assessment V4</option>
              <option value="current">V4 · Current</option>
              <option value="inherited">V4 · Inherited</option>
              <option value="stale">V4 · Stale</option>
              <option value="conflict">V4 · Conflict</option>
              <option value="missing">V4 · Missing</option>
            </select>
          )}

          <select
            className="input"
            style={{ width: 160 }}
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              applyFilters({ topic: e.target.value || undefined, page: 1 });
            }}
          >
            <option value="">Tất cả content topic</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            className="input"
            style={{ width: 140 }}
            value={grade}
            onChange={(e) => {
              setGrade(e.target.value);
              applyFilters({ grade: e.target.value || undefined, page: 1 });
            }}
          >
            {GRADE_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>

          <input
            className="input"
            style={{ flex: 1, minWidth: 200 }}
            placeholder="Tìm theo nội dung câu…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters({ q: q || undefined, page: 1 });
            }}
          />

          <button
            className="btn"
            onClick={() => applyFilters({ q: q || undefined, page: 1 })}
            disabled={isPending}
          >
            <Icon name="search" size={13} />
            {isPending ? "Đang tải…" : "Tìm"}
          </button>
        </div>

        {/* ── Table ── */}
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Nguồn</th>
                <th style={{ width: 110 }}>Content topic</th>
                <th style={{ width: 60 }}>Mức</th>
                <th style={{ width: 50 }}>Loại</th>
                <th>Nội dung câu</th>
                {subject === "math" && <th style={{ width: 135 }}>Assessment V4</th>}
                <th style={{ width: 110 }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={subject === "math" ? 7 : 6} style={{ textAlign: "center", padding: 24 }}>
                    <span className="muted">Không có câu nào.</span>
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr
                  key={row.id}
                  style={{
                    opacity: row.active ? 1 : 0.55,
                    cursor: loadingDetailId === row.id ? "wait" : "pointer",
                  }}
                  onClick={() => handleRowClick(row.id)}
                >
                  <td>
                    <Pill tone={SOURCE_TONES[row.source]}>
                      {SOURCE_LABELS[row.source]}
                    </Pill>
                    {row.examYear && (
                      <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                        {row.examSchool ? `${row.examSchool} · ` : ""}{row.examYear}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: 12 }}>{topicName(row.topic)}</span>
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: 12 }}>{row.grade}</span>
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: 11 }}>{row.type}</span>
                  </td>
                  <td style={{ maxWidth: 420 }}>
                    <span style={{ fontSize: 12.5, lineHeight: 1.4 }}>{row.stem}</span>
                  </td>
                  {subject === "math" && (
                    <td>
                      {row.assessment ? (
                        <div className="col" style={{ gap: 4, alignItems: "flex-start" }}>
                          <Pill tone={row.assessment.state === "current" || row.assessment.state === "inherited" ? "green" : row.assessment.state === "missing" ? "amber" : "red"}>
                            {row.assessment.state === "current" ? "Current" : row.assessment.state === "inherited" ? "Inherited" : row.assessment.state === "missing" ? "Missing" : row.assessment.state === "stale" ? "Stale" : "Conflict"}
                          </Pill>
                          {row.assessment.topicPrimary && (
                            <span className="muted" style={{ fontSize: 10 }}>
                              {row.assessment.topicPrimary} · D{row.assessment.difficultyBand} · {Math.round(row.assessment.confidence ?? 0)}%
                            </span>
                          )}
                        </div>
                      ) : <span className="muted">—</span>}
                    </td>
                  )}
                  <td>
                    <div className="col" style={{ gap: 4, alignItems: "flex-start" }}>
                      {/* Status badge */}
                      {row.active ? (
                        <Pill
                          tone="green"
                          style={{ fontSize: 11, padding: "2px 7px" }}
                        >
                          Đang bật
                        </Pill>
                      ) : (
                        <Pill
                          style={{
                            fontSize: 11,
                            padding: "2px 7px",
                            background: "var(--surface-sunk)",
                            color: "var(--ink-muted)",
                          }}
                        >
                          Đã tắt
                        </Pill>
                      )}
                      {/* Toggle action button */}
                      <button
                        className={"btn sm " + (row.active ? "ghost" : "primary")}
                        style={{ fontSize: 11, padding: "3px 8px" }}
                        disabled={togglingId === row.id || isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(row.id);
                        }}
                      >
                        {togglingId === row.id
                          ? "…"
                          : row.active
                          ? "Tắt"
                          : "Bật"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="row" style={{ gap: 8, marginTop: 16, justifyContent: "center" }}>
            <button
              className="btn sm ghost"
              disabled={page <= 1 || isPending}
              onClick={() => goToPage(page - 1)}
            >
              <Icon name="chevL" size={12} /> Trước
            </button>
            <span className="muted" style={{ fontSize: 12.5, alignSelf: "center" }}>
              Trang {page} / {totalPages}
            </span>
            <button
              className="btn sm ghost"
              disabled={page >= totalPages || isPending}
              onClick={() => goToPage(page + 1)}
            >
              Sau <Icon name="chevR" size={12} />
            </button>
          </div>
        )}
      </Card>

      {/* ── Detail modal ── */}
      {selectedDetail && (
        <QuestionDetailModal
          detail={selectedDetail}
          onClose={() => setSelectedDetail(null)}
        />
      )}
    </div>
  );
}
