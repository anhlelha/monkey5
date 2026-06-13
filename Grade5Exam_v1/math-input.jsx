/* =========================================================
   Math input toolbar + drawing pad
   Used inside essay-type questions
   ========================================================= */
const { useRef: useRefMI, useState: useStateMI, useEffect: useEffectMI } = React;

/* Unit catalogue grouped for the dropdown */
const UNIT_CATS = [
  { cat: "Độ dài", items: ["mm", "cm", "dm", "m", "km"] },
  { cat: "Diện tích", items: ["cm²", "dm²", "m²", "ha", "km²"] },
  { cat: "Thể tích", items: ["cm³", "dm³", "m³", "ml", "lít"] },
  { cat: "Khối lượng", items: ["g", "kg", "tấn"] },
  { cat: "Thời gian", items: ["giây", "phút", "giờ", "ngày"] },
  { cat: "Vận tốc", items: ["m/giây", "m/phút", "km/giờ"] },
  { cat: "Tiền & %", items: ["%", "đồng", "nghìn", "triệu"] }
];

/* ===== Drawing pad ===== */
const DrawPad = ({ onSave, onClose }) => {
  const cvs = useRefMI(null);
  const drawing = useRefMI(false);
  const lastPt = useRefMI(null);
  const history = useRefMI([]); // canvas snapshots for undo
  const [tool, setTool] = useStateMI("pen");
  const [color, setColor] = useStateMI("#0f172a");
  const [size, setSize] = useStateMI(3);

  useEffectMI(() => {
    const c = cvs.current;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);
    history.current = [c.toDataURL()];
  }, []);

  const pos = (e) => {
    const c = cvs.current;
    const rect = c.getBoundingClientRect();
    const t = e.touches?.[0];
    const x = (t ? t.clientX : e.clientX) - rect.left;
    const y = (t ? t.clientY : e.clientY) - rect.top;
    return { x: x * (c.width / rect.width), y: y * (c.height / rect.height) };
  };

  const snapshot = () => {
    const c = cvs.current;
    history.current.push(c.toDataURL());
    if (history.current.length > 30) history.current.shift();
  };

  const start = (e) => {
    drawing.current = true;
    lastPt.current = pos(e);
  };
  const move = (e) => {
    if (!drawing.current) return;
    const c = cvs.current;
    const ctx = c.getContext("2d");
    const pt = pos(e);
    ctx.strokeStyle = tool === "eraser" ? "white" : color;
    ctx.lineWidth = tool === "eraser" ? size * 5 : size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPt.current.x, lastPt.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    lastPt.current = pt;
  };
  const end = () => {
    if (drawing.current) snapshot();
    drawing.current = false;
    lastPt.current = null;
  };

  const undo = () => {
    if (history.current.length <= 1) return;
    history.current.pop();
    const prev = history.current[history.current.length - 1];
    const img = new Image();
    img.onload = () => {
      const c = cvs.current;
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = prev;
  };

  const clear = () => {
    const c = cvs.current;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);
    snapshot();
  };

  const save = () => onSave(cvs.current.toDataURL("image/png"));

  const COLORS = ["#0f172a", "#dc2626", "#2563eb", "#16a34a", "#ea580c"];

  return (
    <div className="draw-modal" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="draw-card">
        <div className="row between">
          <div>
            <h3>Vẽ hình minh hoạ</h3>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>Sơ đồ, hình hình học, mặt cắt — vẽ rồi đính vào bài làm.</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Ico name="x" /></button>
        </div>

        <div className="draw-toolbar">
          <button className={"tool-btn" + (tool === "pen" ? " active" : "")} onClick={() => setTool("pen")} title="Bút vẽ">
            <Ico name="pencil" size={13} /> Bút
          </button>
          <button className={"tool-btn" + (tool === "eraser" ? " active" : "")} onClick={() => setTool("eraser")} title="Tẩy">
            <Ico name="eraser" size={13} /> Tẩy
          </button>
          <div className="tool-divider" />
          <span className="tool-label">Màu</span>
          {COLORS.map(c => (
            <button key={c}
                    className={"color-swatch" + (color === c ? " active" : "")}
                    style={{ background: c }}
                    onClick={() => { setColor(c); setTool("pen"); }} />
          ))}
          <div className="tool-divider" />
          <span className="tool-label">Cỡ</span>
          {[2, 3, 5, 8].map(s => (
            <button key={s}
                    className={"tool-btn" + (size === s ? " active" : "")}
                    style={{ minWidth: 32, justifyContent: "center" }}
                    onClick={() => setSize(s)}>
              {s}
            </button>
          ))}
          <div className="spacer" />
          <button className="tool-btn" onClick={undo} title="Hoàn tác">
            <Ico name="undo" size={13} /> Hoàn tác
          </button>
          <button className="tool-btn" onClick={clear} title="Xoá hết">
            <Ico name="trash" size={13} /> Xoá hết
          </button>
        </div>

        <canvas ref={cvs}
                className="draw-canvas"
                width={720}
                height={420}
                onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
                onTouchStart={(e) => { e.preventDefault(); start(e); }}
                onTouchMove={(e) => { e.preventDefault(); move(e); }}
                onTouchEnd={(e) => { e.preventDefault(); end(); }} />

        <div className="row between">
          <span className="muted" style={{ fontSize: 12 }}>
            Mẹo: dùng màu xanh cho dữ kiện đề, đỏ cho cần tìm, đen cho lời giải.
          </span>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" onClick={onClose}>Huỷ</button>
            <button className="btn primary" onClick={save}>
              <Ico name="check" stroke={2.5} /> Đính kèm vào bài
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ===== Math input wrapper ===== */
const MathInput = ({ value, onChange, drawings, onDrawingsChange,
                    placeholder, readOnly, rows = 8 }) => {
  const taRef = useRefMI(null);
  const [unitsOpen, setUnitsOpen] = useStateMI(false);
  const [drawOpen, setDrawOpen] = useStateMI(false);
  const localDrawings = drawings || [];

  useEffectMI(() => {
    if (!unitsOpen) return;
    const handler = (e) => { if (!e.target.closest(".units-pop")) setUnitsOpen(false); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [unitsOpen]);

  const insert = (s, opts = {}) => {
    const ta = taRef.current;
    if (!ta || readOnly) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const cur = value || "";
    const newV = cur.slice(0, start) + s + cur.slice(end);
    onChange(newV);
    const newPos = start + (opts.cursor !== undefined ? opts.cursor : s.length);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newPos, newPos);
    });
  };

  /* readOnly variant: plain textarea, no toolbar */
  if (readOnly) {
    return (
      <div className="math-input">
        <textarea ref={taRef} className="textarea"
                  value={value || ""}
                  readOnly
                  placeholder={placeholder}
                  rows={rows} />
        {localDrawings.length > 0 && (
          <div className="drawings-row">
            {localDrawings.map((d, i) => (
              <div key={i} className="drawing-thumb"><img src={d} alt="" /></div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const Tool = ({ children, onClick, title, primary, style }) => (
    <button className={"tool-btn" + (primary ? " primary" : "")} onClick={onClick} title={title} style={style}>
      {children}
    </button>
  );

  return (
    <div className="math-input">
      <div className="math-toolbar">
        <Tool onClick={() => insert("×")} title="Nhân">×</Tool>
        <Tool onClick={() => insert("÷")} title="Chia">÷</Tool>
        <Tool onClick={() => insert("±")} title="Cộng/trừ">±</Tool>
        <Tool onClick={() => insert("≈")} title="Xấp xỉ">≈</Tool>
        <Tool onClick={() => insert("≤")} title="Nhỏ hơn hoặc bằng">≤</Tool>
        <Tool onClick={() => insert("≥")} title="Lớn hơn hoặc bằng">≥</Tool>

        <div className="tool-divider" />

        <Tool onClick={() => insert("/", { cursor: 1 })} title="Phân số (a/b)">
          <span style={{ fontSize: 14, lineHeight: 1 }}>½</span>
        </Tool>
        <Tool onClick={() => insert("²")} title="Bình phương">x²</Tool>
        <Tool onClick={() => insert("³")} title="Lập phương">x³</Tool>
        <Tool onClick={() => insert("√")} title="Căn">√</Tool>
        <Tool onClick={() => insert("π")} title="Pi">π</Tool>

        <div className="tool-divider" />

        <div className="units-pop" onClick={(e) => e.stopPropagation()}>
          <Tool onClick={() => setUnitsOpen(o => !o)} title="Đơn vị đo">
            cm² <span style={{ fontSize: 9, marginLeft: 2 }}>▾</span>
          </Tool>
          {unitsOpen && (
            <div className="units-menu">
              {UNIT_CATS.map((cat) => (
                <Fragment key={cat.cat}>
                  <h6>{cat.cat}</h6>
                  {cat.items.map(u => (
                    <button key={u} className="tool-btn"
                            style={{ width: "100%", justifyContent: "center" }}
                            onClick={() => { insert(u); setUnitsOpen(false); }}>
                      {u}
                    </button>
                  ))}
                </Fragment>
              ))}
            </div>
          )}
        </div>

        <div className="tool-divider" />

        <Tool onClick={() => insert("\nĐáp số: ")} title="Thêm dòng đáp số" style={{ fontFamily: "var(--font-sans)" }}>
          Đáp số:
        </Tool>

        <div className="spacer" />

        <Tool primary onClick={() => setDrawOpen(true)} title="Mở khung vẽ hình">
          <Ico name="pencil" size={12} /> Vẽ hình
        </Tool>
      </div>

      <textarea ref={taRef}
                className="textarea"
                value={value || ""}
                placeholder={placeholder}
                rows={rows}
                onChange={(e) => onChange(e.target.value)} />

      {localDrawings.length > 0 && (
        <div className="drawings-row">
          {localDrawings.map((d, i) => (
            <div key={i} className="drawing-thumb">
              <img src={d} alt="" />
              <button className="remove"
                      onClick={() => onDrawingsChange?.(localDrawings.filter((_, j) => j !== i))}>
                <Ico name="x" size={12} stroke={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {drawOpen && (
        <DrawPad onSave={(url) => {
                   onDrawingsChange?.([...localDrawings, url]);
                   setDrawOpen(false);
                 }}
                 onClose={() => setDrawOpen(false)} />
      )}
    </div>
  );
};

Object.assign(window, { MathInput, DrawPad });
