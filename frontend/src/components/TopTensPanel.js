import React, { useEffect, useState } from "react";
import { fetchTop10 } from "../api/client";
import { spriteUrl } from "../utils/sprites";

const CATS = [
  { key: "hp", label: "HP" },
  { key: "attack", label: "Attack" },
  { key: "defense", label: "Defense" },
  { key: "speed", label: "Speed" },
  { key: "sp_attack", label: "Sp. Attack" },
  { key: "sp_defense", label: "Sp. Defense" },
];

export default function TopTensPanel() {
  const [tab, setTab] = useState(CATS[0].key);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchTop10(tab);
        if (!cancel) setRows(data);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [tab]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {CATS.map(c => (
          <button
            key={c.key}
            onClick={() => setTab(c.key)}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: tab === c.key ? "#0f8b8d" : "#fff",
              color: tab === c.key ? "#fff" : "#111",
              cursor: "pointer",
              fontWeight: 700
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? <div>Loading…</div> : (
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {rows.map((r, i) => (
            <li key={r.id} style={{
              display: "grid",
              gridTemplateColumns: "36px 40px 1fr auto",
              alignItems: "center",
              gap: 10,
              padding: "10px 8px",
              borderRadius: 10,
              border: "1px solid #eee",
              background: "#f9ffff"
            }}>
              <div style={{ fontWeight: 800 }}>#{i+1}</div>
              <img src={spriteUrl(r.id)} alt={r.name} width={36} height={36} style={{ imageRendering: "pixelated" }} />
              <div style={{ fontWeight: 700 }}>{String(r.name.charAt(0).toUpperCase()) + String(r.name).slice(1)} <span style={{ color: "#667" }}>#{r.id}</span></div>
              <div style={{ fontVariantNumeric: "tabular-nums", color: "#0b2b36", fontWeight: 800 }}>{r.value}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}