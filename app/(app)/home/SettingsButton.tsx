"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/Icon";
import { SCHOOLS } from "@/lib/static";
import { updateProfile } from "./actions";
import { daysBetween } from "@/lib/fmt";

interface UserDraft {
  name: string;
  email: string;
  grade: string;
  targets: string[];
  hours: number;
  examDate: string;
  readyTarget: number;
}

export function SettingsButton({
  initialUser,
  trigger,
}: {
  initialUser: UserDraft;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} style={{ display: "contents", cursor: "pointer" }}>
          {trigger}
        </div>
      ) : (
        <button className="icon-btn" onClick={() => setOpen(true)} title="Cài đặt">
          <Icon name="settings" />
        </button>
      )}
      {open && mounted && createPortal(
        <SettingsPanel initialUser={initialUser} onClose={() => setOpen(false)} />,
        document.body
      )}
    </>
  );
}

function SettingsPanel({
  initialUser,
  onClose,
}: {
  initialUser: UserDraft;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialUser.name);
  const [targets, setTargets] = useState<string[]>(initialUser.targets);
  const [hours, setHours] = useState(initialUser.hours);
  const [examDate, setExamDate] = useState(initialUser.examDate);
  const [readyTarget, setReadyTarget] = useState(initialUser.readyTarget);
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) =>
    setTargets((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  const dirty =
    name !== initialUser.name ||
    hours !== initialUser.hours ||
    examDate !== initialUser.examDate ||
    targets.join() !== initialUser.targets.join() ||
    readyTarget !== initialUser.readyTarget;

  const days = daysBetween(examDate);

  const save = () => {
    const form = new FormData();
    form.set("name", name);
    form.set("targets", targets.join(","));
    form.set("hours", String(hours));
    form.set("examDate", examDate);
    form.set("readyTarget", String(readyTarget));
    startTransition(async () => {
      await updateProfile(form);
      onClose();
    });
  };

  return (
    <div
      className="tutor-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="tutor-panel" style={{ width: 520 }}>
        <div className="tutor-head">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--surface-sunk)",
              display: "grid",
              placeItems: "center",
              color: "var(--ink-soft)",
            }}
          >
            <Icon name="settings" />
          </div>
          <div style={{ flex: 1 }}>
            <h4>Cài đặt</h4>
            <div className="sub">Hồ sơ · mục tiêu thi · lộ trình học</div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        <div className="tutor-body" style={{ gap: 24 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Hồ sơ</div>
            <div className="col" style={{ gap: 12 }}>
              <div className="field">
                <label>Tên hiển thị</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid cols-2" style={{ gap: 10 }}>
                <div className="field">
                  <label>Email (Google)</label>
                  <input
                    className="input"
                    value={initialUser.email}
                    readOnly
                    style={{ background: "var(--surface-2)", color: "var(--ink-muted)" }}
                  />
                </div>
                <div className="field">
                  <label>Lớp</label>
                  <input
                    className="input"
                    value={initialUser.grade}
                    readOnly
                    style={{ background: "var(--surface-2)", color: "var(--ink-muted)" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="row between" style={{ marginBottom: 10 }}>
              <div className="eyebrow">Trường mục tiêu</div>
              <span className="muted" style={{ fontSize: 11.5 }}>
                Đã chọn {targets.length}/{SCHOOLS.length}
              </span>
            </div>
            <div className="school-pick">
              {SCHOOLS.map((s) => (
                <div
                  key={s.id}
                  className={"school-pick-item " + (targets.includes(s.id) ? "checked" : "")}
                  onClick={() => toggle(s.id)}
                >
                  <div className={"badge " + s.tone}>{s.short}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.full}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>{s.desc}</div>
                  </div>
                  <div className="check">
                    {targets.includes(s.id) && <Icon name="check" size={12} stroke={2.5} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Ngày thi mục tiêu</div>
            <div className="col" style={{ gap: 10 }}>
              <input
                className="input mono"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                min="2026-01-01"
                max="2027-12-31"
                style={{ maxWidth: 200 }}
              />
              <div
                style={{
                  padding: 10,
                  background: "var(--accent-soft)",
                  borderRadius: 8,
                  fontSize: 12.5,
                  color: "var(--accent-ink)",
                }}
              >
                <Icon name="clock" size={12} /> Còn <b className="mono">{days}</b> ngày từ hôm nay. Khỉ con sẽ chia lộ trình phù hợp.
              </div>
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Số giờ học mỗi tuần</div>
            <div className="grid cols-4" style={{ gap: 8 }}>
              {[3, 5, 8, 12].map((h) => (
                <button
                  key={h}
                  className={"chip " + (hours === h ? "active" : "")}
                  style={{
                    justifyContent: "center",
                    padding: "10px 8px",
                    flexDirection: "column",
                    gap: 2,
                    borderRadius: 8,
                  }}
                  onClick={() => setHours(h)}
                >
                  <b style={{ fontSize: 16, fontFamily: "var(--font-mono)" }}>{h}h</b>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>
                    {h <= 3 ? "Nhẹ" : h <= 5 ? "Đều" : h <= 8 ? "Tăng tốc" : "Cao"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Mức sẵn sàng mong muốn</div>
            <div className="row" style={{ gap: 14 }}>
              <input
                type="range"
                min={60}
                max={95}
                step={5}
                value={readyTarget}
                onChange={(e) => setReadyTarget(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: "var(--accent)" }}
              />
              <b className="mono" style={{ fontSize: 18, width: 50, textAlign: "right", color: "var(--accent-ink)" }}>
                {readyTarget}%
              </b>
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>
              Khi đạt mức này cho trường mục tiêu, hệ thống sẽ báo "Đã sẵn sàng".
            </div>
          </div>

          <div>
            <button
              className="btn danger"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => signOut({ callbackUrl: "/signin" })}
            >
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="tutor-input" style={{ padding: 16, gap: 10 }}>
          <button className="btn ghost" onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>
            Huỷ
          </button>
          <button
            className="btn primary"
            disabled={!dirty || targets.length === 0 || pending}
            style={{ flex: 1, justifyContent: "center" }}
            onClick={save}
          >
            <Icon name="check" stroke={2.5} /> {pending ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
