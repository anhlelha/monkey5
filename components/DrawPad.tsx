"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

interface DrawPadProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

const COLORS = ["#0f172a", "#dc2626", "#2563eb", "#16a34a", "#ea580c"];

export function DrawPad({ onSave, onClose }: DrawPadProps) {
  const cvs = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const history = useRef<string[]>([]);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState("#0f172a");
  const [size, setSize] = useState(3);

  useEffect(() => {
    const c = cvs.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);
    history.current = [c.toDataURL()];
  }, []);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = cvs.current;
    if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    const touch = "touches" in e ? e.touches[0] : null;
    const clientX = touch ? touch.clientX : (e as React.MouseEvent).clientX;
    const clientY = touch ? touch.clientY : (e as React.MouseEvent).clientY;
    return {
      x: (clientX - rect.left) * (c.width / rect.width),
      y: (clientY - rect.top) * (c.height / rect.height),
    };
  };

  const snapshot = () => {
    const c = cvs.current;
    if (!c) return;
    history.current.push(c.toDataURL());
    if (history.current.length > 30) history.current.shift();
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    drawing.current = true;
    lastPt.current = pos(e);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const c = cvs.current;
    if (!c || !lastPt.current) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
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
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = prev;
  };

  const clear = () => {
    const c = cvs.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);
    snapshot();
  };

  const save = () => {
    const c = cvs.current;
    if (c) onSave(c.toDataURL("image/png"));
  };

  return (
    <div
      className="draw-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="draw-card">
        <div className="row between">
          <div>
            <h3>Vẽ hình minh hoạ</h3>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              Sơ đồ, hình hình học, mặt cắt — vẽ rồi đính vào bài làm.
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        <div className="draw-toolbar">
          <button
            className={"tool-btn" + (tool === "pen" ? " active" : "")}
            onClick={() => setTool("pen")}
            title="Bút vẽ"
          >
            <Icon name="pencil" size={13} /> Bút
          </button>
          <button
            className={"tool-btn" + (tool === "eraser" ? " active" : "")}
            onClick={() => setTool("eraser")}
            title="Tẩy"
          >
            <Icon name="eraser" size={13} /> Tẩy
          </button>
          <div className="tool-divider" />
          <span className="tool-label">Màu</span>
          {COLORS.map((c) => (
            <button
              key={c}
              className={"color-swatch" + (color === c ? " active" : "")}
              style={{ background: c }}
              onClick={() => {
                setColor(c);
                setTool("pen");
              }}
              aria-label={`Màu ${c}`}
            />
          ))}
          <div className="tool-divider" />
          <span className="tool-label">Cỡ</span>
          {[2, 3, 5, 8].map((s) => (
            <button
              key={s}
              className={"tool-btn" + (size === s ? " active" : "")}
              style={{ minWidth: 32, justifyContent: "center" }}
              onClick={() => setSize(s)}
            >
              {s}
            </button>
          ))}
          <div className="spacer" />
          <button className="tool-btn" onClick={undo} title="Hoàn tác">
            <Icon name="undo" size={13} /> Hoàn tác
          </button>
          <button className="tool-btn" onClick={clear} title="Xoá hết">
            <Icon name="trash" size={13} /> Xoá hết
          </button>
        </div>

        <canvas
          ref={cvs}
          className="draw-canvas"
          width={720}
          height={420}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={(e) => {
            e.preventDefault();
            start(e);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            move(e);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            end();
          }}
        />

        <div className="row between">
          <span className="muted" style={{ fontSize: 12 }}>
            Mẹo: dùng màu xanh cho dữ kiện đề, đỏ cho cần tìm, đen cho lời giải.
          </span>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" onClick={onClose}>
              Huỷ
            </button>
            <button className="btn primary" onClick={save}>
              <Icon name="check" stroke={2.5} /> Đính kèm vào bài
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
