"use client";

import { Fragment, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { Card, KindBadge, Pill } from "@/components/ui";
import { TopBar } from "@/components/TopBar";
import { createReferenceExam } from "./actions";

interface SchoolOption {
  id: string;
  short: string;
  full: string;
  desc: string;
  tone: string;
  color: string;
  minutes: number;
}

interface Props {
  schools: SchoolOption[];
}

export function CreateExamWizard({ schools }: Props) {
  const [step, setStep] = useState(0);
  const [style, setStyle] = useState("cg");
  const [qcount, setQcount] = useState(10);
  const [minutes, setMinutes] = useState(45);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selected = schools.find((s) => s.id === style);

  const generate = () => {
    setError(null);
    startTransition(async () => {
      try {
        await createReferenceExam({ style, qcount, minutes });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Tạo thất bại");
      }
    });
  };

  const steps = [
    { id: 0, label: "Phong cách trường" },
    { id: 1, label: "Cấu trúc đề" },
    { id: 2, label: "Xem trước & tạo" },
  ];

  return (
    <div className="main">
      <TopBar crumbs={[{ label: "Quản trị", href: "/admin?tab=overview" }, "Tạo đề mới"]} />
      <div className="content">
        <div className="page-head">
          <div>
            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
              <Pill tone="amber"><span className="dot" />Chỉ admin</Pill>
              <span className="eyebrow">Công cụ quản trị</span>
            </div>
            <h2>Tạo đề luyện thi tuỳ chỉnh</h2>
            <p>
              Phỏng tạo đề theo phong cách trường mục tiêu. Đề sau khi tạo sẽ xuất hiện trong thư viện
              cho học sinh.
            </p>
          </div>
        </div>

        <div className="wizard">
          <div className="wizard-steps">
            {steps.map((s) => (
              <div
                key={s.id}
                className={"step " + (step === s.id ? "active" : step > s.id ? "done" : "")}
                onClick={() => step >= s.id && setStep(s.id)}
                style={{ cursor: step >= s.id ? "pointer" : "default" }}
              >
                <span className="num">{step > s.id ? "✓" : s.id + 1}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          <div className="wizard-panel">
            {step === 0 && (
              <Card>
                <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Chọn phong cách trường</h3>
                <p className="muted" style={{ margin: "0 0 18px", fontSize: 13 }}>
                  Đề sẽ mô phỏng định dạng, độ khó và phong cách câu hỏi của trường đã chọn.
                </p>
                <div className="grid cols-2" style={{ gap: 10 }}>
                  {schools.map((s) => (
                    <div
                      key={s.id}
                      className={"school-pick-item " + (style === s.id ? "checked" : "")}
                      onClick={() => {
                        setStyle(s.id);
                        if (s.minutes) setMinutes(s.minutes);
                      }}
                    >
                      <div className={"badge " + s.tone} style={{ background: s.color }}>
                        {s.short}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{s.full}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{s.desc}</div>
                      </div>
                      <div className="check">
                        {style === s.id && <Icon name="check" size={13} stroke={2.5} />}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="row" style={{ justifyContent: "flex-end", marginTop: 20 }}>
                  <button className="btn primary" onClick={() => setStep(1)}>
                    Tiếp tục <Icon name="arrow" />
                  </button>
                </div>
              </Card>
            )}

            {step === 1 && (
              <Card>
                <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Cấu trúc đề</h3>
                <p className="muted" style={{ margin: "0 0 18px", fontSize: 13 }}>
                  Số câu và thời lượng làm bài.
                </p>

                <div className="field" style={{ marginBottom: 18 }}>
                  <label>Số câu hỏi</label>
                  <div className="chip-group">
                    {[6, 10, 12, 15, 20, 25].map((n) => (
                      <button
                        key={n}
                        className={"chip " + (qcount === n ? "active" : "")}
                        onClick={() => setQcount(n)}
                      >
                        {n} câu
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label>Thời lượng làm bài</label>
                  <div className="chip-group">
                    {[15, 30, 45, 60, 90].map((n) => (
                      <button
                        key={n}
                        className={"chip " + (minutes === n ? "active" : "")}
                        onClick={() => setMinutes(n)}
                      >
                        {n} phút
                      </button>
                    ))}
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                    Áp lực thời gian:{" "}
                    <b
                      style={{
                        color:
                          minutes / qcount < 4 ? "var(--danger)" :
                          minutes / qcount < 5 ? "var(--warn)" : "var(--success)",
                      }}
                    >
                      {(minutes / qcount).toFixed(1)} phút/câu
                    </b>{" "}
                    — {minutes / qcount < 4 ? "khá căng" : minutes / qcount < 5 ? "vừa phải" : "thoải mái"}
                  </div>
                </div>

                <div className="row between" style={{ marginTop: 22 }}>
                  <button className="btn ghost" onClick={() => setStep(0)}>
                    <Icon name="back" /> Quay lại
                  </button>
                  <button className="btn primary" onClick={() => setStep(2)}>
                    Tiếp tục <Icon name="arrow" />
                  </button>
                </div>
              </Card>
            )}

            {step === 2 && selected && (
              <Card>
                <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Xem trước & tạo đề</h3>
                <p className="muted" style={{ margin: "0 0 18px", fontSize: 13 }}>
                  Kiểm tra lại cấu hình.
                </p>

                <div
                  style={{
                    background: "var(--surface-2)",
                    borderRadius: 12,
                    padding: 20,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 18,
                  }}
                >
                  <div>
                    <div className="eyebrow">Phong cách</div>
                    <b style={{ fontSize: 15 }}>{selected.full}</b>
                  </div>
                  <div>
                    <div className="eyebrow">Số câu · Thời lượng</div>
                    <b style={{ fontSize: 15 }} className="mono">{qcount} câu · {minutes} phút</b>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 18,
                    padding: 14,
                    background: "var(--accent-soft)",
                    borderRadius: 10,
                    fontSize: 13,
                    color: "var(--accent-ink)",
                    border: "1px solid oklch(0.92 0.04 40)",
                  }}
                >
                  <Fragment>
                    <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                      <KindBadge kind="reference" compact />
                      <b style={{ color: "var(--accent-ink)" }}>Đề tạo ra là "Đề tham khảo"</b>
                    </div>
                    <b><Icon name="sparkle" size={13} /> Khỉ con sẽ:</b>
                    <ul style={{ margin: "6px 0 0 22px", padding: 0, lineHeight: 1.6 }}>
                      <li>Lưu đề mới vào thư viện</li>
                      <li>Gắn nhãn "Tham khảo" — kết quả không tính vào % sẵn sàng</li>
                      <li>Đề sẽ xuất hiện trong "Đề thi mẫu" với bộ lọc phù hợp</li>
                    </ul>
                  </Fragment>
                </div>

                {error && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 10,
                      borderRadius: 8,
                      background: "var(--danger-soft)",
                      color: "var(--danger)",
                      fontSize: 12.5,
                    }}
                  >
                    {error}
                  </div>
                )}

                <div className="row between" style={{ marginTop: 22 }}>
                  <button className="btn ghost" onClick={() => setStep(1)} disabled={pending}>
                    <Icon name="back" /> Quay lại
                  </button>
                  <button className="btn primary lg" onClick={generate} disabled={pending}>
                    {pending ? (
                      <Fragment><Icon name="refresh" /> Đang tạo đề…</Fragment>
                    ) : (
                      <Fragment><Icon name="sparkle" /> Tạo đề tham khảo</Fragment>
                    )}
                  </button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
