"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import {
  setUserDisabled,
  setUserRole,
  setUserPlan,
  deleteUser,
} from "../../actions";

interface Props {
  userId: string;
  initialRole: string;
  initialPlan: string;
  initialDisabled: boolean;
  isSelf: boolean;
  displayName: string;
}

type Plan = "free" | "pro" | "vip";
type Role = "student" | "admin";

export function UserAdminControls({
  userId,
  initialRole,
  initialPlan,
  initialDisabled,
  isSelf,
  displayName,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<Role>((initialRole as Role) ?? "student");
  const [plan, setPlan] = useState<Plan>((initialPlan as Plan) ?? "free");
  const [disabled, setDisabled] = useState<boolean>(initialDisabled);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const wrap = (action: () => Promise<void>) => () => {
    setError(null);
    setStatus(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const onChangeRole = (next: Role) =>
    wrap(async () => {
      await setUserRole({ userId, role: next });
      setRole(next);
      setStatus(`Đã đổi vai trò sang "${next === "admin" ? "Admin" : "Học sinh"}".`);
    });

  const onChangePlan = (next: Plan) =>
    wrap(async () => {
      await setUserPlan({ userId, plan: next });
      setPlan(next);
      const label = next === "vip" ? "VIP" : next === "pro" ? "Pro" : "Free";
      setStatus(`Đã đổi gói sang "${label}".`);
    });

  const onToggleDisabled = wrap(async () => {
    const next = !disabled;
    await setUserDisabled({ userId, disabled: next });
    setDisabled(next);
    setStatus(next ? "Đã khoá tài khoản. Phiên hiện tại bị huỷ." : "Đã mở khoá tài khoản.");
  });

  const onDelete = wrap(async () => {
    if (
      !window.confirm(
        `Xoá vĩnh viễn "${displayName}"? Mọi attempt, phiên chuyên đề, dữ liệu OAuth của HS sẽ bị xoá theo. Hành động KHÔNG thể khôi phục.`,
      )
    ) {
      return;
    }
    await deleteUser({ userId });
    router.push("/admin?tab=users");
    router.refresh();
  });

  return (
    <Card
      title="Tác vụ quản trị"
      sub={
        isSelf
          ? "Đây là tài khoản đang đăng nhập — không thể tự khoá / xoá / hạ quyền."
          : "Thay đổi áp dụng ngay lập tức."
      }
    >
      <div className="col" style={{ gap: 16 }}>
        <div className="row" style={{ gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div className="field" style={{ minWidth: 200 }}>
            <label>Vai trò</label>
            <div className="chip-group">
              {(["student", "admin"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={pending || role === r || (isSelf && r !== "admin")}
                  className={"chip " + (role === r ? "active" : "")}
                  onClick={onChangeRole(r)}
                >
                  {r === "admin" ? "Admin" : "Học sinh"}
                </button>
              ))}
            </div>
          </div>

          <div className="field" style={{ minWidth: 280 }}>
            <label>Gói thành viên</label>
            <div className="chip-group">
              {(["free", "pro", "vip"] as Plan[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={pending || plan === p}
                  className={"chip " + (plan === p ? "active" : "")}
                  onClick={onChangePlan(p)}
                >
                  {p === "vip" ? "VIP" : p === "pro" ? "Pro" : "Free"}
                </button>
              ))}
            </div>
          </div>

          <div className="field" style={{ minWidth: 240 }}>
            <label>Trạng thái</label>
            <div className="row" style={{ gap: 10, alignItems: "center" }}>
              <Pill tone={disabled ? "red" : "green"}>
                {disabled ? "Đang khoá" : "Đang hoạt động"}
              </Pill>
              <button
                type="button"
                className={"btn sm " + (disabled ? "primary" : "")}
                disabled={pending || isSelf}
                onClick={onToggleDisabled}
              >
                <Icon name={disabled ? "refresh" : "x"} size={12} />
                {disabled ? "Mở khoá" : "Khoá tài khoản"}
              </button>
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>
              Khi khoá: HS không đăng nhập được và phiên hiện tại bị huỷ.
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 4,
            padding: 12,
            background: "var(--danger-soft)",
            borderRadius: 8,
            borderLeft: "3px solid var(--danger)",
          }}
        >
          <div className="row between" style={{ alignItems: "center" }}>
            <div>
              <b style={{ color: "var(--danger)", fontSize: 13 }}>Vùng nguy hiểm</b>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                Xoá vĩnh viễn người dùng cùng toàn bộ dữ liệu (attempts, sessions,
                OAuth). Nên cân nhắc &quot;Khoá tài khoản&quot; thay vì xoá.
              </div>
            </div>
            <button
              type="button"
              className="btn sm"
              style={{
                background: "var(--danger)",
                color: "#fff",
                borderColor: "var(--danger)",
              }}
              disabled={pending || isSelf}
              onClick={onDelete}
            >
              <Icon name="x" size={12} /> Xoá vĩnh viễn
            </button>
          </div>
        </div>

        {(status || error || pending) && (
          <div
            className="muted"
            style={{
              fontSize: 12.5,
              color: error ? "var(--danger)" : "var(--ink)",
            }}
          >
            {pending ? "Đang xử lý…" : error ? `Lỗi: ${error}` : status}
          </div>
        )}
      </div>
    </Card>
  );
}
