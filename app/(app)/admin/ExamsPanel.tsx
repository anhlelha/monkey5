"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Card, Pill } from "@/components/ui";
import { SCHOOLS } from "@/lib/static";

interface ExamRow {
  id: string;
  kind: string;
  generated: boolean;
  year: string;
  school: string;
  qcount: number;
  minutes: number;
  note: string | null;
}

interface ExamsPanelProps {
  exams: ExamRow[];
}

type KindFilter = "all" | "official" | "reference";

interface FilterState {
  query: string;
  school: string;
  kind: KindFilter;
  year: string;
}

const DEFAULT_STATE: FilterState = { query: "", school: "all", kind: "all", year: "all" };

function parseKind(v: string | null): KindFilter {
  return v === "official" || v === "reference" ? v : "all";
}

export function ExamsPanel({ exams }: ExamsPanelProps) {
  return (
    <Suspense fallback={<Card>Đang tải…</Card>}>
      <ExamsPanelInner exams={exams} />
    </Suspense>
  );
}

function ExamsPanelInner({ exams }: ExamsPanelProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize from URL once. Subsequent updates go through window.history.replaceState
  // so we don't re-fetch the server component on every keystroke.
  const [state, setState] = useState<FilterState>(() => ({
    query: searchParams.get("q") ?? DEFAULT_STATE.query,
    school: searchParams.get("school") ?? DEFAULT_STATE.school,
    kind: parseKind(searchParams.get("kind")),
    year: searchParams.get("year") ?? DEFAULT_STATE.year,
  }));

  const yearSelectorEnabled = state.kind === "official";

  // Push current state to URL (replace, no scroll, no server refetch).
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const put = (k: string, v: string, def: string) => {
      if (v && v !== def) params.set(k, v);
      else params.delete(k);
    };
    put("q", state.query, "");
    put("school", state.school, "all");
    put("kind", state.kind, "all");
    put("year", yearSelectorEnabled ? state.year : "all", "all");

    const next = params.toString();
    const target = next ? `${pathname}?${next}` : pathname;
    if (typeof window !== "undefined" && window.location.pathname + window.location.search !== target) {
      window.history.replaceState(window.history.state, "", target);
    }
    // We intentionally exclude `searchParams` from deps — it changes on every replaceState,
    // and we always derive from latest `state` here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, yearSelectorEnabled, pathname]);

  const update = useCallback((patch: Partial<FilterState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      // When switching away from official, clear year selection.
      if (patch.kind && patch.kind !== "official") next.year = "all";
      return next;
    });
  }, []);

  const officialYears = useMemo(() => {
    const set = new Set(
      exams.filter((e) => e.kind === "official").map((e) => e.year).filter(Boolean),
    );
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [exams]);

  const filtered = useMemo(() => {
    const q = state.query.trim().toLowerCase();
    return exams.filter((e) => {
      if (state.school !== "all") {
        if (state.school === "mix") {
          if (SCHOOLS.find((s) => s.id === e.school)) return false;
        } else if (e.school !== state.school) {
          return false;
        }
      }
      if (state.kind !== "all") {
        if (state.kind === "official" && e.kind !== "official") return false;
        if (state.kind === "reference" && e.kind === "official") return false;
      }
      if (yearSelectorEnabled && state.year !== "all" && e.year !== state.year) return false;
      if (!q) return true;
      const s = SCHOOLS.find((x) => x.id === e.school);
      const hay = [e.year, e.note, s?.short, s?.full, s?.name].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [exams, state, yearSelectorEnabled]);

  const buildDetailHref = (id: string) => {
    const params = new URLSearchParams();
    if (state.query) params.set("q", state.query);
    if (state.school !== "all") params.set("school", state.school);
    if (state.kind !== "all") params.set("kind", state.kind);
    if (yearSelectorEnabled && state.year !== "all") params.set("year", state.year);
    params.set("tab", "exams");
    const qs = params.toString();
    return qs ? `/admin/exam/${id}?from=${encodeURIComponent(qs)}` : `/admin/exam/${id}`;
  };

  return (
    <Card>
      <div className="col" style={{ gap: 14, marginBottom: 16 }}>
        <div className="row between" style={{ gap: 12, flexWrap: "wrap" }}>
          <input
            className="input"
            placeholder="Tìm theo tên, năm, trường…"
            value={state.query}
            onChange={(e) => update({ query: e.target.value })}
            style={{ flex: "1 1 240px", maxWidth: 320 }}
          />
          <span className="muted" style={{ fontSize: 12 }}>
            {filtered.length} / {exams.length} đề
          </span>
        </div>

        <div className="row" style={{ gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="field" style={{ minWidth: 180 }}>
            <label>Trường</label>
            <select
              className="input"
              value={state.school}
              onChange={(e) => update({ school: e.target.value })}
            >
              <option value="all">Tất cả</option>
              {SCHOOLS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.short} — {s.full}
                </option>
              ))}
              <option value="mix">MIX (tổng hợp)</option>
            </select>
          </div>

          <div className="field" style={{ minWidth: 180 }}>
            <label>Loại đề</label>
            <select
              className="input"
              value={state.kind}
              onChange={(e) => update({ kind: e.target.value as KindFilter })}
            >
              <option value="all">Tất cả</option>
              <option value="official">Đề chính thức</option>
              <option value="reference">Đề tham khảo</option>
            </select>
          </div>

          <div className="field" style={{ minWidth: 160 }}>
            <label>Năm {yearSelectorEnabled ? "" : "(chỉ đề chính thức)"}</label>
            <select
              className="input"
              value={state.year}
              onChange={(e) => update({ year: e.target.value })}
              disabled={!yearSelectorEnabled}
            >
              <option value="all">Tất cả</option>
              {officialYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th>Tên đề</th>
            <th>Loại</th>
            <th>Trường</th>
            <th>Năm</th>
            <th>Câu</th>
            <th>Thời lượng</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} className="muted" style={{ textAlign: "center", padding: 24 }}>
                Không tìm thấy đề nào khớp bộ lọc.
              </td>
            </tr>
          )}
          {filtered.map((e) => {
            const s = SCHOOLS.find((x) => x.id === e.school);
            const isAdminRef = e.kind === "reference" && !e.generated;
            const isAutoRef = e.kind === "reference" && e.generated;
            const kindLabel = e.kind === "official"
              ? "Đề chính thức"
              : isAdminRef
                ? "Tham khảo ✓"
                : isAutoRef
                  ? "Phỏng tự động"
                  : "Trộn";
            const kindTone = e.kind === "official"
              ? "solid"
              : isAdminRef
                ? "amber"
                : isAutoRef
                  ? ""
                  : "green";
            return (
              <tr key={e.id}>
                <td>
                  <b style={{ fontWeight: 500 }}>
                    {e.kind === "official" ? `Đề thi ${s?.short ?? "MIX"} · ${e.year}` : e.year}
                  </b>
                  {e.note && (
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{e.note}</div>
                  )}
                </td>
                <td>
                  <Pill tone={kindTone}>{kindLabel}</Pill>
                </td>
                <td>
                  {s ? <Pill tone={s.tone}>{s.short}</Pill> : <Pill>MIX</Pill>}
                </td>
                <td className="mono">{e.kind === "official" ? e.year : "—"}</td>
                <td className="mono">{e.qcount}</td>
                <td className="mono">{e.minutes}p</td>
                <td style={{ textAlign: "right" }}>
                  <Link href={buildDetailHref(e.id)} className="btn sm ghost" style={{ textDecoration: "none" }}>
                    <Icon name="eye" size={12} /> Xem
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
