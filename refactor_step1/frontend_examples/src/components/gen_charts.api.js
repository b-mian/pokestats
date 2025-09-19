import {useState, useEffect} from 'react';
import React from 'react';
import { HorizontalBar } from 'react-chartjs-2';
import { fetchGenAverages } from '../api/client';

const GenCharts = () => {
  const [chartData, setChartData] = useState({});
  const [gen, setGen] = useState(1);

  useEffect(() => {
    async function load() {
      const data = await fetchGenAverages(gen);
      setChartData({
        labels: data.labels,
        datasets: [{
          label: `Gen ${gen} Averages`,
          data: data.values,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          borderWidth: 1
        }]
      });
    }
    load();
  }, [gen]);

  return (
    <div className="gen-charts">
      <select value={gen} onChange={e => setGen(Number(e.target.value))}>
        {[1,2,3,4,5,6].map(g => <option key={g} value={g}>Gen {g}</option>)}
      </select>
      <HorizontalBar data={chartData} />
    </div>
  );
};

export default GenCharts;
