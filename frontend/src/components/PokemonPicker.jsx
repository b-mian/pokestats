import React, { useEffect, useRef, useState } from "react";
import { fetchPokemon } from "../api/client";
import { spriteUrl } from "../utils/sprites";
import { prettyName } from "../utils/format";
import TypePill from "./TypePill";

/**
 * Debounced search-and-select. Used by Compare and Team Builder.
 *
 * Props:
 *   onSelect(pokemon)  — called with the chosen row from /pokemon
 *   excludeIds         — ids to hide from results (already-picked)
 *   placeholder
 *   includeForms       — search alternate forms too (default false)
 */
export default function PokemonPicker({ onSelect, excludeIds = [], placeholder = "Add a Pokémon...", includeForms = false }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    let cancel = false;
    const t = setTimeout(async () => {
      try {
        const rows = await fetchPokemon({ q: q.trim(), limit: 8, include_forms: includeForms });
        if (!cancel) { setResults(rows); setOpen(true); }
      } catch { /* transient search errors are ignorable */ }
    }, 200);
    return () => { cancel = true; clearTimeout(t); };
  }, [q, includeForms]);

  useEffect(() => {
    function onDocClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const visible = results.filter(r => !excludeIds.includes(r.id));

  return (
    <div ref={boxRef} style={{ position: "relative", width: "100%", maxWidth: 340 }}>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 10,
          border: "1px solid #ccc", fontSize: 15,
        }}
      />
      {open && visible.length > 0 && (
        <ul style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 40,
          listStyle: "none", margin: "4px 0 0", padding: 4,
          background: "#fff", border: "1px solid #ddd", borderRadius: 10,
          boxShadow: "0 6px 18px rgba(0,0,0,0.15)", maxHeight: 320, overflowY: "auto",
        }}>
          {visible.map(p => (
            <li key={p.id}>
              <button
                onClick={() => { onSelect(p); setQ(""); setResults([]); setOpen(false); }}
                style={{
                  display: "grid", gridTemplateColumns: "40px 1fr auto", alignItems: "center",
                  gap: 8, width: "100%", padding: "6px 8px", border: "none",
                  background: "transparent", cursor: "pointer", textAlign: "left", borderRadius: 8,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#eef7f7")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <img src={spriteUrl(p.id)} alt={p.name} width={36} height={36}
                     style={{ imageRendering: "pixelated" }} />
                <span style={{ fontWeight: 700 }}>
                  {prettyName(p.name)} <span style={{ color: "#889" }}>#{p.id}</span>
                </span>
                <span>
                  <TypePill type={p.type1} />
                  {p.type2 ? <TypePill type={p.type2} /> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
