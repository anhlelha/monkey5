"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Icon, type IconName } from "./Icon";

interface UserMenuProps {
  user: {
    name: string | null;
    image: string | null;
    grade: string;
    role: string;
    plan: string;
  };
}

interface MenuItem {
  label: string;
  icon: IconName;
  href?: string;
  onClick?: () => void;
  tone?: "danger";
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isAdmin = user.role === "admin";

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials =
    (user.name ?? "K")
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((s) => s[0])
      .join("")
      .toUpperCase() || "K";

  const items: MenuItem[] = [
    ...(isAdmin
      ? ([
          { label: "Trang admin", icon: "settings", href: "/admin" },
          { label: "Trang của người dùng", icon: "home", href: "/home" },
        ] as MenuItem[])
      : ([{ label: "Trang của tôi", icon: "home", href: "/home" }] as MenuItem[])),
    { label: "Trang chính", icon: "library", href: "/" },
    {
      label: "Đăng xuất",
      icon: "x",
      onClick: () => signOut({ callbackUrl: "/" }),
      tone: "danger",
    },
  ];

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className={"sidebar-user user-menu-trigger" + (open ? " open" : "")}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {user.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={user.image}
            alt=""
            className="avatar"
            style={{ objectFit: "cover", borderRadius: "50%" }}
          />
        ) : (
          <div className="avatar">{initials}</div>
        )}
        <div className="meta">
          <b>{user.name ?? "Học sinh"}</b>
          <span
            className="row"
            style={{ gap: 4, marginTop: 2, display: "inline-flex" }}
          >
            <span>{user.grade}</span>
            {isAdmin ? (
              <>
                <span className="muted">·</span>
                <span
                  className="pill"
                  style={{
                    padding: "0 6px",
                    fontSize: "9px",
                    lineHeight: "13px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    background: "var(--accent)",
                    color: "white",
                    borderColor: "transparent",
                    borderRadius: "4px",
                  }}
                >
                  Admin
                </span>
              </>
            ) : user.plan && user.plan !== "free" ? (
              <>
                <span className="muted">·</span>
                <span
                  className="pill"
                  style={{
                    padding: "0 6px",
                    fontSize: "9px",
                    lineHeight: "13px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    background:
                      user.plan === "vip" ? "var(--ink)" : "var(--success-soft)",
                    color: user.plan === "vip" ? "white" : "var(--success)",
                    borderColor: "transparent",
                    borderRadius: "4px",
                  }}
                >
                  {user.plan}
                </span>
              </>
            ) : null}
          </span>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginLeft: "auto", flexShrink: 0, opacity: 0.55 }}
        >
          <path d="M6 15l6-6 6 6" />
        </svg>
      </button>

      {open && (
        <div className="user-menu-popover" role="menu">
          {items.map((it, idx) => {
            const className =
              "user-menu-item" + (it.tone === "danger" ? " danger" : "");
            if (it.href) {
              return (
                <Link
                  key={idx}
                  href={it.href}
                  className={className}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  <Icon name={it.icon} />
                  <span>{it.label}</span>
                </Link>
              );
            }
            return (
              <button
                key={idx}
                type="button"
                className={className}
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  it.onClick?.();
                }}
              >
                <Icon name={it.icon} />
                <span>{it.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
