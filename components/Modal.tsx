"use client";

import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Modal({ open, onClose, title, children, actions }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="tutor-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          margin: "auto",
          width: 460,
          maxWidth: "94vw",
          background: "var(--surface)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-3)",
          padding: 24,
          alignSelf: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: 17, letterSpacing: "-0.01em" }}>
          {title}
        </h3>
        <div style={{ color: "var(--ink-muted)", fontSize: 13.5, lineHeight: 1.55 }}>{children}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          {actions}
        </div>
      </div>
    </div>
  );
}
