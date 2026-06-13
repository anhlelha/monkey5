"use client";

import { useState, useTransition } from "react";
import { Card, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { updatePlanConfig, updateLevelConfig } from "./actions";

interface PlanConfigRow {
  plan: string;
  label: string;
  topicSetLimit: number;
  referenceExamLimit: number;
  position: number;
}

interface LevelConfigRow {
  level: string;
  label: string;
  sub: string;
  qcount: number;
  minutes: number;
  active: boolean;
  position: number;
}

interface Props {
  planConfigs: PlanConfigRow[];
  levelConfigs: LevelConfigRow[];
}

/** Convert DB value (-1 or positive number) to display string. Empty = unlimited. */
function limitToDisplay(v: number): string {
  return v === -1 ? "" : String(v);
}

/** Parse display string back to DB value. Blank/empty → -1 (unlimited). */
function displayToLimit(s: string): number {
  const trimmed = s.trim();
  if (trimmed === "" || trimmed === "∞") return -1;
  const n = parseInt(trimmed, 10);
  return isNaN(n) || n < 0 ? -1 : n;
}

export function PlansPanel({ planConfigs, levelConfigs }: Props) {
  const [planPending, startPlanTransition] = useTransition();
  const [levelPending, startLevelTransition] = useTransition();

  // Local editable state for plan rows
  const [planRows, setPlanRows] = useState(
    planConfigs.map((p) => ({
      ...p,
      topicInput: limitToDisplay(p.topicSetLimit),
      refInput: limitToDisplay(p.referenceExamLimit),
      saved: false,
      error: null as string | null,
    }))
  );

  // Local editable state for level rows
  const [levelRows, setLevelRows] = useState(
    levelConfigs.map((l) => ({
      ...l,
      qcountInput: String(l.qcount),
      minutesInput: String(l.minutes),
      activeInput: l.active,
      saved: false,
      error: null as string | null,
    }))
  );

  function updatePlanInput(
    plan: string,
    field: "topicInput" | "refInput",
    value: string
  ) {
    setPlanRows((prev) =>
      prev.map((r) =>
        r.plan === plan ? { ...r, [field]: value, saved: false, error: null } : r
      )
    );
  }

  function savePlan(plan: string) {
    const row = planRows.find((r) => r.plan === plan);
    if (!row) return;

    const topicSetLimit = displayToLimit(row.topicInput);
    const referenceExamLimit = displayToLimit(row.refInput);

    startPlanTransition(async () => {
      try {
        await updatePlanConfig(plan, { topicSetLimit, referenceExamLimit });
        setPlanRows((prev) =>
          prev.map((r) => (r.plan === plan ? { ...r, saved: true, error: null } : r))
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Lưu thất bại";
        setPlanRows((prev) =>
          prev.map((r) => (r.plan === plan ? { ...r, saved: false, error: msg } : r))
        );
      }
    });
  }

  function updateLevelInput(
    level: string,
    field: "qcountInput" | "minutesInput" | "activeInput",
    value: string | boolean
  ) {
    setLevelRows((prev) =>
      prev.map((r) =>
        r.level === level ? { ...r, [field]: value, saved: false, error: null } : r
      )
    );
  }

  function saveLevel(level: string) {
    const row = levelRows.find((r) => r.level === level);
    if (!row) return;

    const qcount = parseInt(row.qcountInput, 10);
    const minutes = parseInt(row.minutesInput, 10);

    if (isNaN(qcount) || qcount <= 0) {
      setLevelRows((prev) =>
        prev.map((r) =>
          r.level === level ? { ...r, error: "Số câu không hợp lệ" } : r
        )
      );
      return;
    }
    if (isNaN(minutes) || minutes <= 0) {
      setLevelRows((prev) =>
        prev.map((r) =>
          r.level === level ? { ...r, error: "Thời gian không hợp lệ" } : r
        )
      );
      return;
    }

    startLevelTransition(async () => {
      try {
        await updateLevelConfig(level, {
          qcount,
          minutes,
          active: row.activeInput,
        });
        setLevelRows((prev) =>
          prev.map((r) =>
            r.level === level ? { ...r, saved: true, error: null } : r
          )
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Lưu thất bại";
        setLevelRows((prev) =>
          prev.map((r) => (r.level === level ? { ...r, saved: false, error: msg } : r))
        );
      }
    });
  }

  const planTone = (plan: string) =>
    plan === "vip" ? "solid" : plan === "pro" ? "green" : "";

  return (
    <div className="col" style={{ gap: 24 }}>
      {/* ── Section 1: Plan quotas ── */}
      <Card
        title="Gói & Giới hạn"
        sub="Số lượt luyện chuyên đề và đề tham khảo theo từng gói. -1 hoặc để trống = không giới hạn."
      >
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 100 }}>Gói</th>
              <th>Luyện chuyên đề (tổng đời)</th>
              <th>Đề tham khảo</th>
              <th style={{ width: 90 }}></th>
            </tr>
          </thead>
          <tbody>
            {planRows.map((row) => (
              <tr key={row.plan}>
                <td>
                  <Pill tone={planTone(row.plan)}>{row.label}</Pill>
                </td>
                <td>
                  <div className="field" style={{ margin: 0 }}>
                    <input
                      className="input mono"
                      style={{ width: 120 }}
                      placeholder="∞ (không giới hạn)"
                      value={row.topicInput}
                      onChange={(e) =>
                        updatePlanInput(row.plan, "topicInput", e.target.value)
                      }
                    />
                  </div>
                </td>
                <td>
                  <div className="field" style={{ margin: 0 }}>
                    <input
                      className="input mono"
                      style={{ width: 120 }}
                      placeholder="∞ (không giới hạn)"
                      value={row.refInput}
                      onChange={(e) =>
                        updatePlanInput(row.plan, "refInput", e.target.value)
                      }
                    />
                  </div>
                </td>
                <td>
                  <div className="row" style={{ gap: 6 }}>
                    {row.error && (
                      <span style={{ color: "var(--error, red)", fontSize: 11 }}>
                        ⚠ {row.error}
                      </span>
                    )}
                    {row.saved && (
                      <Pill tone="green">
                        <Icon name="check" size={10} stroke={2.5} /> Đã lưu
                      </Pill>
                    )}
                    <button
                      className="btn sm primary"
                      disabled={planPending}
                      onClick={() => savePlan(row.plan)}
                    >
                      {planPending ? "…" : "Lưu"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: "var(--surface-2)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--ink-soft)",
            border: "1px solid var(--border)",
          }}
        >
          <b>Ghi chú:</b> -1 hoặc để trống = không giới hạn (∞). Thay đổi có hiệu lực ngay với lần truy cập tiếp theo của người dùng.
        </div>
      </Card>

      {/* ── Section 2: Level configs ── */}
      <Card
        title="Số câu theo mức luyện"
        sub="Cấu hình số câu và thời gian cho từng mức L4 / L5 / NC / MIX."
      >
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 60 }}>Mức</th>
              <th>Tên / Mô tả</th>
              <th style={{ width: 120 }}>Số câu</th>
              <th style={{ width: 120 }}>Thời gian (phút)</th>
              <th style={{ width: 80 }}>Bật</th>
              <th style={{ width: 90 }}></th>
            </tr>
          </thead>
          <tbody>
            {levelRows.map((row) => (
              <tr key={row.level}>
                <td>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {row.level}
                  </span>
                </td>
                <td>
                  <b style={{ fontWeight: 500 }}>{row.label}</b>
                  <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>
                    {row.sub}
                  </div>
                </td>
                <td>
                  <input
                    className="input mono"
                    style={{ width: 80 }}
                    type="number"
                    min={1}
                    max={50}
                    value={row.qcountInput}
                    onChange={(e) =>
                      updateLevelInput(row.level, "qcountInput", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    className="input mono"
                    style={{ width: 80 }}
                    type="number"
                    min={1}
                    max={120}
                    value={row.minutesInput}
                    onChange={(e) =>
                      updateLevelInput(row.level, "minutesInput", e.target.value)
                    }
                  />
                </td>
                <td>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={row.activeInput}
                      onChange={(e) =>
                        updateLevelInput(row.level, "activeInput", e.target.checked)
                      }
                    />
                    <span style={{ fontSize: 12 }}>{row.activeInput ? "Bật" : "Tắt"}</span>
                  </label>
                </td>
                <td>
                  <div className="row" style={{ gap: 6 }}>
                    {row.error && (
                      <span style={{ color: "var(--error, red)", fontSize: 11 }}>
                        ⚠ {row.error}
                      </span>
                    )}
                    {row.saved && (
                      <Pill tone="green">
                        <Icon name="check" size={10} stroke={2.5} /> Đã lưu
                      </Pill>
                    )}
                    <button
                      className="btn sm primary"
                      disabled={levelPending}
                      onClick={() => saveLevel(row.level)}
                    >
                      {levelPending ? "…" : "Lưu"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
