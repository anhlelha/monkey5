"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Card, Pill } from "@/components/ui";
import { retryReadinessV4JobItemAction } from "@/app/(app)/admin/readiness-v4-actions";
import type { RecomputeJobDetailView } from "@/lib/readiness-v4/job-view-service";

const TERMINAL = new Set(["completed", "cancelled", "failed"]);

function date(value: string | null): string {
  return value ? new Date(value).toLocaleString("vi-VN") : "—";
}

function json(value: Record<string, unknown>): string {
  return JSON.stringify(value, null, 2);
}

export function RecomputeJobDetail({ job }: { job: RecomputeJobDetailView }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [pollSeconds, setPollSeconds] = useState(5);

  useEffect(() => {
    if (TERMINAL.has(job.status)) return;
    const timer = window.setTimeout(() => window.location.reload(), pollSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [job.status, pollSeconds]);

  const retry = (itemId: string) => {
    startTransition(async () => {
      try {
        const retried = await retryReadinessV4JobItemAction(job.id, itemId);
        setMessage(retried ? "Đã đưa item lỗi về hàng đợi." : "Item không còn ở trạng thái failed.");
        setPollSeconds(5);
      } catch (error) {
        setMessage(`Lỗi: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  };

  const progress = job.totalItems ? Math.round((job.processedItems / job.totalItems) * 100) : 0;
  const alertFailure = job.failureRate > 0.05;
  const alertWorker = ["queued", "running"].includes(job.status) && !job.workerHeartbeat.active && job.processedItems > 0;
  const alertMissing = job.reconciliation.missingPairs > 0 && TERMINAL.has(job.status);

  return (
    <div className="col" style={{ gap: 16 }}>
      <Card title={`Recompute Job · ${job.id.slice(0, 16)}…`} sub={`${job.mode} · ${job.reason} · ${job.subject}`}>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <Pill tone={job.status === "completed" ? "green" : job.status === "failed" ? "red" : "amber"}>{job.status}</Pill>
          <span>Progress: <b>{job.processedItems}/{job.totalItems}</b> ({progress}%)</span>
          <span>Success: <b>{job.successItems}</b></span><span>Failed: <b>{job.failedItems}</b></span>
          {!TERMINAL.has(job.status) && <span className="muted">Tự refresh sau {pollSeconds}s</span>}
        </div>
        {(alertFailure || alertWorker || alertMissing) && <div className="notice error" style={{ marginTop: 12 }}>
          {alertFailure && <div>Failure rate vượt ngưỡng 5%; cần pause/điều tra trước khi tiếp tục.</div>}
          {alertWorker && <div>Chưa phát hiện worker lease đang hoạt động.</div>}
          {alertMissing && <div>Reconciliation còn thiếu logical snapshot pair.</div>}
        </div>}
        {message && <div className="muted" style={{ marginTop: 10 }}>{message}</div>}
        <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <Link className="btn" href="/admin?tab=readiness&subject=math">Quay về Readiness V4</Link>
          <button className="btn" disabled={TERMINAL.has(job.status)} onClick={() => window.location.reload()}>Refresh ngay</button>
        </div>
      </Card>

      <div className="grid cols-4" style={{ gap: 12 }}>
        <Card title="Queue depth"><b>{job.queueDepth}</b><div className="muted">oldest: {job.oldestQueuedAgeSeconds == null ? "—" : `${Math.round(job.oldestQueuedAgeSeconds)}s`}</div></Card>
        <Card title="Latency p50"><b>{job.latency.p50Ms == null ? "—" : `${Math.round(job.latency.p50Ms)}ms`}</b></Card>
        <Card title="Latency p95"><b>{job.latency.p95Ms == null ? "—" : `${Math.round(job.latency.p95Ms)}ms`}</b></Card>
        <Card title="Worker heartbeat"><Pill tone={job.workerHeartbeat.active ? "green" : "red"}>{job.workerHeartbeat.active ? "active" : "not detected"}</Pill></Card>
      </div>

      <Card title="Reconciliation" sub="Expected logical user × active profile pairs để giải thích missing/stale/duplicate.">
        <div className="grid cols-4" style={{ gap: 12 }}>
          <div><div className="muted">Expected pairs</div><b>{job.reconciliation.expectedPairs}</b></div>
          <div><div className="muted">Snapshot pairs</div><b>{job.reconciliation.snapshotPairs}</b></div>
          <div><div className="muted">Missing pairs</div><b>{job.reconciliation.missingPairs}</b></div>
          <div><div className="muted">Duplicate logical</div><b>{job.reconciliation.duplicateLogicalResults}</b></div>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {Object.entries(job.reconciliation.statusDistribution).map(([status, count]) => <Pill key={status}>{status}: {count}</Pill>)}
          {job.reconciliation.stalePairs > 0 && <Pill tone="amber">stale: {job.reconciliation.stalePairs}</Pill>}
        </div>
      </Card>

      <Card title="Version và scope">
        <div className="grid cols-2" style={{ gap: 12 }}>
          <div><div className="muted">Policy version</div><div className="mono">{job.policyVersionId ?? "—"}</div><div className="muted">Taxonomy: {job.taxonomyVersion ?? "—"}</div></div>
          <div><div className="muted">Profile versions</div><div className="mono" style={{ overflowWrap: "anywhere" }}>{job.profileVersionIds.join(", ") || "—"}</div><div className="muted">Scope: <pre style={{ whiteSpace: "pre-wrap" }}>{json(job.scope)}</pre></div></div>
        </div>
      </Card>

      <Card title="Job items" sub="Error đã được sanitize; item key user được hash khi render.">
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Item</th><th>Status</th><th>Attempts</th><th>Lease</th><th>Time</th><th>Error/action</th></tr></thead>
          <tbody>
            {job.items.map((item) => <tr key={item.id}>
              <td className="mono">{item.itemKey}</td><td><Pill tone={item.status === "completed" ? "green" : item.status === "failed" ? "red" : "amber"}>{item.status}</Pill></td>
              <td>{item.attemptCount}</td><td>{item.leaseExpiresAt ? date(item.leaseExpiresAt) : "—"}</td>
              <td><div>{date(item.startedAt)}</div><div className="muted">→ {date(item.completedAt)}</div></td>
              <td>{item.error && <div style={{ maxWidth: 360, overflowWrap: "anywhere" }}>{item.error}</div>}{item.status === "failed" && <button className="btn sm" disabled={pending} onClick={() => retry(item.id)}>Retry item</button>}</td>
            </tr>)}
            {!job.items.length && <tr><td colSpan={6} className="empty">Job chưa có item.</td></tr>}
          </tbody>
        </table></div>
      </Card>

      <Card title="Checkpoint và error summary">
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 12 }}>{json(job.checkpoint)}</pre>
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 12 }}>{json(job.errorSummary)}</pre>
      </Card>
    </div>
  );
}
