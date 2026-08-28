import React, { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { fetchGenAverages } from "../api/client";

const STAT_COLORS = [
  "rgba(99, 132, 255, 0.7)",  // HP
  "rgba(255, 99, 132, 0.7)",  // Attack
  "rgba(255, 206, 86, 0.7)",  // Speed
  "rgba(54, 162, 235, 0.7)",  // Defense
  "rgba(75, 192, 192, 0.7)",  // Sp. Attack
  "rgba(153, 102, 255, 0.7)", // Sp. Defense
];

export default function GenAveragesPanel() {
  const [gen, setGen] = useState(1);
  const [resp, setResp] = useState(null); // { labels, values }

  useEffect(() => {
    let cancel = false;
    (async () => {
      const data = await fetchGenAverages(gen);
      if (!cancel) setResp(data);
    })();
    return () => { cancel = true; };
  }, [gen]);

  const chartData = useMemo(() => {
    if (!resp) return null;
    const labels = resp.labels || ["HP", "Attack", "Speed", "Defense", "Sp. Attack", "Sp. Defense"];
    const values = (resp.values || []).slice(0, labels.length).map(v => (v == null ? 0 : v));
    return {
      labels,
      datasets: [{
        label: `Generation ${gen} Averages`,
        data: values,
        backgroundColor: STAT_COLORS.slice(0, values.length),
        borderColor: STAT_COLORS.map(c => c.replace("0.7", "1")).slice(0, values.length),
        borderWidth: 1,
      }],
    };
  }, [resp, gen]);

  const options = {
    indexAxis: "y", // Chart.js 4 horizontal bar
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true, suggestedMax: 110 } },
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <label style={{ fontWeight: 700, alignSelf: "center" }}>Gen</label>
        <select value={gen} onChange={e => setGen(Number(e.target.value))} style={{ padding: 8, borderRadius: 8 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => <option key={g} value={g}>Gen {g}</option>)}
        </select>
      </div>

      {chartData ? <Bar data={chartData} options={options} /> : <div>Loading…</div>}
    </div>
  );
}
