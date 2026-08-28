"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card, Pill } from "@/components/ui";
import type { CandidateRow, SimulationSummary } from "@/lib/readiness-v4/simulator-service";
import type { ReadinessPolicyView } from "@/lib/readiness-v4/policy-view-service";

interface ProfileOption {
  id: string;
  school: string;
  status: string;
  sourceHash: string;
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function ReadinessSimulator({
  policies,
  profiles,
  selectedPolicyId,
  selectedProfileIds,
  rows,
  summary,
}: {
  policies: ReadinessPolicyView[];
  profiles: ProfileOption[];
  selectedPolicyId: string;
  selectedProfileIds: string[];
  rows: CandidateRow[];
  summary: SimulationSummary;
}) {
  const selectedSet = useMemo(() => new Set(selectedProfileIds), [selectedProfileIds]);
  const selectedPolicy = policies.find((policy) => policy.id === selectedPolicyId);
  const statusChanges = useMemo(() => {
    const point = new Map<string, CandidateRow>();
    for (const row of rows) point.set(`${row.userKey}:${row.school}`, row);
    return [...point.values()].filter((row) => row.pointStatus !== row.countStatus);
  }, [rows]);

  const exportJson = () => {
    download(
      `readiness-v4-simulator-${selectedPolicyId.slice(0, 12)}.json`,
      JSON.stringify({ summary, rows }, null, 2),
      "application/json",
    );
  };

  const exportCsv = () => {
    const header = ["userKey", "school", "legacy", "pointReadiness", "countReadiness", "mastery", "pointEvidence", "countEvidence", "pointStatus", "countStatus"];
    const body = rows.map((row) => header.map((field) => csvCell(row[field as keyof CandidateRow])).join(","));
    download(`readiness-v4-simulator-${selectedPolicyId.slice(0, 12)}.csv`, [header.join(","), ...body].join("\n"), "text/csv;charset=utf-8");
  };

  return (
    <div className="col" style={{ gap: 16 }}>
      <Card title="Readiness V4 · Simulator" sub="Preview read-only, deterministic; không thay đổi assignment, read flag hay active snapshot.">
        <form method="get" className="grid cols-2" style={{ gap: 12 }}>
          <label className="field"><span>Candidate policy</span>
            <select name="policy" defaultValue={selectedPolicyId}>
              {policies.map((policy) => <option key={policy.id} value={policy.id}>{policy.version} · {policy.status}</option>)}
            </select>
          </label>
          <label className="field"><span>Profile candidate set</span>
            <select name="profiles" multiple defaultValue={selectedProfileIds} size={Math.min(8, Math.max(3, profiles.length))}>
              {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.school} · {profile.status}</option>)}
            </select>
            <small className="muted">Giữ Ctrl/Cmd để chọn nhiều trường. Mặc định dùng toàn bộ shadow profile.</small>
          </label>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button className="btn primary" type="submit">Chạy preview</button>
            <Link className="btn" href="/admin?tab=readiness&subject=math">Quay về Readiness V4</Link>
          </div>
        </form>
        {selectedPolicy?.validationError && <div className="notice error" style={{ marginTop: 14 }}>Candidate policy không hợp lệ: {selectedPolicy.validationError}</div>}
      </Card>

      <div className="grid cols-4" style={{ gap: 12 }}>
        <Card title="Users compared"><b>{summary.users}</b></Card>
        <Card title="Schools compared"><b>{summary.schools}</b></Card>
        <Card title="Snapshots compared"><b>{summary.snapshotsCompared}</b></Card>
        <Card title="Invariant violations"><Pill tone={summary.invariantViolations ? "red" : "green"}>{summary.invariantViolations}</Pill></Card>
      </div>

      <Card title="Candidate summary" sub="Hai mode point/count được tính song song để phát hiện tác động của weight mode; không diễn giải là tiến bộ học sinh.">
        <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button className="btn sm" onClick={exportJson} disabled={!rows.length}>Tải JSON reconciliation</button>
          <button className="btn sm" onClick={exportCsv} disabled={!rows.length}>Tải CSV reconciliation</button>
          <span className="muted">Candidate policy: <span className="mono">{selectedPolicy?.version ?? selectedPolicyId}</span></span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Trường</th><th>Users</th><th>Point median</th><th>Count median</th><th>Ready point</th><th>Ready count</th><th>Avg |delta|</th></tr></thead>
            <tbody>
              {Object.entries(summary.bySchool).map(([school, value]) => <tr key={school}>
                <td><b>{school.toUpperCase()}</b></td><td>{value.users}</td>
                <td className="mono">{value.point.median.toFixed(1)}</td><td className="mono">{value.count.median.toFixed(1)}</td>
                <td>{value.point.ready}/{value.users}</td><td>{value.count.ready}/{value.users}</td>
                <td className="mono">{value.averageAbsolutePointCountDelta.toFixed(2)}</td>
              </tr>)}
              {!Object.keys(summary.bySchool).length && <tr><td colSpan={7} className="empty">Chưa có snapshot mastery đủ để chạy preview.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Preview rows" sub="userKey đã hash; report không trả email, answer hoặc user ID.">
        <div className="muted" style={{ marginBottom: 10 }}>{statusChanges.length} row có status khác nhau giữa point và count mode.</div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>userKey</th><th>Trường</th><th>Legacy</th><th>Point / Count</th><th>Mastery</th><th>Evidence</th><th>Status point / count</th></tr></thead>
            <tbody>
              {rows.slice(0, 200).map((row) => <tr key={`${row.userKey}:${row.school}`}>
                <td className="mono">{row.userKey}</td><td>{row.school.toUpperCase()}</td><td>{row.legacy == null ? "—" : row.legacy.toFixed(1)}</td>
                <td className="mono">{row.pointReadiness.toFixed(1)} / {row.countReadiness.toFixed(1)}</td>
                <td>{(row.mastery * 100).toFixed(1)}%</td><td>{(row.pointEvidence * 100).toFixed(1)}% / {(row.countEvidence * 100).toFixed(1)}%</td>
                <td><Pill tone={row.pointStatus === row.countStatus ? "" : "amber"}>{row.pointStatus} / {row.countStatus}</Pill></td>
              </tr>)}
              {!rows.length && <tr><td colSpan={7} className="empty">Không có row preview.</td></tr>}
            </tbody>
          </table>
        </div>
        {rows.length > 200 && <p className="muted">Đang hiển thị 200 row đầu; file export chứa toàn bộ {rows.length} row.</p>}
      </Card>

      <Card title="Selected profiles" sub="Profile ID và source hash chỉ hiển thị trong Admin preview.">
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {profiles.filter((profile) => selectedSet.has(profile.id)).map((profile) => <Pill key={profile.id}>{profile.school} · {profile.status}</Pill>)}
        </div>
      </Card>
    </div>
  );
}
