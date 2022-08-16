import {useState, useEffect} from 'react';
import React from 'react';
import types from '../data/types.json';
import types1_freq from '../data/types1_freq.json';
import types2_freq from '../data/types2_freq.json';
import colours from '../data/chart_colours.json';
import { Bar } from 'react-chartjs-2';



const TypesChart = () => {
    const [chart1Data, setChart1Data] = useState({});
    const [chart2Data, setChart2Data] = useState({});
    let options = (num) => {
        return {
            title: {
                display: true,
                text: `Number of Pokemon by Type ${num}`,
                fontSize: 18
            },
            maintainAspectRatio: false,
            legend: {
                display: true,
                fillStyle: 'rgb(0,48,143,1.0)'
            }
        }
    } 
    const chart1 = (typesList, typesData, typeNum) => {
        setChart1Data({
            labels: typesList,
            datasets: [
                {
                    label: `Number of Pokemon by Type ${typeNum}`,
                    data: typesData,
                    backgroundColor: colours,
                    borderWidth: 3,
                    borderColor: colours
                    
                } 
            ]
            
        });
    }

    const chart2 = (typesList, typesData, typeNum) => {
        setChart2Data({
            labels: typesList,
            datasets: [
                {
                    label: `Number of Pokemon by Type ${typeNum}`,
                    data: typesData,
                    backgroundColor: colours,
                    borderWidth: 3,
                    borderColor: colours 
                } 
            ]
            
        });
    }

    useEffect(() => {
        chart1(types, types1_freq, '1');
        chart2(types, types2_freq, '2');
    }, [])

    return (
        <div className="chartsDiv">
            <div className="chart">
                <Bar className="bar-chart" data={chart1Data} options={options("1")}></Bar>
            </div>
            <div className="chart">
                <Bar className="bar-chart" data={chart2Data}  options={options("2")}></Bar>
            </div>
        </div>
    )
}

export default TypesChart;