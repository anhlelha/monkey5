"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { DrawPad } from "./DrawPad";

interface EssayValue {
  text: string;
  drawings: string[];
}

interface MathInputProps {
  value?: EssayValue | string | null;
  onChange: (v: EssayValue | string) => void;
  drawings?: string[];
  onDrawingsChange?: (d: string[]) => void;
  placeholder?: string;
  readOnly?: boolean;
  rows?: number;
}

const UNIT_CATS = [
  { cat: "Độ dài", items: ["mm", "cm", "dm", "m", "km"] },
  { cat: "Diện tích", items: ["cm²", "dm²", "m²", "ha", "km²"] },
  { cat: "Thể tích", items: ["cm³", "dm³", "m³", "ml", "lít"] },
  { cat: "Khối lượng", items: ["g", "kg", "tấn"] },
  { cat: "Thời gian", items: ["giây", "phút", "giờ", "ngày"] },
  { cat: "Vận tốc", items: ["m/giây", "m/phút", "km/giờ"] },
  { cat: "Tiền & %", items: ["%", "đồng", "nghìn", "triệu"] },
];

const valueText = (v: MathInputProps["value"]): string => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return v.text ?? "";
};

export function MathInput({
  value,
  onChange,
  drawings,
  onDrawingsChange,
  placeholder,
  readOnly,
  rows = 8,
}: MathInputProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [unitsOpen, setUnitsOpen] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);
  const localDrawings = drawings ?? [];
  const text = valueText(value);

  useEffect(() => {
    if (!unitsOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest(".units-pop")) setUnitsOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [unitsOpen]);

  const emit = (newText: string) => {
    // Preserve drawings if caller is using the object shape.
    if (typeof value === "object" && value !== null) {
      onChange({ text: newText, drawings: value.drawings ?? [] });
    } else {
      onChange(newText);
    }
  };

  const insert = (s: string, cursorOffset?: number) => {
    const ta = taRef.current;
    if (!ta || readOnly) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newV = text.slice(0, start) + s + text.slice(end);
    emit(newV);
    const newPos = start + (cursorOffset ?? s.length);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newPos, newPos);
    });
  };

  if (readOnly) {
    return (
      <div className="math-input">
        <textarea ref={taRef} className="textarea" value={text} readOnly placeholder={placeholder} rows={rows} />
        {localDrawings.length > 0 && (
          <div className="drawings-row">
            {localDrawings.map((d, i) => (
              <div key={i} className="drawing-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d} alt="" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="math-input">
      <div className="math-toolbar">
        <button className="tool-btn" onClick={() => insert("×")} title="Nhân">×</button>
        <button className="tool-btn" onClick={() => insert("÷")} title="Chia">÷</button>
        <button className="tool-btn" onClick={() => insert("±")} title="Cộng/trừ">±</button>
        <button className="tool-btn" onClick={() => insert("≈")} title="Xấp xỉ">≈</button>
        <button className="tool-btn" onClick={() => insert("≤")} title="≤">≤</button>
        <button className="tool-btn" onClick={() => insert("≥")} title="≥">≥</button>

        <div className="tool-divider" />

        <button className="tool-btn" onClick={() => insert("/", 1)} title="Phân số (a/b)">
          <span style={{ fontSize: 14, lineHeight: 1 }}>½</span>
        </button>
        <button className="tool-btn" onClick={() => insert("²")} title="Bình phương">x²</button>
        <button className="tool-btn" onClick={() => insert("³")} title="Lập phương">x³</button>
        <button className="tool-btn" onClick={() => insert("√")} title="Căn">√</button>
        <button className="tool-btn" onClick={() => insert("π")} title="Pi">π</button>

        <div className="tool-divider" />

        <div className="units-pop" onClick={(e) => e.stopPropagation()}>
          <button className="tool-btn" onClick={() => setUnitsOpen((o) => !o)} title="Đơn vị đo">
            cm² <span style={{ fontSize: 9, marginLeft: 2 }}>▾</span>
          </button>
          {unitsOpen && (
            <div className="units-menu">
              {UNIT_CATS.map((cat) => (
                <Fragment key={cat.cat}>
                  <h6>{cat.cat}</h6>
                  {cat.items.map((u) => (
                    <button
                      key={u}
                      className="tool-btn"
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={() => {
                        insert(u);
                        setUnitsOpen(false);
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </Fragment>
              ))}
            </div>
          )}
        </div>

        <div className="tool-divider" />

        <button
          className="tool-btn"
          onClick={() => insert("\nĐáp số: ")}
          title="Thêm dòng đáp số"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Đáp số:
        </button>

        <div className="spacer" />

        <button className="tool-btn primary" onClick={() => setDrawOpen(true)} title="Mở khung vẽ hình">
          <Icon name="pencil" size={12} /> Vẽ hình
        </button>
      </div>

      <textarea
        ref={taRef}
        className="textarea"
        value={text}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => emit(e.target.value)}
      />

      {localDrawings.length > 0 && (
        <div className="drawings-row">
          {localDrawings.map((d, i) => (
            <div key={i} className="drawing-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d} alt="" />
              <button
                className="remove"
                onClick={() => onDrawingsChange?.(localDrawings.filter((_, j) => j !== i))}
              >
                <Icon name="x" size={12} stroke={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {drawOpen && (
        <DrawPad
          onSave={(url) => {
            onDrawingsChange?.([...localDrawings, url]);
            setDrawOpen(false);
          }}
          onClose={() => setDrawOpen(false)}
        />
      )}
    </div>
  );
}
