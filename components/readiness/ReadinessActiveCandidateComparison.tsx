"use client";

import { useMemo } from "react";
import { Card, Pill } from "@/components/ui";
import type { ActiveCandidateRow, ActiveCandidateComparisonSummary } from "@/lib/readiness-v4/simulator-service";

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function cell(value: unknown): string {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function ReadinessActiveCandidateComparison({ rows, summary }: { rows: ActiveCandidateRow[]; summary: ActiveCandidateComparisonSummary }) {
  const changedRows = useMemo(() => rows.filter((row) => row.gainedReady || row.lostReady || row.becameEvidenceLimited || (row.readinessDelta != null && Math.abs(row.readinessDelta) >= 0.01)), [rows]);
  const exportJson = () => download(`readiness-v4-active-candidate-${summary.candidatePolicyVersionId.slice(0, 12)}.json`, JSON.stringify({ summary, rows }, null, 2), "application/json");
  const exportCsv = () => {
    const header = ["userKey", "school", "activeReadiness", "candidateReadiness", "readinessDelta", "activeStatus", "candidateStatus", "gainedReady", "lostReady", "becameEvidenceLimited", "changedReasonCodes"];
    const body = rows.map((row) => header.map((key) => cell(key === "changedReasonCodes" ? row.changedReasonCodes.join("|") : row[key as keyof ActiveCandidateRow])).join(","));
    download(`readiness-v4-active-candidate-${summary.candidatePolicyVersionId.slice(0, 12)}.csv`, [header.join(","), ...body].join("\n"), "text/csv;charset=utf-8");
  };

  return <Card title="Active vs Shadow Profile comparison" sub="Cùng một mastery evidence được tính qua active và candidate policy/profile; chênh lệch không được diễn giải là tiến bộ học sinh.">
    <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
      <Pill tone={summary.invariantViolations ? "red" : "green"}>Invariant: {summary.invariantViolations}</Pill>
      <span>Compared: <b>{summary.snapshotsCompared}</b></span>
      <span>Changed rows: <b>{changedRows.length}</b></span>
      <button className="btn sm" disabled={!rows.length} onClick={exportJson}>Tải JSON comparison</button>
      <button className="btn sm" disabled={!rows.length} onClick={exportCsv}>Tải CSV comparison</button>
    </div>
    <div className="muted" style={{ marginBottom: 12 }}>Active policy: <span className="mono">{summary.activePolicyVersionId ?? "unavailable"}</span> · Candidate policy: <span className="mono">{summary.candidatePolicyVersionId}</span></div>

    <h4>Policy delta</h4>
    <div className="table-wrap"><table className="table"><thead><tr><th>Field</th><th>Active</th><th>Candidate</th></tr></thead><tbody>
      {summary.policyChanges.map((change) => <tr key={change.field}><td>{change.field}</td><td className="mono">{typeof change.active === "number" ? change.active.toFixed(4) : change.active}</td><td className="mono">{typeof change.candidate === "number" ? change.candidate.toFixed(4) : change.candidate}</td></tr>)}
      {!summary.policyChanges.length && <tr><td colSpan={3} className="empty">Policy không thay đổi.</td></tr>}
    </tbody></table></div>

    <h4>Profile delta theo trường</h4>
    <div className="table-wrap"><table className="table"><thead><tr><th>Trường</th><th>Profile</th><th>Median readiness Δ</th><th>Ready gained/lost</th><th>Evidence limited</th><th>Status distribution</th></tr></thead><tbody>
      {Object.entries(summary.bySchool).map(([school, value]) => <tr key={school}>
        <td><b>{school.toUpperCase()}</b></td>
        <td><div className="muted">{value.activeProfileVersionId ? `A: ${value.activeProfileVersionId.slice(0, 10)}…` : "A: —"}</div><div>{value.candidateProfileVersionId ? `S: ${value.candidateProfileVersionId.slice(0, 10)}…` : "S: —"}</div><div className="muted">{value.profileChanged ? "source changed" : "same source"}</div></td>
        <td className="mono">{value.medianReadinessDelta == null ? "—" : `${value.medianReadinessDelta >= 0 ? "+" : ""}${value.medianReadinessDelta.toFixed(2)}`}</td>
        <td><Pill tone={value.gainedReady ? "green" : ""}>+{value.gainedReady}</Pill> <Pill tone={value.lostReady ? "red" : ""}>−{value.lostReady}</Pill></td>
        <td>{value.becameEvidenceLimited}</td>
        <td><div className="muted">A: {Object.entries(value.activeStatusDistribution).map(([key, count]) => `${key} ${count}`).join(" · ") || "—"}</div><div>S: {Object.entries(value.candidateStatusDistribution).map(([key, count]) => `${key} ${count}`).join(" · ") || "—"}</div></td>
      </tr>)}
      {!Object.keys(summary.bySchool).length && <tr><td colSpan={6} className="empty">Chưa có candidate profile hoặc mastery snapshot.</td></tr>}
    </tbody></table></div>

    <h4>Drill-down các row thay đổi</h4>
    <div className="col" style={{ gap: 8 }}>
      {changedRows.slice(0, 200).map((row) => <details key={`${row.userKey}:${row.school}`}>
        <summary style={{ cursor: "pointer" }}><span className="mono">{row.userKey}</span> · {row.school.toUpperCase()} · {row.readinessDelta == null ? "—" : `${row.readinessDelta >= 0 ? "+" : ""}${row.readinessDelta.toFixed(2)}`} · {row.activeStatus ?? "—"} → {row.candidateStatus ?? "—"}</summary>
        <div className="muted" style={{ marginTop: 6 }}>Profile: {row.activeProfileVersionId ?? "—"} → {row.candidateProfileVersionId ?? "—"}</div>
        <div>Readiness: {row.activeReadiness == null ? "—" : row.activeReadiness.toFixed(2)} → {row.candidateReadiness == null ? "—" : row.candidateReadiness.toFixed(2)}</div>
        <div>Mastery: {row.activeMastery == null ? "—" : `${(row.activeMastery * 100).toFixed(1)}%`} → {row.candidateMastery == null ? "—" : `${(row.candidateMastery * 100).toFixed(1)}%`}</div>
        <div>Evidence: {row.activeEvidence == null ? "—" : `${(row.activeEvidence * 100).toFixed(1)}%`} → {row.candidateEvidence == null ? "—" : `${(row.candidateEvidence * 100).toFixed(1)}%`}</div>
        <div className="muted">Changed gate/reason codes: {row.changedReasonCodes.join(" · ") || "Không có"}</div>
      </details>)}
      {!changedRows.length && <span className="muted">Không có row thay đổi trong scope đã chọn.</span>}
      {changedRows.length > 200 && <span className="muted">Hiển thị 200 row đầu; file export chứa toàn bộ.</span>}
    </div>
  </Card>;
}
