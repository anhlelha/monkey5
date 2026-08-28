"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Card, Pill } from "@/components/ui";
import type { ReadinessPolicy } from "@/lib/readiness-v4/types";
import {
  cloneReadinessPolicyDraftAction,
  moveReadinessPolicyToShadowAction,
  updateReadinessPolicyDraftAction,
} from "@/app/(app)/admin/readiness-v4-actions";
import type { ReadinessPolicyView } from "@/lib/readiness-v4/policy-view-service";

type NumericPolicyKey = Exclude<keyof ReadinessPolicy, "formulaKey" | "blueprintWeightMode">;

const NUMERIC_FIELDS: Array<{ key: NumericPolicyKey; label: string; help: string; ratio?: boolean }> = [
  { key: "priorStrength", label: "Prior strength (K)", help: "Độ mạnh của prior khi evidence còn ít." },
  { key: "priorMastery", label: "Prior mastery", help: "Giá trị prior mặc định.", ratio: true },
  { key: "evidenceTarget", label: "Evidence target (N)", help: "Số evidence mục tiêu để đạt coverage đầy đủ." },
  { key: "evidenceExponent", label: "Evidence exponent", help: "Số mũ điều chỉnh tốc độ tăng evidence." },
  { key: "preparingThreshold", label: "Preparing threshold", help: "Ngưỡng bắt đầu trạng thái Preparing.", ratio: true },
  { key: "nearReadyThreshold", label: "Near-ready threshold", help: "Ngưỡng Near Ready.", ratio: true },
  { key: "readyThreshold", label: "Ready threshold", help: "Ngưỡng Ready trước khi xét gate.", ratio: true },
  { key: "strongReadyThreshold", label: "Strong-ready threshold", help: "Ngưỡng Strong Ready.", ratio: true },
  { key: "overallEvidenceGate", label: "Overall evidence gate", help: "Gate evidence tổng thể.", ratio: true },
  { key: "advancedShareGate", label: "Advanced share gate", help: "Tỷ trọng advanced tối thiểu.", ratio: true },
  { key: "advancedEvidenceGate", label: "Advanced evidence gate", help: "Evidence tối thiểu trong advanced.", ratio: true },
  { key: "criticalTopicThreshold", label: "Critical topic threshold", help: "Tỷ trọng để topic được xem là critical.", ratio: true },
  { key: "criticalMasteryGate", label: "Critical mastery gate", help: "Mastery tối thiểu của critical topic.", ratio: true },
  { key: "criticalEvidenceGate", label: "Critical evidence gate", help: "Evidence tối thiểu của critical topic.", ratio: true },
];

const EDITABLE_STATUSES = new Set(["draft"]);

function statusTone(status: string): string {
  if (status === "active") return "green";
  if (status === "shadow") return "amber";
  if (status === "retired") return "";
  return "solid";
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString("vi-VN") : "—";
}

function formatValue(key: NumericPolicyKey, value: number): string {
  const field = NUMERIC_FIELDS.find((item) => item.key === key);
  return field?.ratio ? `${(value * 100).toFixed(1)}%` : String(value);
}

function validateClientPolicy(policy: ReadinessPolicy): string[] {
  const errors: string[] = [];
  if (policy.priorStrength <= 0 || policy.evidenceTarget <= 0 || policy.evidenceExponent <= 0 || policy.evidenceExponent > 1) {
    errors.push("K, N và evidence exponent phải nằm trong range hợp lệ.");
  }
  const ratioKeys = NUMERIC_FIELDS.filter((field) => field.ratio).map((field) => field.key);
  if (ratioKeys.some((key) => policy[key] < 0 || policy[key] > 1)) errors.push("Các giá trị tỷ lệ phải nằm trong khoảng 0..1.");
  if (!(policy.preparingThreshold < policy.nearReadyThreshold && policy.nearReadyThreshold < policy.readyThreshold && policy.readyThreshold < policy.strongReadyThreshold)) {
    errors.push("Các status threshold phải tăng nghiêm ngặt theo thứ tự Preparing < Near Ready < Ready < Strong Ready.");
  }
  return errors;
}

function DiffTable({ current, active }: { current: ReadinessPolicy; active: ReadinessPolicyView | undefined }) {
  if (!active?.policy) {
    return <p className="muted">Chưa có Active policy hợp lệ để so sánh.</p>;
  }
  const changes = NUMERIC_FIELDS.filter(({ key }) => current[key] !== active.policy?.[key]);
  if (!changes.length && current.blueprintWeightMode === active.policy.blueprintWeightMode) {
    return <p className="muted">Không có thay đổi so với Active policy.</p>;
  }
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Trường</th><th>Active</th><th>Draft/Shadow</th><th>Chiều thay đổi</th></tr></thead>
        <tbody>
          {changes.map(({ key, label }) => {
            const before = active.policy?.[key] as number;
            const after = current[key];
            return <tr key={key}>
              <td>{label}</td>
              <td className="mono">{formatValue(key, before)}</td>
              <td className="mono">{formatValue(key, after)}</td>
              <td>{after > before ? "Tăng" : "Giảm"}</td>
            </tr>;
          })}
          {current.blueprintWeightMode !== active.policy.blueprintWeightMode && <tr>
            <td>Blueprint weight mode</td>
            <td>{active.policy.blueprintWeightMode}</td>
            <td>{current.blueprintWeightMode}</td>
            <td>Thay đổi mode</td>
          </tr>}
        </tbody>
      </table>
    </div>
  );
}

export function ReadinessPolicyManagement({
  views,
  selected,
}: {
  views: ReadinessPolicyView[];
  selected?: ReadinessPolicyView | null;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [policy, setPolicy] = useState<ReadinessPolicy | null>(selected?.policy ?? null);
  const [reason, setReason] = useState("");
  const active = views.find((view) => view.status === "active");
  const errors = useMemo(() => policy ? validateClientPolicy(policy) : [], [policy]);
  const isEditable = selected ? EDITABLE_STATUSES.has(selected.status) && Boolean(policy) : false;

  const run = (action: () => Promise<unknown>, success: string) => {
    setMessage(null);
    startTransition(async () => {
      try {
        await action();
        setMessage(success);
      } catch (error) {
        setMessage(`Lỗi: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  };

  const clone = () => {
    const version = window.prompt("Version mới (3–80 ký tự, a-z/0-9/._-):", `math-readiness-policy-${Date.now()}`);
    if (!version) return;
    const changeSummary = window.prompt("Tóm tắt thay đổi (ít nhất 10 ký tự):");
    if (!changeSummary) return;
    run(
      async () => {
        const result = await cloneReadinessPolicyDraftAction({ sourcePolicyVersionId: selected?.id ?? active?.id ?? views[0]?.id ?? "", version, changeSummary });
        window.location.href = `/admin/readiness/policies/${result.id}`;
      },
      "Đã tạo Draft policy.",
    );
  };

  const save = () => {
    if (!selected || !policy || errors.length) return;
    if (reason.trim().length < 10) {
      setMessage("Lỗi: Edit reason phải có ít nhất 10 ký tự.");
      return;
    }
    run(() => updateReadinessPolicyDraftAction({ policyVersionId: selected.id, policy, reason }), "Đã lưu Draft policy và ghi audit.");
  };

  const moveToShadow = () => {
    if (!selected || reason.trim().length < 10) {
      setMessage("Lỗi: Review reason phải có ít nhất 10 ký tự.");
      return;
    }
    if (!window.confirm("Chuyển Draft sang Shadow? Thao tác này sẽ ghi audit và không thể sửa tại chỗ sau đó.")) return;
    run(() => moveReadinessPolicyToShadowAction({ policyVersionId: selected.id, reason }), "Đã chuyển policy sang Shadow.");
  };

  return (
    <div className="col" style={{ gap: 16 }}>
      <Card title="Policy versions" sub="Policy là immutable theo version; chỉ Draft được sửa. Activation global vẫn thực hiện ở workflow rollout riêng.">
        <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button className="btn" disabled={pending || !views.length} onClick={clone}>Clone Active to Draft</button>
          <Link className="btn" href="/admin?tab=readiness&subject=math">Quay về Readiness V4</Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Version</th><th>Status</th><th>Change summary</th><th>Created</th><th>Reviewer/activator</th><th>Thao tác</th></tr></thead>
            <tbody>
              {views.map((view) => <tr key={view.id}>
                <td><Link href={`/admin/readiness/policies/${view.id}`}><b>{view.version}</b></Link><div className="muted mono" style={{ fontSize: 10 }}>{view.id}</div></td>
                <td><Pill tone={statusTone(view.status)}>{view.status}</Pill></td>
                <td>{view.changeSummary}</td>
                <td>{formatDate(view.createdAt)}</td>
                <td>
                  <div>{view.reviewedByUserId ? `review: ${view.reviewedByUserId}` : "Chưa review"}</div>
                  <div className="muted">{view.activatedByUserId ? `activate: ${view.activatedByUserId}` : "Chưa activate"}</div>
                </td>
                <td><Link className="btn sm" href={`/admin/readiness/policies/${view.id}`}>Mở detail</Link></td>
              </tr>)}
              {!views.length && <tr><td colSpan={6} className="empty">Chưa có policy math. Hãy tạo policy Draft từ workflow khởi tạo hiện có.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && (
        <Card title={`Policy detail · ${selected.version}`} sub={`${selected.status} · ${selected.methodologyVersion} · cập nhật ${formatDate(selected.updatedAt)}`}>
          <div className="grid cols-3" style={{ gap: 12 }}>
            <div><div className="muted">Creator</div><div className="mono">{selected.createdByUserId}</div></div>
            <div><div className="muted">Reviewer</div><div className="mono">{selected.reviewedByUserId ?? "—"}</div></div>
            <div><div className="muted">Activation</div><div className="mono">{selected.activatedByUserId ?? "—"}</div></div>
          </div>
          {selected.validationError && <div className="notice error" style={{ marginTop: 12 }}>Policy không hợp lệ: {selected.validationError}</div>}
          {!selected.policy ? <p className="muted" style={{ marginTop: 12 }}>Không thể dựng typed policy model.</p> : <>
            <div className="grid cols-2" style={{ gap: 12, marginTop: 16 }}>
              <label className="field"><span>Formula key</span><input value={selected.policy.formulaKey} readOnly /></label>
              <label className="field"><span>Blueprint weight mode</span>
                <select disabled={!isEditable} value={policy?.blueprintWeightMode ?? selected.policy.blueprintWeightMode} onChange={(event) => setPolicy((current) => current ? { ...current, blueprintWeightMode: event.target.value as ReadinessPolicy["blueprintWeightMode"] } : current)}>
                  <option value="controlled-fallback">controlled-fallback</option><option value="point">point</option><option value="count">count</option>
                </select>
              </label>
            </div>
            <div className="grid cols-2" style={{ gap: 12, marginTop: 12 }}>
              {NUMERIC_FIELDS.map(({ key, label, help, ratio }) => <label className="field" key={key}>
                <span>{label} {ratio ? "(0–100%)" : ""}</span>
                <input
                  type="number"
                  min={ratio ? 0 : undefined}
                  max={ratio ? 100 : undefined}
                  step="any"
                  disabled={!isEditable}
                  value={policy ? (ratio ? (policy[key] * 100).toString() : policy[key].toString()) : ""}
                  onChange={(event) => {
                    const parsed = Number(event.target.value);
                    if (!Number.isFinite(parsed)) return;
                    setPolicy((current) => current ? { ...current, [key]: ratio ? parsed / 100 : parsed } : current);
                  }}
                />
                <small className="muted">{help}</small>
              </label>)}
            </div>
            {isEditable && <>
              <label className="field" style={{ marginTop: 14 }}><span>Edit/review reason</span><textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nêu rõ lý do thay đổi hoặc review policy…" /></label>
              {errors.length > 0 && <div className="notice error" style={{ marginTop: 12 }}>{errors.map((error) => <div key={error}>{error}</div>)}</div>}
              <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <button className="btn primary" disabled={pending || errors.length > 0} onClick={save}>Lưu Draft</button>
                <button className="btn" disabled={pending || errors.length > 0} onClick={moveToShadow}>Submit / Move to Shadow</button>
              </div>
            </>}
          </>}
          <div style={{ marginTop: 20 }}>
            <h4>Diff so với Active</h4>
            {selected.policy && <DiffTable current={selected.policy} active={active?.id === selected.id ? undefined : active} />}
          </div>
          {selected.assignment && <div style={{ marginTop: 20 }}>
            <h4>Assignment</h4>
            <div className="muted">{selected.assignment.status} · effective từ {formatDate(selected.assignment.effectiveFrom)} · {selected.assignment.reason}</div>
          </div>}
          <div style={{ marginTop: 20 }}>
            <h4>Audit log</h4>
            <div className="col" style={{ gap: 8 }}>
              {selected.audits.map((audit) => <div key={audit.id} style={{ fontSize: 12.5 }}>
                <b>{audit.action}</b> · {audit.fromState ?? "—"} → {audit.toState ?? "—"}
                <div className="muted">{audit.reason} · {audit.actorUserId} · {formatDate(audit.createdAt)}</div>
              </div>)}
              {!selected.audits.length && <span className="muted">Chưa có audit event.</span>}
            </div>
          </div>
          {message && <div className="muted" style={{ marginTop: 14 }}>{message}</div>}
        </Card>
      )}
    </div>
  );
}
