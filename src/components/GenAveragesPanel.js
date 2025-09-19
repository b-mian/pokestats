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
    const vals = (resp.values || []).slice(0, 6);
    while (vals.length < 6) vals.push(null);

    const nulls = vals.some(v => v === null || v === undefined);

    // Replace nulls with 0 for chart rendering, but keep a note below
    const plotted = vals.map(v => (v == null ? 0 : v));

    return {
      chartData: {
        labels,
        datasets: [{
          label: `Generation ${gen} Averages`,
          data: plotted,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
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
          {[1,2,3,4,5,6].map(g => <option key={g} value={g}>Gen {g}</option>)}
        </select>
      </div>

      {chartData ? <HorizontalBar data={chartData} /> : <div>Loading…</div>}

      {hasNulls && (
        <div style={{ marginTop: 8, color: "#777", fontSize: 13 }}>
          Note: Special Attack / Special Defense are not available for this dataset yet.
        </div>
      )}
    </div>
  );
}