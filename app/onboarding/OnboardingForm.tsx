"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { Brand, Pill } from "@/components/ui";
import { completeOnboarding } from "./actions";

interface SchoolOption {
  id: string;
  full: string;
  short: string;
  tone: string;
  desc: string;
}

interface Props {
  firstName: string;
  schools: SchoolOption[];
}

export function OnboardingForm({ firstName, schools }: Props) {
  const [step, setStep] = useState(0);
  const [targets, setTargets] = useState<string[]>([]);
  const [hours, setHours] = useState(5);
  const [pending, startTransition] = useTransition();

  const toggleSchool = (id: string) => {
    setTargets((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  };

  const submit = () => {
    const form = new FormData();
    form.set("targets", targets.join(","));
    form.set("hours", String(hours));
    startTransition(() => completeOnboarding(form));
  };

  return (
    <div className="auth-shell" style={{ alignItems: "flex-start", paddingTop: 60 }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div className="onboard-steps">
          <span className={step >= 0 ? "done" : ""} />
          <span className={step >= 1 ? "done" : ""} />
        </div>

        {step === 0 && (
          <div className="card onboard-card">
            <div className="row" style={{ gap: 12, marginBottom: 14 }}>
              <Brand size={32} />
              <Pill>Bước 1 / 2</Pill>
            </div>
            <h2>Chào {firstName}! Con đang nhắm tới trường nào?</h2>
            <p className="lead">
              Chọn các trường con muốn thi. Khỉ con sẽ ưu tiên đề và bài tập theo phong cách của
              những trường này, và tính % sẵn sàng riêng cho mỗi trường.
            </p>

            <div className="school-pick">
              {schools.map((s) => (
                <div
                  key={s.id}
                  className={"school-pick-item " + (targets.includes(s.id) ? "checked" : "")}
                  onClick={() => toggleSchool(s.id)}
                >
                  <div className={"badge " + s.tone}>{s.short}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.full}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{s.desc}</div>
                  </div>
                  <div className="check">
                    {targets.includes(s.id) && <Icon name="check" size={13} stroke={2.5} />}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 24,
              }}
            >
              <span className="muted" style={{ fontSize: 12.5 }}>
                Đã chọn {targets.length} trường — có thể đổi sau trong cài đặt.
              </span>
              <button
                className="btn primary"
                disabled={targets.length === 0}
                onClick={() => setStep(1)}
              >
                Tiếp tục
                <Icon name="arrow" />
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="card onboard-card">
            <div className="row" style={{ gap: 12, marginBottom: 14 }}>
              <Brand size={32} />
              <Pill>Bước 2 / 2</Pill>
            </div>
            <h2>Mỗi tuần con muốn dành bao nhiêu giờ luyện đề?</h2>
            <p className="lead">Khỉ con sẽ chia nhỏ lộ trình tới ngày thi cho phù hợp.</p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: 10,
                marginTop: 8,
              }}
            >
              {[3, 5, 8, 12].map((h) => (
                <button
                  key={h}
                  className={"chip " + (hours === h ? "active" : "")}
                  style={{
                    justifyContent: "center",
                    padding: "14px 10px",
                    borderRadius: 10,
                    flexDirection: "column",
                    gap: 4,
                  }}
                  onClick={() => setHours(h)}
                >
                  <b style={{ fontSize: 22, fontFamily: "var(--font-mono)" }}>{h}h</b>
                  <span style={{ fontSize: 11, opacity: 0.8 }}>
                    {h <= 3 ? "Nhẹ nhàng" : h <= 5 ? "Đều đặn" : h <= 8 ? "Tăng tốc" : "Cường độ cao"}
                  </span>
                </button>
              ))}
            </div>

            <div
              style={{
                marginTop: 20,
                padding: 14,
                background: "var(--accent-soft)",
                borderRadius: 10,
                fontSize: 13,
                color: "var(--accent-ink)",
                border: "1px solid oklch(0.92 0.04 40)",
              }}
            >
              <Icon name="sparkle" size={14} /> Với {hours} giờ/tuần và mục tiêu hiện tại, Khỉ con
              dự tính lộ trình ~14 tuần để đạt 85% sẵn sàng.
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
              <button className="btn ghost" onClick={() => setStep(0)} disabled={pending}>
                <Icon name="back" /> Quay lại
              </button>
              <button className="btn primary" onClick={submit} disabled={pending}>
                {pending ? "Đang lưu…" : "Vào trang chính"}
                <Icon name="arrow" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
