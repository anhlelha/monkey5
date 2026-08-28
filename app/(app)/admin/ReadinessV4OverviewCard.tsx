import Link from "next/link";
import { Card, Pill } from "@/components/ui";
import type { ReadinessV4AdminState } from "./readiness-v4-actions";

const STATUS_META: Record<string, { label: string; tone: "green" | "amber" | "red" | "" }> = {
  ready: { label: "Sẵn sàng", tone: "green" },
  strong_ready: { label: "Sẵn sàng tốt", tone: "green" },
  evidence_limited: { label: "Thiếu evidence", tone: "amber" },
  preparing: { label: "Đang chuẩn bị", tone: "amber" },
  not_ready: { label: "Chưa sẵn sàng", tone: "red" },
  unverified: { label: "Chưa xác minh", tone: "" },
};

function statusLabel(status: string) {
  return STATUS_META[status]?.label ?? status.replaceAll("_", " ");
}

export function ReadinessV4OverviewCard({ state }: { state: ReadinessV4AdminState }) {
  const statusCounts = state.monitoring.latestStatusCounts;
  const totalStatus = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
  const currentReady = (statusCounts.ready ?? 0) + (statusCounts.strong_ready ?? 0);
  const readyPct = totalStatus > 0 ? Math.round((currentReady / totalStatus) * 100) : null;
  const activeProfiles = state.profiles.active;
  const queued = state.monitoring.queuedItems + state.monitoring.runningItems;
  const orderedStatuses = ["ready", "strong_ready", "evidence_limited", "preparing", "not_ready", "unverified"]
    .filter((status) => statusCounts[status] !== undefined);

  return (
    <Card
      title="Readiness V4 · tổng quan vận hành"
      sub="Dashboard này chỉ dùng snapshot, pointer, profile và job V4. Số liệu legacy được chuyển sang trang baseline riêng."
      action={
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <Link href="/admin?tab=readiness" className="btn sm ghost">Mở control plane</Link>
          <Link href="/admin/legacy-baseline" className="btn sm ghost">Xem baseline cũ</Link>
        </div>
      }
    >
      <div className="grid cols-4" style={{ gap: 12 }}>
        <div className="school-card" style={{ padding: 14 }}>
          <div className="eyebrow">SNAPSHOT READINESS</div>
          <div className="kpi" style={{ marginTop: 5 }}>{state.snapshots.readiness.toLocaleString("vi-VN")}</div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>bản ghi V4 hiện có</div>
        </div>
        <div className="school-card" style={{ padding: 14 }}>
          <div className="eyebrow">PROFILE ĐANG DÙNG</div>
          <div className="kpi" style={{ marginTop: 5 }}>{activeProfiles}</div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>{state.profiles.shadow} shadow · {state.profiles.retired} đã nghỉ</div>
        </div>
        <div className="school-card" style={{ padding: 14 }}>
          <div className="eyebrow">TỈ LỆ SẴN SÀNG</div>
          <div className="kpi" style={{ marginTop: 5 }}>{readyPct === null ? "—" : `${readyPct}%`}</div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>{totalStatus > 0 ? `${currentReady}/${totalStatus} user đã sẵn sàng` : "Chưa có status snapshot"}</div>
        </div>
        <div className="school-card" style={{ padding: 14 }}>
          <div className="eyebrow">HÀNG ĐỢI XỬ LÝ</div>
          <div className="kpi" style={{ marginTop: 5 }}>{queued}</div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>{state.monitoring.runningItems} đang chạy · {state.monitoring.queuedItems} đang chờ</div>
        </div>
      </div>

      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-soft)" }}>
        <div className="row between" style={{ gap: 10, marginBottom: 10 }}>
          <div>
            <div className="eyebrow">PHÂN BỐ TRẠNG THÁI V4</div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 3 }}>Tính trên snapshot mới nhất, không cộng dồn lịch sử.</div>
          </div>
          <Link className="btn sm ghost" href="/admin/readiness/simulator">Mở simulator</Link>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {orderedStatuses.map((status) => {
            const meta = STATUS_META[status] ?? { label: statusLabel(status), tone: "" as const };
            return <Pill key={status} tone={meta.tone}>{meta.label}: {statusCounts[status]}</Pill>;
          })}
          {orderedStatuses.length === 0 && <span className="muted" style={{ fontSize: 12 }}>Chưa có status snapshot.</span>}
        </div>
      </div>

      <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        <Pill tone={state.flags.computeEnabled ? "green" : "amber"}>{state.flags.computeEnabled ? "Tính V4 đang bật" : "Tính V4 đang tắt"}</Pill>
        <Pill tone={state.flags.shadowEnabled ? "green" : "amber"}>{state.flags.shadowEnabled ? "Shadow đang bật" : "Shadow đang tắt"}</Pill>
        <Pill tone={state.flags.readEnabled ? "green" : "amber"}>{state.flags.readEnabled ? "Đọc V4 toàn hệ thống" : "Đọc V4 đang tắt"}</Pill>
        <Pill>{state.flags.persistLegacyEnabled ? "Giữ baseline để rollback" : "Không lưu legacy"}</Pill>
      </div>
    </Card>
  );
}
