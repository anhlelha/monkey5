"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon, type IconName } from "./Icon";

interface SubjectDef {
  id: string;
  label: string;
  href: string;
  icon: IconName;
}

const SUBJECTS: SubjectDef[] = [
  { id: "overview", label: "Tổng quan", href: "/overview", icon: "trend" },
  { id: "math", label: "Toán", href: "/home", icon: "grid" },
  { id: "english", label: "Tiếng Anh", href: "/english", icon: "book" },
  { id: "vietnamese", label: "Tiếng Việt", href: "/vietnamese", icon: "pencil" },
];

// Subject switcher shown in the page header (TopBar). Hidden inside admin and the
// fullscreen exam runner/results where a subject switch doesn't belong.
export function SubjectSwitch() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/exam/") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/create") ||
    // System-wide pages (not tied to a subject) — no subject switcher.
    pathname.startsWith("/guide") ||
    pathname.startsWith("/settings")
  ) {
    return null;
  }

  // On the shared /results page the active subject comes from ?subject=…
  const resultsSubject = pathname.startsWith("/results")
    ? searchParams.get("subject") ?? "math"
    : null;

  const active =
    resultsSubject !== null
      ? resultsSubject
      : pathname === "/overview" || pathname.startsWith("/overview/")
        ? "overview"
        : pathname.startsWith("/english")
          ? "english"
          : pathname.startsWith("/vietnamese")
            ? "vietnamese"
            : "math";

  return (
    <div className="subject-switch header" role="tablist" aria-label="Chế độ xem">
      <span className="subject-switch-label">Chế độ xem</span>
      {SUBJECTS.map((s) => (
        <Link
          key={s.id}
          href={s.href}
          role="tab"
          aria-selected={active === s.id}
          className={"subject-pill " + (active === s.id ? "active" : "")}
        >
          <Icon name={s.icon} size={14} />
          <span>{s.label}</span>
        </Link>
      ))}
    </div>
  );
}
