import { useEffect, useState } from "react";
import React from "react";
import { HorizontalBar } from "react-chartjs-2";
import { useGenAverages } from "../api/hooks";

const GenCharts = () => {
  const [gen, setGen] = useState(1);
  const data = useGenAverages(gen);

  const [chartData, setChartData] = useState({});
  useEffect(() => {
    if (!data) return;
    setChartData({
      labels: data.labels,
      datasets: [{
        label: `Gen ${gen} Averages`,
        data: data.values,
        backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: "rgba(75,192,192,1)",
        borderWidth: 1
      }]
    });
  }, [data, gen]);

  return (
    <div className="gen-charts">
      <select value={gen} onChange={e => setGen(Number(e.target.value))}>
        {[1,2,3,4,5,6].map(g => <option key={g} value={g}>Gen {g}</option>)}
      </select>
      {chartData.labels ? <HorizontalBar data={chartData} /> : <p>Loading…</p>}
    </div>
  );
};
export default GenCharts;