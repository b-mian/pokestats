import React, { useState } from "react";
import SlidePanel from "./SlidePanel";
import TopTensPanel from "./TopTensPanel";
import GenAveragesPanel from "./GenAveragesPanel";
import PokemonQuiz from "./PokemonQuiz"; // <-- add this

export default function LeftSide() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null); // 'top' | 'gen' | 'quiz'

  function openTop() { setMode('top'); setOpen(true); }
  function openGen() { setMode('gen'); setOpen(true); }
  function openQuiz() { setMode('quiz'); setOpen(true); }

  const title =
    mode === 'top' ? "Top Tens" :
    mode === 'gen' ? "Generation Averages" :
    mode === 'quiz' ? "Pokémon Quiz" :
    "";

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <button className="menu-btn" onClick={openTop}>🏆 Top Tens</button>
      <button className="menu-btn" onClick={openGen}> 📊 Poké Charts</button>
      <button className="menu-btn" onClick={openQuiz}>🎮 Poké Quiz</button>

      <SlidePanel
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        width={480}
      >
        {mode === 'top' && <TopTensPanel />}
        {mode === 'gen' && <GenAveragesPanel />}
        {mode === 'quiz' && <PokemonQuiz key={open ? "quiz-open" : "quiz-closed"} />}
      </SlidePanel>
    </div>
  );
}