"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { Card, Pill } from "@/components/ui";
import { saveTopics } from "./actions";

interface TopicRow {
  id: string;
  name: string;
  short: string;
  ico: string;
  color: string;
  position: number;
  skill?: string | null;
}

const COLORS = [
  "oklch(0.6 0.14 30)",
  "oklch(0.58 0.13 240)",
  "oklch(0.6 0.16 25)",
  "oklch(0.68 0.13 70)",
  "oklch(0.58 0.14 290)",
  "oklch(0.6 0.14 200)",
  "oklch(0.6 0.13 170)",
  "oklch(0.62 0.13 330)",
  "oklch(0.62 0.13 130)",
  "oklch(0.55 0.04 260)",
  "oklch(0.62 0.14 50)",
];
const PRESET_ICONS = ["123", "△", "½", "→", "?", "↔", "▥", "Δt", ":", "⌚", "Σ", "π", "√", "%", "□", "∠", "○"];

export function TopicsEditor({ initial, subject = "math" }: { initial: TopicRow[]; subject?: "math" | "english" | "vietnamese" }) {
  const [list, setList] = useState<TopicRow[]>(initial);
  const [dirty, setDirty] = useState(false);
  const [pickerFor, setPickerFor] = useState<{ id: string; type: "color" | "icon" } | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const update = (id: string, patch: Partial<TopicRow>) => {
    setList((l) => l.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    setDirty(true);
  };

  const remove = (id: string) => {
    if (list.length <= 3) return;
    setList((l) => l.filter((t) => t.id !== id));
    setDirty(true);
  };

  const move = (id: string, dir: -1 | 1) => {
    const i = list.findIndex((t) => t.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const copy = [...list];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setList(copy);
    setDirty(true);
  };

  const add = () => {
    const newId = "new" + Date.now().toString(36).slice(-4);
    setList((l) => [
      ...l,
      {
        id: newId,
        name: "Chuyên đề mới",
        short: "Chưa đặt",
        ico: "★",
        color: COLORS[l.length % COLORS.length],
        position: l.length,
      },
    ]);
    setDirty(true);
  };

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        await saveTopics({ subject, topics: list.map(({ id, name, short, ico, color, skill }) => ({ id, name, short, ico, color, skill: skill ?? null })) });
        setDirty(false);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Lưu thất bại");
      }
    });
  };

  const reset = () => {
    setList(initial);
    setDirty(false);
    setError(null);
  };

  return (
    <>
      <div className="row between" style={{ marginBottom: 18 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15 }}>Quản lý nhóm chuyên đề ({list.length} nhóm)</h3>
          <p className="muted" style={{ margin: "2px 0 0", fontSize: 12.5 }}>
            Thêm, đổi tên, đổi màu, sắp xếp lại các chuyên đề.
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {dirty && <Pill tone="amber"><span className="dot" />Có thay đổi chưa lưu</Pill>}
          {error && <Pill tone="red">{error}</Pill>}
          <button className="btn" onClick={reset} disabled={!dirty || pending}>
            Hoàn tác
          </button>
          <button className="btn primary" onClick={save} disabled={!dirty || pending}>
            <Icon name="check" stroke={2.5} /> {pending ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      <Card>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th style={{ width: 60 }}>Icon</th>
              <th style={{ width: 60 }}>Màu</th>
              <th>Tên đầy đủ</th>
              <th style={{ width: 180 }}>Tên ngắn (thẻ)</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {list.map((t, i) => (
              <tr key={t.id}>
                <td>
                  <div className="col" style={{ gap: 2 }}>
                    <button
                      className="icon-btn"
                      style={{ width: 22, height: 22 }}
                      onClick={() => move(t.id, -1)}
                      disabled={i === 0}
                    >
                      <Icon name="chevL" size={10} stroke={2.5} style={{ transform: "rotate(90deg)" }} />
                    </button>
                    <button
                      className="icon-btn"
                      style={{ width: 22, height: 22 }}
                      onClick={() => move(t.id, 1)}
                      disabled={i === list.length - 1}
                    >
                      <Icon name="chevR" size={10} stroke={2.5} style={{ transform: "rotate(90deg)" }} />
                    </button>
                  </div>
                </td>
                <td>
                  <div className="units-pop" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="tool-btn"
                      style={{
                        width: 40,
                        height: 36,
                        justifyContent: "center",
                        fontSize: 16,
                        background: `color-mix(in oklch, ${t.color}, white 86%)`,
                        color: t.color,
                      }}
                      onClick={() =>
                        setPickerFor(
                          pickerFor?.id === t.id && pickerFor.type === "icon"
                            ? null
                            : { id: t.id, type: "icon" },
                        )
                      }
                    >
                      {t.ico}
                    </button>
                    {pickerFor?.id === t.id && pickerFor.type === "icon" && (
                      <div className="units-menu" style={{ minWidth: 240, gridTemplateColumns: "repeat(6, 1fr)" }}>
                        <h6>Chọn ký hiệu</h6>
                        {PRESET_ICONS.map((ic) => (
                          <button
                            key={ic}
                            className="tool-btn"
                            style={{ justifyContent: "center" }}
                            onClick={() => {
                              update(t.id, { ico: ic });
                              setPickerFor(null);
                            }}
                          >
                            {ic}
                          </button>
                        ))}
                        <input
                          className="input"
                          style={{ gridColumn: "1 / -1", marginTop: 4 }}
                          placeholder="Hoặc gõ tự do (1-3 ký tự)…"
                          maxLength={3}
                          defaultValue={t.ico}
                          onBlur={(e) => {
                            update(t.id, { ico: e.target.value || "·" });
                            setPickerFor(null);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="units-pop" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="color-swatch"
                      style={{ background: t.color, width: 36, height: 36 }}
                      onClick={() =>
                        setPickerFor(
                          pickerFor?.id === t.id && pickerFor.type === "color"
                            ? null
                            : { id: t.id, type: "color" },
                        )
                      }
                    />
                    {pickerFor?.id === t.id && pickerFor.type === "color" && (
                      <div className="units-menu" style={{ minWidth: 200, gridTemplateColumns: "repeat(6, 1fr)" }}>
                        <h6>Chọn màu (cùng độ chroma)</h6>
                        {COLORS.map((c, idx) => (
                          <button
                            key={idx}
                            className="color-swatch"
                            style={{
                              background: c,
                              width: 28,
                              height: 28,
                              borderColor: c === t.color ? "var(--ink)" : "var(--border-strong)",
                            }}
                            onClick={() => {
                              update(t.id, { color: c });
                              setPickerFor(null);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <input
                    className="input"
                    value={t.name}
                    onChange={(e) => update(t.id, { name: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={t.short}
                    onChange={(e) => update(t.id, { short: e.target.value })}
                  />
                </td>
                <td>
                  <button
                    className="btn sm danger"
                    onClick={() => remove(t.id)}
                    disabled={list.length <= 3}
                    title={list.length <= 3 ? "Phải có ít nhất 3 chuyên đề" : "Xoá"}
                  >
                    <Icon name="trash" size={12} /> Xoá
                  </button>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: 16, borderBottom: 0 }}>
                <button className="btn" onClick={add}>
                  <Icon name="plus" /> Thêm chuyên đề mới
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      <div
        style={{
          marginTop: 18,
          padding: 14,
          background: "var(--surface-2)",
          borderRadius: 10,
          fontSize: 12.5,
          color: "var(--ink-soft)",
          border: "1px solid var(--border)",
        }}
      >
        <b>Lưu ý khi sửa chuyên đề:</b>
        <ul style={{ margin: "6px 0 0 20px", lineHeight: 1.6 }}>
          <li>Câu hỏi gắn với chuyên đề bị <b>xoá</b> sẽ chuyển sang "Chưa phân loại".</li>
          <li>Đổi tên / icon / màu sẽ <b>cập nhật ngay</b> trên dashboard học sinh.</li>
          <li>Thứ tự ở đây quyết định thứ tự hiển thị trong "Luyện chuyên đề".</li>
        </ul>
      </div>
    </>
  );
}
