import React, { useEffect, useMemo, useState } from "react";
import { HorizontalBar } from "react-chartjs-2";
import { fetchGenAverages } from "../api/client";

export default function GenAveragesPanel() {
  const [gen, setGen] = useState(1);
  const [resp, setResp] = useState(null); // { labels, values }

  useEffect(() => {
    let cancel = false;
    (async () => {
      const data = await fetchGenAverages(gen); // { labels: [...], values: [...] }
      if (!cancel) setResp(data);
    })();
    return () => { cancel = true; };
  }, [gen]);

  const { chartData, hasNulls } = useMemo(() => {
    if (!resp) return { chartData: null, hasNulls: false };

    // Pad to 6 items in case backend sends fewer, preserve order:
    const labels = resp.labels || ["HP","Attack","Speed","Defense","Sp. Attack","Sp. Defense"];
    const vals = (resp.values || []).slice(0, 9);
    while (vals.length < 9) vals.push(null);

    const nulls = vals.some(v => v === null || v === undefined);

    // Replace nulls with 0 for chart rendering, but keep a note below
    const plotted = vals.map(v => (v == null ? 0 : v));

    // Per-bar colors (same length as plotted)
    const bg = [
      "rgba(99, 132, 255, 0.7)",  // HP
      "rgba(255, 99, 132, 0.7)",  // Attack
      "rgba(54, 162, 235, 0.7)",  // Defense
      "rgba(255, 206, 86, 0.7)",  // Sp. Atk
      "rgba(75, 192, 192, 0.7)",  // Sp. Def
      "rgba(153, 102, 255, 0.7)", // Speed
    ].slice(0, plotted.length);

    const borders = [
      "rgba(99, 132, 255, 1)",
      "rgba(255, 99, 132, 1)",
      "rgba(54, 162, 235, 1)",
      "rgba(255, 206, 86, 1)",
      "rgba(75, 192, 192, 1)",
      "rgba(153, 102, 255, 1)",
    ].slice(0, plotted.length);

    return {
      chartData: {
        labels,
        datasets: [{
          label: `Generation ${gen} Averages`,
          data: plotted,
          backgroundColor: bg,     // ← per-bar colors
          borderColor: borders,    // ← per-bar borders
          borderWidth: 1
        }]
      },
      hasNulls: nulls
    };
  }, [resp, gen]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <label style={{ fontWeight: 700, alignSelf: "center" }}>Gen</label>
        <select value={gen} onChange={e => setGen(Number(e.target.value))} style={{ padding: 8, borderRadius: 8 }}>
          {[1,2,3,4,5,6,7,8,9].map(g => <option key={g} value={g}>Gen {g}</option>)}
        </select>
      </div>

      {chartData ? <HorizontalBar data={chartData} /> : <div>Loading…</div>}
    </div>
  );
}