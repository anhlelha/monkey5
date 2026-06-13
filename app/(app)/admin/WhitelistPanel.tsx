"use client";

import { useTransition, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Card, Pill } from "@/components/ui";
import { addWhitelistEntry, deleteWhitelistEntry } from "./whitelist-actions";

interface WhitelistEntry {
  id: string;
  email: string;
  role: string;
  plan: string;
  note: string | null;
  createdAt: Date;
}

const PLAN_OPTIONS = [
  { value: "free",    label: "Free",    tone: "" },
  { value: "pro",     label: "Pro",     tone: "green" },
  { value: "vip",     label: "VIP",     tone: "solid" },
];

const ROLE_OPTIONS = [
  { value: "student", label: "Học sinh" },
  { value: "admin",   label: "Admin" },
];

export function WhitelistPanel({ entries: initial }: { entries: WhitelistEntry[] }) {
  const [entries, setEntries] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleAdd(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await addWhitelistEntry(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess("Đã lưu thành công.");
        formRef.current?.reset();
        // Optimistic refresh: reload entries from page revalidation is handled by server
        // We refresh page to get updated list
        window.location.reload();
      }
    });
  }

  function handleDelete(email: string) {
    if (!confirm(`Xoá ${email} khỏi whitelist?`)) return;
    startTransition(async () => {
      await deleteWhitelistEntry(email);
      setEntries((prev) => prev.filter((e) => e.email !== email));
    });
  }

  const planTone = (plan: string) =>
    plan === "vip" ? "solid" : plan === "pro" ? "green" : "";

  return (
    <div className="col" style={{ gap: 20 }}>
      {/* ── Add / Edit form ── */}
      <Card title="Thêm / Cập nhật email" sub="Gán quyền và gói trước hoặc sau khi người dùng đăng nhập">
        <form ref={formRef} action={handleAdd} style={{ display: "contents" }}>
          <div className="grid cols-2" style={{ gap: 12, marginBottom: 12 }}>
            <div className="field">
              <label>Email *</label>
              <input
                className="input"
                name="email"
                type="email"
                placeholder="user@gmail.com"
                required
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label>Ghi chú</label>
              <input
                className="input"
                name="note"
                placeholder="VD: Tài khoản Vinmec"
              />
            </div>
            <div className="field">
              <label>Vai trò</label>
              <select className="input" name="role" defaultValue="student">
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Gói thành viên</label>
              <select className="input" name="plan" defaultValue="free">
                {PLAN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div style={{ color: "var(--error, red)", fontSize: 13, marginBottom: 10 }}>
              ⚠ {error}
            </div>
          )}
          {success && (
            <div style={{ color: "var(--success)", fontSize: 13, marginBottom: 10 }}>
              ✓ {success}
            </div>
          )}

          <button
            type="submit"
            className="btn primary"
            disabled={isPending}
            style={{ opacity: isPending ? 0.6 : 1 }}
          >
            <Icon name="plus" size={13} />
            {isPending ? "Đang lưu…" : "Lưu vào whitelist"}
          </button>
        </form>
      </Card>

      {/* ── Whitelist table ── */}
      <Card
        title="Danh sách whitelist"
        sub={`${entries.length} email đã cấu hình`}
      >
        {entries.length === 0 ? (
          <div className="empty">Chưa có email nào trong whitelist.</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Gói</th>
                <th>Ghi chú</th>
                <th>Thêm lúc</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>
                    <span className="mono" style={{ fontSize: 13 }}>{e.email}</span>
                  </td>
                  <td>
                    <Pill tone={e.role === "admin" ? "solid" : ""}>{e.role}</Pill>
                  </td>
                  <td>
                    <Pill tone={planTone(e.plan)}>
                      {e.plan === "vip" ? "VIP" : e.plan === "pro" ? "Pro" : "Free"}
                    </Pill>
                  </td>
                  <td className="muted" style={{ fontSize: 12 }}>{e.note ?? "—"}</td>
                  <td className="muted" style={{ fontSize: 12 }}>
                    {new Date(e.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn sm ghost"
                      onClick={() => handleDelete(e.email)}
                      disabled={isPending}
                      style={{ color: "var(--error, red)" }}
                    >
                      <Icon name="trash" size={12} /> Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
