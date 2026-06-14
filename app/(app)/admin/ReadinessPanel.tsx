"use client";

import { useState, useTransition } from "react";
import { Card, Bar, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import {
  refreshSchoolProfilesAction,
  recomputeAllReadinessAction,
  type RecomputeResult,
} from "./actions";

interface HistogramBucket {
  range: string;
  min: number;
  max: number;
  count: number;
  label: string;
}

interface SchoolHistogram {
  school: string;
  total: number;
  avg: number;
  median: number;
  buckets: HistogramBucket[];
}

interface SchoolMeta {
  id: string;
  full: string;
  tone: string;
}

interface Props {
  histograms: SchoolHistogram[];
  schools: SchoolMeta[];
}

export function ReadinessPanel({ histograms, schools }: Props) {
  const [isPending, startTransition] = useTransition();
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [lastRecompute, setLastRecompute] = useState<RecomputeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await refreshSchoolProfilesAction();
        setLastRefresh(
          `Hoàn tất. Created: ${result.created.length} · Rebuilt: ${result.rebuilt.length} · Unchanged: ${result.unchanged.length}`,
        );
      } catch (e) {
        setError(String(e));
      }
    });
  };

  const handleRecompute = () => {
    if (!confirm("Tính lại readiness cho TẤT CẢ user? Quá trình có thể mất vài chục giây.")) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await recomputeAllReadinessAction();
        setLastRecompute(result);
      } catch (e) {
        setError(String(e));
      }
    });
  };

  const schoolMap = new Map(schools.map((s) => [s.id, s]));
  const maxCount = Math.max(1, ...histograms.flatMap((h) => h.buckets.map((b) => b.count)));

  const summaryRows = histograms.map((h) => {
    const meta = schoolMap.get(h.school);
    return {
      id: h.school,
      short: meta?.id?.toUpperCase() ?? h.school.toUpperCase(),
      full: meta?.full ?? h.school,
      tone: meta?.tone ?? "",
      total: h.total,
      avg: h.avg,
      median: h.median,
    };
  });
  const avgs = summaryRows.map((r) => r.avg);
  const overallAvg = avgs.length > 0 ? Math.round(avgs.reduce((s, v) => s + v, 0) / avgs.length) : 0;
  const minAvg = avgs.length > 0 ? Math.min(...avgs) : 0;
  const maxAvg = avgs.length > 0 ? Math.max(...avgs) : 0;
  const spread = maxAvg - minAvg;

  return (
    <div className="col" style={{ gap: 16 }}>
      <Card
        title="Thao tác quản trị"
        sub="Refresh profile các trường + recompute readiness toàn user"
      >
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <button className="btn" onClick={handleRefresh} disabled={isPending}>
            <Icon name="refresh" /> Refresh profiles
          </button>
          <button className="btn primary" onClick={handleRecompute} disabled={isPending}>
            <Icon name="sparkle" /> Recompute all readiness
          </button>
          {isPending && <span className="muted">Đang xử lý…</span>}
        </div>
        {lastRefresh && (
          <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
            {lastRefresh}
          </div>
        )}
        {lastRecompute && (
          <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
            Đã xử lý {lastRecompute.processed}/{lastRecompute.total} user trong{" "}
            {lastRecompute.durationMs}ms
            {lastRecompute.errors.length > 0 && (
              <span style={{ color: "var(--danger)" }}>
                {" "}
                · {lastRecompute.errors.length} lỗi
              </span>
            )}
          </div>
        )}
        {error && (
          <div style={{ color: "var(--danger)", marginTop: 8 }}>{error}</div>
        )}
      </Card>

      {summaryRows.length > 0 && (
        <Card
          title="Tóm tắt readiness theo trường"
          sub={`Trung bình readiness của toàn user · TB chung: ${overallAvg}% · Khoảng cách dễ ↔ khó: ${spread} điểm`}
        >
          <div className="grid cols-4" style={{ gap: 12 }}>
            {summaryRows.map((r) => {
              const isMax = r.avg === maxAvg && spread > 0;
              const isMin = r.avg === minAvg && spread > 0;
              return (
                <div
                  key={r.id}
                  className={"school-card " + r.tone}
                  style={{ padding: 14, cursor: "default" }}
                >
                  <div className="row between">
                    <div>
                      <div className="eyebrow" style={{ fontSize: 10 }}>{r.short}</div>
                      <div className="name">{r.full}</div>
                    </div>
                    {isMax && <Pill tone="green">Cao nhất</Pill>}
                    {isMin && <Pill tone="red">Thấp nhất</Pill>}
                  </div>
                  <div className="pct" style={{ marginTop: 6 }}>
                    <span className="num">{r.avg}</span>
                    <span className="sym">%</span>
                  </div>
                  <Bar value={r.avg} tone={r.tone} tall />
                  <div className="row between" style={{ marginTop: 6 }}>
                    <span className="muted" style={{ fontSize: 11.5 }}>
                      Median {r.median}%
                    </span>
                    <span className="muted" style={{ fontSize: 11.5 }}>
                      {r.total} user
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {histograms.map((h) => {
        const school = schoolMap.get(h.school);
        const name = school?.full ?? h.school;
        const tone = school?.tone ?? "";
        return (
          <Card
            key={h.school}
            title={name}
            sub={`${h.total} user · TB: ${h.avg}% · Median: ${h.median}%`}
          >
            <div className="col" style={{ gap: 6 }}>
              {h.buckets.map((b) => {
                const pct = (b.count / maxCount) * 100;
                return (
                  <div
                    key={b.range}
                    className="row"
                    style={{ gap: 12, alignItems: "center" }}
                  >
                    <span className="muted" style={{ width: 180, fontSize: 12.5 }}>
                      {b.label}
                    </span>
                    <div style={{ flex: 1 }}>
                      <Bar value={pct} tone={tone} />
                    </div>
                    <span
                      className="mono"
                      style={{ width: 80, textAlign: "right", fontSize: 13 }}
                    >
                      <b>{b.count}</b>{" "}
                      <span className="muted">user</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
