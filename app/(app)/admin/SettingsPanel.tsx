"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { updateQuietHours } from "./actions";

interface QuietHours {
  enabled: boolean;
  start: string;
  end: string;
}

interface Props {
  initialQuietHours: QuietHours;
}

export function SettingsPanel({ initialQuietHours }: Props) {
  const [quiet, setQuiet] = useState<QuietHours>(initialQuietHours);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  const dirty =
    quiet.enabled !== initialQuietHours.enabled ||
    quiet.start !== initialQuietHours.start ||
    quiet.end !== initialQuietHours.end;

  const onSave = () => {
    setStatus(null);
    if (quiet.start === quiet.end) {
      setStatus({ tone: "err", msg: "Giờ bắt đầu và kết thúc phải khác nhau." });
      return;
    }
    startTransition(async () => {
      try {
        await updateQuietHours(quiet);
        setStatus({ tone: "ok", msg: "Đã lưu giờ ngừng hoạt động." });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Không thể lưu cấu hình.";
        setStatus({ tone: "err", msg });
      }
    });
  };

  return (
    <div className="col" style={{ gap: 16 }}>
      <Card
        title="Cấu hình chung"
        sub="Tham số mặc định áp dụng cho toàn bộ ứng dụng."
      >
        <div className="col" style={{ gap: 14, maxWidth: 480 }}>
          <div className="field">
            <label>Ngày thi mục tiêu mặc định</label>
            <input className="input mono" defaultValue="01/06/2026" readOnly />
          </div>
          <div className="field">
            <label>Mục tiêu giờ học/tuần mặc định</label>
            <input className="input mono" defaultValue="5" readOnly />
          </div>
          <div className="field">
            <label>Mức yêu cầu sẵn sàng để báo &quot;Đủ điều kiện&quot;</label>
            <input className="input mono" defaultValue="75%" readOnly />
          </div>
        </div>
      </Card>

      <Card
        title="Giờ ngừng hoạt động"
        sub="Bảo vệ sức khoẻ học sinh: tự động khoá truy cập trang luyện tập trong khung giờ này (Asia/Ho_Chi_Minh)."
      >
        <div className="col" style={{ gap: 14, maxWidth: 520 }}>
          <label className="row" style={{ gap: 8, alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={quiet.enabled}
              onChange={(e) => setQuiet({ ...quiet, enabled: e.target.checked })}
            />
            <span>
              <b>Bật giờ ngừng hoạt động</b>
              <span style={{ display: "block", color: "var(--muted)", fontSize: 12 }}>
                Khi tắt, học sinh có thể truy cập bất cứ lúc nào.
              </span>
            </span>
          </label>

          <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
            <div className="field" style={{ minWidth: 180 }}>
              <label>Giờ bắt đầu khoá</label>
              <input
                type="time"
                className="input mono"
                value={quiet.start}
                onChange={(e) => setQuiet({ ...quiet, start: e.target.value })}
                disabled={!quiet.enabled || pending}
              />
            </div>
            <div className="field" style={{ minWidth: 180 }}>
              <label>Giờ mở lại</label>
              <input
                type="time"
                className="input mono"
                value={quiet.end}
                onChange={(e) => setQuiet({ ...quiet, end: e.target.value })}
                disabled={!quiet.enabled || pending}
              />
            </div>
          </div>

          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            Khung giờ hiện tại:{" "}
            <b>
              {quiet.enabled ? `${quiet.start} – ${quiet.end}` : "Đã tắt"}
            </b>{" "}
            {quiet.enabled && quiet.start > quiet.end
              ? "(qua đêm)"
              : null}
          </div>

          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <button
              className="btn primary"
              type="button"
              onClick={onSave}
              disabled={pending || !dirty}
            >
              <Icon name="check" /> {pending ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
            {status ? (
              <span style={{ color: status.tone === "ok" ? "var(--success)" : "var(--danger)", fontSize: 13 }}>
                {status.msg}
              </span>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}
