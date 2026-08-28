import React, { useState } from "react";
import { Link } from "react-router-dom";
import SlidePanel from "./SlidePanel";
import TopTensPanel from "./TopTensPanel";
import GenAveragesPanel from "./GenAveragesPanel";
import PotdCard from "./PotdCard";

const linkStyle = {
  display: "block",
  textDecoration: "none",
  textAlign: "center",
  color: "#fff",
};

export default function LeftSide() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null); // 'top' | 'gen'

  function openTop() { setMode('top'); setOpen(true); }
  function openGen() { setMode('gen'); setOpen(true); }

  const title =
    mode === 'top' ? "Top Tens" :
    mode === 'gen' ? "Generation Averages" :
    "";

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <button className="menu-btn" onClick={openTop}>🏆 Top Tens</button>
      <button className="menu-btn" onClick={openGen}>📊 Poké Charts</button>

      <Link className="menu-btn" style={linkStyle} to="/quiz">🎮 Poké Quiz</Link>
      <Link className="menu-btn" style={linkStyle} to="/compare">⚔️ Compare</Link>
      <Link className="menu-btn" style={linkStyle} to="/team">🛡️ Team Builder</Link>
      <Link className="menu-btn" style={linkStyle} to="/explorer">📈 Stat Explorer</Link>
      <Link className="menu-btn" style={linkStyle} to="/games/higher-lower">🃏 Higher or Lower</Link>

      <PotdCard />

      <SlidePanel
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        width={480}
      >
        {mode === 'top' && <TopTensPanel />}
        {mode === 'gen' && <GenAveragesPanel />}
      </SlidePanel>
    </div>
  );
}
