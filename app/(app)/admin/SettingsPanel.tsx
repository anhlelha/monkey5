"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { updateQuietHours, updateLandingTheme } from "./actions";

interface QuietHours {
  enabled: boolean;
  start: string;
  end: string;
}

type LandingTheme = "clay" | "ocean" | "forest" | "grape" | "coral";

interface Props {
  initialQuietHours: QuietHours;
  initialLandingTheme: LandingTheme;
}

const THEME_OPTIONS: { id: LandingTheme; label: string; swatch: string }[] = [
  { id: "clay",   label: "Clay (đất nung)", swatch: "oklch(0.6 0.14 40)"  },
  { id: "ocean",  label: "Ocean (xanh dương)", swatch: "oklch(0.56 0.13 248)" },
  { id: "forest", label: "Forest (xanh lá)", swatch: "oklch(0.54 0.11 158)" },
  { id: "grape",  label: "Grape (tím)",    swatch: "oklch(0.54 0.15 300)" },
  { id: "coral",  label: "Coral (san hô)", swatch: "oklch(0.62 0.13 28)"  },
];

export function SettingsPanel({ initialQuietHours, initialLandingTheme }: Props) {
  const [quiet, setQuiet] = useState<QuietHours>(initialQuietHours);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  const [theme, setTheme] = useState<LandingTheme>(initialLandingTheme);
  const [themePending, startThemeTransition] = useTransition();
  const [themeStatus, setThemeStatus] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);
  const themeDirty = theme !== initialLandingTheme;

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

  const onSaveTheme = () => {
    setThemeStatus(null);
    startThemeTransition(async () => {
      try {
        await updateLandingTheme({ theme });
        setThemeStatus({ tone: "ok", msg: "Đã lưu theme landing page." });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Không thể lưu theme.";
        setThemeStatus({ tone: "err", msg });
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
        title="Theme landing page"
        sub="Màu chủ đạo của trang giới thiệu (/) — áp dụng cho mọi khách truy cập."
      >
        <div className="col" style={{ gap: 14, maxWidth: 560 }}>
          <div className="field">
            <label>Bảng màu</label>
            <div className="chip-group" style={{ flexWrap: "wrap" }}>
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={"chip" + (theme === opt.id ? " active" : "")}
                  onClick={() => setTheme(opt.id)}
                  disabled={themePending}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: "inline-block",
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      background: opt.swatch,
                      marginRight: 8,
                      verticalAlign: -2,
                      boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.12)",
                    }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            Theme hiện tại: <b>{THEME_OPTIONS.find((t) => t.id === theme)?.label ?? theme}</b>
          </div>

          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <button
              className="btn primary"
              type="button"
              onClick={onSaveTheme}
              disabled={themePending || !themeDirty}
            >
              <Icon name="check" /> {themePending ? "Đang lưu…" : "Lưu theme"}
            </button>
            {themeStatus ? (
              <span style={{ color: themeStatus.tone === "ok" ? "var(--success)" : "var(--danger)", fontSize: 13 }}>
                {themeStatus.msg}
              </span>
            ) : null}
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
