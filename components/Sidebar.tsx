"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon, type IconName } from "./Icon";
import { Brand } from "./ui";
import { SettingsButton } from "@/app/(app)/home/SettingsButton";

interface SidebarProps {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
    grade: string;
    role: string;
    plan: string;
    targets: string[];
    hours: number;
    examDate: string | null;
    readyTarget: number;
  };
  examLibraryBadge?: number;
}

interface NavItem {
  href: string;
  icon: IconName;
  label: string;
  badge?: string | number;
  match?: string[];
  /** When set, item is active only when on /admin with this `tab` query value. */
  adminTab?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const ADMIN_GROUPS: NavGroup[] = [
  {
    title: "Tổng quan",
    items: [{ href: "/admin?tab=overview", icon: "trend", label: "Dashboard", adminTab: "overview" }],
  },
  {
    title: "Học tập",
    items: [
      { href: "/admin?tab=exams", icon: "library", label: "Đề bài", adminTab: "exams" },
      { href: "/admin?tab=bank", icon: "book", label: "Câu hỏi", adminTab: "bank" },
    ],
  },
  {
    title: "Người dùng",
    items: [
      { href: "/admin?tab=users", icon: "user", label: "Tài khoản", adminTab: "users" },
      { href: "/admin?tab=whitelist", icon: "lock", label: "Whitelist", adminTab: "whitelist" },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { href: "/admin?tab=settings", icon: "settings", label: "Cấu hình chung", adminTab: "settings" },
      { href: "/admin?tab=llm", icon: "sparkle", label: "AI LLMs", adminTab: "llm" },
      { href: "/admin?tab=topics", icon: "grid", label: "Chuyên đề", adminTab: "topics" },
      { href: "/admin?tab=qa", icon: "search", label: "QA câu hỏi", adminTab: "qa" },
    ],
  },
  {
    title: "Gói thành viên",
    items: [{ href: "/admin?tab=plans", icon: "star", label: "VIP / Pro / Free", adminTab: "plans" }],
  },
  {
    title: "Cấu hình nội dung",
    items: [
      { href: "/admin?tab=schools", icon: "school", label: "Trường", adminTab: "schools" },
      { href: "/admin?tab=readiness", icon: "target", label: "Mức phù hợp", adminTab: "readiness" },
    ],
  },
];

export function Sidebar({ user, examLibraryBadge }: SidebarProps) {
  const learnItems: NavItem[] = [
    { href: "/home", icon: "home", label: "Trang chính" },
    {
      href: "/library",
      icon: "library",
      label: "Đề thi mẫu",
      badge: examLibraryBadge,
    },
    { href: "/topics", icon: "grid", label: "Luyện chuyên đề", match: ["/topics"] },
    { href: "/results", icon: "trend", label: "Kết quả gần đây" },
  ];

  const initials =
    (user.name ?? "K")
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((s) => s[0])
      .join("")
      .toUpperCase() || "K";

  return (
    <aside className="sidebar">
      <div className="brand">
        <Brand />
        <div className="brand-text">
          <b>Cùng Khỉ con</b>
          <span>vào lớp 6 CLC</span>
        </div>
      </div>

      <Suspense fallback={<NavBody learnItems={learnItems} adminGroups={[]} user={user} isAdmin={false} pathname="" currentTab={null} />}>
        <SidebarBody learnItems={learnItems} user={user} />
      </Suspense>

      <Link href="/home" className="sidebar-user">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {user.image ? (
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
          <span className="row" style={{ gap: 4, marginTop: 2, display: "inline-flex" }}>
            <span>{user.grade}</span>
            {user.role === "admin" ? (
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
                    background: user.plan === "vip" ? "var(--ink)" : "var(--success-soft)",
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
      </Link>
    </aside>
  );
}

function SidebarBody({ learnItems, user }: { learnItems: NavItem[]; user: SidebarProps["user"] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const isAdmin = user.role === "admin";

  return (
    <NavBody
      learnItems={learnItems}
      adminGroups={isAdmin ? ADMIN_GROUPS : []}
      user={user}
      isAdmin={isAdmin}
      pathname={pathname ?? ""}
      currentTab={currentTab}
    />
  );
}

interface NavBodyProps {
  learnItems: NavItem[];
  adminGroups: NavGroup[];
  user: SidebarProps["user"];
  isAdmin: boolean;
  pathname: string;
  currentTab: string | null;
}

function NavBody({ learnItems, adminGroups, user, isAdmin, pathname, currentTab }: NavBodyProps) {
  const isActive = (it: NavItem) => {
    if (it.adminTab) {
      if (it.adminTab === "exams" && pathname.startsWith("/admin/exam")) return true;
      if (pathname !== "/admin") return false;
      if (it.adminTab === "overview") return currentTab === null || currentTab === "overview";
      return currentTab === it.adminTab;
    }
    if (pathname === "/admin" || pathname.startsWith("/admin/")) return false;
    const candidates = it.match ?? [it.href];
    return candidates.some((p) => pathname === p || pathname.startsWith(p + "/"));
  };

  return (
    <>
      <div className="nav-section">
        <h6>Học tập</h6>
        {learnItems.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={"nav-item " + (isActive(it) ? "active" : "")}
          >
            <Icon name={it.icon} />
            <span>{it.label}</span>
            {it.badge !== undefined && it.badge !== null && (
              <span className="badge">{it.badge}</span>
            )}
          </Link>
        ))}
        <SettingsButton
          initialUser={{
            name: user.name ?? "",
            email: user.email ?? "",
            grade: user.grade,
            targets: user.targets,
            hours: user.hours,
            examDate: user.examDate ?? "2026-09-01",
            readyTarget: user.readyTarget,
          }}
          trigger={
            <div className="nav-item">
              <Icon name="settings" />
              <span>Cài đặt</span>
            </div>
          }
        />
      </div>

      {isAdmin &&
        adminGroups.map((group) => (
          <div className="nav-section" key={group.title}>
            <h6>{group.title}</h6>
            {group.items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={"nav-item " + (isActive(it) ? "active" : "")}
                replace={Boolean(it.adminTab)}
              >
                <Icon name={it.icon} />
                <span>{it.label}</span>
              </Link>
            ))}
          </div>
        ))}
    </>
  );
}
