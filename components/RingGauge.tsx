interface RingGaugeProps {
  value: number; // 0..100
  color: string;
  size?: number;
  stroke?: number;
}

// Simple donut gauge with the percentage in the centre. Pure SVG (server-safe).
export function RingGauge({ value, color, size = 116, stroke = 11 }: RingGaugeProps) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - v / 100);
  const cx = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flex: "none" }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.24}
        fontWeight={700}
        fill="var(--ink)"
        fontFamily="var(--font-mono)"
      >
        {Math.round(v)}%
      </text>
    </svg>
  );
}
