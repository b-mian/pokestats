import React from "react";
import "./styles/slidepanel.css";

export default function SlidePanel({ open, title, onClose, children, width = 420 }) {
  return (
    <>
      <div
        className={`sp-backdrop ${open ? "sp-backdrop--open" : ""}`}
        onClick={onClose}
      />
      <aside
        className={`sp-panel ${open ? "sp-panel--open" : ""}`}
        style={{ width }}
        aria-hidden={!open}
      >
        <div className="sp-header">
          <h3 className="sp-title">{title}</h3>
          <button className="sp-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="sp-body">{children}</div>
      </aside>
    </>
  );
}