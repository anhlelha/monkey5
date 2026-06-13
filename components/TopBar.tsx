import { Fragment, type ReactNode } from "react";
import Link from "next/link";

export type Crumb = string | { label: string; href?: string };

interface TopBarProps {
  crumbs?: Crumb[];
  actions?: ReactNode;
}

export function TopBar({ crumbs = [], actions }: TopBarProps) {
  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          const item = typeof c === "string" ? { label: c } : c;
          const href = !last ? item.href : undefined;
          const content = (
            <span
              style={{
                color: last ? "var(--ink)" : undefined,
                fontWeight: last ? 600 : 500,
              }}
            >
              {item.label}
            </span>
          );
          return (
            <Fragment key={i}>
              {i > 0 && <span className="sep">/</span>}
              {href ? (
                <Link href={href} className="crumb-link">
                  {content}
                </Link>
              ) : (
                content
              )}
            </Fragment>
          );
        })}
      </div>
      <div className="actions">{actions}</div>
    </div>
  );
}
