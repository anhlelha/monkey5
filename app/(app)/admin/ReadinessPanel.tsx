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
