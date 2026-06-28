"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface LandingUser {
  name: string | null;
  image: string | null;
  role: string;
}

/**
 * Compact nav-bar actions shown to logged-in users on the landing page.
 * Replaces the "Xem demo / Dùng thử miễn phí" buttons.
 */
export function LandingNavActions({ user }: { user: LandingUser }) {
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

  return (
    <>
      {isAdmin ? (
        <Link href="/admin" className="btn ghost">
          Trang admin
        </Link>
      ) : null}
      <Link href="/overview" className="btn primary">
        {isAdmin ? "Trang người dùng" : "Tiếp tục học"}
      </Link>

      <div className="landing-user" ref={ref}>
        <button
          type="button"
          className={"landing-user-trigger" + (open ? " open" : "")}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          title={user.name ?? "Tài khoản"}
        >
          {user.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.image}
              alt=""
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <span className="landing-user-initials">{initials}</span>
          )}
        </button>
        {open && (
          <div className="landing-user-popover" role="menu">
            <div className="landing-user-head">
              <b>{user.name ?? "Tài khoản"}</b>
              {isAdmin ? <span className="pill admin">Admin</span> : null}
            </div>
            {isAdmin ? (
              <Link
                href="/admin"
                className="landing-user-item"
                onClick={() => setOpen(false)}
                role="menuitem"
              >
                Trang admin
              </Link>
            ) : null}
            <Link
              href="/overview"
              className="landing-user-item"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              {isAdmin ? "Trang người dùng" : "Trang của tôi"}
            </Link>
            <button
              type="button"
              className="landing-user-item danger"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void signOut({ callbackUrl: "/" });
              }}
            >
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Hero / final-CTA buttons shown to logged-in users on the landing page.
 * Replaces "Dùng thử miễn phí / Xem demo".
 */
export function LandingHeroActions({
  user,
  size = "lg",
}: {
  user: LandingUser;
  size?: "lg" | "md";
}) {
  const isAdmin = user.role === "admin";
  const sizeClass = size === "lg" ? " lg" : "";
  return (
    <>
      {isAdmin ? (
        <>
          <Link href="/admin" className={"btn primary" + sizeClass}>
            Vào trang admin
          </Link>
          <Link href="/overview" className={"btn" + sizeClass}>
            Trang của người dùng
          </Link>
        </>
      ) : (
        <Link href="/overview" className={"btn primary" + sizeClass}>
          Tiếp tục học
        </Link>
      )}
    </>
  );
}
