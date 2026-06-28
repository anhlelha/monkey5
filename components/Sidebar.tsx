"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon, type IconName } from "./Icon";
import { Brand } from "./ui";
import { UserMenu } from "./UserMenu";
import { SettingsButton } from "@/app/(app)/home/SettingsButton";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

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
    theme: string;
  };
  examLibraryBadge?: number;
  /** Count of active private remedial sets owned by the user; hides the
   * "Bài thầy giao" nav item when zero. */
  assignedCount?: number;
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
      { href: "/admin?tab=levels", icon: "target", label: "Số câu luyện", adminTab: "levels" },
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

export function Sidebar({ user, examLibraryBadge, assignedCount }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Restore persisted state on mount.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1") {
        setCollapsed(true);
      }
    } catch {
      // ignore (storage disabled)
    }
  }, []);

  // Propagate collapsed state to the parent `.app` grid so the main column
  // can widen. The class lives on `.app` because that is where the CSS grid
  // template-columns are defined.
  useEffect(() => {
    const app = document.querySelector(".app");
    if (!app) return;
    if (collapsed) app.classList.add("sidebar-collapsed");
    else app.classList.remove("sidebar-collapsed");
  }, [collapsed]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const learnItems: NavItem[] = [
    { href: "/home", icon: "home", label: "Trang chính" },
    {
      href: "/library",
      icon: "library",
      label: "Đề thi mẫu",
      badge: examLibraryBadge,
    },
    { href: "/topics", icon: "grid", label: "Luyện chuyên đề", match: ["/topics"] },
    ...(assignedCount && assignedCount > 0
      ? [
          {
            href: "/luyen-rieng",
            icon: "target" as IconName,
            label: "Bài thầy giao",
            badge: assignedCount,
            match: ["/luyen-rieng"],
          },
        ]
      : []),
    { href: "/results", icon: "trend", label: "Kết quả gần đây" },
  ];

  return (
    <aside className={"sidebar" + (collapsed ? " collapsed" : "")}>
      <div className="brand">
        <Brand />
        <div className="brand-text">
          <b>Cùng Khỉ con</b>
          <span>vào lớp 6 CLC</span>
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Mở rộng menu" : "Thu hẹp menu"}
          title={collapsed ? "Mở rộng menu" : "Thu hẹp menu"}
        >
          <Icon name={collapsed ? "chevR" : "chevL"} size={14} />
        </button>
      </div>

      <Suspense fallback={<NavBody learnItems={learnItems} adminGroups={[]} user={user} isAdmin={false} pathname="" currentTab={null} collapsed={collapsed} />}>
        <SidebarBody learnItems={learnItems} user={user} collapsed={collapsed} />
      </Suspense>

      <UserMenu
        user={{
          name: user.name,
          image: user.image,
          grade: user.grade,
          role: user.role,
          plan: user.plan,
        }}
      />
    </aside>
  );
}

function SidebarBody({ learnItems, user, collapsed }: { learnItems: NavItem[]; user: SidebarProps["user"]; collapsed: boolean }) {
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
      collapsed={collapsed}
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
  collapsed: boolean;
}

// English-subject nav — mirrors the math "Học tập" menu so the two subjects look
// and behave the same.
const ENGLISH_ITEMS: NavItem[] = [
  { href: "/english", icon: "home", label: "Trang chính", match: ["/english"] },
  { href: "/english/library", icon: "library", label: "Đề thi mẫu", match: ["/english/library"] },
  { href: "/english/topics", icon: "grid", label: "Luyện chuyên đề", match: ["/english/topics"] },
  { href: "/results?subject=english", icon: "trend", label: "Kết quả gần đây", match: ["/results"] },
];

// Vietnamese-subject nav — mirrors the english nav with /vietnamese prefix.
const VIETNAMESE_ITEMS: NavItem[] = [
  { href: "/vietnamese", icon: "home", label: "Trang chính", match: ["/vietnamese"] },
  { href: "/vietnamese/library", icon: "library", label: "Đề thi mẫu", match: ["/vietnamese/library"] },
  { href: "/vietnamese/topics", icon: "grid", label: "Luyện chuyên đề", match: ["/vietnamese/topics"] },
  { href: "/results?subject=vietnamese", icon: "trend", label: "Kết quả gần đây", match: ["/results"] },
];

// "Hệ thống" nav — shared across subjects (Toán / Tiếng Anh). Guide lives here;
// Cài đặt is rendered separately because it opens a modal, not a route.
const SYSTEM_ITEMS: NavItem[] = [
  { href: "/guide", icon: "book", label: "Hướng dẫn sử dụng" },
];

function NavBody({ learnItems, adminGroups, user, isAdmin, pathname, currentTab, collapsed }: NavBodyProps) {
  const isAdminContext =
    pathname.startsWith("/admin") || pathname.startsWith("/create");
  // English subject = the english hub, or an english exam/practice set (examIds
  // are prefixed "en-" or "enset-"; no math exam id starts with "en").
  const isEnglishContext =
    pathname === "/english" ||
    pathname.startsWith("/english/") ||
    pathname.startsWith("/exam/en");
  // Vietnamese subject = the vietnamese hub, or a vietnamese exam/practice set
  // (examIds are prefixed "vn-" or "vnset-").
  const isVietnameseContext =
    pathname === "/vietnamese" ||
    pathname.startsWith("/vietnamese/") ||
    pathname.startsWith("/exam/vn");

  const isActive = (it: NavItem) => {
    if (it.adminTab) {
      if (it.adminTab === "exams" && pathname.startsWith("/admin/exam")) return true;
      if (pathname !== "/admin") return false;
      if (it.adminTab === "overview") return currentTab === null || currentTab === "overview";
      return currentTab === it.adminTab;
    }
    if (isAdminContext) return false;
    const candidates = it.match ?? [it.href];
    // "/english" and "/vietnamese" are hubs with subpaths — they must match
    // exactly so they don't stay active on their children.
    return candidates.some((p) =>
      p === "/english"
        ? pathname === "/english"
        : p === "/vietnamese"
          ? pathname === "/vietnamese"
          : pathname === p || pathname.startsWith(p + "/"),
    );
  };

  const settingsBlock = (
    <SettingsButton
      initialUser={{
        name: user.name ?? "",
        email: user.email ?? "",
        grade: user.grade,
        targets: user.targets,
        hours: user.hours,
        examDate: user.examDate ?? "2026-09-01",
        readyTarget: user.readyTarget,
        theme: user.theme,
      }}
      trigger={
        <div className="nav-item" title={collapsed ? "Cài đặt" : undefined}>
          <Icon name="settings" />
          <span>Cài đặt</span>
        </div>
      }
    />
  );

  return (
    <>
      {!isAdminContext && (
        <>
          <div className="nav-section">
            <h6>{isEnglishContext ? "Tiếng Anh" : isVietnameseContext ? "Tiếng Việt" : "Học tập"}</h6>
            {(isEnglishContext ? ENGLISH_ITEMS : isVietnameseContext ? VIETNAMESE_ITEMS : learnItems).map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={"nav-item " + (isActive(it) ? "active" : "")}
                title={collapsed ? it.label : undefined}
              >
                <Icon name={it.icon} />
                <span>{it.label}</span>
                {it.badge !== undefined && it.badge !== null && (
                  <span className="badge">{it.badge}</span>
                )}
              </Link>
            ))}
          </div>
          <div className="nav-section">
            <h6>Hệ thống</h6>
            {SYSTEM_ITEMS.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={"nav-item " + (isActive(it) ? "active" : "")}
                title={collapsed ? it.label : undefined}
              >
                <Icon name={it.icon} />
                <span>{it.label}</span>
              </Link>
            ))}
            {settingsBlock}
          </div>
        </>
      )}

      {isAdminContext &&
        isAdmin &&
        adminGroups.map((group) => (
          <div className="nav-section" key={group.title}>
            <h6>{group.title}</h6>
            {group.items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={"nav-item " + (isActive(it) ? "active" : "")}
                replace={Boolean(it.adminTab)}
                title={collapsed ? it.label : undefined}
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
