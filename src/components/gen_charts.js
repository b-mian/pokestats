import {useState, useEffect} from 'react';
import React from 'react';
import { HorizontalBar } from 'react-chartjs-2';
import gen1 from '../data/gen_data/gen_1.json';
import gen2 from '../data/gen_data/gen_2.json';
import gen3 from '../data/gen_data/gen_3.json';
import gen4 from '../data/gen_data/gen_4.json';
import gen5 from '../data/gen_data/gen_5.json';
import gen6 from '../data/gen_data/gen_6.json';
import labels from '../data/gen_data/labels.json';

const GenCharts = () => {
    const [chartData, setChartData] = useState({});

    const options = {
        scales: {
            xAxes: [{
                ticks: {
                    min: 50, max: 85
                    
                }
            }],
            yAxes: [{
                ticks: {
                    min: 50, max: 85
                    
                }
            }],
            
        },
        title: {
            display: true,
            text: 'Average Stats of Gens 1 to 6',
            fontSize: 18
        },
        legend: {
            display: true
        }
       
    }
    const gen_chart = (chartLabels) => {
        setChartData({
            labels: chartLabels,
            datasets: [
                {
                    label: `Average of Gen 1`,
                    data: gen1,
                    backgroundColor:  "rgba(255, 99, 132, 0.6)",
                    borderWidth: 3,
                    borderColor:  "rgba(255, 99, 132, 0.6)"
                    
                },
                {
                    label: `Average of Gen 2`,
                    data: gen2,
                    backgroundColor: "rgba(54, 162, 235, 0.6)",
                    borderWidth: 3,
                    borderColor: "rgba(54, 162, 235, 0.6)"
                    
                },
                {
                    label: `Average of Gen 3`,
                    data: gen3,
                    backgroundColor: "rgba(255, 206, 86, 0.6)",
                    borderWidth: 3,
                    borderColor: "rgba(255, 206, 86, 0.6)"
                    
                },
                {
                    label: `Average of Gen 4`,
                    data: gen4,
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                    borderWidth: 3,
                    borderColor: "rgba(75, 192, 192, 0.6)"
                    
                },
                {
                    label: `Average of Gen 5`,
                    data: gen5,
                    backgroundColor: "rgba(153, 102, 255, 0.6)",
                    borderWidth: 3,
                    borderColor: "rgba(153, 102, 255, 0.6)"
                    
                },
                {
                    label: `Average of Gen 6`,
                    data: gen6,
                    backgroundColor: "rgba(255, 159, 64, 0.6)",
                    borderWidth: 3,
                    borderColor: "rgba(255, 159, 64, 0.6)"
                    
                }      
            ]
            
            
        });
    }

    useEffect(() => {
        gen_chart(labels);
    }, [])

    return (
        <div className="chartsDiv">
            <div className="chart">
                <HorizontalBar data={chartData} options={options}></HorizontalBar>
            </div>
        </div>
    )
}

export default GenCharts;