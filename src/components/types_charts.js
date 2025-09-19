import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { useTypeFrequencies } from "../api/hooks";

const TypesCharts = () => {
  const slot1 = useTypeFrequencies(1, "percent");
  const slot2 = useTypeFrequencies(2, "percent");

  const chart1 = useMemo(() => {
    if (!slot1.length) return null;
    return {
      labels: slot1.map(r => r.type),
      datasets: [{ label: "Type1 %", data: slot1.map(r => r.percent) }]
    };
  }, [slot1]);

  const chart2 = useMemo(() => {
    if (!slot2.length) return null;
    return {
      labels: slot2.map(r => r.type),
      datasets: [{ label: "Type2 %", data: slot2.map(r => r.percent) }]
    };
  }, [slot2]);

  return (
    <div className="types-charts">
      <h4>Type Distributions</h4>
      {chart1 ? <Bar data={chart1} /> : <p>Loading slot1…</p>}
      {chart2 ? <Bar data={chart2} /> : <p>Loading slot2…</p>}
    </div>
  );
};
export default TypesCharts;