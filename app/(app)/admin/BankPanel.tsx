"use client";

import { useState, useTransition } from "react";
import { Card, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import {
  getBankQuestions,
  toggleQuestionActive,
  getQuestionDetail,
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
}

const SOURCE_LABELS: Record<string, string> = {
  official: "Chính thức",
  mock: "Thi thử",
  supplement: "Bổ trợ",
};

const SOURCE_TONES: Record<string, string> = {
  official: "solid",
  mock: "amber",
  supplement: "green",
};

const GRADE_OPTIONS = [
  { value: "", label: "Tất cả mức" },
  { value: "L4", label: "Lớp 4 (L4)" },
  { value: "L5", label: "Lớp 5 (L5)" },
  { value: "NC", label: "Nâng cao (NC)" },
  { value: "L4+5", label: "L4+5" },
];

export function BankPanel({ stats, initialPage, topics }: Props) {
  const [rows, setRows] = useState<BankRow[]>(initialPage.rows);
  const [total, setTotal] = useState(initialPage.total);
  const [page, setPage] = useState(initialPage.page);

  const [source, setSource] = useState<BankFilters["source"]>("all");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [q, setQ] = useState("");

  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [selectedDetail, setSelectedDetail] = useState<QuestionDetail | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

  const pageSize = initialPage.pageSize;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const topicName = (id: string) => {
    const t = topics.find((x) => x.id === id) ?? DEFAULT_TOPICS.find((x) => x.id === id);
    return t?.short ?? id;
  };

  function fetchPage(filters: BankFilters) {
    startTransition(async () => {
      const result = await getBankQuestions(filters);
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
      page: p,
    };
    fetchPage(merged);
  }

  return (
    <div className="col" style={{ gap: 20 }}>
      {/* ── Stat cards ── */}
      <div className="grid cols-4">
        {[
          { k: "Chính thức", v: stats.official, tone: "solid" },
          { k: "Thi thử", v: stats.mock, tone: "amber" },
          { k: "Bổ trợ", v: stats.supplement, tone: "green" },
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
      {Object.keys(stats.byTopic).length > 0 && (
        <Card title="Phân bố theo chuyên đề" sub="Tổng số câu trong kho (kể cả tắt)">
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
      <Card title="Ngân hàng câu hỏi" sub={`${total.toLocaleString("vi-VN")} câu`}>
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
          </select>

          <select
            className="input"
            style={{ width: 160 }}
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              applyFilters({ topic: e.target.value || undefined, page: 1 });
            }}
          >
            <option value="">Tất cả chuyên đề</option>
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
                <th style={{ width: 80 }}>Chuyên đề</th>
                <th style={{ width: 60 }}>Mức</th>
                <th style={{ width: 50 }}>Loại</th>
                <th>Nội dung câu</th>
                <th style={{ width: 110 }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24 }}>
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
