"use client";

import { useState, useTransition } from "react";
import { Card, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { createSchool, updateSchool, deactivateSchool } from "./actions";

interface SchoolDto {
  id: string;
  short: string;
  name: string;
  full: string;
  color: string;
  tone: string;
  desc: string;
  minutes: number;
  style: string;
  position: number;
  active: boolean;
}

interface Props {
  schools: SchoolDto[];
}

export function SchoolsPanel({ schools }: Props) {
  const [editing, setEditing] = useState<SchoolDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (form: SchoolDto, isNew: boolean) => {
    setError(null);
    startTransition(async () => {
      try {
        if (isNew) await createSchool(form);
        else await updateSchool(form);
        setEditing(null);
        setCreating(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const handleDeactivate = (id: string) => {
    if (!confirm(`Vô hiệu hóa trường ${id}?`)) return;
    startTransition(async () => {
      try {
        await deactivateSchool(id);
      } catch (e) {
        setError(String(e));
      }
    });
  };

  return (
    <Card
      title="Danh sách trường"
      sub="Trường mới upload đề (có exam.school) sẽ tự sinh row mặc định — bạn vào đây sửa lại tên/màu."
      action={
        <button className="btn primary" onClick={() => setCreating(true)} disabled={isPending}>
          <Icon name="plus" /> Thêm trường
        </button>
      }
    >
      {error && (
        <div className="muted" style={{ color: "var(--danger)", marginBottom: 12 }}>
          {error}
        </div>
      )}
      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: 50 }}>#</th>
            <th style={{ width: 60 }}>ID</th>
            <th style={{ width: 60 }}>Short</th>
            <th>Tên</th>
            <th style={{ width: 100 }}>Màu</th>
            <th style={{ width: 80 }}>Tone</th>
            <th style={{ width: 80 }}>Phút</th>
            <th style={{ width: 80 }}>Active</th>
            <th style={{ width: 160 }}></th>
          </tr>
        </thead>
        <tbody>
          {schools.map((s) => (
            <tr key={s.id}>
              <td className="mono muted">{s.position}</td>
              <td className="mono">{s.id}</td>
              <td>
                <Pill tone={s.tone}>{s.short}</Pill>
              </td>
              <td>
                <div>{s.name}</div>
                <div className="muted" style={{ fontSize: 11.5 }}>
                  {s.full}
                </div>
              </td>
              <td>
                <span
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 18,
                    background: s.color,
                    borderRadius: 4,
                    verticalAlign: "middle",
                    marginRight: 6,
                  }}
                />
                <span className="mono" style={{ fontSize: 11.5 }}>
                  {s.color}
                </span>
              </td>
              <td className="mono">{s.tone}</td>
              <td className="mono">{s.minutes}</td>
              <td>
                {s.active ? <Pill tone="green">Active</Pill> : <Pill>Inactive</Pill>}
              </td>
              <td style={{ textAlign: "right" }}>
                <button className="btn sm ghost" onClick={() => setEditing(s)}>
                  Sửa
                </button>
                {s.active && (
                  <button
                    className="btn sm ghost"
                    style={{ color: "var(--danger)" }}
                    onClick={() => handleDeactivate(s.id)}
                  >
                    Tắt
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {(editing || creating) && (
        <SchoolFormModal
          initial={editing ?? blankSchool()}
          isNew={creating}
          onCancel={() => {
            setEditing(null);
            setCreating(false);
            setError(null);
          }}
          onSubmit={(form) => handleSubmit(form, creating)}
          isPending={isPending}
        />
      )}
    </Card>
  );
}

function blankSchool(): SchoolDto {
  return {
    id: "",
    short: "",
    name: "",
    full: "",
    color: "#3b82f6",
    tone: "",
    desc: "",
    minutes: 60,
    style: "",
    position: 0,
    active: true,
  };
}

interface FormProps {
  initial: SchoolDto;
  isNew: boolean;
  onCancel: () => void;
  onSubmit: (form: SchoolDto) => void;
  isPending: boolean;
}

function SchoolFormModal({ initial, isNew, onCancel, onSubmit, isPending }: FormProps) {
  const [form, setForm] = useState(initial);
  const update = <K extends keyof SchoolDto>(key: K, value: SchoolDto[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 12,
          padding: 24,
          width: 520,
          maxWidth: "90vw",
          boxShadow: "0 10px 30px rgba(0,0,0,.2)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          {isNew ? "Thêm trường mới" : `Sửa trường ${form.id}`}
        </h3>
        <div className="col" style={{ gap: 12 }}>
          <div className="field">
            <label>ID (chữ thường + số, không đổi sau khi tạo)</label>
            <input
              className="input mono"
              value={form.id}
              onChange={(e) => update("id", e.target.value)}
              disabled={!isNew}
            />
          </div>
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Short</label>
              <input
                className="input"
                value={form.short}
                onChange={(e) => update("short", e.target.value)}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Tone (CSS class)</label>
              <input
                className="input mono"
                value={form.tone}
                onChange={(e) => update("tone", e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Tên ngắn</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Tên đầy đủ</label>
            <input
              className="input"
              value={form.full}
              onChange={(e) => update("full", e.target.value)}
            />
          </div>
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Màu (var() hoặc #hex)</label>
              <input
                className="input mono"
                value={form.color}
                onChange={(e) => update("color", e.target.value)}
              />
            </div>
            <div className="field" style={{ width: 100 }}>
              <label>Phút</label>
              <input
                className="input mono"
                type="number"
                value={form.minutes}
                onChange={(e) => update("minutes", Number(e.target.value))}
              />
            </div>
            <div className="field" style={{ width: 100 }}>
              <label>Position</label>
              <input
                className="input mono"
                type="number"
                value={form.position}
                onChange={(e) => update("position", Number(e.target.value))}
              />
            </div>
          </div>
          <div className="field">
            <label>Mô tả ngắn</label>
            <textarea
              className="input"
              rows={2}
              value={form.desc}
              onChange={(e) => update("desc", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Phong cách</label>
            <textarea
              className="input"
              rows={2}
              value={form.style}
              onChange={(e) => update("style", e.target.value)}
            />
          </div>
          <div className="field row" style={{ gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              id="active-toggle"
              checked={form.active}
              onChange={(e) => update("active", e.target.checked)}
            />
            <label htmlFor="active-toggle">Active</label>
          </div>
        </div>
        <div className="row" style={{ justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button className="btn ghost" onClick={onCancel} disabled={isPending}>
            Hủy
          </button>
          <button className="btn primary" onClick={() => onSubmit(form)} disabled={isPending}>
            {isPending ? "Đang lưu…" : isNew ? "Tạo" : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
