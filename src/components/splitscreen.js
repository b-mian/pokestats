// src/components/splitscreen.js
import React from "react";
import "./styles/splitscreen.css";

export default function Splitscreen({ left: Left, right: Right }) {
  return (
    <div className="layout">
      <aside className="layout__sidebar">
        <Left />
      </aside>
      <main className="layout__content">
        <Right />
      </main>
    </div>
  );
}