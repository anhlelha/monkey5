"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Card, Pill } from "@/components/ui";
import type { ReadinessV4AdminState } from "./readiness-v4-actions";


import {
  activateReadinessV4GlobalAction,
  cancelReadinessV4JobAction,
  createReadinessV4ShadowJobAction,
  disableReadinessV4ReadAction,
  enableReadinessV4ReadAction,
  enableReadinessV4ShadowAction,
  pauseReadinessV4JobAction,
  resumeReadinessV4JobAction,
  retryReadinessV4JobAction,
  rollbackReadinessV4GlobalAction,
} from "./readiness-v4-actions";

const BLUEPRINT_TOPIC_LABELS: Record<string, string> = {
  ratio_percent: "Tỉ lệ phần trăm",
  num_div: "Phép chia",
  plane_geometry: "Hình học phẳng",
  motion: "Chuyển động",
  frac_decimal: "Phân số thập phân",
  sequence_pattern: "Dãy số và quy luật",
  logic_strategy: "Logic và chiến lược",
  solid_geometry: "Hình học không gian",
  measurement: "Đo lường và đổi đơn vị",
  time_calendar: "Thời gian và lịch",
  work_rate: "Năng suất và công việc",
  data_probability: "Dữ liệu và xác suất",
  counting_combinatorics: "Đếm và tổ hợp",
  number_sense: "Cảm nhận số",
};
const RELIABILITY_FLAG_LABELS: Record<string, string> = {
  LOW_EXAM_COUNT: "Ít đề tham chiếu",
  LOW_QUESTION_COUNT: "Ít câu tham chiếu",
  LOW_YEAR_COVERAGE: "Phủ ít năm",
  HIGH_DIFFICULTY_SPREAD: "Độ khó phân tán cao",
  STALE_SOURCE: "Nguồn dữ liệu cũ",
};
const labelBlueprintTopic = (topic: string) => BLUEPRINT_TOPIC_LABELS[topic] ?? topic.replaceAll("_", " ");
const labelReliabilityFlag = (flag: string) => RELIABILITY_FLAG_LABELS[flag] ?? flag.replaceAll("_", " ");
const labelTaxonomyVersion = (version: string) => version === "math-topic-taxonomy-v1" ? "Taxonomy chuyên đề Toán V4" : version;
const labelMethodologyVersion = (version: string) => version === "school-profile-v2" ? "Phương pháp hồ sơ trường V2" : version;
const STATUS_LABELS: Record<string, string> = { draft: "Bản nháp", shadow: "Bản thử nghiệm", active: "Đang dùng", retired: "Đã ngừng dùng", queued: "Đang chờ", running: "Đang chạy", paused: "Đã tạm dừng", completed: "Hoàn tất", cancelled: "Đã hủy", failed: "Thất bại" };
const labelStatus = (status: string) => STATUS_LABELS[status] ?? status.replaceAll("_", " ");

export function ReadinessV4Admin({ state }: { state: ReadinessV4AdminState }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const latestPolicy = state.policies[0];

  const run = (action: () => Promise<unknown>, success: string) => {
    setMessage(null);
    startTransition(async () => {
      try {
        await action();
        setMessage(success);
      } catch (error) {
        setMessage(`Lỗi: ${String(error)}`);
      }
    });
  };

  const reasoned = (label: string, action: (reason: string) => Promise<unknown>, success: string) => {
    const reason = window.prompt(`${label}\nNhập lý do (ít nhất 10 ký tự):`);
    if (!reason) return;
    if (!window.confirm(`${label}? Thao tác sẽ được audit.`)) return;
    run(() => action(reason), success);
  };

  return (
    <div className="col" style={{ gap: 16 }}>
      <Card
        title="Readiness V4 · điều hành bản thử nghiệm"
        sub="V4 đang ghi snapshot riêng; dữ liệu baseline cũ không bị thay đổi bởi tác vụ nền."
      >
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <Pill tone={state.flags.computeEnabled ? "green" : "red"}>Tính V4 {state.flags.computeEnabled ? "đang bật" : "đang tắt"}</Pill>
          <Pill tone={state.flags.shadowEnabled ? "green" : "red"}>Bản thử nghiệm {state.flags.shadowEnabled ? "đang bật" : "đang tắt"}</Pill>
          <Pill tone={state.flags.readEnabled ? "amber" : ""}>Đọc V4 {state.flags.readEnabled ? "đang bật" : "đang tắt"}</Pill>
          <Pill tone={state.flags.persistLegacyEnabled ? "green" : "red"}>Lưu baseline {state.flags.persistLegacyEnabled ? "đang bật" : "đang tắt"}</Pill>
        </div>
        <div className="row" style={{ gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <button className="btn" disabled={pending} onClick={() => run(enableReadinessV4ShadowAction, "Đã bật tính và ghi thử nghiệm; đọc V4 vẫn tắt.")}>Bật ghi thử nghiệm an toàn</button>
          <button className="btn" disabled={pending} onClick={() => run(createReadinessV4ShadowJobAction, "Đã tạo hoặc tìm thấy job nạp lại bản thử nghiệm.")}>Tạo job nạp bản thử nghiệm</button>
          <button className="btn" disabled={pending || latestPolicy?.status !== "shadow"} onClick={() => reasoned("Kích hoạt policy/profile V4 toàn hệ thống", activateReadinessV4GlobalAction, "Đã kích hoạt policy/profile toàn hệ thống; cờ đọc vẫn chưa bật.")}>Kích hoạt toàn hệ thống</button>
          <button className="btn primary" disabled={pending || state.flags.readEnabled || state.profiles.active === 0} onClick={() => {
            if (window.confirm("Bật giao diện Readiness V4 cho toàn bộ người dùng?")) run(enableReadinessV4ReadAction, "Đã bật đọc Readiness V4 toàn hệ thống.");
          }}>Bật đọc V4</button>
          <button className="btn" disabled={pending || !state.flags.readEnabled} onClick={() => run(disableReadinessV4ReadAction, "Đã chuyển giao diện về baseline.")}>Tắt đọc V4</button>
          <button className="btn" disabled={pending || (state.profiles.active === 0 && !state.flags.readEnabled)} onClick={() => reasoned("Hoàn tác Readiness V4 toàn hệ thống", rollbackReadinessV4GlobalAction, "Đã hoàn tác pointer và tắt đọc V4.")}>Hoàn tác toàn hệ thống</button>
          <Link className="btn" href="/admin/readiness/simulator">Mô phỏng tác động</Link>
          <Link className="btn" href="/admin/readiness/profiles">Vòng đời hồ sơ</Link>
        </div>
        {message && <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>{message}</div>}
      </Card>

      <div className="grid cols-4" style={{ gap: 12 }}>
        <Card title="Policy" action={<Link className="btn sm" href="/admin/readiness/policies">Quản lý policy</Link>}>
          <b>{latestPolicy?.version ?? "—"}</b>
          <div className="muted" style={{ marginTop: 6 }}>{latestPolicy?.status ? labelStatus(latestPolicy.status) : "Chưa có"} · {latestPolicy?.reviewed ? "đã duyệt bước xem xét" : "chưa xem xét"}</div>
        </Card>
        <Card title="Hồ sơ trường V2" action={<Link className="btn sm" href="/admin/readiness/profiles">Vòng đời</Link>}>
          <b>{state.profiles.shadow} bản thử nghiệm</b>
          <div className="muted" style={{ marginTop: 6 }}>{state.profiles.active} đang dùng · {state.profiles.retired} đã ngừng dùng</div>
        </Card>
        <Card title="Bản ghi thành thạo"><b>{state.snapshots.mastery}</b></Card>
        <Card title="Bản ghi sẵn sàng"><b>{state.snapshots.readiness}</b></Card>
      </div>

      <Card
        title="School Profile V2"
        sub="Profile immutable đang dùng để mô tả blueprint, độ khó và độ tin cậy của từng trường."
        action={<Link className="btn" href="/admin/readiness/compare">So sánh các trường</Link>}
      >
        {state.schoolProfiles.length === 0 ? (
          <div className="empty">Chưa có School Profile V2.</div>
        ) : (
          <div className="grid cols-2" style={{ gap: 14 }}>
            {state.schoolProfiles.map((profile) => {
              const statusLabel = profile.status === "active" ? "Đang dùng" : profile.status === "shadow" ? "Bản thử nghiệm / chờ duyệt" : "Đã nghỉ";
              const statusTone = profile.status === "active" ? "green" : profile.status === "shadow" ? "amber" : "";
              return (
                <div key={profile.id} className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16, minWidth: 0, borderColor: profile.status === "active" ? "color-mix(in oklch, var(--success), var(--border) 70%)" : "var(--border)" }}>
                  <div className="row between" style={{ gap: 12, alignItems: "flex-start" }}>
                    <div className="row" style={{ gap: 11, minWidth: 0 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, display: "grid", placeItems: "center", flex: "0 0 auto", background: "var(--surface-2)", color: "var(--accent-ink)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        {profile.school.toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>{profile.school.toUpperCase()}</div>
                        <div className="muted" style={{ fontSize: 11.5, marginTop: 3, overflowWrap: "anywhere" }}>
                          {labelTaxonomyVersion(profile.taxonomyVersion)} · {labelMethodologyVersion(profile.methodologyVersion)}
                        </div>
                      </div>
                    </div>
                    <Pill tone={statusTone}>{statusLabel}</Pill>
                  </div>

                  <div className="grid cols-3" style={{ gap: 8 }}>
                    <div style={{ padding: 10, borderRadius: 10, background: "var(--surface-2)" }}>
                      <div className="eyebrow" style={{ fontSize: 9 }}>Nguồn</div>
                      <b style={{ display: "block", marginTop: 4, fontSize: 14 }}>{profile.examCount} đề</b>
                      <span className="muted" style={{ fontSize: 10.5 }}>{profile.questionCount} câu · {profile.yearCount} năm</span>
                    </div>
                    <div style={{ padding: 10, borderRadius: 10, background: "var(--surface-2)" }}>
                      <div className="eyebrow" style={{ fontSize: 9 }}>ĐỘ KHÓ</div>
                      <b className="mono" style={{ display: "block", marginTop: 4, fontSize: 18 }}>{profile.difficultyIndex.toFixed(1)}</b>
                      <span className="muted" style={{ fontSize: 10.5 }}>chỉ số hồ sơ</span>
                    </div>
                    <div style={{ padding: 10, borderRadius: 10, background: "var(--surface-2)" }}>
                      <div className="eyebrow" style={{ fontSize: 9 }}>ĐỘ TIN CẬY</div>
                      <b style={{ display: "block", marginTop: 4, fontSize: 14 }}>{profile.reliabilityFlags.length === 0 ? "Ổn định" : `${profile.reliabilityFlags.length} cảnh báo`}</b>
                      <span className="muted" style={{ fontSize: 10.5 }}>{profile.yearRange.length} mốc năm</span>
                    </div>
                  </div>

                  <div>
                    <div className="row between" style={{ marginBottom: 9, gap: 10 }}>
                      <div>
                        <div className="eyebrow" style={{ fontSize: 9 }}>PHÂN BỔ NỘI DUNG CHÍNH</div>
                        <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>Tỉ trọng nhóm kiến thức nổi bật trong hồ sơ</div>
                      </div>
                      <span className="mono muted" style={{ fontSize: 11 }}>{profile.questionCount} câu</span>
                    </div>
                    <div className="col" style={{ gap: 8 }}>
                      {profile.topBlueprintTopics.slice(0, 5).map((topic) => (
                        <div key={topic.topic}>
                          <div className="row between" style={{ gap: 10, fontSize: 11.5, marginBottom: 4 }}>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{labelBlueprintTopic(topic.topic)}</span>
                            <b className="mono" style={{ fontSize: 11.5 }}>{Math.round(topic.weight * 100)}%</b>
                          </div>
                          <div style={{ height: 6, borderRadius: 999, overflow: "hidden", background: "var(--border-soft)" }}>
                            <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, topic.weight * 100))}%`, borderRadius: 999, background: profile.status === "active" ? "var(--success)" : "var(--accent)" }} />
                          </div>
                        </div>
                      ))}
                      {profile.topBlueprintTopics.length === 0 && <span className="muted" style={{ fontSize: 12 }}>Chưa có nhóm kiến thức.</span>}
                    </div>
                  </div>

                  {profile.reliabilityFlags.length > 0 && (
                    <div style={{ padding: 10, borderRadius: 10, background: "color-mix(in oklch, var(--warn), white 90%)", color: "var(--ink)", fontSize: 11.5 }}>
                      <b>Cảnh báo độ tin cậy:</b> {profile.reliabilityFlags.map(labelReliabilityFlag).join(" · ")}
                    </div>
                  )}

                  <div className="row between" style={{ gap: 10, paddingTop: 2, borderTop: "1px solid var(--border-soft)" }}>
                    {profile.status === "active" ? (
                      <Link className="btn sm" href={`/admin/readiness/${profile.school}`}>Xem dashboard</Link>
                    ) : <span className="muted" style={{ fontSize: 11.5 }}>Hồ sơ chưa được kích hoạt</span>}
                    <details>
                      <summary style={{ cursor: "pointer", fontSize: 12, color: "var(--accent-ink)" }}>Xem nguồn & phiên bản</summary>
                      <div className="muted" style={{ fontSize: 10.5, marginTop: 8, maxWidth: 360, overflowWrap: "anywhere" }}>
                        Bộ phân loại: {profile.taxonomyVersion}<br />
                        Phương pháp: {profile.methodologyVersion}<br />
                        Đợt đánh giá: {profile.assessmentRunId}<br />
                        Mã kiểm tra nguồn: {profile.sourceHash}<br />
                        Mã hồ sơ: {profile.id}
                      </div>
                    </details>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="Tác vụ tính toán lại" sub="Tác vụ chạy nền; tiến độ phản ánh số mục đã xử lý, đạt và lỗi thực tế.">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Mã tác vụ</th><th>Chế độ / lý do</th><th>Trạng thái</th><th>Tiến độ</th><th>Kết quả</th><th>Điều khiển</th></tr></thead>
            <tbody>
              {state.jobs.map((job) => (
                <tr key={job.id}>
                  <td><Link className="mono" style={{ fontSize: 11 }} href={`/admin/readiness/jobs/${job.id}`}>{job.id.slice(0, 12)}…</Link></td>
                  <td>{labelStatus(job.mode)}<div className="muted">{job.reason}</div></td>
                  <td><Pill tone={job.status === "completed" ? "green" : job.status === "failed" ? "red" : "amber"}>{labelStatus(job.status)}</Pill></td>
                  <td>{job.processedItems}/{job.totalItems} mục</td>
                  <td>{job.successItems} đạt · {job.failedItems} lỗi</td>
                  <td>
                    <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                      {(job.status === "queued" || job.status === "running") && (
                        <button className="btn sm" disabled={pending} onClick={() => run(() => pauseReadinessV4JobAction(job.id), "Đã tạm dừng tác vụ.")}>Tạm dừng</button>
                      )}
                      {job.status === "paused" && (
                        <button className="btn sm" disabled={pending} onClick={() => run(() => resumeReadinessV4JobAction(job.id), "Đã tiếp tục tác vụ.")}>Tiếp tục</button>
                      )}
                      {job.failedItems > 0 && ["paused", "failed", "completed"].includes(job.status) && (
                        <button className="btn sm" disabled={pending} onClick={() => run(() => retryReadinessV4JobAction(job.id), "Đã đưa mục lỗi về hàng đợi.")}>Thử lại mục lỗi</button>
                      )}
                      {!["completed", "cancelled", "failed"].includes(job.status) && (
                        <button className="btn sm" disabled={pending} onClick={() => {
                          if (window.confirm("Hủy các mục chưa chạy của tác vụ này?")) run(() => cancelReadinessV4JobAction(job.id), "Đã hủy tác vụ.");
                        }}>Hủy mục chưa chạy</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!state.jobs.length && <tr><td colSpan={6} className="empty">Chưa có job v4.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid cols-2" style={{ gap: 16 }}>
        <Card title="Theo dõi vận hành" sub="Phân bố trạng thái từ snapshot mới nhất; không cộng dồn lịch sử.">
          <div className="muted" style={{ marginBottom: 10 }}>
            Hàng đợi: {state.monitoring.queuedItems} chờ · {state.monitoring.runningItems} đang chạy
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {Object.entries(state.monitoring.latestStatusCounts).map(([status, count]) => (
              <Pill key={status} tone={status === "ready" || status === "strong_ready" ? "green" : status === "unverified" ? "red" : "amber"}>
                {labelStatus(status)}: {count}
              </Pill>
            ))}
            {!Object.keys(state.monitoring.latestStatusCounts).length && <span className="muted">Chưa có snapshot bản thử nghiệm để theo dõi.</span>}
          </div>
        </Card>
        <Card title="Lịch sử thao tác gần nhất" sub="Nhật ký chỉ ghi thêm cho policy, hồ sơ và pointer kích hoạt.">
          <div className="col" style={{ gap: 9 }}>
            {state.audits.map((audit) => (
              <div key={audit.id} style={{ fontSize: 12.5 }}>
                <b>{audit.action.replaceAll("_", " ")}</b> · {audit.fromState ? labelStatus(audit.fromState) : "—"} → {audit.toState ? labelStatus(audit.toState) : "—"}
                <div className="muted">{audit.reason} · {new Date(audit.createdAt).toLocaleString("vi-VN")}</div>
              </div>
            ))}
            {!state.audits.length && <span className="muted">Chưa có audit event.</span>}
          </div>
        </Card>
      </div>
    </div>
  );
}
