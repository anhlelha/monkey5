interface RadarPoint {
  label: string;
  value: number;
}

interface RadarProps {
  data: RadarPoint[];
  size?: number;
  max?: number;
}

export function Radar({ data, size = 320, max = 1 }: RadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 36;
  const n = data.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const point = (val: number, i: number): [number, number] => {
    const v = (val / max) * r;
    return [cx + Math.cos(angle(i)) * v, cy + Math.sin(angle(i)) * v];
  };

  const rings = [0.25, 0.5, 0.75, 1].map((k) => {
    const pts = data.map((_, i) => point(max * k, i));
    return "M" + pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L") + "Z";
  });

  const areaPts = data.map((d, i) => point(d.value, i));
  const areaPath = "M" + areaPts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L") + "Z";

  return (
    <svg className="radar-svg" width={size} height={size} style={{ overflow: "visible" }}>
      {rings.map((d, i) => (
        <path key={i} d={d} className="grid" />
      ))}
      {data.map((_, i) => {
        const [x, y] = point(max, i);
        return <line key={i} className="axis" x1={cx} y1={cy} x2={x} y2={y} />;
      })}
      <path d={areaPath} className="area" />
      {areaPts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" className="point" />
      ))}
      {data.map((d, i) => {
        const [x, y] = point(max * 1.18, i);
        const ax = Math.cos(angle(i));
        const ay = Math.sin(angle(i));
        return (
          <text
            key={i}
            className="label"
            x={x}
            y={y}
            textAnchor={ax > 0.2 ? "start" : ax < -0.2 ? "end" : "middle"}
            dominantBaseline={ay > 0.2 ? "hanging" : ay < -0.2 ? "auto" : "middle"}
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
