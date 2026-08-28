"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Card, Pill } from "@/components/ui";
import {
  activateReadinessProfileAction,
  approveReadinessProfileAction,
  enqueueSchoolProfileBuildAction,
  retireReadinessProfileAction,
  reviewReadinessProfileAction,
} from "@/app/(app)/admin/readiness-v4-actions";
import type { ProfileCandidateComparisonView, ProfileLifecycleVersionView } from "@/lib/readiness-v4/profile-lifecycle-service";

interface AssessmentRunOption { id: string; version: string; inputHash: string; createdAt: string; }
interface SchoolOption { id: string; short: string; name: string; }

function formatDate(value: string | null): string { return value ? new Date(value).toLocaleString("vi-VN") : "—"; }

function VersionSummary({ label, version }: { label: string; version: ProfileLifecycleVersionView | null }) {
  if (!version) return <div><div className="muted">{label}</div><span className="muted">Chưa có</span></div>;
  return <div>
    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}><span className="muted">{label}</span><Pill tone={version.status === "active" ? "green" : version.status === "shadow" ? "amber" : ""}>{version.status}</Pill></div>
    <div className="mono" style={{ overflowWrap: "anywhere" }}>{version.id}</div>
    <div>{version.examCount} đề · {version.questionCount} câu · {version.yearCount} năm</div>
    <div>Difficulty Index: <b>{version.difficultyIndex.toFixed(1)}</b></div>
    <div className="muted">source {version.sourceHash.slice(0, 16)}… · {formatDate(version.createdAt)}</div>
    <div className="muted">review: {version.reviewedByUserId ?? "chưa có"} · approve: {version.approvedByUserId ?? "chưa có"}</div>
    {version.reliabilityFlags.length > 0 && <div className="muted">flags: {version.reliabilityFlags.join(" · ")}</div>}
  </div>;
}

export function ProfileLifecycle({ rows, assessmentRuns, schools }: { rows: ProfileCandidateComparisonView[]; assessmentRuns: AssessmentRunOption[]; schools: SchoolOption[] }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [assessmentRunId, setAssessmentRunId] = useState(assessmentRuns[0]?.id ?? "");
  const [selectedSchools, setSelectedSchools] = useState<string[]>(schools.map((school) => school.id));

  const run = (action: () => Promise<unknown>, success: string) => {
    setMessage(null);
    startTransition(async () => {
      try { await action(); setMessage(success); window.location.reload(); }
      catch (error) { setMessage(`Lỗi: ${error instanceof Error ? error.message : String(error)}`); }
    });
  };
  const reason = (label: string): string | null => {
    const value = window.prompt(`${label}\nNhập lý do (ít nhất 10 ký tự):`);
    if (!value || value.trim().length < 10) { setMessage("Lỗi: lý do phải có ít nhất 10 ký tự."); return null; }
    return value.trim();
  };
  const build = () => {
    if (!assessmentRunId || !selectedSchools.length) { setMessage("Lỗi: cần chọn assessment run và ít nhất một trường."); return; }
    run(() => enqueueSchoolProfileBuildAction({ assessmentRunId, schools: selectedSchools }), "Đã enqueue build/refresh shadow profile.");
  };
  const profileAction = (kind: "review" | "approve" | "activate" | "retire", version: ProfileLifecycleVersionView) => {
    const value = reason(`${kind.toUpperCase()} profile ${version.school}`);
    if (!value) return;
    if (!window.confirm(`${kind.toUpperCase()} profile ${version.school}? Thao tác sẽ được audit.`)) return;
    if (kind === "review") run(() => reviewReadinessProfileAction({ profileVersionId: version.id, reason: value }), "Đã review profile.");
    if (kind === "approve") run(() => approveReadinessProfileAction({ profileVersionId: version.id, reason: value }), "Đã approve profile.");
    if (kind === "retire") run(() => retireReadinessProfileAction({ profileVersionId: version.id, reason: value }), "Đã retire shadow profile.");
    if (kind === "activate") {
      const approverUserId = window.prompt("Nhập user ID của approver đã approve profile:");
      if (!approverUserId) return;
      run(() => activateReadinessProfileAction({ profileVersionId: version.id, approverUserId: approverUserId.trim(), reason: value }), "Đã activate profile và enqueue recompute.");
    }
  };

  return <div className="col" style={{ gap: 16 }}>
    <Card title="School Profile lifecycle" sub="Build/refresh chạy qua DB-backed worker; candidate immutable ở shadow cho tới khi review, approve và activate.">
      <div className="grid cols-2" style={{ gap: 12 }}>
        <label className="field"><span>Approved assessment run</span><select value={assessmentRunId} onChange={(event) => setAssessmentRunId(event.target.value)} disabled={pending}>
          {assessmentRuns.map((run) => <option key={run.id} value={run.id}>{run.version} · {run.id.slice(0, 12)}…</option>)}
        </select><small className="muted">Chỉ assessment run approved được nhận.</small></label>
        <label className="field"><span>Build/refresh scope</span><select multiple value={selectedSchools} onChange={(event) => setSelectedSchools([...event.target.selectedOptions].map((option) => option.value))} size={Math.min(8, Math.max(3, schools.length))} disabled={pending}>
          {schools.map((school) => <option key={school.id} value={school.id}>{school.short} · {school.name}</option>)}
        </select><small className="muted">Chọn rõ từng trường; không build dài trong web request.</small></label>
      </div>
      <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <button className="btn primary" disabled={pending || !assessmentRuns.length || !selectedSchools.length} onClick={build}>Enqueue build/refresh shadow</button>
        <Link className="btn" href="/admin?tab=readiness&subject=math">Quay về Readiness V4</Link>
        <Link className="btn" href="/admin/readiness/compare">So sánh tổng thể</Link>
      </div>
      {!assessmentRuns.length && <div className="notice error" style={{ marginTop: 12 }}>Chưa có approved assessment run để build profile.</div>}
      {message && <div className="muted" style={{ marginTop: 10 }}>{message}</div>}
    </Card>
    <Card title="Candidate vs Active" sub="Candidate phải được review và approve trước activate; activate dùng approver khác activator và tự enqueue active recompute scope.">
      <div className="col" style={{ gap: 14 }}>
        {rows.map((row) => <details key={row.school} open>
          <summary style={{ cursor: "pointer", fontWeight: 700 }}>{row.school.toUpperCase()} · {row.candidate ? "có candidate" : "chưa có candidate"}</summary>
          <div className="grid cols-3" style={{ gap: 12, marginTop: 10 }}>
            <VersionSummary label="Active" version={row.active} />
            <div><VersionSummary label="Candidate" version={row.candidate} />
              {row.candidate && <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                <button className="btn sm" disabled={pending || Boolean(row.candidate.reviewedByUserId)} onClick={() => profileAction("review", row.candidate!)}>Review</button>
                <button className="btn sm" disabled={pending || !row.candidate.reviewedByUserId || Boolean(row.candidate.approvedByUserId)} onClick={() => profileAction("approve", row.candidate!)}>Approve</button>
                <button className="btn sm" disabled={pending || !row.candidate.approvedByUserId} onClick={() => profileAction("activate", row.candidate!)}>Activate</button>
                <button className="btn sm" disabled={pending} onClick={() => profileAction("retire", row.candidate!)}>Retire</button>
              </div>}
            </div>
            <div><div className="muted">Candidate delta</div>
              {!row.delta ? <span className="muted">Chưa đủ active/candidate để so sánh.</span> : <>
                <div>Exam: <b>{row.delta.examAdded >= 0 ? "+" : ""}{row.delta.examAdded}</b> thêm · <b>{row.delta.examRemoved}</b> bỏ</div>
                <div>Questions: <b>{row.delta.questionCount >= 0 ? "+" : ""}{row.delta.questionCount}</b></div>
                <div>Difficulty Index: <b>{row.delta.difficultyIndex == null ? "—" : `${row.delta.difficultyIndex >= 0 ? "+" : ""}${row.delta.difficultyIndex.toFixed(2)}`}</b></div>
                <div>Source changed: <b>{row.delta.sourceChanged ? "yes" : "no"}</b></div>
                {row.delta.reliabilityFlagsAdded.length > 0 && <div className="muted">Flags added: {row.delta.reliabilityFlagsAdded.join(" · ")}</div>}
              </>}
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div className="muted">Version history ({row.versions.length})</div>
            <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 5 }}>
              {row.versions.map((version) => <Pill key={version.id} tone={version.status === "active" ? "green" : version.status === "shadow" ? "amber" : ""}>{version.status} · {version.id.slice(0, 10)}…</Pill>)}
            </div>
          </div>
        </details>)}
        {!rows.length && <div className="empty">Chưa có School Profile version.</div>}
      </div>
    </Card>
  </div>;
}
