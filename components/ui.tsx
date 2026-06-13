// Small shared building blocks ported from components.jsx.

import type { CSSProperties, ReactNode } from "react";
import { Icon } from "./Icon";

// ─── Brand ──────────────────────────────────────────────────────────────────

export function Brand({ size = 30 }: { size?: number }) {
  return (
    <div className="brand-mark" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      K
    </div>
  );
}

// ─── Pill ───────────────────────────────────────────────────────────────────

interface PillProps {
  tone?: string;
  children: ReactNode;
  dot?: boolean;
  style?: CSSProperties;
  className?: string;
}

export function Pill({ tone, children, dot, style, className }: PillProps) {
  return (
    <span className={"pill " + (tone ?? "") + (className ? " " + className : "")} style={style}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

// ─── Kind badge ─────────────────────────────────────────────────────────────

interface KindBadgeProps {
  kind: "official" | "reference" | "mixed" | string;
  mixRatio?: string | null;
  compact?: boolean;
}

export function KindBadge({ kind, mixRatio, compact }: KindBadgeProps) {
  if (kind === "official") {
    return (
      <Pill tone="solid">
        <Icon name="check" size={9} stroke={3} />
        {compact ? "Chính thức" : "Đề chính thức"}
      </Pill>
    );
  }
  if (kind === "reference") {
    return <Pill tone="amber">{compact ? "Tham khảo" : "Đề tham khảo"}</Pill>;
  }
  if (kind === "mixed") {
    return <Pill tone="green">Trộn{mixRatio ? " " + mixRatio : ""}</Pill>;
  }
  return null;
}

// ─── Bar ────────────────────────────────────────────────────────────────────

interface BarProps {
  value: number;
  max?: number;
  tone?: string;
  tall?: boolean;
  thin?: boolean;
}

export function Bar({ value, max = 100, tone = "", tall, thin }: BarProps) {
  return (
    <div className={"bar " + tone + (tall ? " tall" : "") + (thin ? " thin" : "")}>
      <div className="bar-fill" style={{ width: Math.min(100, (value / max) * 100) + "%" }} />
    </div>
  );
}

// ─── Donut ──────────────────────────────────────────────────────────────────

interface DonutProps {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string | number;
  subLabel?: string;
}

export function Donut({
  value,
  max = 100,
  size = 140,
  stroke = 12,
  color = "var(--accent)",
  label,
  subLabel,
}: DonutProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <svg width={size} height={size} className="donut">
      <circle className="track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
      <circle
        className="fill"
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
        stroke={color}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
      />
      {label !== undefined && (
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          fontWeight="700"
          fontSize={size * 0.24}
          fontFamily="var(--font-mono)"
          fill="var(--ink)"
          dominantBaseline="middle"
        >
          {label}
        </text>
      )}
      {subLabel && (
        <text x="50%" y={size * 0.7} textAnchor="middle" fontSize={size * 0.085} fill="var(--ink-muted)">
          {subLabel}
        </text>
      )}
    </svg>
  );
}

// ─── Card ───────────────────────────────────────────────────────────────────

interface CardProps {
  title?: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  tight?: boolean;
  style?: CSSProperties;
}

export function Card({ title, sub, action, children, tight, style }: CardProps) {
  return (
    <div className={"card " + (tight ? "tight" : "")} style={style}>
      {(title || action) && (
        <div className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {sub && <div className="sub">{sub}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
