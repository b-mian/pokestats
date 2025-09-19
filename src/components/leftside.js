import React, { useState } from "react";
import SlidePanel from "./SlidePanel";
import TopTensPanel from "./TopTensPanel";
import GenAveragesPanel from "./GenAveragesPanel";

export default function LeftSide() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null); // 'top' | 'gen'

  function openTop() {
    setMode('top');
    setOpen(true);
  }
  function openGen() {
    setMode('gen');
    setOpen(true);
  }

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <button className="menu-btn" onClick={openTop}>Top Tens</button>
      <button className="menu-btn" onClick={openGen}>Poké Charts</button>

      <SlidePanel
        open={open}
        onClose={() => setOpen(false)}
        title={mode === 'top' ? "Top Tens" : "Generation Averages"}
        width={480}
      >
        {mode === 'top' ? <TopTensPanel /> : <GenAveragesPanel />}
      </SlidePanel>
    </div>
  );
}