"use client";

import { Fragment, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { Card, KindBadge, Pill } from "@/components/ui";
import { TopBar } from "@/components/TopBar";
import { createTopicSet } from "./actions";

interface TopicOption {
  id: string;
  name: string;
  short: string;
  ico: string;
  color: string;
  setCount: number;
}

interface SchoolOption {
  id: string;
  short: string;
  tone: string;
}

interface Props {
  initialTopic: string | null;
  topics: TopicOption[];
  schools: SchoolOption[];
}

const tagOptions: Record<string, string[]> = {
  cd: ["1 vật", "2 vật cùng chiều", "2 vật ngược chiều", "Có thời gian nghỉ", "Dòng nước", "Tàu qua cầu/hầm"],
  hinh: ["Chu vi", "Diện tích", "Hình tròn", "Hình hộp", "Lập phương", "Tỉ số diện tích", "Cắt ghép"],
  phan: ["Tìm phân số", "Cộng/trừ", "Nhân/chia", "Bài toán phần trăm", "Lãi/giảm giá"],
  soh: ["Tính nhanh", "Tìm x", "Chia hết", "Tận cùng", "Dãy số"],
  tuoi: ["1 cặp tuổi", "2 thời điểm", "Tổng-tỉ", "Hiệu-tỉ"],
  log: ["Suy luận", "Dirichlet", "Bảng logic", "Tìm quy luật"],
  do: ["Độ dài", "Diện tích", "Thể tích", "Khối lượng", "Thời gian"],
  xs: ["Đọc biểu đồ", "Tính xác suất", "Tung xúc xắc/đồng xu"],
  ti: ["Tỉ lệ thuận", "Tỉ lệ nghịch", "Bản đồ"],
  tg: ["Giờ - phút", "Múi giờ", "Cộng/trừ thời gian"],
};

export function CreateExerciseWizard({ initialTopic, topics, schools }: Props) {
  const [step, setStep] = useState(0);
  const [topicId, setTopicId] = useState<string | null>(initialTopic);
  const [setName, setSetName] = useState("");
  const [difficulty, setDifficulty] = useState("L5");
  const [qcount, setQcount] = useState(10);
  const [minutes, setMinutes] = useState(30);
  const [types, setTypes] = useState({ fill: true, mcq: true, essay: false });
  const [style, setStyleSel] = useState<string>("mix");
  const [tags, setTags] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const topic = topics.find((t) => t.id === topicId);
  const suggestedName = topic
    ? `${topic.name} — ${
        difficulty === "L4" ? "Lớp 4 cơ bản" :
        difficulty === "L5" ? "Lớp 5 nâng dần" :
        difficulty === "NC" ? "Nâng cao Olympic" : "Tổng hợp"
      }`
    : "";
  const finalName = setName || suggestedName;

  const toggleType = (k: keyof typeof types) =>
    setTypes((t) => ({ ...t, [k]: !t[k] }));
  const toggleTag = (t: string) =>
    setTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  const steps = [
    { id: 0, label: "Chọn chuyên đề" },
    { id: 1, label: "Mức độ & số câu" },
    { id: 2, label: "Dạng câu & tag" },
    { id: 3, label: "Xem trước & tạo" },
  ];

  const generate = () => {
    if (!topicId) return;
    setError(null);
    startTransition(async () => {
      try {
        await createTopicSet({
          topicId,
          name: finalName,
          difficulty,
          qcount,
          minutes,
          tags,
        });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Tạo thất bại");
      }
    });
  };

  return (
    <div className="main">
      <TopBar crumbs={[{ label: "Quản trị", href: "/admin?tab=overview" }, "Tạo bài tập"]} />
      <div className="content">
        <div className="page-head">
          <div>
            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
              <Pill tone="amber"><span className="dot" />Chỉ admin</Pill>
              <span className="eyebrow">Công cụ quản trị</span>
            </div>
            <h2>Tạo bộ bài tập theo chuyên đề</h2>
            <p>
              Bộ bài tập sẽ xuất hiện trong "Luyện chuyên đề" tương ứng. Dùng để cho học sinh luyện chuyên
              sâu 1 dạng cụ thể.
            </p>
          </div>
        </div>

        <div className="wizard">
          <div className="wizard-steps">
            {steps.map((s) => {
              const can = step >= s.id || (s.id === 1 && !!topicId);
              return (
                <div
                  key={s.id}
                  className={"step " + (step === s.id ? "active" : step > s.id ? "done" : "")}
                  onClick={() => can && setStep(s.id)}
                  style={{ cursor: can ? "pointer" : "default" }}
                >
                  <span className="num">{step > s.id ? "✓" : s.id + 1}</span>
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>

          <div className="wizard-panel">
            {step === 0 && (
              <Card>
                <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Chọn chuyên đề</h3>
                <p className="muted" style={{ margin: "0 0 18px", fontSize: 13 }}>
                  Bộ bài tập sẽ thuộc về chuyên đề con chọn.
                </p>
                <div className="grid cols-2" style={{ gap: 8 }}>
                  {topics.map((t) => (
                    <div
                      key={t.id}
                      className={"school-pick-item " + (topicId === t.id ? "checked" : "")}
                      onClick={() => setTopicId(t.id)}
                    >
                      <div
                        className="badge"
                        style={{
                          background: `color-mix(in oklch, ${t.color}, white 80%)`,
                          color: t.color,
                          fontSize: 16,
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        {t.ico}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>
                          {t.setCount} bộ bài đã có
                        </div>
                      </div>
                      <div className="check">
                        {topicId === t.id && <Icon name="check" size={12} stroke={2.5} />}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="row" style={{ justifyContent: "flex-end", marginTop: 20 }}>
                  <button className="btn primary" disabled={!topicId} onClick={() => setStep(1)}>
                    Tiếp tục <Icon name="arrow" />
                  </button>
                </div>
              </Card>
            )}

            {step === 1 && topic && (
              <Card>
                <div className="row" style={{ gap: 10, marginBottom: 18 }}>
                  <div
                    className="badge"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 700,
                      background: `color-mix(in oklch, ${topic.color}, white 86%)`,
                      color: topic.color,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {topic.ico}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{topic.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>Mức độ và số câu</div>
                  </div>
                </div>

                <div className="field" style={{ marginBottom: 18 }}>
                  <label>Mức độ</label>
                  <div className="chip-group">
                    {[
                      { id: "L4", l: "Lớp 4 cơ bản" },
                      { id: "L5", l: "Lớp 5 nâng dần" },
                      { id: "NC", l: "Nâng cao" },
                      { id: "Mix", l: "Trộn (giống đề thật)" },
                    ].map((d) => (
                      <button
                        key={d.id}
                        className={"chip " + (difficulty === d.id ? "active" : "")}
                        onClick={() => setDifficulty(d.id)}
                      >
                        {d.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field" style={{ marginBottom: 18 }}>
                  <label>Số câu hỏi</label>
                  <div className="chip-group">
                    {[5, 8, 10, 12, 15, 20].map((n) => (
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
                  <label>Thời lượng đề xuất (phút)</label>
                  <div className="chip-group">
                    {[15, 20, 30, 45, 60].map((n) => (
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
                    Trung bình <b className="mono">{(minutes / qcount).toFixed(1)} phút/câu</b>
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

            {step === 2 && topic && (
              <Card>
                <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Dạng câu & chủ đề con</h3>
                <p className="muted" style={{ margin: "0 0 18px", fontSize: 13 }}>
                  Chọn các dạng câu sẽ xuất hiện và lọc theo chủ đề con.
                </p>

                <div className="field" style={{ marginBottom: 18 }}>
                  <label>Dạng câu hỏi (chọn ít nhất 1)</label>
                  <div className="chip-group">
                    <button
                      className={"chip " + (types.fill ? "active" : "")}
                      onClick={() => toggleType("fill")}
                    >
                      Điền đáp số
                    </button>
                    <button
                      className={"chip " + (types.mcq ? "active" : "")}
                      onClick={() => toggleType("mcq")}
                    >
                      Trắc nghiệm A/B/C/D
                    </button>
                    <button
                      className={"chip " + (types.essay ? "active" : "")}
                      onClick={() => toggleType("essay")}
                    >
                      Tự luận trình bày
                    </button>
                  </div>
                </div>

                <div className="field" style={{ marginBottom: 18 }}>
                  <label>Phong cách trường (tuỳ chọn)</label>
                  <div className="chip-group">
                    <button
                      className={"chip " + (style === "mix" ? "active" : "")}
                      onClick={() => setStyleSel("mix")}
                    >
                      Chung
                    </button>
                    {schools.map((s) => (
                      <button
                        key={s.id}
                        className={"chip " + (style === s.id ? "active " + s.tone : "")}
                        onClick={() => setStyleSel(s.id)}
                      >
                        {s.short}
                      </button>
                    ))}
                  </div>
                </div>

                {(tagOptions[topic.id] ?? []).length > 0 && (
                  <div className="field">
                    <label>Chủ đề con (chọn nhiều — để trống nếu muốn trộn tất cả)</label>
                    <div className="chip-group">
                      {tagOptions[topic.id].map((tag) => (
                        <button
                          key={tag}
                          className={"chip " + (tags.includes(tag) ? "active" : "")}
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="row between" style={{ marginTop: 22 }}>
                  <button className="btn ghost" onClick={() => setStep(1)}>
                    <Icon name="back" /> Quay lại
                  </button>
                  <button
                    className="btn primary"
                    disabled={!Object.values(types).some(Boolean)}
                    onClick={() => setStep(3)}
                  >
                    Tiếp tục <Icon name="arrow" />
                  </button>
                </div>
              </Card>
            )}

            {step === 3 && topic && (
              <Card>
                <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Xem trước & tạo bộ bài tập</h3>
                <p className="muted" style={{ margin: "0 0 18px", fontSize: 13 }}>
                  Đặt tên hiển thị và xác nhận.
                </p>

                <div className="field" style={{ marginBottom: 18 }}>
                  <label>Tên bộ bài tập</label>
                  <input
                    className="input"
                    placeholder={suggestedName}
                    value={setName}
                    onChange={(e) => setSetName(e.target.value)}
                  />
                  <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>
                    Để trống = dùng tên gợi ý ở trên.
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--surface-2)",
                    borderRadius: 12,
                    padding: 18,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <div>
                    <div className="eyebrow">Chuyên đề</div>
                    <div className="row" style={{ gap: 8, marginTop: 4 }}>
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: `color-mix(in oklch, ${topic.color}, white 86%)`,
                          color: topic.color,
                          display: "grid",
                          placeItems: "center",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {topic.ico}
                      </span>
                      <b style={{ fontSize: 14 }}>{topic.name}</b>
                    </div>
                  </div>
                  <div>
                    <div className="eyebrow">Tên hiển thị</div>
                    <b style={{ fontSize: 14 }}>{finalName}</b>
                  </div>
                  <div>
                    <div className="eyebrow">Mức · Số câu · Thời lượng</div>
                    <b className="mono" style={{ fontSize: 14 }}>
                      {difficulty} · {qcount} câu · {minutes} phút
                    </b>
                  </div>
                  <div>
                    <div className="eyebrow">Dạng câu</div>
                    <b style={{ fontSize: 13 }}>
                      {[types.fill && "Điền", types.mcq && "Trắc nghiệm", types.essay && "Tự luận"]
                        .filter(Boolean)
                        .join(" · ")}
                    </b>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div className="eyebrow">Phong cách & tag</div>
                    <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                      <Pill tone={style === "mix" ? "" : style}>
                        {style === "mix" ? "Chung" : schools.find((s) => s.id === style)?.short}
                      </Pill>
                      {tags.length > 0 ? (
                        tags.map((t) => <Pill key={t}>{t}</Pill>)
                      ) : (
                        <span className="muted" style={{ fontSize: 12 }}>Tất cả chủ đề con</span>
                      )}
                    </div>
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
                      <b style={{ color: "var(--accent-ink)" }}>Bộ bài tạo ra là "Tham khảo"</b>
                    </div>
                    <b><Icon name="sparkle" size={13} /> Khỉ con sẽ:</b>
                    <ul style={{ margin: "6px 0 0 22px", padding: 0, lineHeight: 1.6 }}>
                      <li>Lưu metadata của bộ bài vào ngân hàng</li>
                      <li>Hiển thị bộ bài trong "Luyện chuyên đề → {topic.short}" của học sinh</li>
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
                  <button className="btn ghost" onClick={() => setStep(2)} disabled={pending}>
                    <Icon name="back" /> Quay lại
                  </button>
                  <button className="btn primary lg" onClick={generate} disabled={pending}>
                    {pending ? (
                      <Fragment>
                        <Icon name="refresh" /> Đang tạo bộ bài tập…
                      </Fragment>
                    ) : (
                      <Fragment>
                        <Icon name="sparkle" /> Tạo bộ bài và mở ngay
                      </Fragment>
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
