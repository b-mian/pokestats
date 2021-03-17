import {useState, useEffect} from 'react';
import types from '../data/types.json';
import types1_freq from '../data/types1_freq.json';
import types2_freq from '../data/types2_freq.json';
import colours from '../data/chart_colours.json';
import { Bar } from 'react-chartjs-2';



const TypesChart = () => {
    const [chart1Data, setChart1Data] = useState({});
    const [chart2Data, setChart2Data] = useState({});
    let options = {
        maintainAspectRatio: true,
        width: 960,
        height: 300
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
                <Bar data={chart1Data} options={options}></Bar>
            </div>
            <div className="chart">
                <Bar data={chart2Data} ></Bar>
            </div>
        </div>
    )
}

export default TypesChart;