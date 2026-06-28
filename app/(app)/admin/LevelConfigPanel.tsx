"use client";

import { useState, useTransition } from "react";
import { Card, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { updateLevelConfig } from "./actions";
import { SUBJECT_META } from "@/lib/subjects";
import type { LevelConfigRow } from "./actions";

interface Props {
  levelConfigs: LevelConfigRow[];
  subject: string;
}

export function LevelConfigPanel({ levelConfigs, subject }: Props) {
  const [levelPending, startLevelTransition] = useTransition();

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
        await updateLevelConfig(level, subject, {
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

  const subjectName = SUBJECT_META[subject as keyof typeof SUBJECT_META]?.name ?? subject;

  return (
    <div className="col" style={{ gap: 24 }}>
      {/* Level config table — subject switcher is provided by the admin page head */}
      <Card
        title="Số câu theo mức luyện"
        sub={`Cấu hình số câu và thời gian cho từng mức của ${subjectName}.`}
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
