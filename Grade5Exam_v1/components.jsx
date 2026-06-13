/* =========================================================
   Shared components — Cùng Khỉ con vào lớp 6 CLC
   ========================================================= */
const { useState, useEffect, useRef, useMemo, Fragment } = React;

/* ===== Icons (line, 16px) ===== */
const Ico = ({ name, size = 16, stroke = 1.5 }) => {
  const paths = {
    home: <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-9z" />,
    library: <Fragment><path d="M4 4h4v16H4z" /><path d="M10 4h4v16h-4z" /><path d="M16 5l3 1-3 14-3-1z" /></Fragment>,
    plus: <Fragment><path d="M12 5v14" /><path d="M5 12h14" /></Fragment>,
    target: <Fragment><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></Fragment>,
    grid: <Fragment><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></Fragment>,
    chat: <path d="M21 12a8 8 0 11-3.4-6.55L21 4l-1.3 3.6A7.97 7.97 0 0121 12zM8 11h.01M12 11h.01M16 11h.01" />,
    admin: <Fragment><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0114 0" /></Fragment>,
    clock: <Fragment><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Fragment>,
    check: <path d="M5 12l5 5L20 7" />,
    x: <Fragment><path d="M6 6l12 12" /><path d="M18 6L6 18" /></Fragment>,
    flag: <Fragment><path d="M5 21V4" /><path d="M5 4h12l-2 4 2 4H5" /></Fragment>,
    arrow: <Fragment><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></Fragment>,
    back: <Fragment><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></Fragment>,
    bolt: <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />,
    book: <Fragment><path d="M4 4h6a4 4 0 014 4v12a4 4 0 00-4-4H4z" /><path d="M20 4h-6a4 4 0 00-4 4v12a4 4 0 014-4h6z" /></Fragment>,
    sparkle: <Fragment><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2" /></Fragment>,
    search: <Fragment><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Fragment>,
    settings: <Fragment><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></Fragment>,
    user: <Fragment><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></Fragment>,
    upload: <Fragment><path d="M12 16V4" /><path d="M6 10l6-6 6 6" /><path d="M4 20h16" /></Fragment>,
    download: <Fragment><path d="M12 4v12" /><path d="M6 10l6 6 6-6" /><path d="M4 20h16" /></Fragment>,
    eye: <Fragment><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></Fragment>,
    chevR: <path d="M9 6l6 6-6 6" />,
    chevL: <path d="M15 6l-6 6 6 6" />,
    star: <path d="M12 3l2.9 6 6.6.9-4.8 4.6 1.2 6.6L12 18l-5.9 3.1 1.2-6.6L2.5 9.9 9.1 9z" />,
    more: <Fragment><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></Fragment>,
    fire: <path d="M12 3s-1 4-3 6-3 4-3 7a6 6 0 0012 0c0-3-2-5-3-7 1 2 0 4-2 4 0-3-1-7-1-10z" />,
    trend: <Fragment><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></Fragment>,
    pause: <Fragment><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></Fragment>,
    send: <Fragment><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></Fragment>,
    school: <Fragment><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v6c0 1 3 3 6 3s6-2 6-3v-6" /></Fragment>,
    refresh: <Fragment><path d="M3 12a9 9 0 0115-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 01-15 6.7L3 16" /><path d="M3 21v-5h5" /></Fragment>,
    filter: <path d="M3 5h18l-7 9v6l-4-2v-4z" />,
    lock: <Fragment><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></Fragment>,
    pencil: <Fragment><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 113 3L7 19l-4 1 1-4z" /></Fragment>,
    eraser: <Fragment><path d="M20 13l-7.5 7.5a2 2 0 01-3 0L5 16a2 2 0 010-3l7-7 7 7" /><path d="M14 8l6 6" /></Fragment>,
    trash: <Fragment><path d="M3 6h18" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></Fragment>,
    undo: <Fragment><path d="M3 7v6h6" /><path d="M21 17a9 9 0 00-15-6.7L3 13" /></Fragment>
  };
  return (
    <svg className="ico" width={size} height={size} viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || null}
    </svg>
  );
};

/* ===== Brand mark ===== */
const Brand = ({ size = 30 }) => (
  <div className="brand-mark" style={{ width: size, height: size, fontSize: size * 0.42 }}>
    K
  </div>
);

/* ===== Pill ===== */
const Pill = ({ tone, children, dot }) => (
  <span className={"pill " + (tone || "")}>
    {dot && <span className="dot" />}
    {children}
  </span>
);

/* ===== Kind badge (đề chính thức vs tham khảo) ===== */
const KindBadge = ({ kind, mixRatio, compact }) => {
  if (kind === "official") return (
    <Pill tone="solid">
      <Ico name="check" size={9} stroke={3} />
      {compact ? "Chính thức" : "Đề chính thức"}
    </Pill>
  );
  if (kind === "reference") return (
    <Pill tone="amber">{compact ? "Tham khảo" : "Đề tham khảo"}</Pill>
  );
  if (kind === "mixed") return (
    <Pill tone="green">Trộn{mixRatio ? " " + mixRatio : ""}</Pill>
  );
  return null;
};

/* ===== Bar ===== */
const Bar = ({ value, max = 100, tone = "", tall, thin }) => (
  <div className={"bar " + tone + (tall ? " tall" : "") + (thin ? " thin" : "")}>
    <div className="bar-fill" style={{ width: Math.min(100, (value / max) * 100) + "%" }} />
  </div>
);

/* ===== Donut (single-value ring) ===== */
const Donut = ({ value, max = 100, size = 140, stroke = 12, color = "var(--accent)", label, subLabel }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <svg width={size} height={size} className="donut">
      <circle className="track" cx={size/2} cy={size/2} r={r} strokeWidth={stroke} />
      <circle className="fill"  cx={size/2} cy={size/2} r={r} strokeWidth={stroke}
              stroke={color}
              strokeDasharray={c}
              strokeDashoffset={c * (1 - pct)} />
      {label !== undefined && (
        <text x="50%" y="48%" textAnchor="middle" fontWeight="700"
              fontSize={size * 0.24} fontFamily="JetBrains Mono"
              fill="var(--ink)" dominantBaseline="middle">
          {label}
        </text>
      )}
      {subLabel && (
        <text x="50%" y={size * 0.7} textAnchor="middle"
              fontSize={size * 0.085} fill="var(--ink-muted)">
          {subLabel}
        </text>
      )}
    </svg>
  );
};

/* ===== Sparkline ===== */
const Spark = ({ values, width = 120, height = 36, color = "var(--accent)" }) => {
  const clean = values.map(v => v == null ? null : v);
  const max = Math.max(...clean.filter(v => v != null), 100);
  const min = 0;
  const step = width / (clean.length - 1 || 1);
  const segments = [];
  let cur = [];
  clean.forEach((v, i) => {
    if (v == null) {
      if (cur.length) segments.push(cur);
      cur = [];
    } else {
      const x = i * step;
      const y = height - 4 - ((v - min) / (max - min)) * (height - 8);
      cur.push([x, y]);
    }
  });
  if (cur.length) segments.push(cur);

  const toPath = (seg) => seg.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  return (
    <svg className="spark" width={width} height={height}>
      {segments.map((seg, i) => (
        <path key={i} d={toPath(seg)} stroke={color} />
      ))}
    </svg>
  );
};

/* ===== Radar chart (10-axis topic mastery) ===== */
const Radar = ({ data, size = 320, max = 1 }) => {
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 36;
  const n = data.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const point = (val, i) => {
    const v = (val / max) * r;
    return [cx + Math.cos(angle(i)) * v, cy + Math.sin(angle(i)) * v];
  };

  const rings = [0.25, 0.5, 0.75, 1].map((k) => {
    const pts = data.map((_, i) => point(max * k, i));
    return "M" + pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L") + "Z";
  });

  const areaPts = data.map((d, i) => point(d.value, i));
  const areaPath = "M" + areaPts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L") + "Z";

  return (
    <svg className="radar-svg" width={size} height={size} style={{ overflow: "visible" }}>
      {rings.map((d, i) => <path key={i} d={d} className="grid" />)}
      {data.map((_, i) => {
        const [x, y] = point(max, i);
        return <line key={i} className="axis" x1={cx} y1={cy} x2={x} y2={y} />;
      })}
      <path d={areaPath} className="area" />
      {areaPts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" className="point" />)}
      {data.map((d, i) => {
        const [x, y] = point(max * 1.18, i);
        return (
          <text key={i} className="label" x={x} y={y}
                textAnchor={Math.cos(angle(i)) > 0.2 ? "start" : Math.cos(angle(i)) < -0.2 ? "end" : "middle"}
                dominantBaseline={Math.sin(angle(i)) > 0.2 ? "hanging" : Math.sin(angle(i)) < -0.2 ? "auto" : "middle"}>
            {d.label}
          </text>
        );
      })}
    </svg>
  );
};

/* ===== Sidebar ===== */
const Sidebar = ({ route, onNav, user }) => {
  const items = [
    { id: "home", icon: "home", label: "Trang chính" },
    { id: "library", icon: "library", label: "Đề thi mẫu", badge: "16" },
    { id: "topics", icon: "grid", label: "Luyện chuyên đề" },
    { id: "results", icon: "trend", label: "Kết quả gần đây" }
  ];
  const adminItems = [
    { id: "admin", icon: "admin", label: "Trang admin" },
    { id: "create", icon: "plus", label: "Tạo đề mới" },
    { id: "create-ex", icon: "grid", label: "Tạo bài tập" }
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <Brand />
        <div className="brand-text">
          <b>Cùng Khỉ con</b>
          <span>vào lớp 6 CLC</span>
        </div>
      </div>

      <div className="nav-section">
        <h6>Học tập</h6>
        {items.map(it => (
          <div key={it.id}
               className={"nav-item " + (route === it.id ? "active" : "")}
               onClick={() => onNav(it.id)}>
            <Ico name={it.icon} />
            <span>{it.label}</span>
            {it.badge && <span className="badge">{it.badge}</span>}
          </div>
        ))}
      </div>

      <div className="nav-section">
        <h6>Quản trị</h6>
        {adminItems.map(it => (
          <div key={it.id}
               className={"nav-item " + (route === it.id ? "active" : "")}
               onClick={() => onNav(it.id)}>
            <Ico name={it.icon} />
            <span>{it.label}</span>
          </div>
        ))}
      </div>

      <div className="sidebar-user" onClick={() => onNav("profile")}>
        <div className="avatar">{user.avatar}</div>
        <div className="meta">
          <b>{user.name}</b>
          <span>{user.grade}</span>
        </div>
      </div>
    </aside>
  );
};

/* ===== Top bar ===== */
const TopBar = ({ crumbs = [], actions }) => (
  <div className="topbar">
    <div className="crumbs">
      {crumbs.map((c, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="sep">/</span>}
          <span style={{ color: i === crumbs.length - 1 ? "var(--ink)" : undefined, fontWeight: i === crumbs.length - 1 ? 600 : 500 }}>{c}</span>
        </Fragment>
      ))}
    </div>
    <div className="actions">{actions}</div>
  </div>
);

/* ===== Card ===== */
const Card = ({ title, sub, action, children, tight, style }) => (
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

/* ===== Confirm modal (simple) ===== */
const Modal = ({ open, onClose, title, children, actions }) => {
  if (!open) return null;
  return (
    <div className="tutor-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        margin: "auto", width: 460, maxWidth: "94vw",
        background: "var(--surface)", borderRadius: "var(--r-lg)",
        border: "1px solid var(--border)", boxShadow: "var(--shadow-3)",
        padding: 24, alignSelf: "center"
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: 17, letterSpacing: "-0.01em" }}>{title}</h3>
        <div style={{ color: "var(--ink-muted)", fontSize: 13.5, lineHeight: 1.55 }}>{children}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          {actions}
        </div>
      </div>
    </div>
  );
};

/* ===== Toasts (lightweight) ===== */
const useToasts = () => {
  const [list, setList] = useState([]);
  const push = (msg, kind = "info") => {
    const id = Math.random().toString(36).slice(2);
    setList(l => [...l, { id, msg, kind }]);
    setTimeout(() => setList(l => l.filter(t => t.id !== id)), 3000);
  };
  const Host = () => (
    <div className="toast-host">
      {list.map(t => (
        <div key={t.id} className="toast">
          <Ico name={t.kind === "success" ? "check" : t.kind === "error" ? "x" : "sparkle"} />
          {t.msg}
        </div>
      ))}
    </div>
  );
  return [push, Host];
};

/* ===== Export to window for cross-script access ===== */
Object.assign(window, {
  Ico, Brand, Pill, KindBadge, Bar, Donut, Spark, Radar,
  Sidebar, TopBar, Card, Modal, useToasts
});
